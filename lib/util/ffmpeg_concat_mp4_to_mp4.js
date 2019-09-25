'use strict';
const path = require('path')
const fs = require('fs-extra')
const ffmpeg = require('fluent-ffmpeg')
const {unlink} = require(path.join(__dirname,'../utils'))

const createIntermediate = file =>
  	new Promise((resolve, reject) => {
  	console.log('debug: start covert with ' + file)
    const out = `${file}.ts`
    ffmpeg(file)
		.outputOptions('-c', 'copy', '-bsf:v', 'h264_mp4toannexb', '-f', 'mpegts')
		.output(out)
		.on('start', function(commandLine) {
			console.log('debug: Ffmpeg with command: ' + commandLine)
		})
		.on('end', () => resolve(out))
		.on('error', reject)
		.run()
})
  	
const ffmpeg_concat = async (files, output) => {
	if(files.length){
		const names = await Promise.all(files.map(createIntermediate))
		const namesString = names.join('|')
		await new Promise((resolve, reject) =>
		ffmpeg(`concat:${namesString}`)
			.outputOptions('-c', 'copy', '-bsf:a', 'aac_adtstoasc')
			.output(output)
			.on('start', function(commandLine) {
				console.log('debug: Ffmpeg with command: ' + commandLine)
			})
			.on('end', resolve)
			.on('error', reject)
			.run()
		)
		await Promise.all(names.map(unlink))
		await Promise.all(files.map(unlink))
		await Promise.all([path.normalize(path.dirname(files[0]))].map(unlink))
	}
}

var exec = async function(tempfiles, outputfile, opts){

	var ffmpegPath = await require(path.join(__dirname,'./check_ffmpeg_installed')).exec(opts)
	console.log("debug: ffmpegPath " + ffmpegPath)

	ffmpeg.setFfmpegPath(ffmpegPath)

	console.log('debug: staring merge video')
	try{
		await ffmpeg_concat(tempfiles, outputfile)
		console.log('debug: merge completed')
		return "success"
	}catch(err){
		console.log('debug: merge error' +err)
		return "fail"
	}
}

exports = module.exports = {exec}