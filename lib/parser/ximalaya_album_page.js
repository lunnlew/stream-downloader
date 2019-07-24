'use strict';
const path = require('path')
var request = require(path.join(__dirname,'../rq'));
var cheerio = require('cheerio');
var obtain_all_play_url = async function(params, opts){
	console.log("debug: matching albumlist info ")
	var body = await request.get(params.url);
	var info_match = body.match(/专辑里的声音\(([^\)]*)\)/iu)
	let num = parseInt(info_match[1].replace(/\D/g,""))

	let urls = []

	let p = 2
	do{
		let $ = cheerio.load(body)
		$("#anchor_sound_list .sound-list li._vb").find('.text._vb a').each(function (index, item) {
			let $this = $(this);
	        let url = $this.attr("href")
	        urls.push("https://www.ximalaya.com"+url)
		})
		if(urls.length<num){
			var url = params.url + `p${p}/`
		}else{
			break
		}
		body = await request.get(url)
		p += 1
	}while(true)


	console.log("debug: matching albumlist completed ")
	return urls
}
exports = module.exports = {obtain_all_play_url,vp:false}