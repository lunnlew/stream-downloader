'use strict';
const path = require('path')
const request = require(path.join(__dirname,'../util/request'))
const {getUrlExt, streamsSort} = require(path.join(__dirname,'../utils'))
var cheerio = require('cheerio')

var exec = async function(params, opts){
	logger.info("matching info")

	var url_match = params.url.match(/\w+.quklive.com\/[a-zA-Z0-9=\/\-]+\/embed\/([a-zA-Z0-9]+)/iu);
    var vid = url_match[1]
    logger.info("vid " + vid)

	let body = await request.agent({'referer':params.url}, opts).get(params.url).proxy(opts['httpProxy'])
	let $ = cheerio.load(body.text)
	let title = $('title').text()

	let match = body.text.match(/videoUrl\s*=\s*'([^']*)'/iu)
	let url = match[1]

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