'use strict';
const path = require('path')
const fs = require('fs-extra')
const ffmpeg = require('fluent-ffmpeg')
const { unlink, sleep } = require(path.join(__dirname, '../utils'))
var { default: PQueue } = require('p-queue')

const ffmpeg_concat = async (files, outputpath, outputfilename, opts) => {
    if (files.length) {
        let conc = opts.taskConcurrency ? opts.taskConcurrency : 1
        let queue = new PQueue({ concurrency: conc })
        let names = []
        for (let i in files) {
            let file = files[i]
            queue.add(() => {
                return new Promise((resolve, reject) => {
                    logger.info('start covert with ' + file)
                    const outfile = `${file}.ts`
                    try {
                        ffmpeg(file)
                            .outputOptions('-c', 'copy', '-bsf:v', 'h264_mp4toannexb', '-f', 'mpegts')
                            .output(outfile)
                            .on('start', function(commandLine) {
                                logger.info('Ffmpeg with command: ' + commandLine)
                            })
                            .on('end', () => {
                                names[i] = outfile
                                resolve(outfile)
                            })
                            .on('error', (err) => {
                                logger.debug('ffmpeg covert err ' + err)
                                resolve()
                            })
                            .run()
                    } catch (err) {
                        logger.info('ffmpeg covert err ' + err)
                        resolve()
                    }
                })
            })
        }
        await queue.onIdle()

        // 分割任务
        let l = 50
        // 子任务
        let cnames_sub = []
        if (names.length > l) {

            let cnames_slice = []
            for (var i = 0; i < names.length; i += l) {
                cnames_slice.push(names.slice(i, i + l))
            }
            for (let i in cnames_slice) {
                let names = cnames_slice[i]
                let filename = i + '_sg_' + outputfilename + '.ts'
                cnames_sub.push(path.join(outputpath, filename))
                queue.add(() => {
                    const namesString = names.join('|')
                    return new Promise((resolve, reject) => {
                        try {
                            ffmpeg(`concat:${namesString}`)
                                .outputOptions('-c', 'copy', '-bsf:v', 'h264_mp4toannexb', '-f', 'mpegts')
                                .output(path.join(outputpath, filename))
                                .on('start', function(commandLine) {
                                    logger.info('Ffmpeg with command: ' + commandLine)
                                })
                                .on('end', resolve)
                                .on('error', (err) => {
                                    logger.debug('ffmpeg covert err ' + err)
                                    resolve()
                                })
                                .run()
                        } catch (err) {
                            logger.debug('ffmpeg covert err ' + err)
                            resolve()
                        }
                    })
                })
            }
            await queue.onIdle()

        } else {
            cnames_sub = names
        }

        //最终任务
        const namesString = cnames_sub.join('|')
        await new Promise((resolve, reject) => {
            try {
                ffmpeg(`concat:${namesString}`)
                    .outputOptions('-c', 'copy', '-bsf:a', 'aac_adtstoasc')
                    .output(path.join(outputpath, outputfilename))
                    .on('start', function(commandLine) {
                        logger.info('Ffmpeg with command: ' + commandLine)
                    })
                    .on('end', resolve)
                    .on('error', reject)
                    .run()
            } catch (err) {
                logger.info('ffmpeg merge err ' + err)
                resolve()
            }
        })

        // await Promise.all(names.map(unlink))
        // await Promise.all(files.map(unlink))
        // await sleep(1000)
        // await Promise.all([path.normalize(path.dirname(files[0]))].map(unlink))
    }
}

var exec = async function(tempfiles, outputpath, outputfilename, opts) {

    var ffmpegPath = await require(path.join(__dirname, './check_ffmpeg_installed')).exec(opts)
    logger.info("ffmpegPath " + ffmpegPath)

    ffmpeg.setFfmpegPath(ffmpegPath)

    logger.info('staring merge video')
    try {
        await ffmpeg_concat(tempfiles, outputpath, outputfilename, opts)
        logger.info('merge completed')
        return {
            'state': 'success',
            'outputfile': path.join(outputpath, outputfilename)
        }
    } catch (err) {
        logger.info('merge error' + err)
        return {
            'state': 'fail',
            'err': err
        }
    }
}

exports = module.exports = { exec }