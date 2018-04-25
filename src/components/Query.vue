<template>
  <div class="inner">
    <div class="panel">
      <div class="form-wrapper">
        <SuperForm :form="form" @submit="onSubmit">
          <template slot-scope="scope" slot="custom">
            <div class="form-item-condition" v-if="scope.item && scope.item.name === 'condition'">
              <el-row
                v-for="item, i in form.data[scope.item.name]"
                :key="i"
                :gutter="20"
                class="form-item-condition-line">
                <el-col :span="9">
                  <el-input v-model="item.key"></el-input>
                </el-col>
                <el-col :span="2">
                  <span class="form-item-condition-operator" v-text="item.operator"></span>
                </el-col>
                <el-col :span="9">
                  <el-input v-model="item.value"></el-input>
                </el-col>
                <el-col :span="4">
                  <el-button icon="el-icon-delete" @click="form.data[scope.item.name].splice(i, 1)"></el-button>
                </el-col>
              </el-row>
              <el-button
                icon="el-icon-plus"
                @click="form.data[scope.item.name].push({key: '', value: '', operator: '='})">新增条件</el-button>
            </div>
          </template>
        </SuperForm>
      </div>
    </div>

    <div class="panel panel-preview" v-show="chartVisible">
      <div id="container" :style="{display: form.data.useImage ? 'none' : 'block'}">
      </div>
      <div class="img-wrapper">
      </div>
    </div>
  </div>
</template>

<script>
import * as share from '@/share'
import SuperForm from '@/components/SuperForm'

const rawFormList = [
  // 暂时无法统一
  {
    label: '定时生成时间',
    name: 'generateTime',
    type: 'time-picker',
    visible: false, // 太复杂了, 暂不支持
    placeholder: '请选择定时生成时间',
    rules: [
      {required: true, message: '请选择定时生成时间', trigger: 'change', type: 'date'}
    ],
    isInterval: true,
    value: new Date(2016, 9, 10, 4, 0) // 默认每天凌晨4点执行
  },
  {
    label: '定时生成间隔',
    name: 'intervalTime',
    type: 'select',
    placeholder: '请选择定时生成间隔',
    rules: [
      {required: true, message: '请选择定时生成间隔', trigger: 'change', type: 'number'}
    ],
    options: [
      {
        value: 24 * 60 * 60 * 1000,
        label: '天'
      },
      {
        value: 60 * 60 * 1000,
        label: '小时'
      },
      {
        value: 60 * 1000,
        label: '分钟'
      }
    ],
    value: 24 * 60 * 60 * 1000, // 默认是天
    isInterval: true
  },
  {
    label: '数据库类型',
    name: 'dialect',
    type: 'select',
    visible: false,
    placeholder: '请选择数据库类型',
    rules: [
      {required: true, message: '请选择数据库类型', trigger: 'change', type: 'string'}
    ],
    options: [],
    value: 'mssql'
  },
  {
    label: '图表格式',
    name: 'useImage',
    visible: false,
    type: 'bool',
    activeText: '使用 image',
    inactiveText: '使用 html',
    value: true
  },
  {
    label: '数据库域名',
    name: 'dbHost',
    type: 'input',
    placeholder: '请输入数据库域名',
    rules: [
      {required: true, message: '请输入数据库域名', trigger: 'blur', type: 'string'}
    ],
    value: ''
  },
  {
    label: '数据库端口',
    name: 'dbPort',
    type: 'input',
    placeholder: '请输入数据库端口',
    rules: [
      {required: true, message: '请输入数据库端口', trigger: 'blur', type: 'number'}
    ],
    value: ''
  },
  {
    label: '数据库',
    name: 'database',
    type: 'input',
    placeholder: '请输入数据库',
    rules: [
      {required: true, message: '请输入数据库', trigger: 'blur', type: 'string'}
    ],
    value: ''
  },
  {
    label: '数据库用户名',
    name: 'dbUser',
    type: 'input',
    placeholder: '请输入数据库用户名',
    rules: [
      {required: true, message: '请输入数据库用户名', trigger: 'blur', type: 'string'}
    ],
    value: ''
  },
  {
    label: '数据库密码',
    name: 'dbPassword',
    type: 'input',
    placeholder: '请输入数据库密码',
    rules: [
      {required: true, message: '请输入数据库密码', trigger: 'blur', type: 'string'}
    ],
    value: ''
  },
  {
    label: '表',
    name: 'tableName',
    type: 'input',
    placeholder: '请输入表',
    rules: [
      {required: true, message: '请输入表', trigger: 'blur', type: 'string'}
    ],
    value: ''
  },
  {
    label: '属性字段',
    name: 'valueField',
    type: 'input',
    value: '',
    placeholder: '请输入属性字段',
    mode: 'redgreen',
    rules: [
      {required: true, message: '请输入属性字段', trigger: 'blur', type: 'string'}
    ]
  },
  {
    label: '时间字段',
    name: 'timeField',
    type: 'input',
    placeholder: '请输入时间字段',
    rules: [
      {required: true, message: '请输入时间字段', trigger: 'blur', type: 'string'}
    ],
    value: ''
    // isInterval: false
  },
  {
    label: '时间范围',
    name: 'timeRange',
    type: 'datetimerange',
    value: []
  },

  {
    label: '绿色字段值',
    name: 'greenValue',
    type: 'input',
    value: '',
    mode: 'redgreen'
  },
  {
    label: '红色字段值',
    name: 'redValue',
    type: 'input',
    value: '',
    mode: 'redgreen'
  },
  {
    label: '限制条件',
    name: 'condition',
    type: 'custom',
    value: []
  },
  {
    label: '生成图片尺寸宽度',
    name: 'imgWidth',
    type: 'input',
    value: ''
  }
]

