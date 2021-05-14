<template>
      <vue-context-menu :contextMenuData="contextMenuData"
        @savedata="savedata"
        @newdata="newdata"></vue-context-menu>
</template>
<script>
export default {
  name: 'app',
  data () {
    return {
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
              fnHandler: 'newdata'
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
    setNodeContextMenu (nodeContextData) {
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
