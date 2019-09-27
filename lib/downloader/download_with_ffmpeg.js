'use strict';

const ffmpeg = require('fluent-ffmpeg')
const readline = require('readline')
var {default: PQueue} = require('p-queue')
const path = require('path')
const {renderSize, getValidStreamRange, md5} = require(path.join(__dirname,'../utils'))
const fs = require('fs-extra')

var exec = async function(stream, opts){
	console.log('Downloading streaming content with FFmpeg, press ctrl + c to stop recording...')
   	var conc = opts.downloadConcurrency?opts.downloadConcurrency:1
  	let queue = new PQueue({concurrency: conc});
	var tempfilepath = md5(stream['title'])
   	fs.ensureDirSync(tempfilepath)


   	var ffmpegPath = await require(path.join(__dirname,'../util/check_ffmpeg_installed')).exec(opts)
	console.log("debug: ffmpegPath " + ffmpegPath)


	let part_nums = getValidStreamRange(opts, stream['src'].length)
	console.log("debug: will downloading " + part_nums.join(','))
   	let tempfiles = []
	let success = false
	let success_num = 0
	try{
		for(let i in stream['src']){
			let j = parseInt(i)+1
			let url = stream['src'][i]
			let tempfile = tempfilepath+"/"+j+"."+stream['format']
			tempfiles.push(tempfile)
			if(!opts.onlyMerge){
				if(part_nums.indexOf(j)==-1){
					continue
				}
				queue.add(() => {
					try{
						return new Promise(async (resolve, reject) => {
							var input_ffmpeg_params = []
							var output_ffmpeg_params = []
							
					        input_ffmpeg_params = ['-y']

						    if(opts.httpProxy){
						    	input_ffmpeg_params = input_ffmpeg_params.concat(["-http_proxy "+opts.httpProxy])
						    }

						    output_ffmpeg_params = [['-c copy'], ['-bsf:a aac_adtstoasc']]

						    var params = []
						    for(var k in params){
						    	output_ffmpeg_params = output_ffmpeg_params.concat([`${k} ${params[k]}`])
						    }
							ffmpeg.setFfmpegPath(ffmpegPath)
							ffmpeg({
								"source": url
							})
							.inputOptions(input_ffmpeg_params)
							.outputOptions(output_ffmpeg_params)
							.format('mp4')
							.on('start', function(commandLine) {
						    	console.log('debug: Ffmpeg with command: ' + commandLine)
						  	})
							.on('progress', function(info) {
							    readline.clearLine(process.stdout, 0)
							    readline.cursorTo(process.stdout, 0)
							    process.stdout.write(`frame=${info.frames} fps=${info.currentFps} size=${renderSize(info.targetSize*1024)} time=${info.timemark} bitrate=${info.currentKbps}kbits/s`)
							})
							.on('end', function() {
								console.log('done processing input stream');
								success = true
							    success_num += 1
								resolve('end')
							})
							.on('error', function(err) {
								console.log('an error happened: ' + err.message);
								reject('error')
							})
							.save(tempfile);

			            })
					}catch(err){
						console.log("debug: downloading err " +err)
					}
				});
			}else{
				success = true
			    success_num += 1
			}
		}
		await queue.onIdle()
	}catch(err){
		console.log("debug: downloading err " +err)
		success = false
	}

	var outputfile = stream.title+'.'+stream['format']
	outputfile= outputfile.replace(/[,，!@#$%^&*]/iu,"-")

	console.log("debug: downloaded result " + success)
	
	return {
		"all": success_num == part_nums.length,
		"success":success,
		"tempfiles":tempfiles,
		"outputfile":outputfile
	}
}
exports = module.exports = {exec}