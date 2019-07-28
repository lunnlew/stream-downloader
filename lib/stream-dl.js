'use strict';
var inquirer = require('inquirer');
const path = require('path')
var spawn = require('child_process').spawn;
const fs = require('fs-extra');
const {urlMatchToParser} = require(path.join(__dirname,'./utils'))
const {default: PQueue} = require('p-queue')

var select_stream = async function(streams){
	var opts = [];
	for (var stream_id in streams){
		var stream = streams[stream_id]
		opts.push(`${stream['id']}`)
	}
	if(opts.length){
		let answers = await inquirer.prompt([{
			type: 'list',
			name: 'select_stream',
			message: '请选择媒体流',
			choices: opts
	  	}])
	  	return answers
	}else{
		console.log("无资源")
	}
}

var print_select_stream = async function(streams_results, opts){
	let selected_streams = []
    for(let i in streams_results ){
    	let streams_result = streams_results[i]
    	console.log("-- title:"+streams_result.title)
		console.log("-- url:"+streams_result.url)
		let streams = streams_result.streams
		let stream_id = opts.streamId
		if(stream_id){
			stream_id = stream_id.toUpperCase()
			if(opts.manual){
				if(stream_id in streams){
					let stream = streams[stream_id]
					let selected = await select_stream({stream_id:stream})
					stream = streams[selected['select_stream']]
					stream.title = streams_result.title
					stream.merge = streams_result.merge
					selected_streams.push(stream)
				}
			}else{
				if(stream_id in streams){
					let stream = streams[stream_id]
					stream.title = streams_result.title
					stream.merge = streams_result.merge
					console.log("debug: auto selected "+stream_id)
					selected_streams.push(stream)
				}
			}
		}else{
			if(opts.manual){
				let selected = await select_stream(streams)
				let stream = streams[selected['select_stream']]
				stream.title = streams_result.title
				stream.merge = streams_result.merge
				selected_streams.push(stream)
			}else{
				for(let stream_id in streams){
					let stream = streams[stream_id]
					stream.title = streams_result.title
					stream.merge = streams_result.merge
					console.log("debug: auto selected "+stream_id)
					selected_streams.push(stream)
					break
				}
			}
		}
    }
	return selected_streams
}

var print_stream = function(streams_results, stream_id){

    console.log("================================================")
    streams_results.forEach(function(streams_result){
		console.log("-- title:"+streams_result.title)
		console.log("-- url:"+streams_result.url)
		var streams = streams_result.streams

		console.log("-- stream:")
		if(stream_id){
			if(stream_id in streams){
				var stream = streams[stream_id]
				console.log("  1."+stream_id+" ")
			}
		}else{
			var i=0;
			for(var stream_id in streams){
				i++
				var stream = streams[stream_id]
				console.log(`  ${i}.`+stream_id+" ")
			}
		}
	})
    console.log("================================================")
}
var download_stream_dispatcher = async function(selected_streams, opts){
    opts.verbose = typeof opts.verbose === 'boolean' ? opts.verbose : false;
	if(!selected_streams.length){
		console.log(`Not Selected Streams`)
	}
	var conc = opts.concurrency?opts.concurrency:1
	let queue = new PQueue({concurrency: conc});
	for(let i in selected_streams){
		let selected_stream = selected_streams[i]
		if(selected_stream['container']=='m3u8'){
			queue.add(() => {
				return new Promise(async (resolve, reject) => {
					console.log('Downloading streaming content with FFmpeg, press ctrl + c to stop recording...')
	               	let result = await require(path.join(__dirname,'downloader/download_with_ffmpeg')).exec(selected_stream, opts)
	               	if(result.success){
	               		if(result.all){
		               		if(selected_stream.merge){
		               			if(selected_stream['format'] == 'mp4'){
									let concat_result = await require(path.join(__dirname,'./util/ffmpeg_concat_mp4_to_mp4')).exec(result['tempfiles'], result['outputfile'], opts)
									if(concat_result=="success"){
										resolve("merge_success")
									}else{
										reject("merge_error")
									}
								}else{
									reject("merge format not support")
								}
		               		}else{
		               			let move_result = await require(path.join(__dirname,'./util/move_files')).exec(result['tempfiles'], result['outputfile'], opts)
		               			if(move_result=="success"){
									resolve("move_success")
								}else{
									reject("move_error")
								}
		               		}
		               	}
	               	}else{
	               		reject("download error with ffmpeg")
	               	}
	            })
			});
		}else if(selected_stream['container']=='mp4' ||
			selected_stream['container']=='f4v' || 
			selected_stream['container']=='flv' || 
			selected_stream['container']=='mp3' ||
			selected_stream['container']=='m4a'){
			queue.add(() => {
				return new Promise(async (resolve, reject) => {
					console.log('Downloading streaming content with request, press ctrl + c to stop downloading...')
	               	let result = await require(path.join(__dirname,'downloader/download_with_request')).exec(selected_stream, opts)
	               	if(result.success){
	               		if(result.all){
		               		if(selected_stream.merge){
		               			if(selected_stream['format'] == 'mp4'){
									let concat_result = await require(path.join(__dirname,'./util/ffmpeg_concat_mp4_to_mp4')).exec(result['tempfiles'], result['outputfile'], opts)
									if(concat_result=="success"){
										resolve("merge_success")
									}else{
										reject("merge_error")
									}
								}else{
									reject("merge format not support")
								}
		               		}else{
		               			let move_result = await require(path.join(__dirname,'./util/move_files')).exec(result['tempfiles'], result['outputfile'], opts)
		               			if(move_result=="success"){
									resolve("move_success")
								}else{
									reject("move_error")
								}
		               		}
	               		}else{
	               			resolve("downloaded success")
	               		}
	               	}else{
	               		reject("download error with request")
	               	}
	            })
			});
		}else{
			console.log(`Not Supported For Fmt[${selected_stream['container']}]`)
		}
	}
	await queue.onIdle()
}

