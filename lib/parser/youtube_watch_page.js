'use strict';
const path = require('path')
const request = require(path.join(__dirname,'../util/request'))
const {requestStrToMap, mimeToExt} = require(path.join(__dirname,'../utils'))

var exec = async function(params, opts){
	logger.info("matching info")
	let url_macth = params.url.match(/youtube.com\/watch\?v=([a-zA-Z0-9=]+)/iu)
	let vid = url_macth[1]
	logger.info("vid " + vid)
	
	let content = await request.agent({'referer':params.url}, opts).get(params.url).proxy(opts['httpProxy'])
	let matched = content.text.match(/ytplayer\.config\s*=\s*([^\n]+?\});/iu)
	let vjson = JSON.parse(matched[1])
	let player_response = JSON.parse(vjson["args"]["player_response"])

	let title = player_response["videoDetails"]["title"]

	let streams = []
	// for(let stream of player_response['streamingData']['adaptiveFormats']){
	// 	logger.info(stream)
	// 	streams[stream['itag']] = {
	// 		"id":stream['itag'],
	// 		'container': "mp4", 
	// 		'quality': stream['quality'],
	// 		'size': 0, 
	// 		'isRemote':true,
			// 'type':stream['mimeType'].split(';')[0].split('/')[0],
	// 		'format':mimeToExt(stream['mimeType'].split(';')[0]),
	// 		'src': [stream['url']]
	// 	}
	// }
	for(let stream of player_response['streamingData']['formats']){
		streams[stream['itag']] = {
			"id":stream['itag'],
			'resolution': stream['width']+'x'+stream['height'],
			'size': stream['contentLength'],
			'type':stream['mimeType'].split(';')[0].split('/')[0],
			'format':mimeToExt(stream['mimeType'].split(';')[0]),
			'src': [stream['url']], 
			'isRemote':true
		}
	}
	// let stream_list = vjson['args']['url_encoded_fmt_stream_map'].split(',')
	// for(let stream of stream_list){
	//  	let metadata = requestStrToMap(stream)
	//  	streams[metadata['itag']] = {
	// 		"id":metadata['itag'],
	// 		'container': "mp4", 
	// 		'size': 0, 
	// 		'isRemote':true,
	// 		'format':mimeToExt(metadata['type'].split(';')[0]),
	// 		'src': [metadata['url']]
	// 	}
	// }
	return [{
		"title":title,
		"url":params.url,
		"merge":false,
		"streams":streams
	}]
}
exports = module.exports = {exec, vp:true}