function loadImage (url) {
  var img = new Image()
  var $img = $(img)
  return new Promise((resolve, reject) => {
    $img.on('load', e => {
      resolve(img)
    })
    $img.on('error', e => {
      reject(new Error('load fail'))
    })
    setTimeout(() => {
      $img.off('load').off('error')
      reject(new Error('timeout'))
    }, 10 * 1000)
    img.src = url
  })
}

export default {
  data () {
    return this.getData()
  },
  created () {
    window.app = this // for debug
    this.init()
  },
  watch: {
    $route () {
      this.init()
    }
  },
  methods: {
    useImage () {
      return this.form.data.useImage
    },
    getMode () {
      var path = this.$route.path
      var mode = 'line'
      if (/redgreen/i.test(path)) {
        mode = 'redgreen'
      }
      return mode
    },
    getInterval () {
      var path = this.$route.path
      if (/interval/.test(path)) {
        return true
      }
      return false
    },
    onSubmit () {
      var button = this.form.buttonList[0]
      button.loading = true
      this.chartVisible = false
      var data = this.normalizeForm()
      // 使用 get 接口方便调试和返回图片
      console.log('submit', data)
      var path
      if (this.mode === 'line') {
        path = '/line'
      } else if (this.mode === 'redgreen') {
        path = '/redgreen'
      }
      if (this.useImage()) {
        path += '.png'
      }
      var url = path + '?' + $.param(data) // 线上用相对路径
      if (process.env.NODE_ENV !== 'production') {
        // 开发模式
        url = `//${location.hostname}:${process.env.SERVER_PORT}` + url
      }
      console.log('url', url)
      var promise
      if (data.isInterval) {
        promise = share.handler($.ajax({
          url: url
        }), this, {raw: true}).then(data => {
          this.$message({
            message: data.errmsg,
            type: 'success'
          })
        })
      } else {
        promise = loadImage(url).then(img => {
          this.chartVisible = true
          $('.img-wrapper').empty().append(img)
        })
      }
      return promise.catch(e => {
        this.$message({
          message: e.message,
          type: 'error'
        })
      }).then(() => {
        button.loading = false
      })
      // return share.handler(p, this).then(data => {
      //   var message = '提交成功'
      //   this.$message({
      //     message: message,
      //     type: 'success'
      //   })
      //   this.renderChart(data)
      // }).catch(e => {
      //   console.error('submit fail', e)
      // }).then(() => {
      //   button.loading = false
      // })
    },
    // renderChart (data) {
    //   console.log('render chart', data.chartOpt)
    //   this.chartVisible = true // 顺序不能错
    //   setTimeout(() => {
    //     this.chartImage = 'data:image/png;base64,' + data.chartImage
    //     Highcharts.chart('container', data.chartOpt)
    //   })
    // },
    normalizeForm () {
      var data = _.extend({mode: this.mode, isInterval: this.isInterval, _: _.now()}, this.form.data)
      data = _.cloneDeep(data)
      data.timeRange = _.map(data.timeRange, date => {
        if (date) {
          return date.getTime()
        }
      })
      data.condition = _.filter(data.condition, item => {
        return item.value && item.key
      })
      data.startTime = data.timeRange[0]
      data.endTime = data.timeRange[1]
      delete data.timeRange
      return data
    },
    getData () {
      var ret = {
        form: {
          labelWidth: '160px',
          labelSuffix: '：',
          list: [],
          buttonList: [
            {
              action: 'submit',
              text: '提交',
              type: 'primary',
              loading: false,
              disabled: false
            }
          ],
          data: {}
        },
        dialectOptions: _.map('mssql mysql postgres sqlite'.split(' '), item => {
          return {label: item, value: item}
        }),
        mode: '', // line 或者 redgreen
        isInterval: false,
        chartVisible: false,
        chartImage: null
      }
      return ret
    },
    init () {
      this.mode = this.getMode()
      this.isInterval = this.getInterval()
      this.form.list = _.filter(rawFormList, item => {
        if (item.mode) {
          if (this.mode === item.mode) {
            return true
          }
          return false
        }
        return true
      })
      this.form.list = _.filter(this.form.list, item => {
        if (item.isInterval != null) {
          if (this.isInterval === item.isInterval) {
            return true
          }
          return false
        }
        return true
      })
      var formItem = _.find(this.form.list, item => {
        return item.name === 'dialect'
      })
      if (formItem) {
        formItem.options = this.dialectOptions
      }
      this.form.data = share.getFormData(this.form.list)
      this.mockData()
    },
    mockData () {
      // 模拟数据库数据
      // _.extend(this.form.data, {
      //   // "dbHost": "localhost",
      //   // "dbPort": 1434,
      //   dbHost: '10.211.55.4',
      //   dbPort: 1433,
      //   database: 'test',
      //   tableName: 'dbo.TBL_ALARM_DEV_INFO',
      //   dbUser: 'sa',
      //   dbPassword: 'alarm',
      //   timeField: 'updatetime',
      //   condition: [{key: 'netnode_id', value: '020', operator: '='}],
      //   timeRange: [new Date('2016-10-10'), new Date('2017-10-10')],
      //   imgWidth: 800
      // })

      // 模拟线条型数据
      _.extend(this.form.data, {
        dbHost: '192.168.1.12',
        dbPort: 1433,
        database: 'alarmos',
        tableName: 'dbo.TBL_ALARM_DEV_INFO',
        dbUser: 'sa',
        dbPassword: 'telesound_1',
        timeField: 'updatetime',
        // valueField: 'on_off_line_flag',
        // greenValue: 1,
        // redValue: 0,
        // condition: 'netnode_id=NET%',
        condition: [{key: 'netnode_id', value: 'NET000060', operator: '='}],
        timeRange: [new Date('2016-10-10'), new Date('2017-10-10')],
        imgWidth: 800
      })

      // 模拟红绿图数据
      // _.extend(this.form.data, {
      //   dbHost: '192.168.1.12',
      //   dbPort: 1433,
      //   database: 'cc',
      //   tableName: 'dbo.TBL_ON_OFF_line_Info',
      //   dbUser: 'sa',
      //   dbPassword: 'telesound_1',
      //   timeField: 'on_off_line_time',
      //   valueField: 'on_off_line_flag',
      //   greenValue: 1,
      //   redValue: 0,
      //   // condition: 'Dev_id=02019121',
      //   condition: 'Dev_id=020%',
      //   timeRange: [new Date('2016-11-20'), new Date('2016-11-21')],
      //   imgWidth: 800
      // })
    }
  },
  components: {
    SuperForm
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.form-wrapper {
  width: 600px;
  margin: 0 auto;
}
.panel {
  margin: 55px 0;
}
.panel-preview {
  text-align: center;
}
img {
  max-width: 100%;
}
.form-item-condition {
  display: inline-block;
}
.form-item-condition-operator {
  text-align: center;
  display: inline-block;
  width: 100%;
}
.form-item-condition-line {
  margin-bottom: 10px;
}
</style>
