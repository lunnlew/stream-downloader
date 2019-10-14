'use strict';

const readline = require('readline')
const fs = require('fs-extra')
var request = require('request')
var { default: PQueue } = require('p-queue')
const path = require('path')
const { renderSize, getValidStreamPartRange, md5, getUrlContent } = require(path.join(__dirname, '../utils'))
let userAgent = require(path.join(__dirname, '../util/userAgents'))

// 处理可能存在的301 302 跳转链接
var getRealUrl = async function(url, stream, opts) {
    return new Promise(async (resolve, reject) => {
        request({
            url: url,
            method: "HEAD",
            proxy: opts['httpProxy'],
            headers: "headers" in stream ?
                stream['headers'] : {
                    "User-Agent": userAgent.get()
                }

        }, function(error, response, body) {
            // 返回最终的url
            if (response && response.request['uri']['href']) {
                resolve(response.request['uri']['href'])
            } else {
                resolve(url)
            }

        })
    })
}


var exec = async function(stream, opts, requireDownload) {
    logger.info('Downloading streaming content with Request, press ctrl + c to stop recording...')

    var conc = opts.taskConcurrency ? opts.taskConcurrency : 1
    let queue = new PQueue({ concurrency: conc });
    var tempfilepath = path.join(require('os').tmpdir(), md5(stream['title']))
    fs.ensureDirSync(tempfilepath)

    let tempfiles = []
    let success = false
    let part_nums = 0
    let success_num = 0
    let urls = []
    // 如果是网络资源
    if (stream['isRemote']) {
        if (stream['enablePlain'] && stream['container'] == 'm3u8') {
            urls = await require(path.join(__dirname, '../util/UrlExtractorFromM3U8')).fetch(stream['src'][0], stream)
        } else {
            urls = stream['src']
        }
    } else {
        // 文本资源
        logger.info("parse text")
        // m3u8类型文本
        if (stream['container'] == 'm3u8') {
            urls = await require(path.join(__dirname, '../util/UrlExtractorFromM3U8')).parse(stream['src'][0], stream)
        } else {
            logger.info("canot parse text [" + stream['container'] + ']')
        }

    }
    part_nums = getValidStreamPartRange(opts, urls.length)
    logger.info("will downloading " + part_nums.join(','))
    try {
        for (let i in urls) {
            let j = parseInt(i) + 1
            let url = urls[i]
            // 临时目录
            let tempfile = tempfilepath + "/" + j + "." + stream['format']
            tempfiles.push(tempfile)
            if (requireDownload) {
                if (part_nums.indexOf(j) == -1) {
                    continue
                }
                queue.add(() => {
                    try {
                        return new Promise(async (dresolve, dreject) => {
                            logger.info("downloading url " + url)
                            var writeStream = fs.createWriteStream(tempfile)
                            url = await getRealUrl(url, stream, opts)
                            var readStream = request({
                                url: url,
                                proxy: opts['httpProxy'],
                                headers: "headers" in stream ? stream['headers'] : { "user-agent": userAgent.get() }
                            })

                            let totalBytes = 1
                            let receivedBytes = 0
                            let percentage = 0
                            let process_bar = function(is_completed) {
                                readline.clearLine(process.stdout, 0)
                                readline.cursorTo(process.stdout, 0)
                                if (totalBytes) {
                                    percentage = (receivedBytes * 100) / totalBytes
                                } else {
                                    percentage = 0
                                }
                                if (!is_completed) {
                                    process.stdout.write(`process: totalSize=${renderSize(totalBytes)} receivedSize=${renderSize(receivedBytes)} percentage=${percentage.toFixed(2)}%`)
                                } else {
                                    process.stdout.write(`process: totalSize=${renderSize(totalBytes)} receivedSize=${renderSize(totalBytes)} percentage=100%\n`)
                                }
                            }
                            let interval = setInterval(() => {
                                process_bar(false)
                            }, 1000)
                            readStream.pipe(writeStream)
                            readStream.on('response', function(response) {
                                process.stdout.write(`debug: statusCode ${response.statusCode} contentType ${response.headers['content-type']}`)
                                totalBytes = parseInt(response.headers['content-length'], 10);
                            })
                            readStream.on('data', function(chunk) {
                                receivedBytes += chunk.length
                            })
                            readStream.on('end', function() {
                                clearInterval(interval)
                                process_bar(true)
                                logger.info('下载结束');
                            });
                            readStream.on('error', function(err) {
                                clearInterval(interval)
                                logger.info("错误信息:" + err)
                                dreject("download error")
                            })
                            writeStream.on("finish", function() {
                                writeStream.end()
                                logger.info("保存文件完成")
                                success = true
                                success_num += 1
                                dresolve("ok")
                            });
                        })
                    } catch (err) {
                        logger.info("downloading err " + err)
                    }
                });
            } else {
                success = true
                success_num += 1
            }
        }
        await queue.onIdle()
    } catch (err) {
        logger.info("downloading err " + err)
        success = false
    }

    var outputfilename = stream.title + '.' + stream['format']
    outputfilename = outputfilename.replace(/[,，!@#$%^&*]/iu, "-")

    logger.info("downloaded result " + success)

    return {
        "all": success_num == part_nums.length,
        "success": success,
        "tempfilepath": tempfilepath,
        "tempfiles": tempfiles,
        "outputfilename": outputfilename
    }
}
exports = module.exports = { exec }