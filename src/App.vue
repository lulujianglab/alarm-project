<template>
  <div id="app">
    <Navigation></Navigation>
    <div class="content">
      <!-- <transition> -->
        <!-- 保存路由状态, 注意, 只有 list 保存, detail 不保存 -->
        <!-- <keep-alive :include="/list/i"> -->
          <router-view></router-view>
        <!-- </keep-alive> -->
      <!-- </transition> -->
    </div>
    <Bottom></Bottom>
  </div>
</template>

<script>
import Navigation from '@/components/Navigation'
import Bottom from '@/components/Bottom'

export default {
  name: 'app',
  components: {
    Navigation,
    Bottom
  },
  mounted () {
  },
  methods: {
  }
}
</script>

<style>
@reset-global pc;

body {
  font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif;
  overflow: auto;
  -webkit-font-smoothing: antialiased;
  min-width: 800px;
  font-size: 14px;
  -webkit-tap-highlight-color: rgba(0,0,0,0);
  background-color: #f2f6fe;
}

.inner {
  max-width: 1200px;
  min-width: 700px;
  margin: 0 auto;
  color: #666666;
}

.panel {
  background-color: #fff;
  padding-top: 40px;
  padding-bottom: 40px;
  border-radius: 5px;
}

a {
  text-decoration: none;
}

.button-min-width {
  min-width: 140px;
}
</style>
