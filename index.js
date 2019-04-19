#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var COS = require('cos-nodejs-sdk-v5')
var figlet = require('figlet')
var CLI = require('clui')
var argv = require('yargs')
  .option('dir', {
    alias: 'directory',
    describe: '指定上传目录',
    type: 'string'
  })
  .option('id', {
    alias: 'SecretId',
    describe: '开发者拥有的项目身份识别 ID，用以身份认证',
    type: 'string'
  })
  .option('key', {
    alias: 'SecretKey',
    describe: '开发者拥有的项目身份密钥',
    type: 'string'
  })
  .option('b', {
    alias: 'Bucket',
    describe: 'COS 中用于存储数据的容器 {Bucket}-{APPID}',
    type: 'string'
  })
  .option('r', {
    alias: 'Region',
    describe: '域名中的地域信息',
    type: 'string'
  })
  .option('cl', {
    alias: 'ContentLength',
    describe: 'RFC 2616 中定义的 HTTP 请求内容长度',
    type: 'string'
  })
  .alias('h', 'help')
  .alias('v', 'version')
  .usage('cos-manager [options]')
  .example('首次写入配置: cos-manager --id=AKIDxxx --key=xxx')
  .example('上传指定目录: cos-manager --r=Region --b=Bucket-APPID --dir=dist')
  .epilog('Copyright (c) 2018 yansen.lei').argv
var shell = require('shelljs')

var config = {}

let ph = `${process.cwd()}/`
if (argv.dir) {
  ph = path.join(ph, argv.dir)
}

if (argv.id && argv.key) {
  shell.mkdir('~/.cos-manager/')
  shell.touch('~/.cos-manager/config.json')
  shell.echo(
    JSON.stringify({
      SecretId: argv.id,
      SecretKey: argv.key
    })
  ).to('~/.cos-manager/config.json')
} else if (argv.b && argv.r) {
  var data = shell.cat('~/.cos-manager/config.json')
  if (data.code === 0) {
    config = JSON.parse(data.stdout)
    putFiles(ph)
  }
} else {
  figlet(
    'cos manager',
    {
      font: 'ANSI Shadow',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    },
    function (err, data) {
      if (err) {
        console.log('Something went wrong...')
        console.dir(err)
        return
      }
      console.log(data)
      shell.exec('cos-manager --help')
    }
  )
}

function getCOS () {
  return new COS({
    SecretId: config.SecretId,
    SecretKey: config.SecretKey
  })
}

function putFiles (dir, pre) {
  fs.readdir(dir, (error, files) => {
    if (error) {
      console.log('readdir error: ', error)
    }
    if (files) {
      for (let i = 0; i < files.length; i++) {
        let fileKey = pre ? path.join(pre, files[i]) : files[i]
        let filePath = path.join(dir, files[i])
        if (fs.lstatSync(filePath).isDirectory()) {
          getCOS().putObject(
            {
              Bucket: argv.b,
              Region: argv.r,
              Key: `${fileKey}/`,
              ContentLength: argv.cl,
              Body: filePath
            },
            function (err, data) {
              if (err) {
                console.log('put object err: ', err)
              } else {
                console.log(`put object: ${fileKey}`)
                setTimeout(() => {
                  putFiles(filePath, fileKey)
                }, 200)
              }
            }
          )
        } else {
          max += 1
          getCOS().sliceUploadFile(
            {
              Bucket: argv.b,
              Region: argv.r,
              Key: fileKey,
              FilePath: filePath,
              onHashProgress: function (data) {
                // console.log('hash', data.percent)
              },
              onProgress: function (data) {
                // echo(`${filePath} -> ${parseInt(data.percent * 100)}%`)
                printProgress(filePath, data.percent)
              }
            },
            (err, data) => {
              if (err) {
                console.log(`\n upload ${files[i]} error `, err)
                setTimeout(() => {
                  putFiles(filePath, fileKey)
                }, 200)
              }
            }
          )
        }
      }
    }
  })
}

var Spinner = CLI.Spinner
var Progress = CLI.Progress
var max = 0
var files = {}
var countdown = null
var thisPercentBar = null
function printProgress (file, value) {
  if (!countdown) {
    countdown = new Spinner('uploading...  ', [
      '⣾',
      '⣽',
      '⣻',
      '⢿',
      '⡿',
      '⣟',
      '⣯',
      '⣷'
    ])
    countdown.start()
    thisPercentBar = new Progress(40)
  }
  files[file] = value
  var allValue = 0
  var allMax = 0
  for (const key in files) {
    allValue += files[key]
    if (files[key] === 1) {
      allMax++
    }
  }
  var number = allValue / max
  countdown.message(thisPercentBar.update(number.toFixed(2)))
  setTimeout(() => {
    if (allMax === max) {
      process.stdout.write('\n')
      process.exit(0)
    }
  }, 1000)
}
