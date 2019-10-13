'use strict';

const readline = require('readline')
const path = require('path')
const fs = require('fs-extra')
const {md5} = require(path.join(__dirname,'../utils'))

var exec = async function(stream, opts){
	logger.info('开始取得所有片段地址')

	// 临时目录
	var tempfilepath = path.join(require('os').tmpdir(), md5(stream['title']))
   	fs.ensureDirSync(tempfilepath)
	// 返回资源地址列表
	return {
		'urls':stream['src'],
		'urlspath':tempfilepath+"/"+stream['title'],
		'format':stream['format']
	}
}
exports = module.exports = {exec}