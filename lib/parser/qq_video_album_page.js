'use strict';
const path = require('path')
const request = require(path.join(__dirname,'../util/request'))
var cheerio = require('cheerio');
var obtain_all_play_url = async function(params, opts){
	console.log("debug: matching albumlist info ")

	let agent  = request.agent({
        'referer':params.url,
        'cookieDomain':'qq.com'
    }, opts)


	var body = await agent.get(params.url)
    	.proxy(opts['httpProxy'])

	var $ = cheerio.load(body.text)
	let urls = []
	$(".mod_episode").find('a[itemprop|="url"]').each(function (index, item) {
		let $this = $(this);
        let url = $this.attr("href")
        var http_index = url.indexOf('//');
        if(http_index==0){
        	url = 'http:'+url
        }
        urls.push(url)
	})
	let max_r = 1
	$("._tabsNav").find("a[data-range]").each(function (index, item) {
		let $this = $(this);
		let range = $this.attr("data-range").split("-")
		if(parseInt(range[1])<=0){
			range[1] = 30
		}
		max_r = Math.max(parseInt(range[1]), max_r)
	})
	let plname = $(".video_btn").data("name")
	max_r = Math.max(urls.length, max_r) + 1
	if(urls.length<max_r){
		urls = []
		let t = (new Date()).getTime()
		var url_match = params.url.match(/v\.qq\.com\/detail\/[a-zA-Z0-9]{1}\/([a-zA-Z0-9].*)\.html/iu);
		let vid = url_match[1]
		let r_url = `https://s.video.qq.com/get_playsource?id=${vid}&plat=2&type=4&data_type=2&video_type=106&range=0-${max_r}&plname=${plname}&otype=json&num_mod_cnt=20&callback=_jsonp_1_43e6&_t=${t}`
		let content = await agent.get(r_url).proxy(opts['httpProxy'])
		content = content.text.replace("_jsonp_1_43e6(","").replace("})","}")
		let audio_json = JSON.parse(content)
		for(let i in audio_json['PlaylistItem']['videoPlayList']){
			let url = audio_json['PlaylistItem']['videoPlayList'][i]['playUrl']
        	urls.push(url)
		}
	}
	return urls
}
exports = module.exports = {obtain_all_play_url,vp:false}