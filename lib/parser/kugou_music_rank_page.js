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
	var $ = cheerio.load(content)
	let items = $('.pc_temp_songlist ').find('li')
	let urls = []
	items.each(function (index, item) {
		let $this = $(this);
        let url = $this.find('a').attr("href")
        var http_index = url.indexOf('http')
        urls.push(url)
	})
	logger.info("debug: matching albumlist completed ")
	return urls
}
exports = module.exports = {obtain_all_play_url, vp:false}