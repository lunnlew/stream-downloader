'use strict';
const path = require('path')
var request = require(path.join(__dirname,'../rq'));
var cheerio = require('cheerio');
const {gunzip} = require(path.join(__dirname,'../utils'))

var obtain_all_play_url = async function(params, opts){
	logger.info("debug: matching albumlist info ")
	let content = await request.get(params.url.replace('/#/','/'),null,{
		"referer":params.url,
		'Accept-Encoding': 'gzip'
	})
	content = await gunzip(content)

	let match = content.match(/var\s*data=\s*(.*?)\s*specialData/iu)
	let v_json = JSON.parse(match[1].substring(0, match[1].lastIndexOf(',')))
	let urls = []
	v_json.forEach(function(item){
		urls.push(`https://www.kugou.com/song/${item['encrypt_id']}.html`)
	})
	logger.info("debug: matching albumlist completed ")
	return urls
}
exports = module.exports = {obtain_all_play_url, vp:false}