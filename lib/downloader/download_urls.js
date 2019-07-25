'use strict';

const readline = require('readline')
const fs = require('fs-extra')
var request = require('request')
var {default: PQueue} = require('p-queue')
const path = require('path')
const {renderSize} = require(path.join(__dirname,'../utils'))

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
						var readStream = request({
							  url: url,
							  headers: "headers" in stream?stream['headers']:{}
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
						    console.log("错误信息:" + err)
						    clearInterval(interval)
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
					dreject("download error")
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