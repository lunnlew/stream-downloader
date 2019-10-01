'use strict';
const path = require('path')
const request = require(path.join(__dirname,'../util/request'))
const {getUrlExt, streamsSort} = require(path.join(__dirname,'../utils'))
var cheerio = require('cheerio')

var exec = async function(params, opts){
	console.log("debug: matching info")
	let body = await request.agent({'url':params.url}, opts).get(params.url).proxy(opts['httpProxy'])

	let match = body.text.match(/vInfo"\s*,\s*"([^"]*)"/iu)
	let url = match[1]

	match = body.text.match(/titleToWap\s*=\s*"([^"]*)"/iu)
	let title = match[1]

	let ext = getUrlExt(url)

	let streams = {}
	streams[ext] = {
		"id":ext,
		'duration':0,
		'container': ext, 
		'type':'video',
		'format': ext,
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