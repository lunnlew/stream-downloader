'use strict';
var inquirer = require('inquirer')
const readline = require('readline')
const path = require('path')
const os = require('os')
const fs = require('fs-extra')
const { urlMatchToParser, getValidStreamRange, checkMediaSource, md5, getUrlExt, renderSize, renderDuration, unlink } = require(path.join(__dirname, './utils'))
const { default: PQueue } = require('p-queue')
const psl = require('psl')

var renderTag = function(tag, val) {
    if (tag == 'size') {
        return renderSize(val)
    }
    if (tag == 'duration') {
        return renderDuration(val)
    }
    if (tag == 'type') {
        return `[${val}] `
    }
    return val
}

var makeName = function(stream) {
    let names = []
    let name_keys = ['type', 'id', 'container', 'video_profile', 'audio_profile', 'format', 'resolution', 'duration', 'size']
    for (let key of name_keys) {
        if (key in stream && stream[key]) {
            names.push(key + ':' + renderTag(key, stream[key]))
        }
    }
    return names.join(', ')
}

var select_stream = async function(streams) {
    var selectList = [];
    for (var stream_id in streams) {
        var stream = streams[stream_id]
        selectList.push({
            'name': `${makeName(stream)}`,
            'value': `${stream['id']}`
        })
    }
    if (selectList.length) {
        let answers = await inquirer.prompt([{
            type: 'list',
            name: 'select_stream',
            message: '请选择媒体流',
            choices: selectList
        }])
        return answers
    } else {
        logger.warn("No alternative media resources")
    }
}

var print_select_stream = async function(streams_results, opts) {
    let selected_streams = []
    for (let streams_result of streams_results) {
        logger.info("-- title:" + streams_result.title)
        logger.info("-- url:" + streams_result.url)

        logger.info("-- video stream:")
        let streams = streams_result.streams
        let stream_id = opts.streamFormat
        // 如果指定了格式
        if (stream_id) {
            stream_id = stream_id.toUpperCase()
            if (stream_id in streams) {
                let n_streams = {}
                n_streams[stream_id] = streams[stream_id]
                streams = n_streams
            } else {
                streams = {}
            }
        }
        let selected_stream = {}
        // 如果使用了手动选择
        if (opts.streamManual) {
            let selected = await select_stream(streams)
            if (selected) {
                let stream = streams[selected['select_stream']]
                logger.info("manual selected " + stream['id'])
                stream.title = streams_result.title
                stream.merge = stream.merge || streams_result.merge
                selected_stream['video'] = stream
            }
        } else {
            for (let stream_id in streams) {
                let stream = streams[stream_id]
                stream.title = streams_result.title
                stream.merge = stream.merge || streams_result.merge
                logger.info("auto selected " + stream_id)
                selected_stream['video'] = stream
                break
            }
        }

        let audio_streams = streams_result.audio_streams
        if (audio_streams) {
            logger.info("-- audio stream:")
            // 如果使用了手动选择
            if (opts.streamManual) {
                let selected = await select_stream(audio_streams)
                if (selected) {
                    let stream = audio_streams[selected['select_stream']]
                    logger.info("manual selected " + stream['id'])
                    stream.title = streams_result.title
                    stream.merge = stream.merge || streams_result.merge
                    selected_stream['audio'] = stream
                }
            } else {
                for (let stream_id in audio_streams) {
                    let stream = audio_streams[stream_id]
                    stream.title = streams_result.title
                    stream.merge = stream.merge || streams_result.merge
                    logger.info("auto selected " + stream_id)
                    selected_stream['audio'] = stream
                    break
                }
            }
        }

        let extras = streams_result.extras
        if (extras) {
            selected_stream['extras'] = extras
        }
        selected_streams.push(selected_stream)
    }
    return selected_streams
}

