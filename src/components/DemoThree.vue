<template>
    <div id="canvas-container">
      <NodeContextMenu
        ref='NodeContextMenu'
      />

      <CaseList
       @onSelectNode="selectNodeInCase"
        ref="CaseList"
      />
<!--       <node-context-menu v-show="isShowContextMenu" ref="contextMenu"></node-context-menu>
 -->
<!-- <button @click="go">123</button> -->
      <div id="d3show" v-if="!isClearD3Content" :class="isExtend? 'no-expend-div' : 'expend-div'">
        <canvas  v-if="isCanvas"  :width="width" :height="height"></canvas>
        <svg v-else id="mainsvg" :width="width" :height="height" ></svg>
<!-- viewBox="-480 -250 960 500" -->
      </div>

      <div class="caselist-button" @click="open">
          <a-icon type="caret-left" />
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
import { getNodeNextJump } from '@/request/api';// 导入我们的api接口
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
      layoutoption: null, // 关于对一些特定布局的设置，例如径向布局的结点根

      myData: `46 43 1
47 0 1
47 10 1
47 20 1
47 28 1
47 30 1
47 42 1
49 34 1
49 46 1
50 14 1
50 16 1
50 20 1
50 33 1
50 42 1
50 45 1
51 4 1
51 11 1
51 18 1
51 21 1
51 23 1
51 24 1
51 29 1
51 45 1
51 50 1
52 14 1
52 29 1
52 38 1
52 40 1
53 43 1
54 1 1
54 6 1
54 7 1
54 13 1
54 19 1
54 41 1
55 15 1
55 51 1
56 5 1
56 6 1
57 5 1
57 6 1
57 9 1
57 13 1
57 17 1
57 39 1
57 41 1
57 48 1
57 54 1
58 38 1
59 3 1
59 8 1
59 15 1
59 36 1
59 45 1
60 32 1
61 2 1
61 37 1
61 53 1
100 101 1`
    }
  },

  mounted () {
    // this.originData = this.createNewData(this.myData)
    // console.log(this.originData)
    // createCentric(this.originData, svg)
    /* this.isCanvas = true;
    const canvas = document.querySelector('canvas');
    console.log(canvas)
    console.log(createForceDirectedGraph(this.originData, canvas)) */

    this.d3showDIV = document.getElementById('d3show');
    /*     this.height = this.d3showDIV.clientHeight
    this.width = this.d3showDIV.clientWidth */
    this.height = this.d3showDIV.offsetHeight;
    this.width = this.d3showDIV.offsetWidth;
    /* this.height = 500
    this.width = 800 */
    this.svg.attr('height', this.height)
    this.svg.attr('width', this.width)
    /*     this.height = this.d3showDIV.clientHeight
    this.width = this.d3showDIV.clientWidth */

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

    '$store.state.layoutId': function (layoutId) {
      console.log('当前的布局ID:', layoutId);
      this.changeLayout(layoutId)
    },
    '$store.state.layoutOrderId': function (val) {
      // console.log('当前的布局排序ID:', val);
      this.layoutObj.update(this.layoutObj.orderFun[val])
    }

  },

  methods: {

    createNewData (myData) {
      const str = myData;
      const result = str.split('\n').map(item => {
        return item.split(' ')
      })
      console.log(result)

      const obj = {
        nodes: [],
        edges: []
      }

      const nodeMap = {}
      result.forEach((edge, index) => {
        obj.edges.push({
          guid: index,
          source: edge[0],
          target: edge[1]
        })

        if (!nodeMap[edge[0]]) {
          nodeMap[edge[0]] = {guid: edge[0]}
          obj.nodes.push(nodeMap[edge[0]])
        }

        if (!nodeMap[edge[1]]) {
          nodeMap[edge[1]] = {guid: edge[1]}
          obj.nodes.push(nodeMap[edge[1]])
        }
      })

      return obj
    },

    open () {
      this.$refs.CaseList.visible = true
    },

    selectNodeInCase (node) {
      console.log('你选择了节点：', node)
      getNodeNextJump(node).then(res => {
        if (res.message === 'success') {
          this.originData = res.content;
          this.changeLayout(this.$store.state.layoutId);
        }
      })

      /* 访问接口，返回了数据之后 */
      // this.originData = originData // 更新数据
      // this.changeLayout(this.$store.state.layoutId);
    },

    selectedNodeChange (node) {
      this.$store.dispatch('changeNodeFun', node)
    },

    showNodeContextMenu (nodeContextData) {
      console.log('右键', nodeContextData)
      this.$refs.NodeContextMenu.setNodeContextMenu(nodeContextData)
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
          // console.log('111', layoutOption)
          let data = this.originData
          this.layoutObj = selectGraphLayout(layoutId, data, htmlDomSelection, this.selectedNodeChange, layoutOption, this.showNodeContextMenu)
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

.node_context_menu {
  position: absolute;
  height: 100px;
  width: 100px;
  background-color: aqua;
}

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

.caselist-button{
  color:#fff;

  /*垂直居中*/
  display: flex;
  justify-content: center;
  align-items: center;

  width: 20px;
  height: 8%;
  background-color: #d3d3d3;

  position: absolute;
  top:46%;
  left:0;

  z-index:100;

  cursor:pointer;
}
</style>
