'use strict';

const readline = require('readline')
const path = require('path')
const fs = require('fs-extra')

var exec = async function(stream, opts){
	console.log('开始从m3u8文件中解析所有片段地址')

	// 取得资源路径前缀
	let parts = stream['src'][0].split('/')
	parts.pop()
	let prepath = parts.join('/')

	// 下载m3u8资源文件
	let result = await require(path.join(__dirname,'../downloader/download_with_request')).exec(stream, opts)

	let filepath = path.join(process.cwd(), result['tempfiles'][0])
	let input = fs.createReadStream(filepath)
	const rl = readline.createInterface({
	  input: input
	})
	let urls = []
	await new Promise(async (resolve, reject) => {
		rl.on('line', (line) => {
		  if(line.indexOf('.ts')>-1){
		  	urls.push(prepath + '/' + line)
		  }
		})
		rl.on('close', (line) => {
			resolve(urls)
		})
	})
	// 返回资源地址列表
	return {
		'urls':urls,
		'urlspath':filepath,
		'format':stream['format']
	}
}
exports = module.exports = {exec}