var print_stream = function(streams_results, stream_id) {

    logger.info("================================================")
    streams_results.forEach(function(streams_result) {
        logger.info("-- title:" + streams_result.title)
        logger.info("-- url:" + streams_result.url)
        logger.info("-- video stream:")
        var streams = streams_result.streams
        if (stream_id) {
            if (stream_id in streams) {
                logger.info(" 1." + stream_id + " ")
            }
        } else {
            var i = 0;
            for (let stream of streams) {
                i++
                logger.info(`  ${i}.` + stream['id'] + " ")
            }
        }

        logger.info("-- audio stream:")
        var audio_streams = streams_result.audio_streams
        var i = 0;
        for (let stream of audio_streams) {
            i++
            logger.info(`  ${i}.` + stream['id'] + " ")
        }
    })
    logger.info("================================================")
}
var download_extras_task = async function(title, selected_extras, opts) {
    // 是否启用了Aria2c下载视频资源
    var enableAria2 = opts.enableAria2 || false
    // 任务队列
    let queue = new PQueue({ concurrency: 1 })
    title = title.replace(/[,，!@#$%^&*]/iu, "-")

    let tempfilepath = path.join(require('os').tmpdir(), md5(title))
    fs.ensureDirSync(tempfilepath)

    for (let extra of selected_extras) {
        let urls = []
        let titles = []
        let format
        if (extra.type == 'stl') {
            format = getUrlExt(extra['src'][0]['url'])
            for (let stl of extra['src']) {
                urls.push(stl['url'])
                titles.push(title + '_' + stl['type'] + '.' + format)
            }
        }
        queue.add(() => {
            return new Promise(async (resolve, reject) => {
                let result = ''
                let selected_stream = {
                    'src': urls,
                    'title': title,
                    'isRemote': true,
                    'urlspath': tempfilepath,
                    'format': format
                }
                // 如果启用了Aria2c下载
                if (enableAria2) {
                    result = await require(path.join(__dirname, 'downloader/download_with_aria2c')).exec(selected_stream, opts)
                } else {
                    result = await require(path.join(__dirname, 'downloader/download_with_request')).exec(selected_stream, opts, !opts.onlyMerge)
                }
                let move_result = await require(path.join(__dirname, './util/move_files')).exec(result['tempfiles'], titles, opts)
                resolve(move_result)
            })
        })
    }
    // 等待任务执行完毕
    await queue.onIdle()
    logger.info('extras downloaded')

}
var download_stream_task = async function(selected_stream, opts) {
    // 是否启用了Aria2c下载视频资源
    var enableAria2 = opts.enableAria2 || false
    // 是否仅仅下载
    var onlyDownload = opts.onlyDownload
    return new Promise(async (resolve, reject) => {
        let result = ''
        // 如果启用了Aria2c下载
        if (enableAria2) {
            // 解析最终的资源地址列表
            let stream = ''
            if (selected_stream['container'] == 'm3u8') {
                stream = await require(path.join(__dirname, 'aria2c/stream_with_m3u8')).exec(selected_stream, opts)
            } else if (selected_stream['container'] == 'mp4' ||
                selected_stream['container'] == 'f4v' ||
                selected_stream['container'] == 'flv' ||
                selected_stream['container'] == 'mp3' ||
                selected_stream['container'] == 'm4a' ||
                selected_stream['container'] == 'm4s' ||
                selected_stream['container'] == 'ts') {
                stream = await require(path.join(__dirname, 'aria2c/stream_with_media')).exec(selected_stream, opts)
            }
            // 实际下载
            selected_stream['src'] = stream.urls
            selected_stream['urlspath'] = stream.urlspath
            selected_stream['format'] = stream.format
            result = await require(path.join(__dirname, 'downloader/download_with_aria2c')).exec(selected_stream, opts)
        } else {
            // 资源默认下载方式
            if (selected_stream['container'] == 'm3u8' && selected_stream['isRemote'] && !selected_stream['enablePlain']) {
                result = await require(path.join(__dirname, 'downloader/download_with_ffmpeg')).exec(selected_stream, opts)
            } else {
                result = await require(path.join(__dirname, 'downloader/download_with_request')).exec(selected_stream, opts, !opts.onlyMerge)
            }
        }

        logger.info('download result')

        // 资源下载结果
        if (result.success && result.all) {
            if (!onlyDownload) {
                // 是否需要合并资源
                if (selected_stream.merge) {
                    // 如果资源格式为mp4,ts则合并到mp4
                    if (selected_stream['format'] == 'mp4' ||
                        selected_stream['format'] == 'ts') {
                        // 指定格式
                        selected_stream['format'] = 'mp4'
                        let concat_result = await require(path.join(__dirname, './util/ffmpeg_concat_mp4_to_mp4')).exec(result['tempfiles'], result['tempfilepath'], result['outputfilename'], opts)
                        // 返回合并结果
                        resolve({
                            'state': 'success',
                            'tempfilepath': result['tempfilepath'],
                            'outputfile': concat_result['outputfile']
                        })
                    } else {
                        reject({
                            'state': 'fail',
                            'err': "merge format not support"
                        })
                    }
                } else {
                    resolve({
                        'state': 'success',
                        'tempfiles': result['tempfiles'],
                        'tempfilepath': result['tempfilepath'],
                        'outputfile': result['outputfile'] || path.join(result['tempfilepath'], result['outputfilename'])
                    })
                }
            } else {
                resolve({ 'state': 'success', 'msg': "download success" })
            }
        } else {
            reject({ 'state': 'fail', 'msg': "download fail" })
        }
    })
}
var download_stream_dispatcher = async function(selected_streams, opts) {
    opts.verbose = typeof opts.verbose === 'boolean' ? opts.verbose : false;
    if (!selected_streams.length) {
        logger.info(`Not Selected Streams`)
    }
    // 任务并发数
    var conc = opts.taskConcurrency ? opts.taskConcurrency : 1
    var onlyDownloadExtras = opts.onlyDownloadExtras ? opts.onlyDownloadExtras : false
    // 任务队列
    let queue = new PQueue({ concurrency: conc })
    // 循环添加任务
    for (let selected_stream of selected_streams) {
        let selected_video_stream = selected_stream['video']
        let selected_audio_stream = selected_stream['audio']
        let selected_extras = selected_stream['extras']
        queue.add(() => {
            return new Promise(async (resolve, reject) => {
                if (selected_video_stream && selected_video_stream.isDispatch) {
                    logger.info('new dispatcher')
                    await parse_stream_dispatcher(selected_video_stream['src'], opts)
                    resolve('success')
                } else if (selected_video_stream) {
                    let finish_result
                    let move_result

                    if (selected_extras) {
                        logger.info('start download extras')
                        // 等待附加任务完成
                        finish_result = await download_extras_task(selected_video_stream.title, selected_extras, opts)
                    }

                    if (!onlyDownloadExtras) {

                        var outputfilename = selected_video_stream.title + '.' + selected_video_stream['format']
                        outputfilename = outputfilename.replace(/[,，!@#$%^&*]/iu, "-")
                        // 等待视频流任务完成
                        finish_result = await download_stream_task(selected_video_stream, opts)
                        logger.info('video_stream download completed')
                        if (selected_audio_stream) {
                            let audio_result = await download_stream_task(selected_audio_stream, opts)
                            logger.info('audio_stream download completed')
                            // 合并音视频流
                            finish_result = await require(path.join(__dirname, './util/ffmpeg_concat_av_to_mp4')).exec(finish_result['outputfile'], audio_result['outputfile'], finish_result['tempfilepath'], finish_result['outputfilename'], opts)
                        }
                        logger.info('finish_result')
                        if (finish_result['outputfile']) {
                            if (finish_result['tempfiles']) {
                                move_result = await require(path.join(__dirname, './util/move_files')).exec(finish_result['tempfiles'], outputfilename, opts)
                            } else {
                                move_result = await require(path.join(__dirname, './util/move_files')).exec([finish_result['outputfile']], outputfilename, opts)
                            }
                        }
                        logger.info('move_result')
                        logger.info(move_result)
                        if (move_result) {
                            if (move_result['state'] == 'success') {
                                logger.info('clear tmp data')
                                try {
                                    await Promise.all([path.join(require('os').tmpdir(), md5(selected_video_stream.title))].map(unlink))
                                } catch (err) {
                                    logger.info('' + err)
                                }
                                logger.info('finish file in localtion [' + path.resolve(move_result['output']) + ']')
                            } else {
                                logger.info('file move err')
                            }
                        }
                    }
                    resolve()
                } else {
                    logger.info('not selected stream')
                }
            })
        })
    }
    // 等待任务执行完毕
    await queue.onIdle()
}

var parse_stream_dispatcher = async function(all_play_urls, opts) {
    if (!all_play_urls.length) {
        logger.info(`Not play page urls`)
    }
    logger.info(`urls total ${all_play_urls.length}`)
    // 播放器
    if (opts.player || opts.outStream) {
        let pEpisodeNum = typeof opts.pEpisodeNum == 'undefined' ? 1 : opts.pEpisodeNum
        let n = Math.min(parseInt(pEpisodeNum), all_play_urls.length) - 1
        let streams_params = { "url": all_play_urls[n], "verbose": opts.verbose }
        let parser = urlMatchToParser(streams_params, opts)
        let streams_results = await parser.exec(streams_params, opts)
        logger.info("================================================")
        let selected_streams = await print_select_stream(streams_results, opts)
        logger.info("================================================")
        let i = 0
        let stream = selected_streams[i]['video']
        if (opts.outStream) {
            process.stdout.write(stream['src'][0])
            process.exit()
        } else {
            let spawn = require('child_process').spawn
            let cmd = `${opts.player} ${stream['src'][0]}`
            logger.info("cmd " + cmd)
            try {
                let player_child = spawn(`${opts.player}`, [stream['src'][0]]);
                player_child.stdout.on('data', (data) => {
                    logger.info(`stdout: ${data}`)
                })
                player_child.stderr.on('data', (data) => {
                    logger.info(`stderr: ${data}`)
                })
                player_child.stderr.on('close', (code) => {
                    logger.info(`子进程退出，退出码 ${code}`)
                })
            } catch (error) {
                logger.info("" + error)
            }
        }
    } else {
        let conc = opts.taskConcurrency ? opts.taskConcurrency : 1

        // 手动选择模式强制主任务数为1
        if (opts.streamManual) {
            conc = 1
        }

        let queue = new PQueue({ concurrency: conc });

        let stream_nums = getValidStreamRange(opts, all_play_urls.length)

        if (typeof opts.dEpisodeNum != 'undefined') {
            let n = Math.min(parseInt(opts.dEpisodeNum), all_play_urls.length) - 1
            all_play_urls = [all_play_urls[n]]
        }

        for (let i in all_play_urls) {
            let j = parseInt(i) + 1
            if (stream_nums.indexOf(j) == -1) {
                continue
            }
            let streams_params = { "url": all_play_urls[i], "verbose": opts.verbose }
            queue.add(() => {
                return new Promise(async (resolve, reject) => {
                    logger.info('parse url ' + streams_params['url'])
                    try {
                        let parser = urlMatchToParser(streams_params, opts)
                        if (parser) {
                            if (parser.vp) {
                                let streams_results = await parser.exec(streams_params, opts)
                                // 如果启用了仅展示信息
                                if (opts.infoOnly) {
                                    //是否设置了视频格式行为
                                    if (opts.streamFormat) {
                                        print_stream(streams_results, opts.streamFormat.toUpperCase())
                                    } else {
                                        print_stream(streams_results, "")
                                    }
                                } else {
                                    // 下载
                                    logger.info("================================================")
                                    let selected_streams = await print_select_stream(streams_results, opts)
                                    logger.info("================================================")
                                    await download_stream_dispatcher(selected_streams, opts)
                                }
                            } else {
                                let new_all_play_urls = await parser.obtain_all_play_url(streams_params, opts)
                                await parse_stream_dispatcher(new_all_play_urls, opts)
                            }
                        }
                        resolve()
                    } catch (err) {
                        logger.info("err " + err)
                        reject(err)
                    }
                })
            });
        }
        await queue.onIdle()
    }
}


var exec = async function(opts) {
    opts.verbose = typeof opts.verbose === 'boolean' ? opts.verbose : false;

    if (!opts._.length) {
        const usage = require(path.join(__dirname, './usage'))
        opts = await usage.promptOpts(opts)
    }

    let configOpts = {}
    let configJsonFile = os.homedir() + "/.stream-dl/config.json"

    if (!opts.disabeConfig) {
        logger.info('try load config from ' + configJsonFile)
        if (fs.existsSync(configJsonFile)) {
            configOpts = fs.readJsonSync(configJsonFile)
            logger.info('config loaded')
        }
    }

    if (!opts._.length) {
        logger.info("please set urls ")
        process.exit()
    }
    let queue = new PQueue({ concurrency: 1 })

    opts._.forEach((url, index) => {

        if (!opts.disabeConfig) {
            let url_part = new URL(url)
            let domain_parsed = psl.parse(url_part.hostname)
            if (!opts['httpCookies']) {
                if (configOpts['httpCookies'] && domain_parsed['domain'] in configOpts['httpCookies']) {
                    opts['httpCookies'] = configOpts['httpCookies'][domain_parsed['domain']]
                }
            } else {
                if (!('httpCookies' in configOpts)) {
                    configOpts['httpCookies'] = {}
                }
                configOpts['httpCookies'][domain_parsed['domain']] = opts['httpCookies']
            }
            logger.info('config saved')
            fs.outputJsonSync(configJsonFile, configOpts)
        }

        queue.add(() => {
            return new Promise(async (resolve, reject) => {
                // 测试链接类型, 直接进行下载
                let source = await checkMediaSource(url, opts)
                if (source['isMedia']) {
                    logger.info('source is media')
                    let matched = url.split('?')[0].match(/([^\.\/\\]+)\.([a-z]+)$/i)
                    let ext = matched[2]
                    let stream = {
                        "id": index,
                        "title": matched[1],
                        'container': source['type'],
                        'quality': 0,
                        'size': 0,
                        'format': ext,
                        'isRemote': true,
                        'src': [url]
                    }
                    await download_stream_dispatcher([stream], opts)
                } else {
                    // 根据url取得对应的分析器
                    let streams_params = { "url": url, "verbose": opts.verbose }
                    try {
                        let parser = urlMatchToParser(streams_params, opts)
                        if (parser) {
                            if (parser.obtain_all_play_url && opts.playlist || !parser.vp) {
                                let all_play_urls = await parser.obtain_all_play_url(streams_params, opts)
                                await parse_stream_dispatcher(all_play_urls, opts)
                            } else {
                                await parse_stream_dispatcher([url], opts)
                            }
                        }
                    } catch (err) {
                        logger.info("" + err)
                    }
                }
                resolve()
            })
        })

    })
    await queue.onIdle()

}
exports = module.exports = { exec }