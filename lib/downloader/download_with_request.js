'use strict';

const readline = require('readline')
const fs = require('fs-extra')
var request = require('request')
var {default: PQueue} = require('p-queue')
const path = require('path')
const {renderSize} = require(path.join(__dirname,'../utils'))

// 处理可能存在的301 302 跳转链接
var getRealUrl = async function(url, stream){
	return new Promise(async (resolve, reject) => {
		request({
			url: url,
			method:"HEAD",
			headers:"headers" in stream
				?stream['headers']
				:
				{
					"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36"
				}
				
		},function(error, response, body) {
			// 返回最终的url
			resolve(response.request['uri']['href'])
		})
	})
}

var exec = async function(stream, opts){
	var conc = opts.concurrency?opts.concurrency:1
  	let queue = new PQueue({concurrency: conc});
	var tempfilepath = (new Date()).getTime().toString()
   	fs.ensureDirSync(tempfilepath)

	let tempfiles = []
	let success = false
	try{
		for(let i in stream['src']){
			let url = stream['src'][i]
			let tempfile = tempfilepath+"/"+i+"."+stream['format']
			tempfiles.push(tempfile)
			queue.add(() => {
				try{
					return new Promise(async (dresolve, dreject) => {
						console.log("debug: downloading url "+url)
						var writeStream = fs.createWriteStream(tempfile)
						url = await getRealUrl(url, stream)

						var readStream = request({
							  url: url,
							  headers: 
							  "headers" in stream?
							  stream['headers']:
							{
								"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36"
							}
						})

						let totalBytes = 1 
						let receivedBytes = 0
						let process_bar = function(is_completed){
								readline.clearLine(process.stdout, 0)
				    			readline.cursorTo(process.stdout, 0)
				    			const percentage = (receivedBytes * 100) / totalBytes
				    			if(!is_completed){
				    				process.stdout.write(`process: totalSize=${renderSize(totalBytes)} receivedSize=${renderSize(receivedBytes)} percentage=${percentage.toFixed(2)}%`)
				    			}else{
				    				process.stdout.write(`process: totalSize=${renderSize(totalBytes)} receivedSize=${renderSize(totalBytes)} percentage=100%`+"\n")
				    			}
						}
						let interval =  setInterval(()=>{
								process_bar(false)
				    		},1000)
						readStream.pipe(writeStream)
						readStream.on('response', function(response) {
							console.log(`debug: statusCode ${response.statusCode} contentType ${response.headers['content-type']}`)
							totalBytes = parseInt(response.headers['content-length'], 10);
						})
						readStream.on('data',function(chunk){
							receivedBytes += chunk.length
						})
						readStream.on('end', function() {
							clearInterval(interval)
							process_bar(true)
						    console.log('文件下载成功');
						});
						readStream.on('error', function(err) {
						    clearInterval(interval)
						    console.log("错误信息:" + err)
						    dreject("download error")
						})
						writeStream.on("finish", function() {
						    console.log("文件写入成功");
						    writeStream.end()
						    success = true
						    dresolve("ok")
						});
		            })
				}catch(err){
					console.log("debug: downloading err " +err)
				}
			});
		}
		await queue.onIdle()
	}catch(err){
		console.log("debug: downloading err " +err)
		success = false
	}

	var outputfile = stream.title+'.'+stream['format']
	outputfile= outputfile.replace(/[,，!@#$%^&*]/iu,"-")
	
	return {
		"success":success,
		"tempfiles":tempfiles,
		"outputfile":outputfile
	}
}
exports = module.exports = {exec}