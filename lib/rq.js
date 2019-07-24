'use strict';
const path = require('path')
var request = require('request-promise')
var pre_headers = {
	"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36",
}
var get = async function(url,encoding,headers){
	encoding = typeof encoding === 'undefined' || encoding===false ? 'utf-8' : encoding;
	headers = typeof headers === 'undefined' ? pre_headers : Object.assign(pre_headers,headers);
	console.log("debug: Requesting "+url)
	let options = {
	    method: 'GET',
	    uri: url,
	    headers,
	    encoding: encoding
	}
	try{
	   return await request(options)
	}catch(error){
		console.log("debug: Requested error ")
		console.log("debug: " + error)
		process.exit(1)
	}
}

exports = module.exports = { get }