import Vue from 'vue'
import Router from 'vue-router'
import DiagramContainer from '@/components/DiagramContainer'
import BloodHome from '@/components/BloodHome'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'DiagramContainer',
      component: DiagramContainer
    },
    {
      path: '/BloodHome',
      name: 'BloodHome',
      component: BloodHome
    }

  ]
})
