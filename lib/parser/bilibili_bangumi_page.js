'use strict';

const path = require('path')
var request = require(path.join(__dirname,'../rq'));
var crypto = require('crypto');
var zlib = require('zlib');
var stream_types = [
        {'id': 'flv_p60', 'quality': 116, 'audio_quality': 30280,
         'container': 'FLV', 'video_resolution': '1080p', 'desc': '高清 1080P60'},
        {'id': 'hdflv2', 'quality': 112, 'audio_quality': 30280,
         'container': 'FLV', 'video_resolution': '1080p', 'desc': '高清 1080P+'},
        {'id': 'flv', 'quality': 80, 'audio_quality': 30280,
         'container': 'FLV', 'video_resolution': '1080p', 'desc': '高清 1080P'},
        {'id': 'flv720_p60', 'quality': 74, 'audio_quality': 30280,
         'container': 'FLV', 'video_resolution': '720p', 'desc': '高清 720P60'},
        {'id': 'flv720', 'quality': 64, 'audio_quality': 30280,
         'container': 'FLV', 'video_resolution': '720p', 'desc': '高清 720P'},
        {'id': 'hdmp4', 'quality': 48, 'audio_quality': 30280,
         'container': 'MP4', 'video_resolution': '720p', 'desc': '高清 720P (MP4)'},
        {'id': 'flv480', 'quality': 32, 'audio_quality': 30280,
         'container': 'FLV', 'video_resolution': '480p', 'desc': '清晰 480P'},
        {'id': 'flv360', 'quality': 16, 'audio_quality': 30216,
         'container': 'FLV', 'video_resolution': '360p', 'desc': '流畅 360P'},
        {'id': 'mp4', 'container': 'FLV', 'quality': 0},
    ]

var APPKEY = '84956560bc028eb7'
var SECRETKEY = '94aba54af9065f71de72f5508f1cd42e'
var api_url = 'https://bangumi.bilibili.com/player/web_api/v2/playurl'



var gunzip = function(content){
	return  new Promise((resolve, reject) => {
			zlib.gunzip(content, function(err, dezipped) {
	            resolve(dezipped.toString())
	        })
		  }
		)
}
var get_api_url = function(cid, qn, season_type){
	let params_str = `appkey=${APPKEY}&cid=${cid}&module=bangumi&otype=json&player=0&qn=${qn}&season_type=${season_type}`
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


	let title = v_json['h1Title']
	console.log("debug: title " + title)

	let avid = v_json['epInfo']['aid']
	console.log("debug: avid " + avid)

	let cid = v_json['epInfo']['cid']
	console.log("debug: cid " + cid)

	let mediaInfo = v_json['mediaInfo']
    let seasonType = mediaInfo['ssType']

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
		let api_url = get_api_url(cid, qn, seasonType)
		let vcontent = await request.get(api_url,null,{
			"referer":params.url,
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
			'format':'mp4', 
			'src': urls
		}
	}
	
	let streams_sorted = streams

	console.log("debug: matching video completed ")
	return [{
		"title":title,
		"url":params.url,
		"merge":true,
		"streams":streams_sorted
	}]
}

exports = module.exports = {exec,vp:true}