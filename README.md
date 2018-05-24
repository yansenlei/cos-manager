# cos-manager
> 使用简单的命令行操作[腾讯对象存储服务](https://github.com/tencentyun/cos-nodejs-sdk-v5)

## 安装
```bash
$ npm install cos-manager -g
```

## 示例
```bash
  # 首次写入配置
  $ cos-manager --id=AKIDxxx --key=xxx
  # 上传指定目录
  $ cos-manager --r=Region --b=BocketName --dir=dist
  # 查看帮助信息
  $ cos-manager -h
```

## 规划
- [x] 上传指定目录下的所有文件
- [ ] 支持Windows用户
- [ ] 多文件上传进度优化
- [ ] 丰富桶操作...
