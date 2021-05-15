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
    if (callback) callback(node, index);
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
    if (callback) callback(edge, index);
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
  // setColorByKey: 'entity_type',
  isPackage: false
}) {
  /*------------------这是罗sir之前的-------------------*/
  // const setColor = d3.scaleOrdinal(d3.schemeCategory10);
  //
  // const nodesG = svg
  //   .append('g')
  //   .selectAll('circle')
  //   .data(nodes)
  //   .enter()
  //   .append('g')
  //
  // const nodesCircle = nodesG
  //   .append('circle')
  //   .attr('stroke', 'grey')
  //   .style('stroke-opacity', 0.3)
  //   .attr('stroke-width', '1px')
  //   .attr('r', nodeDrawOption.nodeSize)
  //   .attr('fill', d => nodeDrawOption.isPackage ? setColor(d.data[nodeDrawOption.setColorByKey]) : setColor(d[nodeDrawOption.setColorByKey]))
  //   .append('title')
  //   .text(d => nodeDrawOption.isPackage ? d.data.id : d.id);
  //
  // const nodesText = nodesG
  //   .append('text')
  //   .style('fill', '#fff')
  //   .style('font-size', `${nodeDrawOption.nodeSize}px`)
  //   .style('text-anchor', 'middle')
  //   .style('cursor', 'default')
  //   .attr('pointer-events', 'none')
  //   .attr('transform', d => `translate(0,${nodeDrawOption.nodeSize / 2})`)
  //   .text(d => nodeDrawOption.isPackage ? d.data.id : d.id)
  //   .each(function (d) {
  //     d.text = this;
  //   });

  /*------------------下面是重新写的一个版本-------------------*/

  // 之前的随机数据
  const nodeColorScale = d3
    .scaleOrdinal()
    .domain(['AAAAAA', 'BBBBBB', 'CCCCCC', 'DDDDDD'])
    .range([
      '#ff9e6d',
      '#86cbff',
      '#c2e5a0',
      '#fff686'
    ]);

  // // 正式的案例数据———根据 entity_type 渲染不同的节点颜色
  // const nodeColorScale = d3
  //   .scaleOrdinal()
  //   .domain(['BusinessCatalog', 'BusinessLogicEntity', 'BusinessLogicEntityColumn', 'DATABASE', 'TABLE', 'COLUMN', 'JOB', 'NODE', 'ColumnLineage'])
  //   .range([
  //     "#ff9e6d",
  //     "#86cbff",
  //     "#c2e5a0",
  //     "#fff686",
  //     "#9e79db",
  //     "#8dd3c7",
  //     "aquamarine",
  //     "aqua",
  //     'pink'
  //   ]);
  //
  // // 正式的案例数据——根据 entity_type 渲染不同的节点标记
  // const nodeLabelScale = d3
  //   .scaleOrdinal()
  //   .domain(['BusinessCatalog', 'BusinessLogicEntity', 'BusinessLogicEntityColumn', 'DATABASE', 'TABLE', 'COLUMN', 'JOB', 'NODE', 'ColumnLineage'])
  //   .range(['m', 'L', 's', 'd', 'T', 'z', 'J', 'j', 'c']);

  let nodeG = svg
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
    .style('fill', d => nodeDrawOption.isPackage ? nodeColorScale(d.data[nodeDrawOption.setColorByKey]) : nodeColorScale(d[nodeDrawOption.setColorByKey]))
  nodeG
    .append('text')
    .style('cursor', 'default')
    .attr('pointer-events', 'none')
    .attr('dy', nodeDrawOption.nodeSize / 2)
    .attr('dx', -nodeDrawOption.nodeSize / 2)
    .text(d => nodeDrawOption.isPackage ? d.data.id : d.id)
  // .text(d => nodeLabelScale(d.entity_type));  // 针对业务案例

  return nodeG
}

// 绘画边
export function drawLinkSvg (svg, links, linkDrawOption = {
  setColorByKey: 'group',
  // setColorByKey: 'relationship_type',
}) {
  /*------------------这是罗sir之前的-------------------*/
  // const linkG = svg
  //   .append('g')
  //   .lower()
  //   .attr('stroke', colornone)
  //   .attr('fill', 'none')
  //   .selectAll('path')
  //   .data(links)
  //   .enter()
  //   .append('path')
  //   .attr('marker-end', '#url(arrow)')

  /*------------------下面是重新写的一个版本-------------------*/
  // 之前的随机数据
  const linkColorScale = d3
    .scaleOrdinal()
    .domain(['Edge-AAAAAA', 'Edge-BBBBBB', 'Edge-CCCCCC'])
    .range([
      '#9e79db',
      '#8dd3c7',
      '#009966'
    ]);

  // // 正式案例数据——根据 relationship_type 渲染不同的连边颜色
  // const linkColorScale = d3
  //   .scaleOrdinal()
  //   .domain(['PARENT_CHILD', 'LOGICAL_PHYSICAL', 'DATA_FLOW'])
  //   .range([
  //     '#9e79db',
  //     '#8dd3c7',
  //     '#009966',
  //   ]);

  let linkG = svg
    .selectAll('.linkG')
    .data(links, d => d.id)
    .enter()
    .append('g')
    .attr('class', 'linkG');
  linkG  // 连边
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

export const colorin = '#00f';
export const colorout = '#f00';
export const colornone = '#ccc';
export const nodeColor = '#ff9e6d';
