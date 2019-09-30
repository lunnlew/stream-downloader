'use strict';
const fs = require('fs-extra')
const path = require('path')
const zlib = require('zlib')
const crypto = require('crypto')
const mime = require('mime')


// 大小转换
var renderSize = function(filesize){
    if(null==filesize||filesize==''||!filesize){
        return "0 Bytes";
    }
    var unitArr = new Array("Bytes","KB","MB","GB","TB","PB","EB","ZB","YB");
    var index=0;
    var srcsize = parseFloat(filesize);
    index=Math.floor(Math.log(srcsize)/Math.log(1024));
    var size =srcsize/Math.pow(1024,index);
	if(size%1 === 0){
	    size=size.toFixed(0);
	}else{
	    size=size.toFixed(2);
	}
    return size+unitArr[index];
}

// 时间转换
var renderDuration = function(duration){
    if(null==duration||duration==''||!duration){
        return "0 s";
    }
    var unitArr = new Array("秒","分","小时");
    var index=0;
    var srcsize = parseFloat(duration);
    index=Math.floor(Math.log(srcsize)/Math.log(60));
    var size = srcsize/Math.pow(60,index);
    if(size%1 === 0){
        size=size.toFixed(0);
    }else{
        size=size.toFixed(2);
    }
    return size+unitArr[index];
}

// 文件删除
var unlink = path =>
    new Promise((resolve, reject) => {
            try{
                if(fs.statSync(path).isDirectory()){
                        fs.emptyDirSync(path)
                        fs.rmdir(path, err => (err ? reject(err) : resolve()))
                }else{
                    fs.unlink(path, err => (err ? reject(err) : resolve()))
                }
            }catch(err){
                reject(err)
            }
      }
    )

const gunzip = function(content){
    return  new Promise((resolve, reject) => {
            zlib.gunzip(content, function(err, dezipped) {
                resolve(dezipped.toString())
            })
          }
        )
}

// 文件移动
const move_files = async (files, output, outputfile) => {
    fs.ensureDirSync(output)
    if(files){
        if(files.length==1){
            await Promise.all(files.map(function(filepath,i){
                return new Promise((resolve, reject) => {
                    try{
                        if(fs.pathExistsSync(outputfile)){
                            resolve()
                        }else{
                            fs.move(filepath, path.join(output, outputfile), err => (err ? reject(err) : resolve()))
                        }
                    }catch(err){
                        reject(err)
                    }
                })
            }))
        }else{
            await Promise.all(files.map(function(filepath,i){
                return new Promise((resolve, reject) => {
                    try{
                        if(fs.pathExistsSync(outputfile)){
                            resolve()
                        }else{
                            fs.move(filepath, path.join(output, i+'_'+outputfile), err => (err ? reject(err) : resolve()))
                        }
                    }catch(err){
                        reject(err)
                    }
                })
            }))
        }
        // await Promise.all([path.normalize(path.dirname(files[0]))].map(unlink))
    }
}

// url匹配器
var urlMatchToParser = function(params, opts){
    let match_rules = require(path.join(__dirname,'./match_rules'))
    let parser
    let extractorName = opts.extractorName
    let extractorNum = opts.extractorNum
    if(typeof extractorName == 'undefined'){
        for (var rule in match_rules){
            if(match_rules[rule].test(params.url)){
                extractorName = rule
                break
            }
        }
    }
    let extractorfile
    if(typeof extractorNum != 'undefined'){
        extractorfile = path.join(__dirname,'./parser/'+extractorName+'_'+extractorNum)
    }else{
        extractorfile = path.join(__dirname,'./parser/'+extractorName)
    }
    if(fs.pathExistsSync(extractorfile+'.js')){
        parser = require(extractorfile)
    }
    if(!parser)
        console.log(`Not Supported For [${params.url}]`)
    return parser
}

var sleep = function (delay) {
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

var mapToRequestStr = function (e) {
    var t = []
    for (var n in e)
        e[n] && t.push(n + "=" + encodeURIComponent(e[n]));
    return t.join("&")
}

var requestStrToMap = function (e) {
    var t = []
    let params = new URLSearchParams(e)
    params.forEach((value, name, searchParams) => {
       t[name] = value
    })
    return t
}

var getValidStreamRange = function (opts, length) {
    var start = 1
    var end = length
    var range = ""
    if('streamPartStart' in opts){
        start = opts['streamPartStart']
    }
    if('streamPartEnd' in opts){
        end = opts['streamPartEnd']
    }
    if('streamPartRange' in opts){
        range = opts['streamPartRange']
    }
    let part_nums = []
    if(range!=""){
        let arr_ranges = range.split(",")
        arr_ranges.forEach(function(range){
            let ranges = range.split("-")
            for (var i = parseInt(ranges[0]); i <= parseInt(ranges[ranges.length-1]); i++) {
                if(part_nums.indexOf(i)==-1 && i>=start && i<=end){
                    part_nums.push(i)
                }
            }
        })
    }else{
        for (var i = start; i <= end; i++) {
            part_nums.push(i)
        }
    }
    return part_nums
 }

var md5 = function(str){
    var hash_md5 = crypto.createHash('md5')
    return hash_md5.update(str).digest('hex')
}

var getUrlContent = async function(url, stream){
    let request = require('request')
    return new Promise(async (resolve, reject) => {
        request({
            url: url,
            method:"GET",
            headers:"headers" in stream
                ?stream['headers']
                :
                {
                    "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36"
                }
                
        },function(error, response, body) {
            if(body){
                resolve(body)
            }else{
                resolve("")
            }
        })
    })
}
var mimeToExt = function(mimeType){
    return mime.getExtension(mimeType)
}
var checkMediaSource = async function(url, opts){
    const request = require(path.join(__dirname,'./util/request'))
    let content = await request.agent({'url':url}, opts).head(url).proxy(opts['httpProxy']).catch(err => {
        let headers = {}
        if (err.status === 301) {
          return request.agent({'url':url}, opts).head(err.response.headers['location'])
            .proxy(opts['httpProxy'])
        }
        return Promise.reject(err)
      })
    let type = mimeToExt(content.type)
    console.log('debug: checkMediaSource type '+type)
    let mediaTypes = [
    'bin', 'exe', 'zip',
    'jpeg', 'jpg', 'png', 'webp',
    'mp3', 'm4a',
    'mp4', 'flv', 'f4v', 'webm',
    'm3u8'
    ]
    return {
        'isMedia': mediaTypes.indexOf(type)>=0,
        'type': type
    }
}
var sortBy = function(props) {
    return function(a,b) {
        return a[props] - b[props];
    }
}

var arrayValSort = function(arr, props) {
    arr.sort(sortBy(props))
    return arr
}

var streamsSort = function(streams, ids) {
    let streams_sorted = {}
    for(let id of ids){
        for(let stream_id in streams){
            if(stream_id == id){
                streams_sorted[stream_id] = streams[stream_id]
            }
        }
    }
    return streams_sorted
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
    md5,
    mapToRequestStr,
    requestStrToMap,
    getUrlContent,
    mimeToExt,
    checkMediaSource,
    arrayValSort,
    streamsSort
}