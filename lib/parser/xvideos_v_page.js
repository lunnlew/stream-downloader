'use strict';
const path = require('path')
const request = require(path.join(__dirname,'../util/request'))
const {getUrlExt, streamsSort} = require(path.join(__dirname,'../utils'))
const ids = ['VideoUrlLow', 'VideoHLS', 'VideoHLS-250p', 'VideoHLS-360p', 'VideoHLS-480p', 'VideoHLS-720p', 'VideoUrlHigh']

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
		"merge":false,
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
		"merge":false,
		'size':0
	}

	match = body.text.match(/VideoHLS\('([^']+)'\)/iu)
	let VideoHLS = match[1]
	console.log('debug: VideoHLS ' + VideoHLS)
	console.log('debug: 包含多个清晰度媒体源')

	ext = getUrlExt(VideoHLS)

    url_part = new URL(VideoHLS)
	let m3u8_content = await agent
        .set('host',url_part.hostname)
		.get(VideoHLS)
		.buffer(true)
	    .parse(function(res, fn){
			res.text = ""
			res.setEncoding("utf-8");
			res.on("data",function(chunk){
				res.text += chunk.toString()
			})
			res.on("end",function(){
				fn(null, res)
			})
		})
		.proxy(opts['httpProxy'])
	let us = VideoHLS.split('?')[0].split('/')
	us.pop()
	let sVideoHLS = {
		"id":'VideoHLS',
		'duration':0,
		'container': ext, 
		'type':'video',
		'format': ext,
        'isRemote':true,
        'video_profile':ext,
		'src': [VideoHLS],
		"merge":false,
		'preurl':us.join('/'),
		'size':0
	}
	let dataurls = await require(path.join(__dirname,'../util/UrlExtractorFromM3U8')).parseStreams(m3u8_content.text, sVideoHLS)
	let urls = []
	for(let d of dataurls){
		ext = getUrlExt(d['url'])
		streams['VideoHLS-' + d['name']] = {
			"id":'VideoHLS-' + d['name'],
			'duration':0,
			'container': ext, 
			'type':'video',
			'format': ext,
	        'isRemote':true,
	        'video_profile':ext,
			'src': [d['url']],
			"merge":true,
			'size':0
		}
	}
	return [{
		"title":title,
		"url":params.url,
		"streams":streamsSort(streams, ids)
	}]
}

exports = module.exports = {exec,vp:true}