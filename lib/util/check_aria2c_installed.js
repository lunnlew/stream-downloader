'use strict';
const path = require('path')
const fs = require('fs-extra');
var spawn = require('child_process').spawn
var iconv = require('iconv-lite')
var unzip = require('unzip')
const {unlink} = require(path.join(__dirname,'../utils'))


var eunzip = async function(zippath, outpath){
	return  new Promise((resolve, reject) => {
		zippath = path.join(process.cwd(),zippath)
		outpath = path.join(process.cwd(),outpath)
	  	if(fs.pathExistsSync(zippath)){
			var extract = unzip.Extract({ path:outpath });
			extract.on('finish', function () {
			    console.log("解压aria2c.zip完成")
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
					"title":"aria2c"
				}, opts)
				if(result.success){
					let move_result = await require(path.join(__dirname,'./move_files')).exec(result['tempfiles'], result['outputfile'], opts)
	       			if(move_result=="success"){
						resolve("success")
					}else{
						reject("error")
					}
				}else{
					resolve("error")
				}
			}catch(err){
				reject(err)
			}
		}
	)
}

var exec = async function(opts){
	var ffpath = opts.binAria2c?opts.binAria2c:'aria2c'
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


	result = path.join(process.cwd(),'bin/aria2c.exe')
	if(fs.pathExistsSync(result)){
		return result
	}else{
		console.log("debug: local not exists aria2c ")
	}
	
	// 系统平台
	let os_platform = os.platform()
	// 系统架构
	let os_arch = os.arch()

	// aria2 版本
	let version = '1.34.0'

	if(os_platform=='win32'){
		if(os_arch == 'x64' || os_arch == 'x32'){
			os_platform = 'win'
			os_arch = os_arch.replace('x','')+'bit'
		}
		try{
			console.log("debug: starting download aria2c ")
			let ffresult = await tryDownload(opts,`https://github.com/aria2/aria2/releases/download/release-${version}/aria2-${version}-${os_platform}-${os_arch}-build1.zip`)
			console.log("debug: download result " + ffresult)
			if(ffresult == "success"){
				console.log("debug: unzip aria2c.zip ")
				let zipr = await eunzip("aria2c.zip","")
				var tmp_p = `aria2-${version}-${os_platform}-${os_arch}-build1/aria2c.exe`
				await new Promise((resolve, reject) => {
					try{
						let tmp_f = path.join(process.cwd(), tmp_p)
						if(fs.pathExistsSync(tmp_f)){
							fs.move(tmp_f, path.join(process.cwd(),'bin/aria2c.exe'), err => (err ? reject(err) : resolve()))
						}else{
							reject("error")
						}
					}catch(err){
						console.log("debug: move aria2c error " + err)
					}
				})
				console.log("debug: clear tempfile ")
				try{
					await Promise.all([path.normalize(`aria2-${version}-${os_platform}-${os_arch}-build1`)].map(unlink))
				}catch(err){
					console.log("debug: rm tempfile file failed")
				}

				if(zipr == "success"){
					result = path.join(process.cwd(),'bin/aria2c.exe')
				}else{
					result = "aria2c"
				}
			}else{
				result = "aria2c"
			}
		}catch(err){
			console.log("debug: download aria2c error " + err)
		}
	} else {
		console.log(`debug: current platform(${os_platform}-${os_arch}) not support downloading aria2c to install`)
	}
	return result
}

exports = module.exports = {exec}