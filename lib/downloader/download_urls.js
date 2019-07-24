'use strict';

const readline = require('readline')
const fs = require('fs-extra')
var request = require('request')
var {default: PQueue} = require('p-queue')
const path = require('path')

var renderSize = function(filesize){
    if(null==filesize||filesize==''){
        return "0 Bytes";
    }
    var unitArr = new Array("Bytes","KB","MB","GB","TB","PB","EB","ZB","YB");
    var index=0;
    var srcsize = parseFloat(filesize);
    index=Math.floor(Math.log(srcsize)/Math.log(1024));
    var size =srcsize/Math.pow(1024,index);
       if(size%1 === 0){
            size=size.toFixed(0); //如果是整数不保留小数
        }else{
            size=size.toFixed(2);//保留的小数位数
        }
    return size+unitArr[index];
}
var exec = async function(stream, opts, resolve, reject){
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
		reject("download error")
	}
	
	if(success){
		var outputfile = stream.title+'.'+stream['format']
		outputfile= outputfile.replace(/[,，!@#$%^&*]/iu,"-")
		if(stream.merge){
			if(stream['format'] == 'mp4'){
				await require(path.join(__dirname,'../util/ffmpeg_concat_mp4_to_mp4')).exec(tempfiles, outputfile, opts, resolve, reject)
			}else{
				reject("merge format not support")
			}
		}else{
			await require(path.join(__dirname,'../util/move_files')).exec(tempfiles, outputfile, opts, resolve, reject)
		}
	}else{
		reject("download error")
	}
}
exports = module.exports = {exec}