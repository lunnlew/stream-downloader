'use strict';
const fs = require('fs-extra')
const path = require('path')
const zlib = require('zlib')
const crypto = require('crypto')
const mime = require('mime')


// 大小转换
var renderSize = function(filesize) {
    if (null == filesize || filesize == '' || !filesize) {
        return "0 Bytes";
    }
    var unitArr = new Array("Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB");
    var index = 0;
    var srcsize = parseFloat(filesize);
    index = Math.floor(Math.log(srcsize) / Math.log(1024));
    var size = srcsize / Math.pow(1024, index);
    if (size % 1 === 0) {
        size = size.toFixed(0);
    } else {
        size = size.toFixed(2);
    }
    return size + unitArr[index];
}

// 时间转换
var renderDuration = function(duration) {
    if (null == duration || duration == '' || !duration) {
        return "0 s";
    }
    var unitArr = new Array("秒", "分", "小时");
    var index = 0;
    var srcsize = parseFloat(duration);
    index = Math.floor(Math.log(srcsize) / Math.log(60));
    var size = srcsize / Math.pow(60, index);
    if (size % 1 === 0) {
        size = size.toFixed(0);
    } else {
        size = size.toFixed(2);
    }
    return size + unitArr[index];
}

// 文件删除
var unlink = path =>
    new Promise((resolve, reject) => {
        try {
            if (fs.statSync(path).isDirectory()) {
                fs.emptyDirSync(path)
                fs.rmdir(path, err => (err ? reject(err) : resolve()))
            } else {
                fs.unlink(path, err => (err ? reject(err) : resolve()))
            }
        } catch (err) {
            reject(err)
        }
    })

const gunzip = function(content) {
    return new Promise((resolve, reject) => {
        zlib.gunzip(content, function(err, dezipped) {
            resolve(dezipped.toString())
        })
    })
}

// 文件移动
const move_files = async (files, output, outputfile) => {
    fs.ensureDirSync(output)
    if (files) {
        await Promise.all(files.map(function(filepath, i) {
            return new Promise((resolve, reject) => {
                let n_outputfile
                if (outputfile instanceof Array) {
                    if (i in outputfile) {
                        n_outputfile = outputfile[i]
                    } else {
                        n_outputfile = i + '_' + outputfile
                    }

                } else {
                    if (files.length != 1) {
                        n_outputfile = i + '_' + outputfile
                    } else {
                        n_outputfile = outputfile
                    }
                }
                try {
                    let fpath = path.join(output, n_outputfile)
                    if (fs.pathExistsSync(fpath)) {
                        resolve()
                    } else {
                        fs.move(filepath, fpath, { overwrite: true }, err => (err ? reject(err) : resolve()))
                    }
                } catch (err) {
                    reject(err)
                }
            })
        }))
    }
}

// url匹配器
var urlMatchToParser = function(params, opts) {
    let match_rules = require(path.join(__dirname, './match_rules'))
    let parser
    let extractorName = opts.extractorName
    let extractorNum = opts.extractorNum
    if (typeof extractorName == 'undefined') {
        for (var rule in match_rules) {
            if (match_rules[rule].test(params.url)) {
                extractorName = rule
                break
            }
        }
    }
    let extractorfile_default = path.join(__dirname, './parser/' + extractorName)

    let extractorFullName = extractorName
    if (typeof extractorNum != 'undefined') {
        extractorFullName = extractorName + '_' + extractorNum
    }

    let extractorfile = path.join(__dirname, './parser/' + extractorFullName)

    if (fs.pathExistsSync(extractorfile + '.js')) {
        logger.info('use extractor ' + extractorFullName)
        parser = require(extractorfile)
    } else {
        logger.info('use extractor ' + extractorName)
        if (fs.pathExistsSync(extractorfile_default + '.js')) {
            parser = require(extractorfile_default)
        }
    }

    if (!parser)
        logger.info(`Not Supported For [${params.url}]`)
    return parser
}

var sleep = function(delay) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                resolve(1)
            } catch (e) {
                reject(0)
            }
        }, delay);
    })
}

var mapToRequestStr = function(e, r = false) {
    var t = []
    for (var n in e) {
        (e[n] || r) && t.push(n + "=" + encodeURIComponent(e[n]));
    }
    return t.join("&")
}

