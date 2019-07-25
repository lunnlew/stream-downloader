'use strict';
const path = require('path')
const fs = require('fs-extra');
var spawn = require('child_process').spawn
var iconv = require('iconv-lite')
var unzip = require('unzip')
const {unlink} = require(path.join(__dirname,'../utils'))


var eunzip = async function(zippath,outpath){
	return  new Promise((resolve, reject) => {
		zippath = path.join(process.cwd(),zippath)
		outpath = path.join(process.cwd(),outpath)
	  	if(fs.pathExistsSync(zippath)){
			var extract = unzip.Extract({ path:outpath });
			extract.on('finish', function () {
			    console.log("解压ffmpeg.zip完成")
			    resolve("ok")
			});
			extract.on('error', function (err) {
			    console.log(err)
			    reject(err)
			});
			fs.createReadStream(zippath).pipe(extract);
	  	}else{
	  		reject()
	  	}
	  }
	)
}

var tryDownload = function(opts, url){
	return  new Promise((resolve, reject) => {
			require(path.join(__dirname,'../downloader/download_urls')).exec({
				"src":[url],
				"format":"zip",
				"title":"ffmpeg"
			}, opts, resolve, reject)
		  }
		)
}

var exec = async function(ffpath, opts){
	let result = ffpath.replace(/\\/g,"/")
	if(ffpath.indexOf("/")!==false){
		if(fs.pathExistsSync(path)){
			return result
		}
	}else{
		result = await new Promise((resolve, reject) => {
			let cmd = `where ${ffpath}`
			console.log("debug: cmd " + cmd)
			try{
				let cmd_child = spawn(`where`, [ffpath]);
				cmd_child.stdout.on('data', function (data) {
					data = data.toString().replace(/[\r\n]/g,"").replace(/\\/g,"/")
					resolve(data)
				});
				cmd_child.stderr.on('data', function (data) {
					console.log("debug: err " + iconv.decode(data, 'gb2312').toString())
					resolve("")
				});
			}catch(error){
				console.log("debug: err " + error)
				reject(error)
			}
		  }
		)

		if(fs.pathExistsSync(result)){
			return result
		}
	}


	result = path.join(process.cwd(),'bin/ffmpeg.exe')
	if(fs.pathExistsSync(result)){
		return result
	}

	console.log("debug: local not exists ffmpeg ")

	console.log("debug: starting download ffmpeg ")
	var ffresult = ""

	try{
		ffresult = await tryDownload(opts,"https://ffmpeg.zeranoe.com/builds/win64/static/ffmpeg-20190722-817235b-win64-static.zip")
	
	}catch(err){
		console.log("debug:  download ffmpeg error")
	}

	console.log("debug: download result " +ffresult)

	if(ffresult == "ok"){

		console.log("debug: unzip ffmpeg.zip ")
		let zipr = await eunzip("ffmpeg.zip","")

		var tmp_p = "ffmpeg-20190722-817235b-win64-static/bin/ffmpeg.exe"
		await new Promise((resolve, reject) => {
			let tmp_f = path.join(process.cwd(), tmp_p)
			if(fs.pathExistsSync(tmp_f)){
				fs.move(tmp_f, path.join(process.cwd(),'bin/ffmpeg.exe'), err => (err ? reject(err) : resolve()))
			}else{
				reject("error")
			}
		})
		console.log("debug: clear tempfile ")
		try{
			await Promise.all([path.normalize("ffmpeg-20190722-817235b-win64-static")].map(unlink))
		}catch(err){
			console.log("debug: rm tempfile file failed")
		}

		if(zipr == "ok"){
			result = path.join(process.cwd(),'bin/ffmpeg.exe')
		}else{
			result = "ffmpeg"
		}
	}else{
		result = "ffmpeg"
	}

	return result
}

exports = module.exports = {exec}