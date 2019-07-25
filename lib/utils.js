'use strict';
const fs = require('fs-extra')
const path = require('path')


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

module.exports = {
	renderSize,
    unlink,
    urlMatchToParser
}