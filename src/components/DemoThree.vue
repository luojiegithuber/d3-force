<template>
    <div id="canvas-container">
      <node-context-menu v-show="isShowContextMenu" ref="contextMenu"></node-context-menu>
      <div id="canvas" ref="canvas">
        <button @click="changeLayout(1)">同心圆</button>
        <button @click="changeLayout(2)">弦图</button>
        <button @click="changeLayout(3)">力导向</button>
        <canvas v-if="isCanvas" width="960" height="500"></canvas>
        <svg v-else id="mainsvg" width="960" height="500" viewBox="-480 -250 960 500"></svg>

      </div>
    </div>
</template>

<script>

import NodeContextMenu from './NodeContextMenu'
import originData from '../../static/data/huawei.json'
// import '../../static/d3/d3-canvas-transition.min.js'
import * as d3 from '../../static/d3/d3.v6-6-0.min.js'
import createCentric from '../../src/graph/layout/concentric'
import createChordLayout from '../../src/graph/layout/chordLayout'
import createForceDirectedGraph from '../../src/graph/layout/force'
// import * as d3 from '../../static/d3/d3.min.js'

// var d31 = require('d3')
// var d31 = require('../../static/d3/d3.min.js')
// var d32 = require('../../static/d3/d3-canvas-transition.js')
/* var d32 = require('d3-canvas-transition')
var d3Collection = require('../../static/d3/d3-collection.js')
var d3Selection = require('../../static/d3/d3-selection.js') */
// var d3Selection2 = Object.assign({}, d3Collection, d3Selection);
// console.log(d3)
// console.log(d32)
// var d3 = Object.assign({}, d31, d32);
/* var d3Other = Object.assign({}, d32, d3Collection, d3Selection);
console.log(d3Other);
console.log(d3Collection);
console.log(d3Selection); */
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
      isShowContextMenu: false,

      originData: originData,
      isCanvas: false,
      svg: null,
      canvas: null,
      layout: 0,

      radius: 5, // node的半径大小
      context: null,
      width: 0,
      height: 0,
      simulation: null, // 力学仿真
      transform: null,
      mainData: null,
      scale: null
    }
  },

  mounted () {
    this.svg = d3.select('#mainsvg');

    // createCentric(this.originData, svg)
    /* this.isCanvas = true;
    const canvas = document.querySelector('canvas');
    console.log(canvas)
    console.log(createForceDirectedGraph(this.originData, canvas)) */

    this.changeLayout(1)
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
    },

    changeLayout (layout) {
      d3.select('#mainsvg').selectAll('*').remove();
      this.isCanvas = false;
      switch (layout) {
        case 1:
          createCentric(this.originData, this.svg)
          break;
        case 2:
          createChordLayout(this.originData, this.svg)
          break;
        case 3:
          this.isCanvas = true;
          this.$nextTick(() => {
            this.canvas = document.querySelector('canvas');
            createForceDirectedGraph(this.originData, this.canvas)
          });
          break;
        default:
          break;
      }
    }

  }
}
</script>

<style scoped lang='scss'>
@import '../assets/css/common.scss';
#canvas-container{
  flex-grow:1;
}

#canvas{
  //@include box-border;
  // @include big-box;
  height:100%;
  flex-grow:1;
  background-color: #fff;
}

#canvas canvas {
  outline: none;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 1);
}

</style>
