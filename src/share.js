import Vue from 'vue'

export const eventHub = new Vue()

export const getFormData = formList => {
  var data = {}
  _.each(formList, item => {
    data[item.name] = item.value
  })
  return data
}

export const handler = (promise, ctx, opt) => {
  opt = _.extend({silent: false, raw: false}, opt)
  return Promise.resolve(promise).then(json => {
    if (json.errno === 0) {
      if (opt.raw) {
        return json
      } else {
        return json.data
      }
    } else {
      throw new Error(json.errmsg || '未知错误')
    }
  }).catch(err => {
    console.log('error', err)
    var message = err.message
    if (!message) {
      var statusText = err.statusText
      if (statusText) {
        // 网络错误
        message = `网络错误: ${statusText}`
      }
    }
    if (!opt.silent) {
      // 最好还能加上 is active
      ctx.$message({
        message: message,
        type: 'error'
      })
    }
    throw err // 保证依然是 error 输出
  })
}
