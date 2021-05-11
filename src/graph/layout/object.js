import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';

export function Node (node) {
  this.id = node.guid;
  this.group = node.type_name; // 类
  this.label = node.guid; // 先固定文本避免卡顿
  this.pathNum = 0; // 出入度总数
  this.x = undefined; // 自定义
  this.y = undefined; // 自定义
  this.data = node;
  this.incoming = []; // 高亮显示线的时候会用到
  this.outgoing = []; // 高亮显示线的时候会用到
  this.matrixIndex = 0; // 矩阵轴中的位置
}

export function createNodes (arr, callback) {
  return arr.map((d, index) => {
    const node = new Node(d);
    allNodeByIdMap.set(node.id, node)
    if (callback)callback(node, index);
    return node;
  });
}

export function Edge (edge) {
  this.id = edge.guid;
  this.group = edge.type_name; // 类
  this.label = edge.guid; // 先固定文本避免卡顿
  this.source = edge.source;
  this.target = edge.target;
  this.sourceNode = allNodeByIdMap.get(edge.source); // 上面的Node类型
  this.targetNode = allNodeByIdMap.get(edge.target);
}

export function createEdges (arr, callback) {
  const edges = arr.map((d, index) => {
    const edge = new Edge(d);
    if (callback)callback(edge, index);
    return edge
  })

  return edges;
}
const colors = d3.scaleOrdinal(d3.schemeCategory10);
export function setColor (x) {
  return colors(x);
}

export var allNodeByIdMap = new Map();
export function setAllNodeByIdMap (arr) {
  allNodeByIdMap = new Map(arr.map(d => [d.id, d]));
  return true
}

// 绘画节点的配置
export function NodeDrawOption (option) {
  this.nodeSize = option.nodeSize; // 节点大小 number
  this.setColorByKey = option.setColorByKey; // 节点颜色应用的区别属性 string
  this.isEncapsulation = option.isEncapsulation; // 布尔值 ，表示是否封装，如果节点被二次封装就要取节点的data属性
}

// 绘画节点
export function drawNodeSvg (svg, nodes, nodeDrawOption = {
  nodeSize: 10,
  setColorByKey: 'group',
  isPackage: false
}) {
  const setColor = d3.scaleOrdinal(d3.schemeCategory10);

  const nodesG = svg
    .append('g')
    .selectAll('circle')
    .data(nodes)
    .enter()
    .append('g')

  const nodesCircle = nodesG
    .append('circle')
    .attr('stroke', 'grey')
    .style('stroke-opacity', 0.3)
    .attr('stroke-width', '1px')
    .attr('r', nodeDrawOption.nodeSize)
    .attr('fill', d => nodeDrawOption.isPackage ? setColor(d.data[nodeDrawOption.setColorByKey]) : setColor(d[nodeDrawOption.setColorByKey]))
    .append('title')
    .text(d => nodeDrawOption.isPackage ? d.data.id : d.id);

  const nodesText = nodesG
    .append('text')
    .style('fill', '#fff')
    .style('font-size', `${nodeDrawOption.nodeSize}px`)
    .style('text-anchor', 'middle')
    .style('cursor', 'default')
    .attr('pointer-events', 'none')
    .attr('transform', d => `translate(0,${nodeDrawOption.nodeSize / 2})`)
    .text(d => nodeDrawOption.isPackage ? d.data.id : d.id)
    .each(function (d) {
      d.text = this;
    });

  return nodesG
}

// 绘画边
export function drawLinkSvg (svg, links, linkDrawOption) {
  const linkG = svg
    .append('g')
    .lower()
    .attr('stroke', colornone)
    .attr('fill', 'none')
    .selectAll('path')
    .data(links)
    .enter()
    .append('path')
    .attr('marker-end', '#url(arrow)')

  return linkG
}

export const colorin = '#00f';
export const colorout = '#f00';
export const colornone = '#ccc';
export const nodeColor = '#ff9e6d';
