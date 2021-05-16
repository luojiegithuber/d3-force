import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';

const linkColor = {
  PARENT_CHILD: '#9e79db',
  LOGICAL_PHYSICAL: '#8dd3c7',
  DATA_FLOW: '#009966'
}

const nodeColor = {
  BusinessCatalog: '#ff9e6d',
  BusinessLogicEntity: '#86cbff',
  BusinessLogicEntityColumn: '#c2e5a0',
  DATABASE: '#fff686',
  TABLE: '#9e79db',
  COLUMN: '#8dd3c7',
  JOB: 'aquamarine',
  NODE: 'aqua',
  ColumnLineage: 'pink'
}

const nodeLabel = {
  BusinessCatalog: 'm',
  BusinessLogicEntity: 'L',
  BusinessLogicEntityColumn: 's',
  DATABASE: 'd',
  TABLE: 'T',
  COLUMN: 'z',
  JOB: 'J',
  NODE: 'j',
  ColumnLineage: 'c'
}

export function Node (node) {
  this.id = node.guid;
  this.group = node.entity_type; // 类
  this.label = nodeLabel[node.entity_type]; // 先固定文本避免卡顿
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
  this.group = edge.relationship_type; // 类
  this.label = edge.guid; // 先固定文本避免卡顿
  this.source = edge.source;
  this.target = edge.target;
  this.sourceNode = allNodeByIdMap.get(edge.source); // 上面的Node类型
  this.targetNode = allNodeByIdMap.get(edge.target);
}

export function createEdges (arr, callback) {
  const edges = arr.map((d, index) => {
    const edge = new Edge(d);
    if (callback) callback(edge, index);
    return edge
  })

  return edges;
}
/*
const colors = d3.scaleOrdinal(d3.schemeCategory10);

export function setColor (x) {
  return colors(x);
} */

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

// 更新绘画节点
export function updateNodeSvg (nodeRootG, nodes, nodeDrawOption = {
  nodeSize: 10,
  setColorByKey: 'group',
  // setColorByKey: 'entity_type',
  isPackage: false
}) {
  var g = nodeRootG.selectAll('g')
  g = g.data(nodes, function (d) { return d.id; });
  g.exit().remove();
  g = g.enter().append('g').attr('class', 'node').append('circle').attr('fill', 'red').attr('r', 8).merge(g);
  g = nodeRootG.selectAll('g');
  drawCircle(g);
  drawText(g);

  function drawCircle (g) {
    g
      .append('circle')
      .attr('stroke', 'grey')
      .style('stroke-opacity', 0.3)
      .attr('stroke-width', '1px')
      .attr('r', nodeDrawOption.nodeSize)
      .style('fill', d => nodeDrawOption.isPackage ? nodeColor[d.data[nodeDrawOption.setColorByKey]] : nodeColor[d[nodeDrawOption.setColorByKey]])
      .append('title')
      .text(d => nodeDrawOption.isPackage ? d.data.label : d.label);
  }

  function drawText (g) {
    g
      .append('text')
      .style('fill', '#000')
      .style('font-size', `${nodeDrawOption.nodeSize}px`)
      .style('text-anchor', 'middle')
      .style('cursor', 'default')
      .attr('pointer-events', 'none')
      .attr('transform', d => `translate(0,${nodeDrawOption.nodeSize / 2})`)
      .text(d => nodeDrawOption.isPackage ? d.data.label : d.label)
      .each(function (d) {
        d.text = this;
      });
  }

  return g
}

export function updateLinkSvg (linkRootG, links, linkDrawOption = {}) {
  var g = linkRootG.selectAll('g')
  g = g.data(links, function (d) { return d.id; });
  g.exit().remove();

  g = g.enter().append('g').attr('class', 'link')
    .append('path')
    .attr('stroke', d => linkColor[d.group])
    .attr('id', (d, i) => 'edgepath' + i)
    .style('pointer-events', 'none')
    .attr('marker-end', 'url(#arrow)')
    .merge(g);

  g = linkRootG.selectAll('g');
  return g
}

