import Vue from 'vue'
import Router from 'vue-router'
// import Index from '@/components/Index'
import Query from '@/components/Query'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/line',
      component: Query
    },
    {
      path: '/redgreen',
      component: Query
    },
    {
      path: '/intervalline',
      component: Query
    },
    {
      path: '/intervalredgreen',
      component: Query
    },
    {
      path: '*',
      redirect: '/line'
    }
  ]
})
