<template>
  <div>
    <!-- 字段统一使用大驼峰, 不用中划线 -->
    <el-form
      :inline="form.inline"
      @submit.native.prevent="onEnter()"
      ref="form"
      :model="form.data"
      :label-position="form.labelPosition"
      :label-width="form.labelWidth"
      :label-suffix="form.labelSuffix">
      <!-- 用来触发回车提交 -->
      <button type="submit" style="display: none">提交</button>
      <el-form-item
        v-for="item, i in form.list"
        v-if="item.visible !== false"
        :label="item.label"
        :key="i"
        :prop="item.name"
        :error="item.error"
        :show-message="item.showMessage"
        :rules="item.rules"
        :required="item.required"
        :ref="item.name"
      >

        <el-select
          v-if="item.type === 'select'"
          v-model="form.data[item.name]"
          :disabled="item.disabled"
          :multiple="item.multiple"
          :clearable="item.clearable"
          :filterable="item.filterable"
          :placeholder="item.placeholder">
          <el-option
            v-for="item, i in item.options"
            :key="i"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>

        <el-cascader
          v-else-if="item.type === 'cascader'"
          style="width: 100%"
          expand-trigger="hover"
          :clearable="item.clearable"
          :filterable="item.filterable"
          :disabled="item.disabled"
          :options="item.options"
          v-model="form.data[item.name]">
        </el-cascader>

        <el-radio-group
          v-else-if="item.type === 'radio'"
          v-model="form.data[item.name]"
          :disabled="item.disabled">
          <el-radio
            v-for="item, i in item.options"
            :key="i"
            :label="item.value">{{item.label}}
          </el-radio>
        </el-radio-group>

        <el-checkbox-group
          v-else-if="item.type === 'checkbox'"
          v-model="form.data[item.name]"
          :disabled="item.disabled">
          <el-checkbox
            v-for="item, i in item.options"
            :key="i"
            :label="item.value">
            <RichText :text="item.label" @click="onClickText"></RichText>
          </el-checkbox>
        </el-checkbox-group>

        <el-date-picker
          v-else-if="item.type === 'date-picker'"
          type="date"
          :placeholder="item.placeholder"
          v-model="form.data[item.name]"
          :disabled="item.disabled">
        </el-date-picker>

        <el-time-picker
          v-else-if="item.type === 'time-picker'"
          type="date"
          :placeholder="item.placeholder"
          v-model="form.data[item.name]"
          :disabled="item.disabled">
        </el-time-picker>

        <el-date-picker
          v-else-if="item.type === 'daterange'"
          v-model="form.data[item.name]"
          type="daterange"
          align="right"
          :unlink-panels="item.unlinkPanels"
          :range-separator="item.rangeSeparator || '至'"
          :start-placeholder="item.startPlaceholder || '开始日期'"
          :end-placeholder="item.endPlaceholder || '结束日期'"
          :picker-options="item.pickerOptions || []">
        </el-date-picker>

        <el-date-picker
          v-else-if="item.type === 'datetimerange'"
          v-model="form.data[item.name]"
          type="datetimerange"
          align="right"
          :unlink-panels="item.unlinkPanels"
          :range-separator="item.rangeSeparator || '至'"
          :start-placeholder="item.startPlaceholder || '开始日期'"
          :end-placeholder="item.endPlaceholder || '结束日期'"
          :picker-options="item.pickerOptions || []">
        </el-date-picker>

        <el-checkbox
          v-else-if="item.type === 'bool' && item.tag === 'checkbox'"
          v-model="form.data[item.name]"
          :disabled="item.disabled">
        </el-checkbox>

        <el-switch
          v-else-if="item.type === 'bool'"
          v-model="form.data[item.name]"
          :disabled="item.disabled"
          :active-text="item.activeText"
          :inactive-text="item.inactiveText">
        </el-switch>

        <!-- el-upload 的 model 就是 file-list, 格式是 [{name: '', url: ''}] -->
        <el-upload
          v-else-if="item.type === 'upload'"
          :auto-upload="item.autoUpload"
          :before-upload="item.beforeUpload || function() {emitUpload('before-upload', item, arguments)}"
          :on-success="function() {emitUpload('success', item, arguments)}"
          :on-change="function() {emitUpload('change', item, arguments)}"
          :on-preview="function() {emitUpload('preview', item, arguments)}"
          :on-remove="function() {emitUpload('remove', item, arguments)}"
          :on-error="function() {emitUpload('error', item, arguments)}"
          :on-progress="function() {emitUpload('progress', item, arguments)}"
          :with-credentials="item.withCredentials"
          :multiple="item.multiple"
          :disabled="item.disabled"
          :drag="item.drag"
          :list-type="item.listType"
          :accept="item.accept"
          :action="item.action || 'javascript:;'"
          :file-list="form.data[item.name]">
          <i class="el-icon-plus uploader-icon"></i>
