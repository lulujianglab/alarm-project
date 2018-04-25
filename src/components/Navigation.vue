<template>
  <div>
    <!-- 导航栏 -->
    <el-menu
      mode="horizontal"
      background-color="#545c64"
      text-color="#fff"
      active-text-color="#ffd04b"
      :default-active="currentPath"
      router
    >
      <div class="inner">
        <div class="nav-left">
          <el-menu-item index="/" class="logo no-active-nav no-padding">
            <template slot="title">
              <router-link to="/index">
                <img src="../assets/logo.png">
                <span>报警系统</span>
              </router-link>
            </template>
          </el-menu-item>
        </div>

        <div class="nav-center">
          <el-menu-item index="/line">
            线条型图
          </el-menu-item>
          <el-menu-item index="/redgreen">
            红绿图
          </el-menu-item>
          <el-menu-item index="/intervalline">
            线条型图定时生成接口
          </el-menu-item>
          <el-menu-item index="/intervalredgreen">
            红绿图定时生成接口
          </el-menu-item>
        </div>
      </div>
    </el-menu>
  </div>
</template>

<script>

export default {
  name: 'app',
  data () {
    window.app = this
    return {
      currentPath: this.$route.path
    }
  },
  watch: {
    '$route' (to, from) {
      this.currentPath = to.path
    }
  },
  methods: {
  },
  created () {
  }
}
</script>

<style>
</style>

<style scoped>
.el-menu {
  text-align: center;
}

.nav-left {
  float: left;
}

.nav-center {
  display: inline-block;
  text-align: center;
}

.nav-left, .nav-right {
  text-align: left;
}

.nav-center .el-menu-item, .nav-center .el-submenu {
  float: none;
  display: inline-block;
  text-align: left;
}

.logo {
  color: #fff !important;
  font-size: 18px;
  font-weight: bold;
  img {
    /* 需要写死不然IE10有问题 */
    height: 29px;
    width: auto !important;
    vertical-align: middle !important;
    position: relative;
  }
}
</style>
