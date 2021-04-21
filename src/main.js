// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'

import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'

import store from './vuex/store.js'

Vue.use(Antd)

Vue.config.productionTip = false

Vue.prototype.bus = new Vue()

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>'
})
