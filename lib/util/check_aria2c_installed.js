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
                logger.info("解压aria2c.zip完成")
                resolve("success")
            });
            extract.on('error', function(err) {
                logger.error(`解压失败,请检查[unzip ${zippath}]`)
                reject()
            });
            fs.createReadStream(zippath).pipe(extract);
        } else {
            reject()
        }
    })
}

var euntarbz2 = async function(zippath, outpath) {
    return new Promise((resolve, reject) => {
        zippath = path.join(process.cwd(), zippath)
        outpath = path.join(process.cwd(), outpath)
        if (fs.pathExistsSync(zippath)) {
            let cmd_child = spawn(`tar`, ['jxvf', zippath]);
            cmd_child.stdout.on('data', function(data) {});
            cmd_child.stderr.on('close', (code) => {
                logger.info(`解压完毕，退出码 ${code}`)
                resolve("success")
            })
            cmd_child.stderr.on('data', function(data) {
                logger.error(`解压失败,请检查[tar jxvf ${zippath}]`)
                resolve()
            });
        } else {
            reject()
        }
    })
}

var tryDownload = function(opts, url, destfile, destext) {
    return new Promise(async (resolve, reject) => {
        try {
            let result = await require(path.join(__dirname, '../downloader/download_with_request')).exec({
                "src": [url],
                "format": destext,
                "isRemote": true,
                "title": "aria2c"
            }, opts, true)
            if (result.success) {
                let move_result = await require(path.join(__dirname, './move_files')).exec(result['tempfiles'], destfile, opts)
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
    var ffpath = opts.aria2cPath ? opts.aria2cPath : 'aria2c'

    // 系统平台
    let os_platform = os.platform()
    // 系统架构
    let os_arch = os.arch()
    // 编译链接类型
    let lib_link = 'static'

    logger.debug(`platform(${os_platform}-${os_arch}-${lib_link})`)

    logger.info(`check whereis aria2c`)

    let result = ffpath.replace(/\\/g, "/")
    if (ffpath.indexOf("/") >= 0 && fs.pathExistsSync(path)) {
        return result
    }

    if (os_platform == 'win32') {
        result = path.join(process.cwd(), 'bin/aria2c.exe')
        if (fs.pathExistsSync(result)) {
            return result
        }
    } else if (os_platform == 'linux') {
        result = path.join(process.cwd(), 'bin/aria2c')
        if (fs.pathExistsSync(result)) {
            return result
        }
    }

    if (os_platform == 'win32') {
        result = await new Promise((resolve, reject) => {
            logger.info("cmd " + `where ${ffpath}`)
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
    } else if (os_platform == 'linux') {
        result = await new Promise((resolve, reject) => {
            logger.info("cmd " + `whereis -b ${ffpath}`)
            try {
                let cmd_child = spawn(`whereis`, ['-b', ffpath]);
                cmd_child.stdout.on('data', function(data) {
                    logger.info("data: " + data)
                    data = data.toString().replace(/[\r\n]/g, "").replace(/\\/g, "/")
                    let bin = data.split(":").pop().replace(/ /g, "/")
                    resolve(bin)
                });
                cmd_child.stderr.on('data', function(data) {
                    logger.err("err: " + data)
                    resolve("")
                });
            } catch (error) {
                logger.info("err " + error)
                reject(error)
            }
        })
    }

    if (fs.pathExistsSync(result)) {
        return result
    }

    logger.info("local not exists aria2c ")

    let sourceUrl
    let outFile
    let zipExt
    let sourceDir
    let sourceExe
    let destExe
    let version

    result = "aria2c"

    if (os_platform == 'win32') {
        if (os_arch == 'x64' || os_arch == 'x32') {
            os_platform = 'win'
            os_arch = os_arch.replace('x', '') + 'bit'
        }
        version = '1.34.0'
        sourceUrl = `https://github.com/aria2/aria2/releases/download/release-${version}/aria2-${version}-${os_platform}-${os_arch}-build1.zip`
        outFile = "aria2c.zip"
        zipExt = 'zip'
        sourceDir = `aria2-${version}-${os_platform}-${os_arch}-build1`
        sourceExe = `aria2-${version}-${os_platform}-${os_arch}-build1/aria2c.exe`
        destExe = 'bin/aria2c.exe'
    } else if (os_platform == 'linux') {
        if (os_arch == 'x64' || os_arch == 'x32') {
            os_arch = os_arch.replace('x', '') + 'bit'
        }
        version = '1.34.0'
        sourceUrl = `https://github.com/q3aql/aria2-static-builds/releases/download/v${version}/aria2-${version}-${os_platform}-gnu-${os_arch}-build1.tar.bz2`
        outFile = "aria2c.tar.bz2"
        zipExt = 'tar.bz2'
        sourceDir = `aria2-${version}-${os_platform}-gnu-${os_arch}-build1`
        sourceExe = `aria2-${version}-${os_platform}-gnu-${os_arch}-build1/aria2c`
        destExe = 'bin/aria2c'
    } else {
        logger.error(`current platform(${os_arch_name}-${os_arch}) not support aria2c `)
        process.exit()
    }

    try {
        logger.info("starting download aria2c from[" + sourceUrl + "]")
        let ffresult = await tryDownload(opts, sourceUrl, outFile, zipExt)
        logger.info("download result " + ffresult.state)
        if (ffresult.state == "success") {
            let zipr = 'fail'
            logger.info(`unzip ${outFile}`)
            if (zipExt == 'zip') {
                zipr = await eunzip(outFile, "")
            } else {
                zipr = await euntarbz2(outFile, "")
            }
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
                logger.error(`unzip ${outFile} failed`)
            }
        }
    } catch (err) {
        logger.debug("download aria2c error " + err)
    }

    if (fs.pathExistsSync(result)) {
        return result
    } else {
        logger.error(`check aria2c install error`)
        process.exit()
    }
}

exports = module.exports = { exec }