<template>
    <div id="canvas-container">
      <!-- <CaseList></CaseList> -->
<!--       <node-context-menu v-show="isShowContextMenu" ref="contextMenu"></node-context-menu>
 -->
<!-- <button @click="go">123</button> -->
      <div id="d3show" v-if="!isClearD3Content" :class="isExtend? 'no-expend-div' : 'expend-div'">
        <canvas  v-if="isCanvas"  :width="width" :height="height"></canvas>
        <svg v-else id="mainsvg" :width="width" :height="height" ></svg>
<!-- viewBox="-480 -250 960 500" -->
      </div>
    </div>
</template>

<script>

import NodeContextMenu from './NodeContextMenu'
import CaseList from './SearchSelectCase/CaseList'
import originDataNode from '../../static/data/huaweinode.json'
import originDataEdge from '../../static/data/huaweiedge.json'
import originData from '../../static/data/huawei.json'
// import '../../static/d3/d3-canvas-transition.min.js'
import * as d3 from '../../static/d3/d3.v6-6-0.min.js'
import selectGraphLayout from '../graph/layout/selectGraphLayout.ts'

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
    CaseList,
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

      isClearD3Content: false,

      /*       originData: {
        nodes: originDataNode,
        edges: originDataEdge
      }, */
      originData: originData,
      isCanvas: false,
      svg: d3.select('#mainsvg'),
      canvas: null,
      layout: 0,

      isExtend: true,

      width: 0,
      height: 0,

      radius: 5, // node的半径大小
      context: null,

      simulation: null, // 力学仿真
      transform: null,
      mainData: null,
      scale: null,

      layoutObj: null,
      curSelectedNode: null,
      layoutoption: null // 关于对一些特定布局的设置，例如径向布局的结点根
    }
  },

  mounted () {
    // createCentric(this.originData, svg)
    /* this.isCanvas = true;
    const canvas = document.querySelector('canvas');
    console.log(canvas)
    console.log(createForceDirectedGraph(this.originData, canvas)) */

    this.d3showDIV = document.getElementById('d3show');
    /*     this.height = this.d3showDIV.clientHeight
    this.width = this.d3showDIV.clientWidth */
    this.height = 500
    this.width = 800
    // this.svg.attr('height', this.height)
    // this.svg.attr('width', this.width)
    const defaultLayoutId = 10;
    this.$store.dispatch('changeLayoutIdFun', defaultLayoutId)

    // console.log(this.$store.state.layoutId)
  },
  beforeCreate () {
    // 兄弟组件传值
    // 监听抽屉的滑动，以免滑梯滑动之后canvas的面积不会被改变
    this.bus.$on('toDiagramForArea', isExtend => {
      this.isExtend = isExtend
      // this.upDateDiagramAnimationFrame(0)
    })

    this.bus.$on('changeLayoutOption', layoutOption => {
      this.layoutOption = layoutOption;
      this.changeLayout(this.$store.state.layoutId, layoutOption);
    })
  },

  watch: {

    '$store.state.layoutId': function (val) {
      console.log('当前的布局ID:', val);
      this.changeLayout(val)
    },
    '$store.state.layoutOrderId': function (val) {
      console.log('当前的布局排序ID:', val);
      this.layoutObj.update(this.layoutObj.orderFun[val])
    }

  },

  methods: {

    selectedNodeChange (node) {
      this.$store.dispatch('changeNodeFun', node)
    },

    /* upDateDiagramAnimationFrame (count) {
      count++
      requestAnimationFrame(() => {
        this.myDiagram.requestUpdate()
        if (count < 60) { this.upDateDiagramAnimationFrame(count) }
      })
    }, */

    changeLayout (layoutId, layoutOption) {
      this.$store.dispatch('changeNodeFun', {})
      this.isClearD3Content = true;
      this.$nextTick(() => {
        this.isClearD3Content = false;
        this.isCanvas = this.isCanvasLayout(layoutId);
        this.$nextTick(() => {
          const htmlDomSelection = this.isCanvasLayout(layoutId) ? document.querySelector('canvas') : d3.select('#mainsvg')
          console.log('111', layoutOption)
          this.layoutObj = selectGraphLayout(layoutId, this.originData, htmlDomSelection, this.selectedNodeChange, layoutOption)
        })
      })
      ;
    },

    isCanvasLayout (layoutId) {
      return layoutId === 7 || layoutId === 8
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
  border: 1px solid black;
}

.expend-div{
  width: 97vw;
  animation: extend 1s ;
}

.no-expend-div{
  width: calc(97vw - 350px);
  animation: shrink 1s ;
}

@keyframes shrink {
    0% {width: 97vw;}
    100% {width: calc(97vw - 350px);}
}

@keyframes extend {
    0% {width: calc(97vw - 350px);}
    100% {width: 97vw;}
}
</style>
