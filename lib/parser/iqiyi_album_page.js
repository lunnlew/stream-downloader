'use strict';
const path = require('path')
var request = require(path.join(__dirname,'../rq'));
var cheerio = require('cheerio');
var obtain_all_play_url = async function(params, opts){
	console.log("debug: matching albumlist info ")
	var body = await request.get(params.url);
	var $ = cheerio.load(body)
	let urls = []
	$(".site-piclist").find('li[data-albumlist-elem|="playItem"]').each(function (index, item) {
		let $this = $(this);
        let url = $this.find('a.site-piclist_pic_link').attr("href")
        var http_index = url.indexOf('//');
        if(http_index==0){
        	url = 'http:'+url
        }
        urls.push(url)
	})
	console.log("debug: matching albumlist completed ")
	return urls
}
exports = module.exports = {obtain_all_play_url,vp:false}