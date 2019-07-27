'use strict';
const path = require('path')
const fs = require('fs-extra')
const {unlink,move_files} = require(path.join(__dirname,'../utils'))

var exec = async function(tempfiles, outputfile, opts){
	console.log('debug: staring rename files')
	try{
		await move_files(tempfiles, typeof opts.output!='undefined'?opts.output:".", outputfile)
		console.log('debug: rename completed')
		return "success"
	}catch(err){
		console.log('debug: rename error' + err)
		return "fail"
	}
}

exports = module.exports = {exec}