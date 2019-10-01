'use strict';
const path = require('path')
const fs = require('fs-extra')
const {getUrlContent} = require(path.join(__dirname,'../utils'))

var fetch = async function(m3u8_url, stream={}){
	let m3u8_content = await getUrlContent(m3u8_url, stream)
	return parse(m3u8_content, stream)
}

var parse = function(m3u8_content, stream={}){
	let urls = []
	// 匹配所有EXTINF信息行
	let matcheds = m3u8_content.match(/#EXTINF:([\d\.]+),\s+(.+?)\s+/iug)
	let suffix = stream['suffix'] || ''
	for(let i in matcheds){
		//取得实际的资源地址行
		let line = matcheds[i].split('\n')[1]
		//如果是完整的网络资源
		if(line.indexOf('http') ===0){
			urls.push(line+suffix)
		}else{
			// 否则加上链接前缀
			urls.push(stream['preurl'] + '/' + line+suffix)
		}
	}
	return urls
}
exports = module.exports = {parse, fetch}