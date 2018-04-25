# alarm

> alarm project


### 安装环境

```bash
npm run bootstrap
```

```
如果直接出现rm -fr ./node_modules; cnpm install,则
npm install
```

注意, 第一个 highcharts license 一定要填 `y`, 后面的直接回车即可

看到 `All done! Happy charting!` 表示安装成功Highcharts Export Server

### 前端脚本

```bash
# 开发
npm run dev

# 部署
npm run build
```

### 后端服务

```bash
npm start


# 测试+日志模式
npm run start:dev
```


### 部署服务

1. 先安装环境
1. 再执行如下命令

```bash
npm run deploy
```

如需修改线上监听端口可修改 `config/prod.env.js` 文件
