'use strict';
const path = require('path')
const fs = require('fs-extra')
const ffmpeg = require('fluent-ffmpeg')
const {unlink} = require(path.join(__dirname,'../utils'))

const move_files = async (files, output, outputfile) => {
	if(files){
		if(files.length==1){
			await Promise.all(files.map(function(filepath,i){
				return new Promise((resolve, reject) => {
					// 已存在则不处理
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
					// 已存在则不处理
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

var exec = async function(tempfiles, outputfile, opts, resolve, reject){
	console.log('debug: staring rename files')
	try{
		await move_files(tempfiles, typeof opts.output!='undefined'?opts.output:".", outputfile)
		console.log('debug: rename completed')
		resolve("ok")
	}catch(err){
		console.log('debug: rename error' + err)
		reject()
	}
}

exports = module.exports = {exec}