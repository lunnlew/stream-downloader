'use strict';
const path = require('path')
const fs = require('fs-extra')
const {unlink,move_files} = require(path.join(__dirname,'../utils'))

var exec = async function(tempfiles, outputfile, opts){
	console.log('debug: starting rename files')
	let output = typeof opts.output!='undefined'?opts.output:"."
	try{
		await move_files(tempfiles, output, outputfile)
		console.log('debug: rename completed')
		return {
			'state':'success',
			'output': output
		}
	}catch(err){
		console.log('debug: rename error' +err)
		return {
			'state':'fail'
		}
	}
}

exports = module.exports = {exec}