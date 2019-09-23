'use strict';
const path = require('path')
var request = require(path.join(__dirname,'../rq'));
var UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36" 
const superagent = require('superagent')
const ids = ['SD','HD', 'SHD', 'FHD']
const vd_2_id = {321001: 'SD', 321002: 'HD', 321003:'SHD', 321004: 'FHD'}
const id_2_profile = {'SD':'标清;(270P)', 'HD': '高清;(480P)','SHD': '超清;(720P)', 'FHD': '蓝光;(1080P)'}

const {mapToRequestStr} = require(path.join(__dirname,'../utils'))
const {getCkeyV91, createGUID} = require(path.join(__dirname,'../encrypt/qq_video_encrypt_9.1'))

var getvinfoparam = function(option, opts){
	// 从cookies中解析参数
	let cookies_str = opts.httpCookies || ''
	let cookies = cookies_str.split("; ")
	let cps = {}
	cookies.forEach(function(item){
		let s = item.split("=")
		cps[s[0]] = s[1]
	})

	let logintoken = {
		"main_login":cps['main_login'],
		"openid":cps['vqq_openid'],
		"appid":cps['vqq_appid'],
		"access_token":cps['vqq_access_token'],
		"vuserid":cps['vqq_vuserid'],
		"vusession":cps['vqq_vusession']
	}
	let t =  Math.round(new Date().getTime()/1000)
    let platform = 10201
    let sdtfrom = 'v1010'
    let encryptVer = '9.1'
    let appVer = '3.5.57'
    let guid = createGUID()
    let flowid = createGUID() + '_' + platform

	let params = {
		'charge':'0',
		'defaultfmt':'auto',
		'otype':'ojson',
		'guid':guid,
		'flowid':flowid,
		'platform':platform.toString(),
		'sdtfrom':sdtfrom,
		'defnpayver':'1',
		'appVer':appVer,
		'host':'v.qq.com',
		'ehost': option['url'],
		'refer':'v.qq.com',
		'sphttps':'1',
		'tm':t.toString(),
		'spwm':'4',
		'logintoken':cps['vqq_openid']?JSON.stringify(logintoken):'',
		'vid': option['vid'],
		'defn': option['streamId'].toLowerCase(),
		'fhdswitch':'1',
		'show1080p':'1',
		'isHLS':'1',
		'onlyGetinfo':'true',
		'dtype':'3',
		'sphls':'2',
		'spgzip':'1',
		'dlver':'2',
		'drm':'32',
		'hdcp':'0',
		'spau':'1',
		'spaudio':'15',
		'defsrc':'2',
		'encryptVer': encryptVer,
		'cKey':getCkeyV91(platform, appVer, option['vid'], "" , guid, t),
		'fp2p':'1',
		'spadseg':'1',
		'adsid':'',
		'adpinfo':''
	}
	return mapToRequestStr(params)
}

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
	var streams_sorted = []
	var can_download = false
	var cookies_str = opts.httpCookies || ''
	var agent = superagent.agent()
	var cookies = cookies_str.split("; ")
	cookies.forEach(function(item){
		agent.jar.setCookie(item, "v.qq.com","/")
	})
	try{

		 for (let part_format_id in vd_2_id) {
		 	console.log('part_format_id ' + part_format_id)
	    	let stream_id = vd_2_id[part_format_id]
	    	if(stream_id in streams){
				continue
			}
			if(opts.streamId && opts.streamId.toUpperCase()!=stream_id){
				continue
			}
			let payload = {
				'buid':'onlyvinfo',
				'vinfoparam': getvinfoparam({
						'vid':vid,
						'url':params.url,
						'streamId':stream_id
					}, opts)
			}
			let content = await agent
				.post('https://vd.l.qq.com/proxyhttp')
				.set('referer', params.url)
				.set('User-Agent', UserAgent)
				.set('accept', 'application/json; charset=utf8')
				.send(JSON.stringify(payload)) 
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
			let video_json = JSON.parse(content.text)
			if(video_json.errCode==0){
				video_json = JSON.parse(video_json['vinfo'])
				// 视频是否可下载
			    if(video_json['s']=="f"){
			    	console.log("debug: video "+video_json['msg'])
				    can_download = false
			    }else{
			    	can_download = true
			    }
			    if(can_download){
				    title = video_json['vl']['vi'][0]['ti']
				    let fn_pre = video_json['vl']['vi'][0]['lnk']
				    let host = video_json['vl']['vi'][0]['ul']['ui'][0]['url']
				    let seg_cnt = video_json['vl']['vi'][0]['fc']
				    let filename = video_json['vl']['vi'][0]['fn']

				    let real_format_id = video_json['vl']['vi'][0]['keyid'].split('.')[1]

				    if(vd_2_id[real_format_id] in streams){
						continue
					}else{
						part_format_id = real_format_id
					}

					let pt = video_json['vl']['vi'][0]['ul']['ui'][0]['hls']['pt']
					let vurl = `${host}${pt}`
			    	streams[stream_id] = Object.assign({'id':stream_id},{
						'video_profile': id_2_profile[stream_id], 
						'container': 'm3u8', 
						'src': [vurl], 
						'format' : 'mp4', 
						'size' : 0, 
						'screenSize': ""
					})
			    }
			}
		}
	}catch(err){
		console.log(err)
	}

	console.log("debug: matching video completed ")

	for(let index in ids){
		let stream_id = ids[index]
		if (stream_id in streams){
			streams_sorted[stream_id] = Object.assign({'id':stream_id},streams[stream_id])
		}
	}

	return [{
		"title":title,
		"url":params.url,
		"merge":true,
		"streams":streams_sorted
	}]
}

exports = module.exports = {exec,vp:true}