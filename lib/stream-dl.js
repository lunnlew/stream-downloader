'use strict';
var inquirer = require('inquirer')
const readline = require('readline')
const path = require('path')
var spawn = require('child_process').spawn
const fs = require('fs-extra')
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
		let stream_id = opts.streamFormat
		if(stream_id){
			stream_id = stream_id.toUpperCase()
			if(opts.streamManual){
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
			if(opts.streamManual){
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
	// 是否启用了Aria2c下载视频资源
	var enableAria2 = opts.enableAria2 || false
	// 任务并发数
	var conc = opts.taskConcurrency?opts.taskConcurrency:1
	// 是否仅仅下载
	var onlyDownload = opts.onlyDownload
	// 任务队列
	let queue = new PQueue({concurrency: conc})
	// 循环添加任务
	for(let i in selected_streams){
		let selected_stream = selected_streams[i]
		if(selected_stream.isDispatch){
			queue.add(() => {return new Promise(async (resolve, reject) => {
				console.log('debug: new dispatcher')
				await parse_stream_dispatcher(selected_stream['src'], opts)
				resolve('success')
			})})
		}else{
			queue.add(() => {return new Promise(async (resolve, reject) => {
				let result = ''
				// 如果启用了Aria2c下载
				if(enableAria2){
					// 解析最终的资源地址列表
					let stream = ''
					if(selected_stream['container']=='m3u8'){
						stream = await require(path.join(__dirname,'aria2c/stream_with_m3u8')).exec(selected_stream, opts)
					}else if(selected_stream['container']=='mp4' ||
							selected_stream['container']=='f4v' || 
							selected_stream['container']=='flv' || 
							selected_stream['container']=='mp3' ||
							selected_stream['container']=='m4a' ||
							selected_stream['container']=='ts'){
						stream = await require(path.join(__dirname,'aria2c/stream_with_media')).exec(selected_stream, opts)
					}
					// 实际下载
					selected_stream['src'] = stream.urls
					selected_stream['urlspath'] = stream.urlspath
					selected_stream['format'] = stream.format
					result = await require(path.join(__dirname,'downloader/download_with_aria2c')).exec(selected_stream, opts)
				}else{
					// 资源默认下载方式
					if(selected_stream['container']=='m3u8' && selected_stream['isRemote'] && !selected_stream['enablePlain']){
				   		result = await require(path.join(__dirname,'downloader/download_with_ffmpeg')).exec(selected_stream, opts)
				   	}else{
				   		result = await require(path.join(__dirname,'downloader/download_with_request')).exec(selected_stream, opts)
				   	}
				}

				// 资源下载结果
	            if(result.success && result.all){
	            	if(!onlyDownload){
		            	// 是否需要合并资源
		           		if(selected_stream.merge){
		           			// 如果资源格式为mp4,ts则合并到mp4
		           			if(selected_stream['format'] == 'mp4'||
		           				selected_stream['format'] == 'ts'){
		           				// 指定格式
								selected_stream['format'] = 'mp4'
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
		           			// 不合并则转移文件到最终目录
		           			let move_result = await require(path.join(__dirname,'./util/move_files')).exec(result['tempfiles'], result['outputfile'], opts)
		           			if(move_result=="success"){
								resolve("move_success")
							}else{
								reject("move_error")
							}
		           		}
		           	}else{
		           		resolve("download_success")
		           	}
		       	}else{
		       		reject("download error")
		       	}
			})})
		}
	}
	// 等待任务执行完毕
	await queue.onIdle()
}

var parse_stream_dispatcher = async function(all_play_urls, opts){
	if(!all_play_urls.length){
		console.log(`debug: Not play page urls`)
	}
	console.log(`debug: urls total ${all_play_urls.length}`)
	// 播放器
	if(opts.player){
		let pEpisodeNum = typeof opts.pEpisodeNum == 'undefined'?1:opts.pEpisodeNum
		let n = Math.min(parseInt(pEpisodeNum),all_play_urls.length)-1
		let streams_params = {"url":all_play_urls[n],"verbose":opts.verbose}
	    let parser = urlMatchToParser(streams_params, opts)
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
				player_child.stdout.on('data', (data) => {
				  console.log(`stdout: ${data}`)
				})
				player_child.stderr.on('data', (data) => {
				  console.error(`stderr: ${data}`)
				})
				player_child.stderr.on('close', (code) => {
					console.log(`子进程退出，退出码 ${code}`)
				})
			}catch(error){
				console.log("debug: " + error)
			}
			break
		}
	}else{
		var conc = opts.taskConcurrency?opts.taskConcurrency:1
		let queue = new PQueue({concurrency: conc});

		if(typeof opts.dEpisodeNum != 'undefined'){
			let n = Math.min(parseInt(opts.dEpisodeNum),all_play_urls.length)-1
			all_play_urls = [all_play_urls[n]]
		}
		
		for(let i in all_play_urls){
			let streams_params = {"url":all_play_urls[i],"verbose":opts.verbose}
			queue.add(() => {
				return new Promise(async (resolve, reject) => {
					console.log('debug: parse url ' + streams_params['url'])
					try{
		    			let parser = urlMatchToParser(streams_params, opts)
		    			if(parser){
			    			if(parser.vp){
								let streams_results = await parser.exec(streams_params, opts)
								// 如果启用了仅展示信息
								if(opts.infoOnly){
									//是否设置了视频格式行为
									if(opts.streamFormat){
										print_stream(streams_results,opts.streamFormat.toUpperCase())
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
    	const usage = require(path.join(__dirname,'./usage'))
    	opts = await usage.promptOpts(opts)
    }

    if(!opts._.length){
    	console.log("debug: please set urls ")
    	process.exit()
    }

    opts._.forEach(async (url) => {
		// 根据url取得对应的分析器
		let streams_params = {"url":url,"verbose":opts.verbose}
		try{
		    let parser = urlMatchToParser(streams_params, opts)
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