'use strict';
const path = require('path')
var request = require(path.join(__dirname,'../rq'));
var cheerio = require('cheerio');
const {gunzip} = require(path.join(__dirname,'../utils'))

var obtain_all_play_url = async function(params, opts){
	console.log("debug: matching audio info ")
	let url_macth = params.url.match(/www\.bilibili\.com\/audio\/am([a-zA-Z0-9]+)/iu)
	let sid = url_macth[1]
	console.log("debug: sid " + sid)

	let info_api = `https://www.bilibili.com/audio/music-service-c/web/song/of-menu?sid=${sid}&pn=1&ps=100`
	let vcontent = await request.get(info_api,null,{
		"referer":params.url,
		'Accept-Encoding': 'gzip'
	})
	vcontent = await gunzip(vcontent)
	let vp_json = JSON.parse(vcontent)

	let urls = []
	for(let i in vp_json['data']['data']){
		let v = vp_json['data']['data'][i]
		let url = `https://www.bilibili.com/audio/au${v['id']}`
		urls.push(url)
	}

	console.log("debug: matching albumlist completed ")
	return urls
}
exports = module.exports = {obtain_all_play_url,vp:false}