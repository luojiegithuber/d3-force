import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';
import * as dagreD3 from '../../../static/d3/dagre-d3.min.js';
import {Node, Edge, createNodes, createEdges, setColor, colorin, colorout, colornone, allNodeByIdMap, setAllNodeByIdMap} from './object.js';

function createDagreLayout (data, svg, callFunSelectNode) {
  const nodes = createNodes(data.nodes, node => {
    allNodeByIdMap.set(node.id, node)
  })

  const edges = createEdges(data.edges, edge => {})
  // 创建 graph 对象
  let g = new dagreD3.graphlib.Graph();
  //设置图
  let ss = g.setGraph({
  rankdir:'TB'
  });
  nodes.forEach(item => {
      g.setNode(item.id, {
        //节点标签
        label: item.id,
        //节点形状
        shape: 'circle',
        //节点样式
        style: "fill:#fff;stroke:blue"
        })
  })
  edges.forEach(item => {
      g.setEdge(item.source,item.target, {
          //边标签
          label: '',
          //边样式
          style: "stroke:grey;fill:none;"
        })
    })
  // 创建渲染器
  let render = new dagreD3.render();
  // 选择 svg 并添加一个g元素作为绘图容器.
  svg.call(d3.zoom().on("zoom", function(e) {
        svgGroup.attr("transform",e.transform);
      }))
  let svgGroup = svg.append('g')
  // 在绘图容器上运行渲染器生成流程图.

  render(svgGroup, g);
}

export default createDagreLayout;
