// sequelize use tedious to connect mssql
// http://tediousjs.github.io/tedious/api-connection.html
const Sequelize = require('sequelize')
const exporter = require('highcharts-export-server')
// http://expressjs.com/en/4x/api.html
const express = require('express')
const app = express()
const _ = require('lodash')
const moment = require('moment')
const cors = require('cors') // https://www.npmjs.com/package/cors
const log = require('min-log')
var path = require('path')
var fs = require('fs')
var devConfig = require('../config/dev.env.js')
var prodCondig = require('../config/prod.env.js')
var config = devConfig
if (process.env.NODE_ENV === 'production') {
  config = prodCondig
}
var timer = null

try {
  // 启动 Phantomjs 线程池
  exporter.initPool({
    maxWorkers: 2,
    initialWorkers: 1,
    workLimit: 2
  })
} catch (err) {
  console.error('图片生成服务启动失败', err)
}

// 返回图片到前台
function handler(query, res) {
  if (query.isInterval === 'true') {
    var interval = parseInt(query.intervalTime)
    delete query.isInterval
    delete query.intervalTime
    if (timer) {
      clearInterval(timer)
      timer = 0
    }
    timer = setInterval(() => {
      handler(query)
    }, interval)
    handler(query) // 当场先执行一次
    return res.send({
      errno: 0,
      errmsg: '定时任务设置成功'
    })
  }

  var promise = queryData(query)

  return promise.then(data => {
    var chartOpt
    if (query.mode === 'line') {
      chartOpt = generateLineChartOpt(data)
    } else if (query.mode === 'redgreen') {
      chartOpt = generateRedGreenChartOpt(data)
    }
    if (query.useImage) {
      return renderChartImage(chartOpt, query).then(base64 => {
        // 字符串解码图片
        var buffer = Buffer.from(base64, 'base64')
        if (res) {
          // 有 res 就返回请求
          res.set('Content-Type', 'image/png')
          res.send(buffer)
        } else {
          // 写文件
          var time = moment().format('YYYYMMDDhhmmss')
          var file = time + '-' + query.mode + '.png'
          file = path.resolve(__dirname, '../image', file)
          log.debug('write file', file)
          fs.writeFile(file, buffer, err => {
            if (err) {
              console.error('写文件失败', file, err)
            }
          })
        }
      })
    } else {
      return res.send({
        errno: 0,
        errmsg: 'ok',
        data: {
          chartOpt: chartOpt
        }
      })
    }
  }).catch(err => {
    log.error('error', err)
    if (res) {
      res.send({
        errno: 500,
        errmsg: err.message
      })
    }
  })
}

var port = config.SERVER_PORT || 80

app
  .use(cors())
  .get('/line.png', (req, res) => {
    var query = _.extend(req.query, {mode: 'line', useImage: true})
    handler(query, res)
  })
  .get('/line', (req, res) => {
    var query = _.extend(req.query, {mode: 'line', useImage: false})
    handler(query, res)
  })
  .get('/redgreen', (req, res) => {
    var query = _.extend(req.query, {mode: 'redgreen', useImage: false})
    handler(query, res)
  })
  .get('/redgreen.png', (req, res) => {
    var query = _.extend(req.query, {mode: 'redgreen', useImage: true})
    handler(query, res)
  })
  .use(express.static(path.resolve(__dirname, '../dist')))
  .listen(port, '0.0.0.0', err => {
    if (err) {
      console.error(err)
    } else {
      console.log(`listen on ${port}`)
    }
  })

