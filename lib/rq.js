'use strict';
const path = require('path')
var request = require('request-promise')
var pre_headers = {
	"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36",
}
var tough = require('tough-cookie')
var get = async function(url,encoding,headers,cookie_op){
	encoding = typeof encoding === 'undefined' || encoding===false ? 'utf-8' : encoding;
	headers = typeof headers === 'undefined' ? pre_headers : Object.assign(pre_headers,headers);
	let cookie
	let cookiejar

	if(typeof cookie_op != 'undefined'){
		cookiejar = request.jar()
		cookie_op['cookies'].forEach(function(cookie){
			cookie = new tough.Cookie(cookie)
			cookiejar.setCookie(cookie, cookie_op['url']);
		})

		// logger.info(cookiejar)
	}

	logger.info("Requesting "+url)
	let options = {
	    method: 'GET',
	    uri: url,
	    headers,
	    encoding: encoding,
	    jar: cookiejar
	}
	try{
	   return await request(options)
	}catch(error){
		logger.info("Requested error ")
		logger.info("" + error)
		process.exit(1)
	}
}

exports = module.exports = { get }