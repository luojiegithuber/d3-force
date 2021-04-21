<template>
    <div id="canvas-container">
<!--       <node-context-menu v-show="isShowContextMenu" ref="contextMenu"></node-context-menu>
 -->
<!-- <button @click="go">123</button> -->
      <div id="d3show" >

        <canvas v-if="isCanvas" width="960" height="500"></canvas>
        <svg v-else id="mainsvg" width="960" height="500" ></svg>
<!-- viewBox="-480 -250 960 500" -->
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
import createArcLayout from '../../src/graph/layout/arcLayout'
import createAdjacentMatrixLayout from '../../src/graph/layout/adjacentMatrixLayout'
import createCircularLayout from '../../src/graph/layout/circularLayout'

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
      // curSelectedNode: null, // 当前选中的节点
      isShowContextMenu: false,

      d3showDIV: null,

      originData: originData,
      isCanvas: false,
      svg: d3.select('#mainsvg'),
      canvas: null,
      layout: 0,

      width: 0,
      height: 0,

      radius: 5, // node的半径大小
      context: null,

      simulation: null, // 力学仿真
      transform: null,
      mainData: null,
      scale: null,

      arcObj: null,
      curSelectedNode: null
    }
  },

  mounted () {
    // createCentric(this.originData, svg)
    /* this.isCanvas = true;
    const canvas = document.querySelector('canvas');
    console.log(canvas)
    console.log(createForceDirectedGraph(this.originData, canvas)) */

    this.d3showDIV = document.getElementById('d3show');
    this.height = this.d3showDIV.clientHeight
    this.width = this.d3showDIV.clientWidth
    this.svg.attr('height', this.height)
    this.svg.attr('width', this.width)
    this.changeLayout(3)
    // console.log(this.$store.state.layoutId)
  },
  beforeCreate () {
    // 兄弟组件传值
    // 监听抽屉的滑动，以免滑梯滑动之后canvas的面积不会被改变
    this.bus.$on('toDiagramForArea', msg => {
      this.upDateDiagramAnimationFrame(0)
    })

    /* this.bus.$on('changeGraphLayout', layoutId => {
      this.changeLayout(layoutId)
    }) */
  },

  watch: {

    '$store.state.layoutId': function (val) {
      console.log('当前的布局ID:', val);
      this.changeLayout(val)
    },
    '$store.state.layoutOrderId': function (val) {
      console.log('当前的布局排序ID:', val);
      this.arcObj.update(this.arcObj.orderFun[val])
    }

  },

  methods: {

    selectedNodeChange (node) {
      this.$store.dispatch('changeNodeFun', node)
    },

    upDateDiagramAnimationFrame (count) {
      count++
      requestAnimationFrame(() => {
        this.myDiagram.requestUpdate()
        if (count < 60) { this.upDateDiagramAnimationFrame(count) }
      })
    },

    changeLayout (layout) {
      if (layout === 7) {
        this.d3showDIV.innerHTML = `
        <canvas width="${this.width}" height="${this.height}"></canvas>
      `
      } else {
        this.d3showDIV.innerHTML = `
       <svg id="mainsvg" width="${this.width}" height="${this.height}" ></svg>
      `
      }

      if (layout === 7) {
        this.isCanvas = true;
        this.$nextTick(() => {
          this.canvas = document.querySelector('canvas');
          createForceDirectedGraph(this.originData, this.canvas)
        });
      } else {
        this.$nextTick(() => {
          this.svg = d3.select('#mainsvg')
          this.isCanvas = false;
          switch (layout) {
            case 1:
              createCentric(this.originData, this.svg)
              break;
            case 2:
              createChordLayout(this.originData, this.svg)
              break;
            case 3:
              this.arcObj = createArcLayout(this.originData, this.svg, this.selectedNodeChange)
              break;
            case 4:
              createAdjacentMatrixLayout(this.originData, this.svg)
              break;
            case 5:
              createCircularLayout(this.originData, this.svg, 0)
              break;
            case 6:
              createCircularLayout(this.originData, this.svg, 0.85)
              break;
            default:
              break;
          }
        });
      }
    }

  }
}
</script>

<style scoped lang='scss'>
@import '../assets/css/common.scss';
#canvas-container{
  flex-grow:1;
  overflow: hidden;
}

#canvas canvas {
  outline: none;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 1);
}

#d3show{
  margin: 0;
  overflow: hidden;
  height:100%;
  width: calc(100vw - 350px)
}

</style>
