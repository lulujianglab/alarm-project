<template>
  <div class="footer">
    <p class="footer-content" v-text="copyRight"></p>
    <!-- <p class="footer-content" >隐私权政策 京ICP证080047号</p> -->
  </div>
</template>

<script>
export default {
  data () {
    return {
      currentYear: new Date().getFullYear()
    }
  },
  computed: {
    copyRight () {
      var currentYear = this.currentYear
      return `Copyright © 2005 - ${currentYear} 北京声迅电子股份有限公司 All Rights Reserved`
    }
  }
}
</script>

<style scoped>
.footer{
  width: 100%;
  background: #3a3a3a;
  text-align: center;
  box-sizing: border-box;
  font-size: 14px;
  padding: 30px 0;
  &-content{
    color: white;
  }
  z-index: 100;
}
</style>
