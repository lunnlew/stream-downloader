'use strict';

const readline = require('readline')
var os = require('os')
var {default: PQueue} = require('p-queue')
const path = require('path')
const {renderSize, getValidStreamPartRange, md5} = require(path.join(__dirname,'../utils'))
const fs = require('fs-extra')
const spawn = require('child_process').spawn

var exec = async function(stream, opts){
	logger.info('Downloading streaming content with Ari2c, press ctrl + c to stop recording...')

   	var conc = opts.taskConcurrency?opts.taskConcurrency:1
  	let queue = new PQueue({concurrency: conc});
	var tempfilepath = path.join(require('os').tmpdir(), md5(stream['title']))
   	fs.ensureDirSync(tempfilepath)

   	var aria2cPath = await require(path.join(__dirname,'../util/check_aria2c_installed')).exec(opts)
	logger.info("aria2cPath " + aria2cPath)


	let part_nums = getValidStreamPartRange(opts, stream['src'].length)
	logger.info("will downloading " + part_nums.join(','))
   	let tempfiles = []
	let success = false
	let success_num = 0

	let filepath = ''
	let fWrite = ''

	filepath = stream['urlspath']+'.txt'
	fs.ensureFileSync(filepath)
	fWrite = fs.createWriteStream(filepath)

	var aria2Concurrency = opts.aria2Concurrency?opts.aria2Concurrency:16
	try{
		for(let i in stream['src']){
			let j = parseInt(i)+1
			let url = stream['src'][i]
			let tempfile = tempfilepath+"/"+url.split('?')[0].split('/').pop()
			tempfiles.push(tempfile)
			if(!opts.onlyMerge){
				if(part_nums.indexOf(j)==-1){
					continue
				}
				if(!stream['remote']){
					fWrite.write(url + os.EOL)
				}
			}else{
				success = true
			    success_num += 1
			}
		}
		queue.add(() => {
			try{
				return new Promise(async (resolve, reject) => {
					try{
						let cmd_child = spawn(aria2cPath, ['--console-log-level', 'warn', '-d', tempfilepath,'-x', aria2Concurrency, '-j', aria2Concurrency, '-c', '-i', filepath]);
						cmd_child.stdout.on('data', (data) => {
						  logger.info(`stdout: ${data}`)
						})
						cmd_child.stderr.on('data', (data) => {
						  logger.info(`stderr: ${data}`)
						})
						cmd_child.stderr.on('close', (code) => {
							logger.info(`子进程退出，退出码 ${code}`)
							resolve()
						})
					}catch(error){
						logger.info("err " + error)
						reject(error)
					}
			    })
			}catch(err){
				logger.info("downloading err " +err)
			}
		})
		success = true
		success_num = part_nums.length
		await queue.onIdle()
	}catch(err){
		logger.info("downloading err " +err)
		success = false
	}

	var outputfilename = stream.title+'.'+stream['format']
	outputfilename = outputfilename.replace(/[,，!@#$%^&*]/iu,"-")

	logger.info("downloaded result " + success)
	
	return {
		"all": success_num == part_nums.length,
		"success":success,
		"tempfiles":tempfiles,
		"tempfilepath":tempfilepath,
		"outputfilename":outputfilename
	}
}
exports = module.exports = {exec}