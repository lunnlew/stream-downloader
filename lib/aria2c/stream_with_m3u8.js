'use strict';

const readline = require('readline')
const path = require('path')
const fs = require('fs-extra')
const {md5} = require(path.join(__dirname,'../utils'))

var exec = async function(stream, opts){
	console.log('开始从m3u8文件中解析所有片段地址')
	let urls = []
	let filepath = ''
	// 判断是否是网络资源
	if(!stream['enablePlain']){
		// 取得资源路径前缀
		let parts = stream['src'][0].split('/')
		parts.pop()
		let preurl = parts.join('/')

		// 下载m3u8资源文件
		let result = await require(path.join(__dirname,'../downloader/download_with_request')).exec(stream, opts)

		filepath = path.join(process.cwd(), result['tempfiles'][0])
		let input = fs.createReadStream(filepath)
		const rl = readline.createInterface({
		  input: input
		})
		await new Promise(async (resolve, reject) => {
			rl.on('line', (line) => {
			  if(line.indexOf('.ts')>-1){
			  	urls.push(preurl + '/' + line)
			  }
			})
			rl.on('close', (line) => {
				resolve(urls)
			})
		})
	}else{
		// 文本行
		let matched = stream['src'][0].match(/#EXTINF:([\d\.]+),\s+(.+?)\s+/iug)
		for(let i in matched){
			let file = matched[i].split('\n')[1]
			urls.push(stream['preurl'] + '/' + file)
		}
		// 临时目录
		var tempfilepath = md5(stream['title'])
	   	fs.ensureDirSync(tempfilepath)
	   	filepath = path.join(process.cwd(), tempfilepath+"/"+stream['title'])
	}
	// 返回资源地址列表
	return {
		'urls':urls,
		'urlspath':filepath,
		'format':stream['format']
	}
}
exports = module.exports = {exec}