// sql查询 对返回数据进行处理
function queryData(query) {
  log.debug('query', query)
  // 实例化 以连接池的形式连接到所使用的数据库
  var sequelize = new Sequelize(query.database, query.dbUser, query.dbPassword, {
    host: query.dbHost,
    dialect: query.dialect || 'mssql', // 默认 mssql
    port: parseInt(query.dbPort),
    database: query.database,
    pool: {
      max: 1,
      min: 0,
      idle: 10000
    },
    options: {}
  })
  var table = _.split(query.tableName, '.')
  table.unshift(query.database)
  table = _.map(table, item => {
    return `[${item}]`
  }).join('.')
  // TODO 未来可以用统一语法
  var timeFormat = query.timeFormat || 'YYYY-MM-DD HH:mm:ss' // 默认这种时间格式
  var startTime = moment(parseInt(query.startTime))
  var endTime = moment(parseInt(query.endTime))
  var startStr = startTime.format(timeFormat)
  var endStr = endTime.format(timeFormat)

  var condition = query.condition || []
  var timeField = []
  var sql, _sql
  if (query.mode === 'line') {
    sql = `SELECT [${query.timeField}] FROM ${table}`
    timeField.push(
      {key: query.timeField, operator: '>', value: startStr},
      {key: query.timeField, operator: '<', value: endStr}
    )
  } else if (query.mode === 'redgreen') {
    sql = `SELECT [${query.timeField}], [${query.valueField}] FROM ${table}`
    timeField.push(
      {key: query.timeField, operator: '>', value: startStr},
      {key: query.timeField, operator: '<', value: endStr}
    )
  }
  // sql字符串要用单引号拼接
  if (condition === '') {
    sql = sql + ' where ' + _.map(timeField, item => {
      return ['[' + item.key + ']', item.operator, JSON.stringify(item.value).replace(/"/g, "'")].join(' ')
    }).join(' and ')
  } else {
    _sql = sql + ' where ' + _.map(timeField, item => {
      return ['[' + item.key + ']', item.operator, JSON.stringify(item.value).replace(/"/g, "'")].join(' ')
    }).join(' and ')
    sql = _sql + ' and ' + '(' + _.map(condition, item => {
      return ['[' + item.key + ']', item.operator, JSON.stringify(item.value).replace(/"/g, "'")].join(' ')
    }).join(' or ') + ')'
  }

  log.debug('sql', sql)

  var promise
  if (log.isDebugEnabled()) {
    log.debug({endTime, startTime}, query.timeField, query.valueField)
    var mockData = new Array(24)
    if (query.mode === 'line') {
      mockData = _.map(mockData, item => {
        return {
          [query.timeField]: _.random(+startTime, +endTime)
        }
      })
    } else {
      mockData = _.map(mockData, item => {
        return {
          [query.timeField]: _.random(+startTime, +endTime),
          [query.valueField]: _.random(0, 1)
        }
      })
    }
    promise = Promise.resolve(mockData)
  } else {
    promise = sequelize.query(sql, {type: sequelize.QueryTypes.SELECT})
  }

  // 执行sql查询 根据type参数指定查询的类型
  return promise.then(data => {
    sequelize.close() // 一次性实例, 自动回收
    log.debug('sql data', data)
    if (query.mode === 'line') {
      data = _.map(data, item => {
        return item[query.timeField]
      })
      let zoneCount = 24 // 默认分成24份
      let duration = (endTime - startTime) / zoneCount
      data = _.map(new Array(24), (item, i) => {
        var start = startTime + i * duration
        var end = startTime + (i + 1) * duration
        return _.some(data, item => {
          item = +moment(item)
          return item >= start && item < end
        })
      })
    } else if (query.mode === 'redgreen') {
      let zoneCount = 24 // 默认分成24份
      let duration = (endTime - startTime) / zoneCount
      data = _.map(new Array(24), (item, i) => {
        var start = startTime + i * duration
        var end = startTime + (i + 1) * duration
        // 先选出在一个时间段里面的所有点
        var dotsInZone = _.filter(data, item => {
          var date = item[query.timeField]
          date = new Date(date).toISOString().replace(/T/, ' ').replace(/\..+/, '')
          date = +moment(date)
          // var date = +moment(item[query.timeField])
          return date >= start && date < end
        })
        // 如果有点
        if (!_.isEmpty(dotsInZone)) {
          // 有任何 valueField 为 true 就是画绿色,为false就是红色
          return _.some(dotsInZone, item => {
            if (item[query.valueField] === 1) {
              return true
            } else if (item[query.valueField] === 0) {
              return false
            }
          })
        }
        // 没有点就返回 undefined
      })
      // 将data中值非undefined的对应键存入数组arr
      for (var key in data) {
        var arr = []
        if (data[key] !== undefined) {
          arr.push(key)
        }
      }
      // 把 undefined 填满
      data = _.map(data, (item, i) => {
        if (item === undefined) {
          if (i === 0) { // 没有点就取data数组中最开始有值的相反值
            var key = arr[0]
            return !data[key]
          } else { // 没有点就取上一个值
            return data[i - 1]
          }
        }
        return item
      })
    }
    return data
  }).catch(err => {
    sequelize.close()
    return Promise.reject(err)
  })
}
// 生成线条型图
function generateLineChartOpt(data) {
  var opt = {
    chart: {
      type: 'column'
    },
    credits: {
      enabled: false
    },
    exporting: {
      // 导出一模一样的
      enabled: true,
      scale: 2
    },
    title: {
      text: ''
    },
    plotOptions: {
      column: {
        borderWidth: 0,
        pointWidth: 0.5
      }
    },
    xAxis: {
      categories: _.map(data, (item, i) => {
        return i
      }),
      title: {
        text: ''
      },
      tickColor: '#668B8B'
    },
    yAxis: [{
      tickPositions: [0, 1],
      title: {
        text: '线条型',
        style: {
          color: '#36648B',
          fontSize: '16px'
        },
        rotation: 0,
        x: -20
      },
      lineColor: '#ccd6eb',
      lineWidth: 1,
      labels: {
        enabled: false
      }
    }, {
      tickPositions: [0, 1],
      title: {
        text: ''
      },
      opposite: true,
      lineColor: '#ccd6eb',
      lineWidth: 1,
      labels: {
        enabled: false
      }
    }],
    legend: {
      enabled: false
    },
    series: [{
      data: _.map(data, (item, i) => {
        return item ? 1 : 0
      }),
      color: '#ff0000',
      yAxis: 1
    }]
  }
  return opt
}
// 生成红绿图
function generateRedGreenChartOpt(data) {
  var opt = {
    chart: {
      type: 'column'
    },
    credits: {
      enabled: false
    },
    exporting: {
      // 导出一模一样的
      enabled: true,
      scale: 2
    },
    title: {
      text: ''
    },
    plotOptions: {
      column: {
        borderWidth: 0,
        pointWidth: 20
      }
    },
    xAxis: {
      categories: _.map(data, (item, i) => {
        return i
      }),
      title: {
        text: ''
      },
      tickColor: '#668B8B'
    },
    yAxis: [{
      tickPositions: [0, 1],
      title: {
        text: '在线状态',
        style: {
          color: '#36648B',
          fontSize: '16px'
        },
        rotation: 0,
        x: -25
      },
      lineColor: '#ccd6eb',
      lineWidth: 1,
      labels: {
        enabled: false
      }
    }, {
      tickPositions: [0, 1],
      title: {
        text: ''
      },
      opposite: true,
      lineColor: '#ccd6eb',
      lineWidth: 1,
      labels: {
        enabled: false
      }
    }],
    legend: {
      enabled: false
    },
    series: [{
      data: _.map(data, (item, i) => {
        // true为设备在线，false为设备不在线
        if (item === true) {
          data = {
            'color': '#008B00',
            'y': 1
          }
        } else if (item === false) {
          data = {
            'color': '#ff0000',
            'y': 1
          }
        }
        return data
      }),
      yAxis: 1
    }]
  }
  return opt
}

if (log.isDebugEnabled()) {
  // queryData({
  //     "mode": "line",
  //     "isInterval": false,
  //     "dbHost": "10.211.55.4",
  //     "dbPort": 1433,
  //     // "dbHost": "localhost",
  //     // "dbPort": 1434,
  //     "database": "test",
  //     "dbUser": "sa",
  //     "dbPassword": "alarm",
  //     "tableName": "dbo.TBL_ALARM_DEV_INFO",
  //     "timeField": "updatetime",
  //     "condition": "",
  //     "imgSize": 1000,
  //     "startTime": 1444435200000,
  //     "endTime": 1507593600000
  // }).then(x => {
  //   console.log(x)
  // }).catch(err => {
  //   console.error('err', err)
  // })
}

if (log.isDebugEnabled()) {
  // 测试渲染图片用的
  // renderChartImage({chart: {type: 'column'}}).then(x => {
  //   console.log(77777777, x)
  // }).catch(err => {
  //   console.log(err)
  // })
}

// 导出图片
function renderChartImage (chartOpt, query) {
  return new Promise((resolve, reject) => {
    chartOpt.chart.height = query.imgWidth / 6
    // 导出配置
    var opt = {
      type: 'png',
      width: query.imgWidth,
      scale: 1,
      options: chartOpt
    }
    log.debug('render chart image', opt)
    // 执行导出
    exporter.export(opt, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res.data)
      }
    })
  })
}
