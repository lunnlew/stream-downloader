'use strict';

const ffmpeg = require('fluent-ffmpeg')
const readline = require('readline')
const {renderSize} = require(path.join(__dirname,'../utils'))

var exec = function(stream, opts, resolve, reject){
   	var ffmpegPath = opts.ffmpeg?opts.ffmpeg:'ffmpeg'
	console.log(ffmpegPath)
	var outputfile = stream.title+".mp4"
	outputfile = opts.output?opts.output:outputfile.replace(/[,，!@#$%^&*]/iu,"-")
	var input_ffmpeg_params = []
	var output_ffmpeg_params = []
	var is_stream = true
	if(is_stream)
        input_ffmpeg_params = ['-y', '-re']
    else
        input_ffmpeg_params = ['-y']

    if(opts.httpProxy){
    	input_ffmpeg_params = input_ffmpeg_params.concat(["-http_proxy "+opts.httpProxy])
    }

    output_ffmpeg_params = ['-c copy']

    var params = []
    for(var k in params){
    	output_ffmpeg_params = output_ffmpeg_params.concat([`${k} ${params[k]}`])
    }
	ffmpeg.setFfmpegPath(ffmpegPath)

	ffmpeg({
		"source":stream['src'][0]
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
	    process.stdout.write(`frame=${info.frames} fps=${info.currentFps} size=${renderSize(info.targetSize)} time=${info.timemark} bitrate=${info.currentKbps}kbits/s`)
	})
	.on('end', function() {
		resolve('end')
		console.log('done processing input stream');
	})
	.on('error', function(err) {
		reject('error')
		console.log('an error happened: ' + err.message);
	})
	.save(outputfile);
}
exports = module.exports = {exec}