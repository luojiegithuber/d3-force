<template>
  <div class="node-context-menu" :style="{ left: x + 'px', top: y + 'px' }">
      <ul class="context-menu" @click="liEntrust" >
          <li >查看血缘</li>
          <li >查看元数据</li>
          <li >复制表名</li>
          <li >添加上游</li>
          <li >添加下游</li>
          <li >删除节点</li>
      </ul>
  </div>
</template>

<script>

export default {

  components: {

  },
  data () {
    return {
      isShow: false,
      x: 0,
      y: 0
    }
  },

  computed: {

  },
  mounted () {
    // 阻止浏览器默认右键的行为
    this.$el.oncontextmenu = () => false
  },
  methods: {

    // 事件委托
    liEntrust (e) {
      this.$parent.isShowContextMenu = false

      let ev = e || window.e
      let target = ev.target || ev.srcElement

      ev.stopPropagation() || (ev.cancelBubble = true)// 阻止事件冒泡
      ev.preventDefault()// 阻止默认事件

      switch (target.innerText) {
        case '查看血缘' :
          this.viewBlood()
          break
        case '查看元数据' :
          this.viewMetadata()
          break
        case '复制表名' :
          this.copyTableName()
          break
        case '添加上游' :
          this.addUpstream()
          break
        case '添加下游' :
          this.addDownstream()
          break
        case '删除节点' :
          this.removeNode()
          break
      }
    },

    // 根据坐标定位
    positioning (x, y) {
      this.x = x
      this.y = y
    },

    viewBlood () {
      console.log('函数——查看血缘')
    },

    viewMetadata () {
      console.log('函数——查看元数据')
    },

    copyTableName () {
      console.log('函数——复制表名')
    },

    addUpstream () {
      console.log('函数——添加上游')
    },

    addDownstream () {
      console.log('函数——添加下游')
    },

    removeNode () {
      console.log('函数——删除节点')
    }

  }
}
</script>

<style scoped lang='scss'>
@import '../assets/css/common.scss';

.node-context-menu{
    //@include box-border(#D3D3D3);
    width:100px;
    position:absolute;

    z-index: 1000;
    box-shadow: 0px 0px 5px 5px rgba($color: #000000, $alpha: 0.1);
}

.context-menu {
    margin:0;
    padding:0;
}

.context-menu li {
    height: 30px;
    width: 100%;
    padding:6px 10px;

    display: block;
    color: #606266;
    background-color: white;
    list-style: none;

    cursor: pointer;
}

.context-menu li:hover {
    background: #e6f6ff;
    color: #00C1DE;
}

</style>
