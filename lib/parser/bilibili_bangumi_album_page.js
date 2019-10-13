'use strict';
const path = require('path')
var request = require(path.join(__dirname,'../rq'));
var cheerio = require('cheerio');
const {gunzip} = require(path.join(__dirname,'../utils'))

var obtain_all_play_url = async function(params, opts){
	logger.info("debug: matching albumlist info ")
	let content = await request.get(params.url,null,{
		"referer":params.url,
		"cookie":"CURRENT_FNVAL=16;",
		'Accept-Encoding': 'gzip'
	})
	content = await gunzip(content)
	let match = content.match(/__INITIAL_STATE__=(.*?);\(function\(\)\{var/iu)
	let v_json = JSON.parse(match[1])

	let urls = []

	for(let i in v_json['mediaInfo']['episodes']){
		let v = v_json['mediaInfo']['episodes'][i]
		let url = `https://www.bilibili.com/bangumi/play/ep${v['ep_id']}`
		urls.push(url)
	}
	
	logger.info("debug: matching albumlist completed ")
	return urls
}
exports = module.exports = {obtain_all_play_url,vp:false}