// 文件的作用是在整个Vue项目中声明:我们要使用Vuex进行状态管理

// 引入
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex);

// 创建Vuex实例
const store = new Vuex.Store({
  state: {
    layoutId: 1,
    layoutOrderId: 1,
    nodeData: null,
    edgeData: null
  },

  mutations: {

    changeLayoutId (state, layoutId) { // 上面定义的state
      state.layoutId = layoutId
    },

    changeLayoutOrderId (state, layoutOrderId) {
      state.layoutOrderId = layoutOrderId
    },

    changeNode (state, node) {
      state.nodeData = node
    }

  },

  // 注册action,类似于Vue里的mothods
  actions: {
    changeLayoutIdFun (context, layoutId) {
      // 接收一个与store实例具有相同方法的属性得到context对象
      context.commit('changeLayoutId', layoutId)
    },

    changeLayoutOrderIdFun (context, layoutOrderId) {
      context.commit('changeLayoutOrderId', layoutOrderId)
    },

    changeNodeFun (context, node) {
      context.commit('changeNode', node)
    }
  }

})

// 导出store
export default store
