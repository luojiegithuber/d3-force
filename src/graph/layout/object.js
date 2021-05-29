import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';

// 连边颜色编码
export const linkColor = {
  PARENT_CHILD: '#9e79db',
  LOGICAL_PHYSICAL: '#8dd3c7',
  DATA_FLOW: '#009966',
  PK_FK: '#006633'
}

// 节点颜色编码
export const nodeColor = {
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

// 节点标签编码
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

// 节点哈希记录
export var allNodeByIdMap = new Map();

// 节点数据结构
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

  this.links = []; // Edge类型

  // ****************以下是增量布局测试用的数据结构
  // 是否曾经扩展过
  this.isExpandChildren = {
    ALL:false,
    RECOMMEND:false,
    OTHERS:false,
    DATA_FLOW:false,
    PK_FK:false,
    LAST_PARENT_CHILD:false,
    LOGICAL_PHYSICAL:false,
    NEXT_PARENT_CHILD:false,
  };
  // 增量后子节点Node类型放里面 ; 判断有没有子节点就要根据其数组长度来
  this.expandChildrenNode = {
    ALL:[],
    RECOMMEND:[],
    OTHERS:[],
    DATA_FLOW:[],
    PK_FK:[],
    LAST_PARENT_CHILD:[],
    LOGICAL_PHYSICAL:[],
    NEXT_PARENT_CHILD:[],
  };
  // 对象，保存扩散节点 id——node对象
  this.isExpandChildNodeMap = {
    ALL:{},
    RECOMMEND:{},
    OTHERS:{},
    DATA_FLOW:{},
    PK_FK:{},
    LAST_PARENT_CHILD:{},
    LOGICAL_PHYSICAL:{},
    NEXT_PARENT_CHILD:{},
  };
  // 增量后子节点Node类型放里面 ; 判断有没有子节点就要根据其数组长度来
  this.expandChildrenLink = {
    ALL:[],
    RECOMMEND:[],
    OTHERS:[],
    DATA_FLOW:[],
    PK_FK:[],
    LAST_PARENT_CHILD:[],
    LOGICAL_PHYSICAL:[],
    NEXT_PARENT_CHILD:[],
  };
  // 对象，保存扩散节点 id——node对象
  this.isExpandChildLinkMap = {
    ALL:{},
    RECOMMEND:{},
    OTHERS:{},
    DATA_FLOW:{},
    PK_FK:{},
    LAST_PARENT_CHILD:{},
    LOGICAL_PHYSICAL:{},
    NEXT_PARENT_CHILD:{},
  };
  this.default_show = node.default_show; // 是否默认展示
  // 是否处于收缩子节点状态
  this.isShrink = {
    ALL:false,
    RECOMMEND:false,
    OTHERS:false,
    DATA_FLOW:false,
    PK_FK:false,
    LAST_PARENT_CHILD:false,
    LOGICAL_PHYSICAL:false,
    NEXT_PARENT_CHILD:false,
  };
  // 是否处于被父节点收缩的状态
  this.isBeShrinked = {
    ALL:false,
    RECOMMEND:false,
    OTHERS:false,
    DATA_FLOW:false,
    PK_FK:false,
    LAST_PARENT_CHILD:false,
    LOGICAL_PHYSICAL:false,
    NEXT_PARENT_CHILD:false,
  };

  // ****************以下是路径记忆用的数据结构
  this.isRemember = node.isRemember || false;
  // 1.节点不被记忆不代表不能可视化，当处于被扩展状态的时候，不被记忆也是可以可视化的
  // ****************以下是钉住/解锁用的数据结构
  this.isPin = false;
  this.isPinRemember = false;
}

// 根据原始数据获取相应的节点，以放止污染原始数据
export function createNodes (originalNodes, callback) {
  return originalNodes.map((d, index) => {
    const node = new Node(d);

    allNodeByIdMap.set(node.id, node); // 用于辅助连边数据结构的构造

    if (callback) callback(node, index);
    return node;
  });
}

// 连边数据结构
export function Edge (edge) {
  this.data = edge;
  this.id = edge.guid;
  this.group = edge.relationship_type; // 类
  this.label = edge.guid; // 先固定文本避免卡顿
  this.source = edge.source;
  this.target = edge.target;
  this.sourceNode = allNodeByIdMap.get(edge.source); // source节点详细信息
  this.targetNode = allNodeByIdMap.get(edge.target); // target节点详细信息

  // ****************以下是增量布局测试用的数据结构
  this.default_show = edge.default_show; // 是否展示
  this.isShrink = {
    ALL:false,
    RECOMMEND:false,
    OTHERS:false,
    DATA_FLOW:false,
    PK_FK:false,
    LAST_PARENT_CHILD:false,
    LOGICAL_PHYSICAL:false,
    NEXT_PARENT_CHILD:false,
  }; // 是否处于收缩状态
  this.isBeShrinked = {
    ALL:false,
    RECOMMEND:false,
    OTHERS:false,
    DATA_FLOW:false,
    PK_FK:false,
    LAST_PARENT_CHILD:false,
    LOGICAL_PHYSICAL:false,
    NEXT_PARENT_CHILD:false,
  }; // 是否处于被父节点收缩的状态

  this.isRemember = () => this.sourceNode.isRemember && this.targetNode.isRemember

  // ****************以下是关系扩展需要的数据结构
  this.relationshipTypeExpand = [];
  this.isRelationshipExpand = false;
}

// 根据原始数据获取相应的连边，以放止污染原始数据
export function createEdges (originalEdges, callback) {
  return originalEdges.map((d, index) => {
    const edge = new Edge(d);
    edge.sourceNode.links.push(edge);
    edge.targetNode.links.push(edge);
    if (callback) callback(edge, index);
    return edge
  });
}

