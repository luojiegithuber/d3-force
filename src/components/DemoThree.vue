<template>
    <div id="demo3-container">
      <node-context-menu v-show="isShowContextMenu" ref="contextMenu"></node-context-menu>
      <div id="demo3" ref="demo3">
        <canvas width="960" height="600"></canvas>
      </div>
    </div>
</template>

<script>

import NodeContextMenu from './NodeContextMenu'
import * as d3 from '../../static/d3/d3.v6-6-0.min.js'
import data from '../../static/data/miserables.json'
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

      radius: 5, // node的半径大小
      canvas: null,
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
    console.log(data)

    this.initGraph();
  },
  beforeCreate () {
    // 兄弟组件传值
    // 监听抽屉的滑动，以免滑梯滑动之后canvas的面积不会被改变
    this.bus.$on('toDiagramForArea', msg => {
      this.upDateDiagramAnimationFrame(0)
    })
  },

  methods: {

    initGraph () {
      var that = this;

      that.canvas = document.querySelector('canvas');
      that.context = that.canvas.getContext('2d');
      that.width = that.canvas.width;
      that.height = that.canvas.height;
      that.scale = d3.scaleOrdinal(d3.schemeCategory10);
      that.transform = d3.zoomIdentity;
      that.mainData = data;

      that.simulation = d3.forceSimulation(that.mainData.nodes) // 创建一个新的力学仿真.
        .force('link', d3.forceLink(that.mainData.edges).id(function (d) { return d.id })) // 添加或移除一个力模型.
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(that.width / 2, that.height / 2));

      that.simulation
        .nodes(that.mainData.nodes)
        .on('tick', simulationUpdate);

      that.simulation.force('link')
        .links(that.mainData.edges);

      d3.select(that.canvas)
        .call(d3.drag()
          .container(that.canvas)
          .subject(dragsubject)
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended))

        .call(d3.zoom()
          .scaleExtent([1 / 10, 8])
          .on('zoom', zoomed))

      function dragsubject (e) {
        // return simulation.find(e.x, e.y); //找最近的节点
        let i;
        let x = that.transform.invertX(e.x);
        let y = that.transform.invertY(e.y);
        let dx;
        let dy;
        for (i = that.mainData.nodes.length - 1; i >= 0; --i) {
          const node = that.mainData.nodes[i];
          dx = x - node.x;
          dy = y - node.y;

          if (dx * dx + dy * dy < that.radius * that.radius) {
            node.x = that.transform.applyX(node.x);
            node.y = that.transform.applyY(node.y);
            console.log('您拖动了节点', node)
            return node;
          }
        }

        console.log('你拖动了画布')
      }

      function dragstarted (e) {
        // d3.select(that).attr('stroke', 'black');
        if (!e.active) that.simulation.alphaTarget(0.3).restart();
        e.subject.fx = that.transform.invertX(e.x);
        e.subject.fy = that.transform.invertY(e.y);
      }

      function dragged (e) {
        e.subject.fx = that.transform.invertX(e.x);
        e.subject.fy = that.transform.invertY(e.y);
      }

      function dragended (e) {
        if (!e.active) that.simulation.alphaTarget(0);
        e.subject.fx = null;
        e.subject.fy = null;
      }

      function zoomed (e) {
        // console.log('zooming')
        that.transform = e.transform;
        // console.log('transform',transform)
        simulationUpdate();
      }

      function simulationUpdate () {
        // console.log('更新');
        const context = that.context;
        context.save(); // 保存当前环境的状态

        context.clearRect(0, 0, that.width, that.height); // 清空给定矩形内的指定像素
        context.translate(that.transform.x, that.transform.y); // 方法重新映射画布上的 (0,0) 位置
        context.scale(that.transform.k, that.transform.k); // 缩放当前绘图，更大或更小

        that.mainData.edges.forEach(function (d) {
          context.beginPath(); // 起始一条路径，或重置当前路径
          context.moveTo(d.source.x, d.source.y); // 把路径移动到画布中的指定点，不创建线条
          context.lineTo(d.target.x, d.target.y); // 添加一个新点，然后在画布中创建从该点到最后指定点的线条
          context.stroke(); // 绘制已定义的路径
        });

        that.mainData.nodes.forEach((d, i) => {
          context.beginPath();
          context.arc(d.x, d.y, that.radius, 0, 2 * Math.PI, true); // 方法创建弧/曲线（用于创建圆或部分圆）
          context.fillStyle = that.colorNode(d) // 设置或返回用于填充绘画的颜色、渐变或模式。
          context.fill(); // 填充当前绘图（路径）
        });

        context.restore(); // 返回之前保存过的路径状态和属性
      }
    },

    colorNode (node) {
      const nodeColor = this.scale(node.group);
      return nodeColor;
    },

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
