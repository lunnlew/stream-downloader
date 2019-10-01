'use strict';
const path = require('path')
const fs = require('fs-extra');
var spawn = require('child_process').spawn
var iconv = require('iconv-lite')
var os = require('os')
const {unlink} = require(path.join(__dirname,'../utils'))

var eunzip = async function(zippath, outpath){
	return  new Promise((resolve, reject) => {
		zippath = path.join(process.cwd(),zippath)
		outpath = path.join(process.cwd(),outpath)
	  	if(fs.pathExistsSync(zippath)){
			var unzip = require('unzip')
			var extract = unzip.Extract({ path:outpath });
			extract.on('finish', function () {
			    console.log("解压ffmpeg.zip完成")
			    resolve("success")
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
	return  new Promise(async (resolve, reject) => {
			try{
				let result = await require(path.join(__dirname,'../downloader/download_with_request')).exec({
					"src":[url],
					"format":"zip",
					"isRemote":true,
					"title":"ffmpeg"
				}, opts)
				if(result.success){
					let move_result = await require(path.join(__dirname,'./move_files')).exec(result['tempfiles'], result['outputfile'], opts)
	       			resolve(move_result)
				}else{
					resolve({'state':'fail'})
				}
			}catch(err){
				reject({'state':'fail', 'err':err})
			}
		}
	)
}

var exec = async function(opts){
	var ffpath = opts.ffmpegPath?opts.ffmpegPath:'ffmpeg'
	let result = ffpath.replace(/\\/g,"/")
	if(ffpath.indexOf("/")>=0){
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
	}else{
		console.log("debug: local not exists ffmpeg ")
	}

	// 系统平台
	let os_platform = os.platform()
	// 系统架构
	let os_arch = os.arch()
	// ffmpeg 版本
	let version = '20190926-525de95'
	// 编译链接类型
	let lib_link = 'static'

	if(os_platform=='win32'){
		if(os_arch == 'x64' || os_arch == 'x32'){
			os_platform = os_arch.replace('x', 'win')
		}
		try{
			console.log("debug: starting download ffmpeg ")
			let ffresult = await tryDownload(opts,`https://ffmpeg.zeranoe.com/builds/${os_platform}/${lib_link}/ffmpeg-${version}-${os_platform}-${lib_link}.zip`)
			console.log("debug: download result " + ffresult.state)
			if(ffresult.state == "success"){
				console.log("debug: unzip ffmpeg.zip ")
				let zipr = await eunzip("ffmpeg.zip","")
				var tmp_p = `ffmpeg-${version}-${os_platform}-${lib_link}/bin/ffmpeg.exe`
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
					await Promise.all([path.normalize(`ffmpeg-${version}-${os_platform}-${lib_link}`)].map(unlink))
				}catch(err){
					console.log("debug: rm tempfile file failed")
				}

				if(zipr == "success"){
					result = path.join(process.cwd(),'bin/ffmpeg.exe')
				}else{
					result = "ffmpeg"
				}
			}else{
				result = "ffmpeg"
			}

		}catch(err){
			console.log("debug: download ffmpeg error " + err)
		}
	} else {
		console.log(`debug: current platform(${os_platform}-${os_arch}) not support downloading ffmpeg to install`)
	}
	return result
}

exports = module.exports = {exec}