// 弧线、邻接矩阵布局中会用到
export function setAllNodeByIdMap (arr) {
  allNodeByIdMap = new Map(arr.map(d => [d.id, d]));
  return true
}

// 绘画节点的配置
export function NodeDrawOption (option) {
  this.nodeSize = option.nodeSize; // 节点大小 number
  this.setColorByKey = option.setColorByKey; // 节点颜色编码属性 string
  this.isEncapsulation = option.isEncapsulation; // 布尔值 ，表示是否封装，如果节点被二次封装就要取节点的data属性，针对特定的布局算法
}

// 更新节点绘画
export function updateNodeSvg (nodeRootG, nodes, curNode, nodeDrawOption = {
  nodeSize: 18,
  setColorByKey: 'group',
  isPackage: false
}) {
  // nodes = nodes.filter(d => d.show);

  var g = nodeRootG.selectAll('g')
  g = g.data(nodes, function (d) {
    return d.id;
  });
  g.exit().remove();
  g = g.enter().append('g').attr('class', 'node').lower()
  drawCircle(g);
  drawText(g);
  g = g.merge(g);

  g = nodeRootG.selectAll('g');

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

function setNodeVisibility (g) {
  g.style('display', d => (!d.isShrink && d.show) ? 'inherit' : 'none');
}

// 更新连边绘图
export function updateLinkSvg (linkRootG, links, linkDrawOption = {}) {
  // links = links.filter(d => d.show);

  var g = linkRootG.selectAll('g')
  g = g.data(links, function (d) {
    return d.id;
  });
  g.exit().remove();

  g = g.enter().append('g').attr('class', 'link')
    .append('path')
    .attr('stroke', d => linkColor[d.group] || 'black')
    .style('stroke-width', 1)
    .attr('id', (d, i) => 'edgepath' + i)
    .attr('marker-end', 'url(#arrow)')
    .merge(g);

  g = linkRootG.selectAll('g');

  // setNodeVisibility(g)
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
  // .text(d => nodeLabelScale(d.entity_type)); // 针对业务案例

  return nodeG
}

// 绘画边
export function drawLinkSvg (svg, links, linkDrawOption = {
  nodeSize: 10,
  setColorByKey: 'group'
}) {
  const nodeSize = linkDrawOption.nodeSize
  // 之前的随机数据
  // 正式案例数据——根据 relationship_type 渲染不同的连边颜色
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

  // 设置箭头样式
  let defs = svg.append('defs');
  let arrowMarker = defs.append('marker')
    .attr('id', 'arrow')
    .attr('markerUnits', 'strokeWidth')
    .attr('markerWidth', nodeSize / 2)
    .attr('markerHeight', nodeSize / 2)
    .attr('viewBox', `-0 ${-nodeSize / 4} ${nodeSize / 2} ${nodeSize / 2}`)
    .attr('refX', `${nodeSize * 1.5}`)
    .attr('refY', `0`)
    .attr('orient', 'auto');
  arrowMarker.append('path')
    .attr('d', `M0,${-nodeSize / 4} L${nodeSize / 2},0 L0,${nodeSize / 4}`)
    .attr('fill', '#999')
    .style('stroke', 'none');

  // 连边的提示标签
  let linkLabels = linkG // 标签
    .append('text')
    .style('pointer-events', 'none')
    .attr('class', 'edgelabel')
    .attr('id', (d, i) => 'edgelabel' + i)
    .attr('font-size', 12)
    .attr('fill', d => linkColorScale(d[linkDrawOption.setColorByKey]));
  linkLabels.append('textPath') // 要沿着<path>的形状呈现文本，请将文本包含在<textPath>元素中，该元素具有一个href属性，该属性具有对<path>元素的引用.
    .attr('xlink:href', (d, i) => '#edgepath' + i)
    .style('text-anchor', 'middle')
    .style('pointer-events', 'none')
    .attr('startOffset', '50%')
    .text(d => d.group);

  return linkG
}

// 用于节点的移动
// 传入参数————是d3.选择器下的node g对象
export function moveNode (nodeG, isTransition) {
  if (isTransition) {
    nodeG
      .transition()
      .duration(800)
      .attr('transform', (d) => `translate(${d.x},${d.y})`);
  } else {
    nodeG.attr('transform', (d) => `translate(${d.x},${d.y})`);
  }
}

// 用于边的移动
// 传入参数————是d3.选择器下的边  path
export function moveLink (linkG, isTransition) {
  if (isTransition) {
    linkG
      .transition()
      .duration(800)
      .attr('d', d => `M ${d.sourceNode.x} ${d.sourceNode.y} L ${d.targetNode.x} ${d.targetNode.y}`);
  } else {
    linkG.attr('d', d => `M ${d.sourceNode.x} ${d.sourceNode.y} L ${d.targetNode.x} ${d.targetNode.y}`);
  }
}

// 高亮节点 节点格式是d3.selection！！！
export function highlightNode (oldNodeG, newNodeG) {
  // 旧的得去掉高亮
  if (oldNodeG) {
    oldNodeG.select('circle')
      .attr('stroke', 'grey')
      .style('stroke-opacity', 0.3)
      .attr('stroke-width', '1px')
  }

  newNodeG.select('circle')
    .attr('stroke', 'orange')
    .style('stroke-opacity', 1)
    .attr('stroke-width', '2.5px')
}

// 高亮节点 节点格式是d3.selection！！！
export function highlightLink (oldLinkG, newLinkG) {
  // // 旧的得去掉高亮
  // if (oldLinkG) {
  //   oldLinkG
  //     .style('stroke-width', 1)
  // }
  //
  // newLinkG
  //   .style('stroke-width', 3)
}

export const colorin = '#00f';
export const colorout = '#f00';
export const colornone = '#ccc';
