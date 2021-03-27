<template>
    <div id="demo3-container">
      <node-context-menu v-show="isShowContextMenu" ref="contextMenu"></node-context-menu>
      <div id="demo3" ref="demo3"></div>
    </div>
</template>

<script>

import NodeContextMenu from './NodeContextMenu'
import * as d3 from '../../static/d3/d3.v6-6-0.min.js'
export default {
  name: 'demo3',
  components: {

    NodeContextMenu

  },
  data () {
    return {
      myDiagram: null,
      modelData: [], // 节点数据
      modelLinks: [], // 连线数据
      treeStructure: [], // 树结构映射
      curSelectedNode: null, // 当前选中的节点
      isShowContextMenu: false
    }
  },

  mounted () {
    console.log(d3)
  },
  beforeCreate () {
    // 兄弟组件传值
    // 监听抽屉的滑动，以免滑梯滑动之后canvas的面积不会被改变
    this.bus.$on('toDiagramForArea', msg => {
      this.upDateDiagramAnimationFrame(0)
    })
  },

  methods: {

    upDateDiagramAnimationFrame (count) {
      count++
      requestAnimationFrame(() => {
        this.myDiagram.requestUpdate()
        if (count < 60) { this.upDateDiagramAnimationFrame(count) }
      })
    }

  }
}
</script>

<style scoped lang='scss'>
@import '../assets/css/common.scss';
#demo3-container{
  flex-grow:1;
}

#demo3{
  //@include box-border;
  // @include big-box;
  height:100%;
  flex-grow:1;
  background-color: #fff;
}

#demo3 canvas {
  outline: none;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 1);
}

</style>
