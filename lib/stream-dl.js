'use strict';
var inquirer = require('inquirer')
const readline = require('readline')
const path = require('path')
const fs = require('fs-extra')
const {urlMatchToParser, checkMediaSource, md5, renderSize, renderDuration} = require(path.join(__dirname,'./utils'))
const {default: PQueue} = require('p-queue')

var renderTag = function(tag, val){
	if(tag=='size'){
		return renderSize(val)
	}
	if(tag=='duration'){
		return renderDuration(val)
	}
	if(tag=='type'){
		return `[${val}] `
	}
	return val
}

var makeName = function(stream){
	let names = []
	let name_keys = ['type','id','container','video_profile','audio_profile','format','resolution','duration','size']
	for(let key of name_keys){
		if(key in stream && stream[key]){
			names.push(key+':'+renderTag(key, stream[key]))
		}
	}
	return names.join(', ')
}

var select_stream = async function(streams){
	var opts = [];
	for (var stream_id in streams){
		var stream = streams[stream_id]
		opts.push({
			'name':`${makeName(stream)}`,
			'value':`${stream['id']}`
		})
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
    for(let streams_result of streams_results ){
    	console.log("-- title:"+streams_result.title)
		console.log("-- url:"+streams_result.url)

		console.log("-- video stream:")
		let streams = streams_result.streams
		let stream_id = opts.streamFormat
		// 如果指定了格式
		if(stream_id){
			stream_id = stream_id.toUpperCase()
			if(stream_id in streams){
				streams = {
					stream_id : streams[stream_id]
				}
			}else{
				streams = {}
			}
		}
		let selected_stream = {}
		// 如果使用了手动选择
		if(opts.streamManual){
			let selected = await select_stream(streams)
			let stream = streams[selected['select_stream']]
			console.log("debug: manual selected "+stream['id'])
			stream.title = streams_result.title
			stream.merge = streams_result.merge
			selected_stream['video'] = stream
		}else{
			for(let stream_id in streams){
				let stream = streams[stream_id]
				stream.title = streams_result.title
				stream.merge = streams_result.merge
				console.log("debug: auto selected "+stream_id)
				selected_stream['video'] = stream
				break
			}
		}

		console.log("-- audio stream:")
		let audio_streams = streams_result.audio_streams
		// 如果使用了手动选择
		if(opts.streamManual){
			let selected = await select_stream(audio_streams)
			let stream = audio_streams[selected['select_stream']]
			console.log("debug: manual selected "+stream['id'])
			stream.title = streams_result.title
			stream.merge = streams_result.merge
			selected_stream['audio'] = stream
		}else{
			for(let stream_id in audio_streams){
				let stream = audio_streams[stream_id]
				stream.title = streams_result.title
				stream.merge = streams_result.merge
				console.log("debug: auto selected "+stream_id)
				selected_stream['audio'] = stream
				break
			}
		}
		selected_streams.push(selected_stream)
    }
	return selected_streams
}

var print_stream = function(streams_results, stream_id){

    console.log("================================================")
    streams_results.forEach(function(streams_result){
		console.log("-- title:"+streams_result.title)
		console.log("-- url:"+streams_result.url)
		console.log("-- video stream:")
		var streams = streams_result.streams
		if(stream_id){
			if(stream_id in streams){
				console.log("  1."+stream_id+" ")
			}
		}else{
			var i=0;
			for(let stream of streams){
				i++
				console.log(`  ${i}.`+stream['id']+" ")
			}
		}

		console.log("-- audio stream:")
		var audio_streams = streams_result.audio_streams
		var i=0;
		for(let stream of audio_streams){
			i++
			console.log(`  ${i}.`+stream['id']+" ")
		}
	})
    console.log("================================================")
}
var download_stream_task = async function(selected_stream, opts){
	// 是否启用了Aria2c下载视频资源
	var enableAria2 = opts.enableAria2 || false
	// 是否仅仅下载
	var onlyDownload = opts.onlyDownload
	return new Promise(async (resolve, reject) => {
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
						let concat_result = await require(path.join(__dirname,'./util/ffmpeg_concat_mp4_to_mp4')).exec(result['tempfiles'], result['tempfilepath'], result['outputfilename'], opts)
						console.log(concat_result)
						// 返回合并结果
						resolve({
							'state':'success',
							'tempfilepath':result['tempfilepath'],
							'outputfile':concat_result['outputfile']
						})
					}else{
						reject({
							'state':'fail',
							'err':"merge format not support"
						})
					}
	       		}else{
					resolve({
						'state':'success',
						'tempfiles':result['tempfiles'],
						'tempfilepath':result['tempfilepath'],
						'outputfile':result['outputfile']
					})
	       		}
	       	}else{
	       		resolve({'state':'success', 'msg':"download success"})
	       	}
	   	}else{
	   		reject({'state':'fail', 'msg':"download fail"})
	   	}
   	})
}
var download_stream_dispatcher = async function(selected_streams, opts){
    opts.verbose = typeof opts.verbose === 'boolean' ? opts.verbose : false;
	if(!selected_streams.length){
		console.log(`Not Selected Streams`)
	}
	// 任务并发数
	var conc = opts.taskConcurrency?opts.taskConcurrency:1
	// 任务队列
	let queue = new PQueue({concurrency: conc})
	// 循环添加任务
	for(let selected_stream of selected_streams){
		let selected_video_stream = selected_stream['video']
		let selected_audio_stream = selected_stream['audio']
		if(selected_video_stream.isDispatch){
			queue.add(() => {return new Promise(async (resolve, reject) => {
				console.log('debug: new dispatcher')
				await parse_stream_dispatcher(selected_video_stream['src'], opts)
				resolve('success')
			})})
		}else{
			queue.add(() => {
				return new Promise(async (resolve, reject) => {
					var outputfilename = selected_video_stream.title+'.'+selected_video_stream['format']
					outputfilename = outputfilename.replace(/[,，!@#$%^&*]/iu,"-")
					// 等待视频流任务完成
					let finish_result = await download_stream_task(selected_video_stream, opts)
					console.log('debug: video_stream download completed')
					if(selected_audio_stream){
						let audio_result = await download_stream_task(selected_audio_stream, opts)
						console.log('debug: audio_stream download completed')
						// 合并音视频流
						finish_result = await require(path.join(__dirname,'./util/ffmpeg_concat_av_to_mp4')).exec(finish_result['outputfile'], audio_result['outputfile'], finish_result['tempfilepath'], finish_result['outputfilename'], opts)
					}
	       			let move_result
	       			if(finish_result['outputfile']){
	       				if(finish_result['tempfiles']){
			       			move_result = await require(path.join(__dirname,'./util/move_files')).exec(finish_result['tempfiles'], outputfilename, opts)
	       				}else{
			       			move_result = await require(path.join(__dirname,'./util/move_files')).exec([finish_result['outputfile']], outputfilename, opts)
	       				}
	       			}
					// var os = require('os')
	    			// if(os.platform()=='win32' && move_result['output']){
					// 	console.log('open filesystem')
					// 	var exec = require('child_process').exec
					// 	exec(`start ${move_result['output']}`)
	    			// }
	       			console.log('debug: file localtion ['+move_result['output']+']')
					resolve()
				})
			})
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
			var stream = selected_streams[i]['video']
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
    opts._.forEach(async (url, index) => {
    	// 测试链接类型, 直接进行下载
    	let source = await checkMediaSource(url, opts)
    	if(source['isMedia']){
    		let matched = url.split('?')[0].match(/([^\.\/\\]+)\.([a-z]+)$/i)
    		let ext = matched[2]
    		let stream ={
		        "id": index,
		        "title": matched[1],
		        'container': source['type'], 
		        'quality': 0, 
		        'size': 0, 
		        'format': ext, 
		        'isRemote':true,
		        'src': [url]
		    }
    		await download_stream_dispatcher([stream], opts)
    	}else{
			// 根据url取得对应的分析器
			let streams_params = {"url":url,"verbose":opts.verbose}
			try{
			    let parser = urlMatchToParser(streams_params, opts)
			    if(parser){
			    	if(parser.obtain_all_play_url && opts.playlist || !parser.vp){
				    	let all_play_urls = await parser.obtain_all_play_url(streams_params, opts)
				    	await parse_stream_dispatcher(all_play_urls, opts)
			    	}else{
			    		await parse_stream_dispatcher([url], opts)
			    	}
			    }
	    	}catch(err){
	    		console.log("debug: "+err)
			}
    	}
    })
}
exports = module.exports = {exec}