'use strict';
const fs = require('fs-extra')
const path = require('path')
var zlib = require('zlib')
var crypto = require('crypto')


// 大小转换
var renderSize = function(filesize){
    if(null==filesize||filesize==''){
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

// 文件删除
var unlink = path =>
    new Promise((resolve, reject) => {
        if(fs.statSync(path).isDirectory()){
            fs.emptyDirSync(path)
            fs.rmdir(path, err => (err ? reject(err) : resolve()))
        }else{
            fs.unlink(path, err => (err ? reject(err) : resolve()))
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
    if(files){
        if(files.length==1){
            await Promise.all(files.map(function(filepath,i){
                return new Promise((resolve, reject) => {
                    if(fs.pathExistsSync(outputfile)){
                        resolve()
                    }else{
                        fs.move(filepath, path.join(output, outputfile), err => (err ? reject(err) : resolve()))
                    }
                })
            }))
        }else{
            await Promise.all(files.map(function(filepath,i){
                return new Promise((resolve, reject) => {
                    if(fs.pathExistsSync(outputfile)){
                        resolve()
                    }else{
                        fs.move(filepath, path.join(output, i+'_'+outputfile), err => (err ? reject(err) : resolve()))
                    }
                })
            }))
        }
        await Promise.all([path.normalize(path.dirname(files[0]))].map(unlink))
    }
}

// url匹配器
var urlMatchToParser = function(params){
    let match_rules = require(path.join(__dirname,'./match_rules'))
    let parser
    for (var rule in match_rules){
        if(match_rules[rule].test(params.url)){
            parser = require(path.join(__dirname,'./parser/'+rule));
            break
        }
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

var buildres = function(e){
    var t = [];
    for (var n in e)
        t.push(n + "=" + encodeURIComponent(e[n]));
    return t.join("&")
}

module.exports = {
	renderSize,
    unlink,
    move_files,
    urlMatchToParser,
    gunzip,
    sleep,
    getValidStreamRange, 
    md5,
    buildres
}