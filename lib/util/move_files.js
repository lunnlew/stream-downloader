'use strict';
const path = require('path')
const fs = require('fs-extra')
const {unlink,move_files} = require(path.join(__dirname,'../utils'))

var exec = async function(tempfiles, outputfile, opts){
	logger.info('starting rename files')
	let output = typeof opts.output!='undefined'?opts.output:"."
	try{
		await move_files(tempfiles, output, outputfile)
		logger.info('rename completed')
		return {
			'state':'success',
			'output': output
		}
	}catch(err){
		logger.info('rename error' +err)
		return {
			'state':'fail'
		}
	}
}

exports = module.exports = {exec}