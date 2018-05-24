#!/usr/bin/env node

var fs = require('fs')
var COS = require('cos-nodejs-sdk-v5')
var argv = require('yargs')
    .option('dir', {
        alias : 'directory',
        describe: '指定上传目录',
        type: 'string'
    })
    .option('id', {
        alias : 'SecretId',
        describe: '开发者拥有的项目身份识别 ID，用以身份认证',
        type: 'string'
    })
    .option('key', {
        alias : 'SecretKey',
        describe: '开发者拥有的项目身份密钥',
        type: 'string'
    })
    .option('b', {
        alias : 'Bucket',
        describe: 'COS 中用于存储数据的容器 {Bucket}-{APPID}',
        type: 'string'
    })
    .option('r', {
        alias : 'Region',
        describe: '域名中的地域信息',
        type: 'string'
    })
    .option('cl', {
        alias : 'ContentLength',
        describe: 'RFC 2616 中定义的 HTTP 请求内容长度',
        type: 'string'
    })
    .alias('h', 'help')
    .alias('v', 'version')
    .usage('格式: cos-manager [options]')
    .example('首次写入配置: cos-manager --id=AKIDxxx --key=xxx')
    .example('上传指定目录: cos-manager --r=Region --b=BocketName --dir=dist')
    .epilog('Copyright (c) 2018 yansen.lei')
    .argv
require('shelljs/global')

var config = {}

let path = process.cwd()
if(argv.dir) {
    path = `${path}/${argv.dir}/`
}

if(argv.id && argv.key) {
    mkdir('~/.cos-manager/')
    touch('~/.cos-manager/config.json')
    echo(JSON.stringify({
        SecretId: argv.id,
        SecretKey: argv.key
    })).to('~/.cos-manager/config.json')
} else if(argv.b && argv.r){
    var data = cat('~/.cos-manager/config.json')
    if(data.code === 0){
        config = JSON.parse(data.stdout)
        putFiles(path)
    }
} else {
    exec('cos-manager --help')
}

function getCOS() {
    return new COS({
        SecretId: config.SecretId,
        SecretKey: config.SecretKey
    })
}

function putFiles(path, pre) {
    fs.readdir(path, (error, files) => {
        if(files) {
            for (let i = 0; i < files.length; i++) {
                let fileKey = pre ? `${pre}/${files[i]}` : files[i]
                let filePath = `${path}${files[i]}`
                if(fs.lstatSync(filePath).isDirectory()) {
                    getCOS().putObject({
                        Bucket: argv.b,
                        Region: argv.r,
                        Key: `${fileKey}/`,
                        ContentLength: argv.conlg || '1000',
                        Body: filePath,
                    }, function(err, data) {
                        if(err) {
                            console.log('put object',err)
                        } else {
                            console.log(`新建文件夹 ${fileKey}`)
                            putFiles(`${filePath}/`, fileKey)
                        }
                    })
                } else {
                    getCOS().sliceUploadFile({
                        Bucket: argv.b,
                        Region: argv.r,
                        Key: fileKey,
                        FilePath: filePath,
                        onHashProgress: function (data) {
                            // echo(data.percent)
                        },
                        onProgress: function (data) {
                            echo(`${filePath} -> ${parseInt(data.percent*100)}%`)
                        },
                    }, (err, data) => {
                        if(err) {
                            console.log(`上传${files[i]}失败`, err)
                        }
                    })
                }
            }
        }
    })
}