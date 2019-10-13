'use strict';
const path = require('path')
const request = require(path.join(__dirname,'../util/request'))
const {getUrlExt, streamsSort} = require(path.join(__dirname,'../utils'))

var exec = async function(params, opts){
	logger.info("debug: matching info")
	let body = await request.agent({'referer':params.url}, opts).get(params.url).proxy(opts['httpProxy'])
	let match = body.text.match(/f4Addr:\s*'([^']*)'/iu)
	let f4Addr = match[1]

    let url_macth = params.url.match(/\w+.ifeng.com\/video.html\?liveid=([a-zA-Z0-9=]+)/iu)
    let vid = url_macth[1]
    logger.info("debug: vid " + vid)

    let t = (new Date().getTime()*1000).toString().slice(0,13)

	let infoapi = `http:${f4Addr}${vid}/config_${vid}.js?_=${t}`
	body = await request.agent({'referer':infoapi}, opts)
	.buffer(true)
	.set('content-type','application/javascript')
	.get(infoapi).proxy(opts['httpProxy'])
	match = body.text.match(/config\s*=\s*([^;]*)/iu)
	let v_json = JSON.parse(match[1])
	let title = v_json['info']['title']
	let url = v_json['compenonts']['video']['list'][0]['mp4']
	let ext = getUrlExt(url)
	
	let streams = {}
	streams[ext] = {
		"id":ext,
		'duration':0,
		'container': ext, 
		'type':'video',
		'format':'mp4',
        'isRemote':true,
        'video_profile':ext,
		'src': [url],
		"merge":true,
		'size':0
	}

	return [{
		"title":title,
		"url":params.url,
		"streams":streams
	}]
}
exports = module.exports = {exec, vp:true}