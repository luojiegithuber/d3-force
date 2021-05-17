<template>
      <vue-context-menu :contextMenuData="contextMenuData"
        @checkNode="checkNode"
        @shrinkNode="shrinkNode"
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
          fnHandler: 'checkNode', // Binding events(绑定事件)
          btnName: '查看节点信息' // The name of the menu option (菜单名称)
        }, {
          fnHandler: 'shrinkNode',
          btnName: '收缩'
        }, {
          btnName: '扩展',
          children: [
            {
              btnName: '全部类型',
              fnHandler: 'getNodeNextJump'
            }
          ]

        }]
      }
    }
  },
  methods: {
    getNodeNextJump () {
      if (this.node.isExpandChildren) {
        // 如果之前请求过节点了，那就不需要再请求，直接用现成的
        console.log('已经请求过该节点，直接扩展')
        this.bus.$emit('addNewGraph', {
          node: this.node,
          newGraph: {
            nodes: this.node.isExpandChildNode,
            edges: this.node.isExpandChildLink
          }
        })
        return;
      }
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

    shrinkNode () {
      this.bus.$emit('shrinkNode', this.node)
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
    checkNode () {
      console.log(this.node)
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
