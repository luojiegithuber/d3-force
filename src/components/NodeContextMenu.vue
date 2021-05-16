<template>
      <vue-context-menu :contextMenuData="contextMenuData"
        @savedata="savedata"
        @getNodeNextJump="getNodeNextJump"></vue-context-menu>
</template>
<script>
import { getNodeNextJump } from '@/request/api';// 导入我们的api接口
export default {
  name: 'app',
  data () {
    return {
      node: null,
      // contextmenu data (菜单数据)
      contextMenuData: {
        // the contextmenu name(@1.4.1 updated)
        menuName: 'demo',
        // The coordinates of the display(菜单显示的位置)
        axis: {
          x: null,
          y: null
        },
        // Menu options (菜单选项)
        menulists: [{
          fnHandler: 'savedata', // Binding events(绑定事件)
          btnName: '控制台打印节点信息' // The name of the menu option (菜单名称)
        }, {
          btnName: '扩展',
          children: [
            {
              btnName: '全部类型',
              fnHandler: 'getNodeNextJump'
            },
            {
              btnName: 'A类型',
              fnHandler: 'newdata'
            },
            {
              btnName: 'B类型',
              fnHandler: 'newdata'
            }
          ]

        }]
      }
    }
  },
  methods: {
    getNodeNextJump () {
      getNodeNextJump(this.node.data).then(res => {
        if (res.message === 'success') {
          console.log('新取得的数据', res.content)
          this.bus.$emit('addNewGraph', {
            node: this.node,
            newGraph: res.content
          })
        }
      })
    },

    setNodeContextMenu (nodeContextData) {
      this.node = nodeContextData.node;
      var x = nodeContextData.position[0];
      var y = nodeContextData.position[1];
      // Get the current location
      this.contextMenuData.axis = {
        x, y
      }
    },
    savedata () {
      alert(1)
    },
    newdata () {
      console.log('newdata!')
    }
  }
}
</script>

<style>
.vue-contextmenu-listWrapper {
  padding: 0;
}

ul{
  display: block;
  padding: 0;
}

.btn-wrapper-simple{
  height: 25px;
}

.no-child-btn{
  display: block;
  height: 25px !important;
}

</style>
