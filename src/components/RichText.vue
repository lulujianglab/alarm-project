<template>
  <div class="rich-text">
    <component
      :is="item.tag || 'span'"
      :id="item.id"
      :class="item.class"
      :style="item.style"
      :src="item.src"
      :href="item.href || 'javascript:;'"
      @click="onClick(item)"
      v-for="item, i in formatText(text)"
      :key="i"
      v-text="item.text">
    </component>
  </div>
</template>

<script>
export default {
  props: ['text'],
  data () {
    return {
    }
  },
  mounted () {
  },
  methods: {
    onClick (item) {
      this.$emit('click', item)
    },
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
    }
  }
}
</script>

<style>
.rich-text {
  img {
    height: 20px;
    width: 20px;
    vertical-align: middle;
  }
}
</style>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.rich-text {
  display: inline;
}
</style>
