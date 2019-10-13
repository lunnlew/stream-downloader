'use strict';
const path = require('path')
const request = require(path.join(__dirname,'../util/request'))

var exec = async function(params, opts){
	logger.info("debug: matching info")
	let url_macth = params.url.match(/live.qq.com\/video\/v\/([0-9]+)/iu)
	let vid = url_macth[1]
	logger.info("debug: vid " + vid)
	let api_endpoint = `https://m.live.qq.com/video/v/${vid}`
	let content = await request.agent(Object.assign({},params,{'url':api_endpoint}), opts)
		.set('user-agent','Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Mobile Safari/537.36')
		.get(api_endpoint)
	let match = content.text.match(/window.\$DETAIL\s*=\s*(.*?);/iu)
	let v_json = JSON.parse(match[1])
	let title = v_json['video_info']['title']
	let stream_name = v_json['video_info']['stream_name']
	api_endpoint = `https://api.qiecdn.com/api/v1/video/stream/${stream_name}`
	content = await request.agent(Object.assign({},params,{'url':api_endpoint}), opts)
        .set('accept', 'application/json;charset=UTF-8')
		.set('user-agent','Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Mobile Safari/537.36')
		.get(api_endpoint)
	v_json = JSON.parse(content.text)
	let streams = []
	if(v_json['code']==200){
		let videos = v_json['result']['videos']
		for(let i in videos){
			let video = videos[i]
			let url = `https://qietv-play.qiecdn.com/${video['key']}`
			streams[video['height']] = {
		        "id":video['height'],
		        'container': "m3u8", 
				'type':'video',
		        'size': video['fileSize'], 
		        'format':'mp4', 
		        'isRemote':true,
		        'src': [url]
		    }
		}
	}
    return [{
        "title":title,
        "url":params.url,
		"merge":true,
        "streams":streams
    }]
}
exports = module.exports = {exec, vp:true}