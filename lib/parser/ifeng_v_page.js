'use strict';
const path = require('path')
const request = require(path.join(__dirname,'../util/request'))
const {getUrlExt, streamsSort} = require(path.join(__dirname,'../utils'))

var exec = async function(params, opts){
	logger.info("debug: matching info")
	let body = await request.agent({'referer':params.url}, opts).get(params.url).proxy(opts['httpProxy'])
	let match = body.text.match(/allData\s*=\s*(.*?);/iu)
	let vjson = JSON.parse(match[1])
	let url = vjson['docData']['m3u8Url']
	let title = vjson['docData']['title']
	let guid =  vjson['docData']['guid']

	let ext = getUrlExt(url)

	let authurl = `http://shankapi.ifeng.com/feedflow/getVideoAuthUrl/${guid}`
	body = await request.agent({'referer':authurl}, opts).get(authurl).proxy(opts['httpProxy'])
	let v_json = JSON.parse(body.text)

	if(v_json['code']==0){
		url = url+'?'+v_json['data']['authUrl']
	}
	
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