'use strict';

const path = require('path')
var request = require(path.join(__dirname,'../rq'));
var crypto = require('crypto');
var zlib = require('zlib');
var stream_types = [
        {'id': 'mp4', 'container': 'FLV', 'quality': 0},
        {'id': 'flv360', 'quality': 16, 'audio_quality': 30216, 'container': 'FLV', 'video_resolution': '360p', 'desc': '流畅 360P'},
        {'id': 'flv480', 'quality': 32, 'audio_quality': 30280, 'container': 'FLV', 'video_resolution': '480p', 'desc': '清晰 480P'},
        {'id': 'hdmp4', 'quality': 48, 'audio_quality': 30280, 'container': 'MP4', 'video_resolution': '720p', 'desc': '高清 720P (MP4)'},
        {'id': 'flv720', 'quality': 64, 'audio_quality': 30280, 'container': 'FLV', 'video_resolution': '720p', 'desc': '高清 720P'},
        {'id': 'flv720_p60', 'quality': 74, 'audio_quality': 30280, 'container': 'FLV', 'video_resolution': '720p', 'desc': '高清 720P60'},
        {'id': 'flv', 'quality': 80, 'audio_quality': 30280, 'container': 'FLV', 'video_resolution': '1080p', 'desc': '高清 1080P'},
        {'id': 'hdflv2', 'quality': 112, 'audio_quality': 30280, 'container': 'FLV', 'video_resolution': '1080p', 'desc': '高清 1080P+'},
        {'id': 'flv_p60', 'quality': 116, 'audio_quality': 30280, 'container': 'FLV', 'video_resolution': '1080p', 'desc': '高清 1080P60'}
    ]
var APPKEY = 'iVGUTjsxvpLeuDCf'
var SECRETKEY = 'aHRmhWMLkdeMuILqORnYZocwMBpMEOdt'
var api_url = 'https://interface.bilibili.com/v2/playurl'



var gunzip = function(content){
	return  new Promise((resolve, reject) => {
			zlib.gunzip(content, function(err, dezipped) {
	            resolve(dezipped.toString())
	        })
		  }
		)
}
var get_api_url = function(cid, qn){
	let params_str = `appkey=${APPKEY}&cid=${cid}&otype=json&player=0&qn=${qn}`
   	return sign_api_url(api_url, params_str, SECRETKEY)
}
        
var sign_api_url = function(api_url, params_str, skey){
	var md5 = crypto.createHash('md5')
    let sign = md5.update(params_str + skey).digest('hex')
    return `${api_url}?${params_str}&sign=${sign}`
}

var exec = async function(params, opts){
	console.log("debug: matching video info ")
	let content = await request.get(params.url,null,{
		"referer":params.url,
		"cookie":"CURRENT_FNVAL=16;",
		'Accept-Encoding': 'gzip'
	})
	content = await gunzip(content)
	let match = content.match(/__INITIAL_STATE__=(.*?);\(function\(\)\{var/iu)
	let v_json = JSON.parse(match[1])
	let pn = v_json['videoData']['videos']
	console.log("debug: pn " + pn)

	let title = v_json['videoData']['title']
	console.log("debug: title " + title)

	let avid = v_json['aid']
	console.log("debug: avid " + avid)

	let cid = v_json['videoData']['pages'][0]['cid']
	console.log("debug: cid " + cid)

	let streams = {}
	for(let i in stream_types){
		let st = stream_types[i]
		let stream_id = st['id']

		if(stream_id in streams){
			continue
		}

		if(opts.streamId&&opts.streamId.toUpperCase()!=stream_id){
			continue
		}

		let qn = st['quality']
		let api_url = get_api_url(cid, qn)
		let vcontent = await request.get(api_url,null,{
			"referer":"https://www.bilibili.com/",
			'Accept-Encoding': 'gzip'
		})
		vcontent = await gunzip(vcontent)
		let vp_json = JSON.parse(vcontent)

		stream_id = vp_json['format']
		qn = vp_json['quality']

		if(stream_id in streams){
			continue
		}

		let urls = []
		for(let i in vp_json['durl']){
			let v = vp_json['durl'][i]
			urls.push(v['url'])
		}

		streams[stream_id] = {
			"id":stream_id,
			"headers":{
				"referer":params.url,
				"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36"
			},
			'container': "flv", 
			'quality': qn, 
			'size': 0, 
            'isRemote':true,
			'format':'mp4', 
			'src': urls
		}
	}
	
	let streams_sorted = streams

	console.log("debug: matching video completed ")
	return [{
		"title":title,
		"url":params.url,
		"merge":false,
		"streams":streams_sorted
	}]
}

exports = module.exports = {exec,vp:true}