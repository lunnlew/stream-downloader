'use strict';

const readline = require('readline')
const path = require('path')
const fs = require('fs-extra')
const {md5} = require(path.join(__dirname,'../utils'))

var exec = async function(stream, opts){
	console.log('开始从m3u8文件中解析所有片段地址')
	let urls = []
	let filepath = ''
	// 临时目录
	var tempfilepath = md5(stream['title'])
	fs.ensureDirSync(tempfilepath)
	filepath = path.join(process.cwd(), tempfilepath+"/"+stream['title'])
	// 判断是否是网络资源
	if(stream['isRemote']){
		urls = await require(path.join(__dirname,'../util/UrlExtractorFromM3U8')).fetch(stream['src'][0], stream)
	}else{
		urls = await require(path.join(__dirname,'../util/UrlExtractorFromM3U8')).parse(stream['src'][0], stream)
	}
	// 返回资源地址列表
	return {
		'urls':urls,
		'urlspath':filepath,
		'format':stream['format']
	}
}
exports = module.exports = {exec}