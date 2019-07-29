'use strict';
const path = require('path')
var request = require(path.join(__dirname,'../rq'));
var UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36" 
const superagent = require('superagent')
const ids = ['SD','HD', 'SHD', 'FHD']
const vd_2_id = {10203: 'SD', 10212: 'HD', 10201:'SHD', 10209: 'FHD'}
const id_2_profile = {'SD':'标清;(270P)', 'HD': '高清;(480P)','SHD': '超清;(720P)', 'FHD': '蓝光;(1080P)'}

var exec = async function(params, opts){
	console.log("debug: matching video info ")
	var body = await request.get(params.url)

	var vid_match = body.match(/"vid":"([a-z0-9]+)"/iu);
    var vid = vid_match[1]
    console.log("debug: vid " + vid)

    var info_match = body.match(/VIDEO_INFO\s*=\s*\{(.*)video_checkup_time"/iu);
    
    var title_match = info_match[1].match(/"title":\s*"([^"]*)"/iu)
    var title = title_match[1]
    console.log("debug: title " + title)

	var streams = []

	var can_download = false

	try{

	    for (let part_format_id in vd_2_id) {
	    	let stream_id = vd_2_id[part_format_id]

	    	if(stream_id in streams){
				continue
			}

			if(opts.streamId && opts.streamId.toUpperCase()!=stream_id){
				continue
			}
			
			let platform = 11 //4100201
	    	let url = `http://vv.video.qq.com/getinfo?otype=json&appver=3.2.19.333&platform=${platform}&defnpayver=1&defn=${stream_id.toLowerCase()}&vid=${vid}`
		    let content = ""//await request.get(url)

			// 必须含有 vqq_access_token vqq_appid vqq_openid 来识别会员

			var cookies_str = 'vqq_access_token=15E9AAC26ED32809A9D3C452E3D2ACC9; vqq_appid=101483052; vqq_openid=FA606E1161310CEE0DC65FC0D19A963F'
			var agent = superagent.agent()
			let cookies = cookies_str.split("; ")
			cookies.forEach(function(item){
				agent.jar.setCookie(item, "vv.video.qq.com","/")
			})

			content = await agent
			   .get(url)
			   .set('referer', params.url)
		   		.set('User-Agent', UserAgent)
			   .set('accept', 'application/json; charset=utf8')
			   .buffer(true).parse(function(res, fn){
		   			res.text = ""
					res.setEncoding("utf-8");
					res.on("data",function(chunk){
						res.text += chunk.toString()
					})
					res.on("end",function(){
						fn(null, res)
					})
			})

		    let video_json_match = content.text.match(/QZOutputJson=(.*)/iu)
		    let video_json = video_json_match[1]
		    video_json = video_json.substring(0, video_json.lastIndexOf(';'))
		    video_json = JSON.parse(video_json)

		    // 视频是否可下载
		    if(video_json['s']=="f"){
		    	console.log("debug: video "+video_json['msg'])
			    can_download = false
		    	break
		    }

		    title = video_json['vl']['vi'][0]['ti']
		    let fn_pre = video_json['vl']['vi'][0]['lnk']
		    let host = video_json['vl']['vi'][0]['ul']['ui'][0]['url']
		    let seg_cnt = video_json['vl']['vi'][0]['cl']['fc']
		    let filename = video_json['vl']['vi'][0]['fn']


		    let fc_cnt = seg_cnt

		    // start 因为非会员fhd将自动降至sd,故排除
		    let real_format_id = ""
		    if(fc_cnt==0){
		        real_format_id = video_json['vl']['vi'][0]['cl']['keyid'].split('.')[-1]
		    }else{
		    	real_format_id = video_json['vl']['vi'][0]['cl']['ci'][0]['keyid'].split('.')[1]
		    }
		    if(vd_2_id[real_format_id] in streams){
				continue
			}else{
				part_format_id = real_format_id
			}
			// end


		    let magic_str = ""
		    let video_type = ""
		    let fparts = []
		    if(seg_cnt==0){
		    	seg_cnt=1
		    }else{
		    	fparts = filename.split('.')
		    	fn_pre = fparts[0]
		   	 	magic_str = fparts[1]
		    	video_type = fparts[2]
		    }

		    let total_size = 0

		    // 视频片段
		    let urls = []

		    var can_seg_download = false

		    for (let i = 1; i < seg_cnt+1; i++) {
		    	if(fc_cnt!=0){
		            filename = [fn_pre, magic_str, i, video_type].join('.')
		    	}
		        let key_api = `http://vv.video.qq.com/getkey?otype=json&platform=${platform}&format=${part_format_id}&vid=${vid}&filename=${filename}&appver=3.2.19.333`
		       
		       	console.log(key_api)

		       	let part_info = await agent
				   .get(key_api)
				   .set('referer', params.url)
		   			.set('User-Agent', UserAgent)
				   .set('accept', 'application/json; charset=utf8')
				   .buffer(true).parse(function(res, fn){
			   			res.text = ""
						res.setEncoding("utf-8");
						res.on("data",function(chunk){
							res.text += chunk.toString()
						})
						res.on("end",function(){
							fn(null, res)
						})
				})

		        let part_info_match = part_info.text.match(/QZOutputJson=(.*)/iu)
			    let part_json = part_info_match[1]
			    part_json = part_json.substring(0, part_json.lastIndexOf(';'))
			    part_json=JSON.parse(part_json)

			    let vkey = ""
			    let url = ""


				   // console.log(part_json)

			    // 视频清晰度是否可下载
			    if(part_json['s']=="f"){
			    	console.log("debug: part "+part_json['msg'])
			    	can_seg_download = false
			    	break
			    }

			    if(!part_json['key']){
			    	vkey = video_json['vl']['vi'][0]['fvkey']
		            url = `${video_json['vl']['vi'][0]['ul']['ui'][0]['url']}${fn_pre + '.mp4'}?vkey=${vkey}`
			    }else{
		        	vkey = part_json['key']
		            url = `${host}${filename}?vkey=${vkey}`
		        }

			    can_seg_download = true

		        urls.push(url)
		    }

		    can_download = true

		    if(can_seg_download){
		    	streams[stream_id] = Object.assign({'id':stream_id},{
					'video_profile': id_2_profile[stream_id], 
					'container': 'mp4', 
					'src': urls, 
					'format' : 'mp4', 
					'size' : total_size, 
					'screenSize': ""
				})
		    }

	    }

	    var streams_sorted = [];
		for(let index in ids){
			let stream_id = ids[index]
			if (stream_id in streams){
				streams_sorted[stream_id] = Object.assign({'id':stream_id},streams[stream_id])
			}
		}

	}catch(err){
		console.log(err)
	}
	
	console.log("debug: matching video completed ")

	if(!can_download){
		console.log("debug: video cannot download ")
		return []
	}

   
	return [{
		"title":title,
		"url":params.url,
		"merge":true,
		"streams":streams_sorted
	}]
}

exports = module.exports = {exec,vp:true}