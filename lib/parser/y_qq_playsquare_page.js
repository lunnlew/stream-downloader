'use strict';
const path = require('path')
var request = require(path.join(__dirname,'../rq'));
var cheerio = require('cheerio');
var obtain_all_play_url = async function(params, opts){
	console.log("debug: matching albumlist info ")
	let url_macth = params.url.match(/y\.qq\.com\/n\/yqq\/playsquare\/([a-zA-Z0-9].*)\.html/iu)
	let disstid = url_macth[1]
    console.log("debug: disstid " + disstid)
	var t =  (new Date()).getTime().toString()
    let url = `https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&json=1&utf8=1&onlysong=0&new_format=1&disstid=${disstid}&g_tk=${t}&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0`
	let content = await request.get(url,false,{
		"referer":params.url
	})
	let diss_json = JSON.parse(content)

	let urls = []
	diss_json['cdlist'][0]['songlist'].forEach(function (item) {
		let url = `https://y.qq.com/n/yqq/song/${item['mid']}.html`
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