var parse_stream_dispatcher = async function(all_play_urls, opts){
	if(!all_play_urls.length){
		console.log(`debug: Not play page urls`)
	}
	console.log(`debug: urls total ${all_play_urls.length}`)
	// 播放器
	if(opts.player){
		let playNum = typeof opts.playNum == 'undefined'?1:opts.playNum
		let n = Math.min(parseInt(playNum),all_play_urls.length)-1
		let streams_params = {"url":all_play_urls[n],"verbose":opts.verbose}
	    let parser = urlMatchToParser(streams_params)
		let streams_results = await parser.exec(streams_params, opts)
    	console.log("================================================")
		let selected_streams = await print_select_stream(streams_results, opts)
    	console.log("================================================")
		for(let i in selected_streams){
			var stream = selected_streams[i]
			var spawn = require('child_process').spawn
			var cmd = `${opts.player} ${stream['src'][0]}`
			console.log("debug: cmd " + cmd)
			try{
				var player_child = spawn(`${opts.player}`, [stream['src'][0]]);
				player_child.stdout.on('data', function (data) {
					console.log("debug: " + data)
				});
				player_child.stderr.on('data', function (data) {
					console.log("debug: " + data)
				});
			}catch(error){
				console.log("debug: " + error)
			}
			break
		}
	}else{
		var conc = opts.concurrency?opts.concurrency:1
		let queue = new PQueue({concurrency: conc});
		for(let i in all_play_urls){
			let streams_params = {"url":all_play_urls[i],"verbose":opts.verbose}
			queue.add(() => {
				return new Promise(async (resolve, reject) => {
					try{
		    			let parser = urlMatchToParser(streams_params)
		    			if(parser){
			    			if(parser.vp){
								let streams_results = await parser.exec(streams_params, opts)
								// 如果启用了仅展示信息
								if(opts.infoOnly){
									//是否设置了视频格式行为
									if(opts.streamId){
										print_stream(streams_results,opts.streamId.toUpperCase())
									}else{
										print_stream(streams_results,"")
									}
								}else{
									// 下载
		    						console.log("================================================")
									let selected_streams = await print_select_stream(streams_results, opts)
		    						console.log("================================================")
									await download_stream_dispatcher(selected_streams, opts)
								}
							}else{
								let new_all_play_urls = await parser.obtain_all_play_url(streams_params, opts)
								await parse_stream_dispatcher(new_all_play_urls, opts)
							}
						}
						resolve()
					}catch(err){
						console.log("debug: err "+err)
						reject(err)
					}
	            })
			});
		}
		await queue.onIdle()
	}
}


var exec = async function(opts){
    opts.verbose = typeof opts.verbose === 'boolean' ? opts.verbose : false;

    if(!opts._.length){
    	const promptList = [{
            type: 'input',
            message: '请输入地址(必填):',
            name: 'url'
        },{
            type: 'input',
            message: '设定下载格式(可选):',
            name: 'streamId'
        },{
            type: 'confirm',
            message: '启用手动选择(可选):',
            name: 'manual',
            default:false
        },{
            type: 'input',
            message: '设定ffmpeg路径(可选):',
            name: 'binFfmpeg',
            default:'ffmpeg'
        },{
            type: 'input',
            message: '设定播放器(可选):',
            name: 'player'
        },{
            type: 'input',
            message: '设定播放的视频序号(可选):',
            name: 'pEpisodeNum'
        },{
            type: 'input',
            message: '设定代理(可选):',
            name: 'httpProxy'
        },{
            type: 'input',
            message: '设定cookies:',
            name: 'httpCookies'
        }];
        let answers = await inquirer.prompt(promptList)
        if(answers['url']){
        	opts._.push(answers['url'])
        }
        if(answers['streamId']){
        	opts['streamId'] = answers['streamId']
        }
        if(answers['streamPartStart']){
        	opts['streamPartStart'] = answers['streamPartStart']
        }
        if(answers['streamPartEnd']){
        	opts['streamPartEnd'] = answers['streamPartEnd']
        }
        if(answers['streamPartRange']){
        	opts['streamPartRange'] = answers['streamPartRange']
        }
        if(answers['concurrency']){
        	opts['concurrency'] = parseInt(answers['concurrency'])
        }
        if(answers['pEpisodeNum']){
        	opts['pEpisodeNum'] = parseInt(answers['pEpisodeNum'])
        }
        if(answers['binFfmpeg']){
        	opts['binFfmpeg'] = answers['binFfmpeg']
        }
        if(answers['player']){
        	opts['player'] = answers['player']
        }
        if(answers['httpProxy']){
        	opts['httpProxy'] = answers['httpProxy']
        }
        if(answers['httpCookies']){
        	opts['httpCookies'] = answers['httpCookies']
        }
        if(answers['manual']){
        	opts['manual'] = answers['manual']
        }
    }

    if(!opts._.length){
    	console.log("debug: please set urls ")
    	process.exit()
    }

    opts._.forEach(async (url) => {
		// 根据url取得对应的分析器
		let streams_params = {"url":url,"verbose":opts.verbose}
		try{
		    let parser = urlMatchToParser(streams_params)
		    if(parser){
		    	if(parser.vp){
					await parse_stream_dispatcher([url], opts)
				}else{
			    	//取得所有视频的播放页地址
			    	let all_play_urls = await parser.obtain_all_play_url(streams_params, opts)
			    	await parse_stream_dispatcher(all_play_urls, opts)
			    }
		    }
    	}catch(err){
    		console.log("debug: "+err)
		}
    })
}
exports = module.exports = {exec}