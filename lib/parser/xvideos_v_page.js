'use strict';
const path = require('path')
const request = require(path.join(__dirname,'../util/request'))
const {getUrlExt, streamsSort} = require(path.join(__dirname,'../utils'))
const ids = ['VideoUrlLow', 'VideoHLS', 'VideoUrlHigh']

var exec = async function(params, opts){
	console.log("debug: matching info ")
	let agent  = request.agent({
        'referer':params.url,
        'cookieDomain':'xvideos.com'
    }, opts)
    let url_part = new URL(params.url)
	let body = await agent
        .set('host',url_part.hostname)
		.get(params.url)
		.proxy(opts['httpProxy'])

	let match = body.text.match(/VideoTitle\('([^']+)'\)/iu)
	let title = match[1]

	let streams = {}

	match = body.text.match(/VideoUrlLow\('([^']+)'\)/iu)
	let VideoUrlLow = match[1]
	console.log('debug: VideoUrlLow ' + VideoUrlLow)

	let ext = getUrlExt(VideoUrlLow)

	streams['VideoUrlLow'] = {
		"id":'VideoUrlLow',
		'duration':0,
		'container': ext, 
		'type':'video',
		'format': ext,
        'isRemote':true,
        'video_profile':ext,
		'src': [VideoUrlLow],
		"merge":true,
		'size':0
	}


	match = body.text.match(/VideoUrlHigh\('([^']+)'\)/iu)
	let VideoUrlHigh = match[1]
	console.log('debug: VideoUrlHigh ' + VideoUrlHigh)

	ext = getUrlExt(VideoUrlHigh)

	streams['VideoUrlHigh'] = {
		"id":'VideoUrlHigh',
		'duration':0,
		'container': ext, 
		'type':'video',
		'format': ext,
        'isRemote':true,
        'video_profile':ext,
		'src': [VideoUrlHigh],
		"merge":true,
		'size':0
	}

	match = body.text.match(/VideoHLS\('([^']+)'\)/iu)
	let VideoHLS = match[1]
	console.log('debug: VideoHLS ' + VideoHLS)

	ext = getUrlExt(VideoHLS)

	streams['VideoHLS'] = {
		"id":'VideoHLS',
		'duration':0,
		'container': ext, 
		'type':'video',
		'format': ext,
        'isRemote':true,
        'video_profile':ext,
		'src': [VideoHLS],
		"merge":true,
		'size':0
	}

	return [{
		"title":title,
		"url":params.url,
		"streams":streamsSort(streams, ids)
	}]
}

exports = module.exports = {exec,vp:true}