'use strict';
const path = require('path')
const fs = require('fs-extra');
const spawn = require('child_process').spawn
const iconv = require('iconv-lite')
const os = require('os')
const { unlink } = require(path.join(__dirname, '../utils'))

var eunzip = async function(zippath, outpath) {
    return new Promise((resolve, reject) => {
        zippath = path.join(process.cwd(), zippath)
        outpath = path.join(process.cwd(), outpath)
        if (fs.pathExistsSync(zippath)) {
            var unzip = require('unzip')
            var extract = unzip.Extract({ path: outpath });
            extract.on('finish', function() {
                logger.info("解压ffmpeg.zip完成")
                resolve("success")
            });
            extract.on('error', function(err) {
                logger.info(err)
                reject(err)
            });
            fs.createReadStream(zippath).pipe(extract);
        } else {
            reject()
        }
    })
}

var tryDownload = function(opts, url) {
    return new Promise(async (resolve, reject) => {
        try {
            let result = await require(path.join(__dirname, '../downloader/download_with_request')).exec({
                "src": [url],
                "format": "zip",
                "isRemote": true,
                "title": "ffmpeg"
            }, opts)
            if (result.success) {
                let move_result = await require(path.join(__dirname, './move_files')).exec(result['tempfiles'], result['outputfile'], opts)
                resolve(move_result)
            } else {
                resolve({ 'state': 'fail' })
            }
        } catch (err) {
            reject({ 'state': 'fail', 'err': err })
        }
    })
}

var exec = async function(opts) {
    var ffpath = opts.ffmpegPath ? opts.ffmpegPath : 'ffmpeg'
    let result = ffpath.replace(/\\/g, "/")
    if (ffpath.indexOf("/") >= 0) {
        if (fs.pathExistsSync(path)) {
            return result
        }
    } else {
        result = await new Promise((resolve, reject) => {
            let cmd = `where ${ffpath}`
            logger.info("cmd " + cmd)
            try {
                let cmd_child = spawn(`where`, [ffpath]);
                cmd_child.stdout.on('data', function(data) {
                    data = data.toString().replace(/[\r\n]/g, "").replace(/\\/g, "/")
                    resolve(data)
                });
                cmd_child.stderr.on('data', function(data) {
                    logger.info("err " + iconv.decode(data, 'gb2312').toString())
                    resolve("")
                });
            } catch (error) {
                logger.info("err " + error)
                reject(error)
            }
        })

        if (fs.pathExistsSync(result)) {
            return result
        }
    }

    result = path.join(process.cwd(), 'bin/ffmpeg.exe')
    if (fs.pathExistsSync(result)) {
        return result
    } else {
        logger.info("local not exists ffmpeg ")
    }

    // 系统平台
    let os_platform = os.platform()
    // 系统架构
    let os_arch = os.arch()
    // ffmpeg 版本
    let version = '20190926-525de95'
    // 编译链接类型
    let lib_link = 'static'

    logger.debug(`platform(${os_platform}-${os_arch}-[${version}]-${lib_link})`)

    let sourceUrl
    let outFile
    let zipExt
    let sourceDir
    let sourceExe
    let destExe

    if (os_platform == 'win32') {
        if (os_arch == 'x64' || os_arch == 'x32') {
            os_platform = os_arch.replace('x', 'win')
        }
        sourceUrl = `https://ffmpeg.zeranoe.com/builds/${os_platform}/${lib_link}/ffmpeg-${version}-${os_platform}-${lib_link}.zip`
        outFile = "ffmpeg.zip"
        zipExt = 'zip'
        sourceDir = `ffmpeg-${version}-${os_platform}-${lib_link}`
        sourceExe = `ffmpeg-${version}-${os_platform}-${lib_link}/bin/ffmpeg.exe`
        destExe = 'bin/ffmpeg.exe'
    } else if (os_platform == 'win32') {
        sourceUrl = `https://ffmpeg.zeranoe.com/builds/${os_platform}/${lib_link}/ffmpeg-${version}-${os_platform}-${lib_link}.zip`
        outFile = "ffmpeg.zip"
        zipExt = 'zip'
        sourceDir = `ffmpeg-${version}-${os_platform}-${lib_link}`
        sourceExe = `ffmpeg-${version}-${os_platform}-${lib_link}/bin/ffmpeg.exe`
        destExe = 'bin/ffmpeg.exe'
    } else {
        logger.info(`current platform(${os_platform}-${os_arch}) not support downloading ffmpeg to install`)
        return "ffmpeg"
    }



    try {
        logger.info("starting download ffmpeg ")
        let ffresult = await tryDownload(opts, sourceUrl)
        logger.info("download result " + ffresult.state)
        if (ffresult.state == "success") {
            let zipr = 'fail'
            logger.info(`unzip ${outFile}`)
            if (zipExt == 'zip') {
                zipr = await eunzip(outFile, "")
            } else {

                if (zipr == "success") {
                    await new Promise((resolve, reject) => {
                        let tmp_f = path.join(process.cwd(), sourceExe)
                        if (fs.pathExistsSync(tmp_f)) {
                            fs.move(tmp_f, path.join(process.cwd(), destExe), err => (err ? reject(err) : resolve()))
                        } else {
                            reject("error")
                        }
                    })
                    logger.info("clear tempfile ")

                    try {
                        await Promise.all([path.normalize(sourceDir)].map(unlink))
                    } catch (err) {
                        logger.info("rm tempfile file failed")
                    }

                    result = path.join(process.cwd(), destExe)
                } else {
                    result = "ffmpeg"
                }
            }
        } else {
            result = "ffmpeg"
        }

    } catch (err) {
        logger.info("download ffmpeg error " + err)
    }
    return result
}

exports = module.exports = { exec }