<!--           <div class="preview" v-if="form.data[item.name] && form.data[item.name].length && item.previewImage">
            <img
              v-for="item, i in form.data[item.name]"
              :alt="item.name"
              :title="item.name"
              :src="item.url">
          </div> -->
        </el-upload>

        <el-input
          v-else-if="item.type === 'textarea'"
          type="textarea"
          :rows="3"
          :placeholder="item.placeholder"
          v-model="form.data[item.name]"
          :disabled="item.disabled">
        </el-input>

        <span
          v-else-if="item.type === 'text'"
          v-text="form.data[item.name]"
        ></span>

        <el-autocomplete
          v-else-if="item.fetchSuggestions"
          v-model="form.data[item.name]"
          :disabled="item.disabled"
          :fetch-suggestions="item.fetchSuggestions"
          :trigger-on-focus="item.triggerOnFocus"
          :placeholder="item.placeholder"
        ></el-autocomplete>

        <slot
          v-else-if="item.type === 'custom'"
          name="custom"
          :item="item"
          :value="form.data[item.name]"
        >自定义表单</slot>

        <!-- 默认值是 input text, type: "input" -->
        <el-input
          v-else
          v-model="form.data[item.name]"
          :disabled="item.disabled"
          :placeholder="item.placeholder"></el-input>

        <!-- 富文本结构 -->
        <p class="el-form-item-tips" v-if="item.tips">
          <RichText :text="item.tips" @click="onClickText"></RichText>
        </p>

      </el-form-item>

      <el-form-item>
        <el-button
          v-for="item, i in form.buttonList"
          :key="i"
          :type="item.type"
          @click="onClick(item)"
          :icon="item.icon"
          :loading="item.loading"
          :disabled="item.disabled"
          :class="Object.assign({'button-min-width': true}, item.class)"
        >{{item.text}}</el-button>
      </el-form-item>

    </el-form>
  </div>
</template>

<script>
import RichText from '@/components/RichText'

export default {
  props: ['form'],
  data () {
    return {
    }
  },
  methods: {
    formatText (text) {
      // 可展示富文本
      var arr
      if (text == null || text === '') {
        arr = []
      }
      if (_.isArray(text)) {
        arr = text
      } else {
        arr = [text]
      }
      arr = _.map(text, item => {
        if (_.isString(item)) {
          item = {
            text: item
          }
        }
        return item
      })
      return arr
    },
    emitUpload (type, item, args) {
      if (type === 'change' || type === 'remove') {
        var ref = _.first(this.$refs[item.name])
        if (ref) {
          setTimeout(() => {
            // remove 会延迟
            ref.validate('change') // 手动触发 change, 因此前面不需要判断是否有 change rules
          })
        }
      }
      var arr = ['upload', type, item].concat(_.slice(args))
      this.$emit.apply(this, arr)
    },
    onEnter () {
      if (this.form.submitOnEnter) {
        this.onClick({
          action: 'submit'
        })
      }
    },
    onClick (item) {
      if (item.action === 'submit') {
        var formEl = this.$refs['form']
        formEl.validate(valid => {
          if (valid) {
            this.$emit(item.action, this.form.data, item)
          } else {
            this.$emit('error', {
              action: item.action,
              type: 'validate'
            })
          }
        })
      } else {
        this.$emit(item.action, this.form.data)
      }
    },
    onClickText (item) {
      this.$emit('clickText', item)
    }
  },
  mounted () {
    window.form = this.$refs.form
  },
  components: {RichText}
}
</script>

<style>
.el-upload {
  text-align: left !important;
}
</style>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.uploader-icon {
  font-size: 22px;
  color: #c5c5c5;
  width: trans(60);
  height: trans(60);
  line-height: trans(60);
  text-align: center;

  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.el-form-item-tips {
  color: #999999;
  font-size: 12px;
  line-height: 1;
  margin-top: 5px;
  padding-top: 4px;
  top: 100%;
  display: block;
}
.el-select, .el-autocomplete, .el-date-editor--datetimerange, .el-date-editor {
  width: 100%;
}
.preview {
  margin-top: 10px;
  img {
    height: trans(60);
  }
  .img-round {
    border-radius: 50%;
  }
  img+img {
    margin-left: trans(26);
  }
}
</style>