var requestStrToMap = function(e) {
    var t = []
    let params = new URLSearchParams(e)
    params.forEach((value, name, searchParams) => {
        t[name] = value
    })
    return t
}

var getValidStreamRange = function(opts, length) {
    var start = 1
    var end = length
    var range = ""
    if ('streamStart' in opts) {
        start = opts['streamStart']
    }
    if ('streamEnd' in opts) {
        end = opts['streamEnd']
    }
    if ('streamRange' in opts) {
        range = opts['streamRange']
    }
    let stream_nums = []
    if (range != "") {
        let arr_ranges = range.split(",")
        arr_ranges.forEach(function(range) {
            let ranges = range.split("-")
            for (var i = parseInt(ranges[0]); i <= parseInt(ranges[ranges.length - 1]); i++) {
                if (stream_nums.indexOf(i) == -1 && i >= start && i <= end) {
                    stream_nums.push(i)
                }
            }
        })
    } else {
        for (var i = start; i <= end; i++) {
            stream_nums.push(i)
        }
    }
    return stream_nums
}

var getValidStreamPartRange = function(opts, length) {
    var start = 1
    var end = length
    var range = ""
    if ('streamPartStart' in opts) {
        start = opts['streamPartStart']
    }
    if ('streamPartEnd' in opts) {
        end = opts['streamPartEnd']
    }
    if ('streamPartRange' in opts) {
        range = opts['streamPartRange']
    }
    let part_nums = []
    if (range != "") {
        let arr_ranges = range.split(",")
        arr_ranges.forEach(function(range) {
            let ranges = range.split("-")
            for (var i = parseInt(ranges[0]); i <= parseInt(ranges[ranges.length - 1]); i++) {
                if (part_nums.indexOf(i) == -1 && i >= start && i <= end) {
                    part_nums.push(i)
                }
            }
        })
    } else {
        for (var i = start; i <= end; i++) {
            part_nums.push(i)
        }
    }
    return part_nums
}

var md5 = function(str) {
    var hash_md5 = crypto.createHash('md5')
    return hash_md5.update(str).digest('hex')
}

var getUrlContent = async function(url, stream) {
    let request = require('request')
    return new Promise(async (resolve, reject) => {
        request({
            url: url,
            method: "GET",
            headers: "headers" in stream ?
                stream['headers'] : {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36"
                }

        }, function(error, response, body) {
            if (body) {
                resolve(body)
            } else {
                resolve("")
            }
        })
    })
}
var mimeToExt = function(mimeType) {
    return mime.getExtension(mimeType)
}
var checkMediaSource = async function(url, opts) {
    logger.info('start checkMediaSource')
    const request = require(path.join(__dirname, './util/request'))
    let url_part = new URL(url)
    let content = await request.agent({ 'referer': url }, opts)
        .set('accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
        .set('host', url_part.hostname)
        .get(url).proxy(opts['httpProxy'])
    let type = mimeToExt(content.type)
    logger.info('checkMediaSource type ' + type)
    let mediaTypes = [
        'bin', 'exe', 'zip',
        'jpeg', 'jpg', 'png', 'webp',
        'mp3', 'm4a',
        'mp4', 'flv', 'f4v', 'webm',
        'm3u8'
    ]
    return {
        'isMedia': mediaTypes.indexOf(type) >= 0,
        'type': type
    }
}
var sortBy = function(props) {
    return function(a, b) {
        return a[props] - b[props];
    }
}

var arrayValSort = function(arr, props) {
    arr.sort(sortBy(props))
    return arr
}

var streamsSort = function(streams, ids) {
    let streams_sorted = {}
    for (let id of ids) {
        for (let stream_id in streams) {
            if (stream_id == id) {
                streams_sorted[stream_id + ''] = streams[stream_id]
            }
        }
    }
    return streams_sorted
}

var getUrlExt = function(url) {
    let base = url.split('?')[0]
    return base.substring(base.lastIndexOf('.') + 1, base.length)
}
module.exports = {
    renderSize,
    renderDuration,
    unlink,
    move_files,
    urlMatchToParser,
    gunzip,
    sleep,
    getValidStreamRange,
    getValidStreamPartRange,
    md5,
    mapToRequestStr,
    requestStrToMap,
    getUrlContent,
    mimeToExt,
    checkMediaSource,
    arrayValSort,
    streamsSort,
    getUrlExt
}