// 绘画节点
export function drawNodeSvg (svg, nodes, nodeDrawOption = {
  nodeSize: 10,
  setColorByKey: 'group',
  isPackage: false
}) {
  const nodeG = svg
    .selectAll('.nodeG')
    .data(nodes, d => nodeDrawOption.isPackage ? d.data.id : d.id)
    .enter()
    .append('g')
    .attr('class', 'nodeG')
    .attr('id', d => nodeDrawOption.isPackage ? d.data.id : d.id)
  nodeG
    .append('circle')
    .attr('r', nodeDrawOption.nodeSize)
    .attr('stroke', 'grey')
    .style('stroke-opacity', 0.3)
    .attr('stroke-width', '1px')
    .style('fill', d => nodeDrawOption.isPackage ? nodeColor[d.data[nodeDrawOption.setColorByKey]] : nodeColor[d[nodeDrawOption.setColorByKey]])
  nodeG
    .append('text')
    .style('cursor', 'default')
    .attr('pointer-events', 'none')
    .attr('dy', nodeDrawOption.nodeSize / 2)
    .attr('dx', -nodeDrawOption.nodeSize / 2)
    .text(d => nodeDrawOption.isPackage ? d.data.label : d.label)
  // .text(d => nodeLabelScale(d.entity_type));  // 针对业务案例

  return nodeG
}

// 绘画边
export function drawLinkSvg (svg, links, linkDrawOption = {
  setColorByKey: 'group'
  // setColorByKey: 'relationship_type',
}) {
  // 之前的随机数据

  // // 正式案例数据——根据 relationship_type 渲染不同的连边颜色
  const linkColorScale = d3
    .scaleOrdinal()
    .domain(['PARENT_CHILD', 'LOGICAL_PHYSICAL', 'DATA_FLOW'])
    .range([
      '#9e79db',
      '#8dd3c7',
      '#009966'
    ]);

  const linkG = svg
    .selectAll('.linkG')
    .data(links, d => d.id)
    .enter()
    .append('g')
    .attr('class', 'linkG');
  linkG // 连边
    .append('path')
    .attr('class', 'edgepath')
    .attr('stroke', d => linkColorScale(d[linkDrawOption.setColorByKey]))
    .attr('id', (d, i) => 'edgepath' + i)
    .style('pointer-events', 'none')
    .attr('marker-end', 'url(#arrow)');

  // 连边的提示标签
  // let linkLabels = linkG  // 标签
  //   .append('text')
  //   .style('pointer-events', 'none')
  //   .attr('class', 'edgelabel')
  //   .attr('id', (d, i) => 'edgelabel' + i)
  //   .attr('font-size', 12)
  //   .attr('fill', d => linkColorScale(d[linkDrawOption.setColorByKey]));
  // linkLabels.append('textPath') // 要沿着<path>的形状呈现文本，请将文本包含在<textPath>元素中，该元素具有一个href属性，该属性具有对<path>元素的引用.
  //   .attr('xlink:href', (d, i) => '#edgepath' + i)
  //   .style('text-anchor', 'middle')
  //   .style('pointer-events', 'none')
  //   .attr('startOffset', '50%')
  //   .text(d => d.group);

  return linkG
}

// 用于节点的移动
// 传入参数————是d3.选择器下的node g对象
export function moveNode (nodeG) {
  nodeG.attr('transform', (d) => `translate(${d.x},${d.y})`);
}

// 用于边的移动
// 传入参数————是d3.选择器下的边  path
export function moveLink (linkG) {
  linkG.attr('d', d => `M ${d.sourceNode.x} ${d.sourceNode.y} L ${d.targetNode.x} ${d.targetNode.y}`);
}

export const colorin = '#00f';
export const colorout = '#f00';
export const colornone = '#ccc';
