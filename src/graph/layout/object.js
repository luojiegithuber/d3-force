import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';

/*
=========================== 常量 ===========================
 */

// 连边颜色编码（可作为全图配置）
export const linkColor = {
  PARENT_CHILD: '#9e79db',
  LOGICAL_PHYSICAL: '#8dd3c7',
  DATA_FLOW: '#009966',
  PK_FK: '#006633'
};

// 节点颜色编码（可作为全图配置，暂定，后期可考虑使用图片）
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
};

// 节点标签编码（可作为全图配置，暂定，后期可考虑使用图片）
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
};

// 节点哈希记录（可考虑作为图谱属性，本文件中会用到，主要用于将节点详情信息绑定到相应的连边属性上）
export var allNodeByIdMap = new Map();

/*
=========================== 点边数据结构 （可作为统一数据类型 interface和图谱接口统一方法）===========================
 */

// 节点数据结构（可作为统一数据类型 interface）
export function Node (node) {
  this.id = node.guid; // id
  this.group = node.entity_type; // 类型
  this.label = nodeLabel[node.entity_type]; // 文本标识
  this.x = undefined; // 坐标x
  this.y = undefined; // 坐标y
  this.data = node; // 后台返回的节点原始数据（力引导中没有用到）

  this.pathNum = 0; // 出入度总数（力引导中没有用到）
  this.incoming = []; // 入度线数组，用于高亮时显示入度线（力引导中没有用到）
  this.outgoing = []; // 出度线数组，用于高亮时显示出度线（力引导中没有用到）
  this.matrixIndex = 0; // 矩阵布局中的位置索引（力引导中没有用到）

  this.links = []; // 记录相关连边数据，Edge类型

  // ****************以下是增量布局用的数据结构
  // 当前扩展状态（即图谱上是否展示了对应关系下的所有点边数据）
  this.currentExpandStatus = {
    ALL: false,
    RECOMMEND: false,
    OTHERS: false,
    DATA_FLOW: false,
    PK_FK: false,
    LAST_PARENT_CHILD: false,
    LOGICAL_PHYSICAL: false,
    NEXT_PARENT_CHILD: false
  };
  // 是否曾经扩展过（即是否发送过扩展请求）
  this.isExpandChildren = {
    ALL: false,
    RECOMMEND: false,
    OTHERS: false,
    DATA_FLOW: false,
    PK_FK: false,
    LAST_PARENT_CHILD: false,
    LOGICAL_PHYSICAL: false,
    NEXT_PARENT_CHILD: false
  };
  // 增量后子节点数组，Node类型
  this.expandChildrenNode = {
    ALL: [],
    RECOMMEND: [],
    OTHERS: [],
    DATA_FLOW: [],
    PK_FK: [],
    LAST_PARENT_CHILD: [],
    LOGICAL_PHYSICAL: [],
    NEXT_PARENT_CHILD: []
  };
  // 增量后的节点哈希记录，id - Node
  this.isExpandChildNodeMap = {
    ALL: {},
    RECOMMEND: {},
    OTHERS: {},
    DATA_FLOW: {},
    PK_FK: {},
    LAST_PARENT_CHILD: {},
    LOGICAL_PHYSICAL: {},
    NEXT_PARENT_CHILD: {}
  };
  // 增量后的连边数组，Edge类型
  this.expandChildrenLink = {
    ALL: [],
    RECOMMEND: [],
    OTHERS: [],
    DATA_FLOW: [],
    PK_FK: [],
    LAST_PARENT_CHILD: [],
    LOGICAL_PHYSICAL: [],
    NEXT_PARENT_CHILD: []
  };
  // 增量后的连边哈希记录，id - Edge
  this.isExpandChildLinkMap = {
    ALL: {},
    RECOMMEND: {},
    OTHERS: {},
    DATA_FLOW: {},
    PK_FK: {},
    LAST_PARENT_CHILD: {},
    LOGICAL_PHYSICAL: {},
    NEXT_PARENT_CHILD: {}
  };

  // ****************以下是路径记忆用的数据结构
  this.isRemember = node.isRemember || false;

  // ****************以下是钉住/解锁用的数据结构
  this.isPinStatus = false;
  this.isPinRemember = false;
}

// 根据原始数据获取相应数据结构的节点，放止污染原始数据（可作为图谱接口统一方法）
export function createNodes (originalNodes, callback) {
  return originalNodes.map((d, index) => {
    // 实例化
    const node = new Node(d);
    // 用于辅助连边数据结构的构造
    allNodeByIdMap.set(node.id, node);
    // 调用回调
    if (callback) callback(node, index);

    return node;
  });
}

// 连边数据结构（可作为统一数据类型 interface）
export function Edge (edge) {
  this.id = edge.guid; // id
  this.group = edge.relationship_type; // 类型
  this.label = edge.guid; // 文本标识
  this.data = edge; // 后台返回的节点原始数据（力引导中没有用到）
  this.source = edge.source; // source节点id
  this.target = edge.target; // target节点id
  this.sourceNode = allNodeByIdMap.get(edge.source); // source节点详细信息，Node类型
  this.targetNode = allNodeByIdMap.get(edge.target); // target节点详细信息，Node类型

  // ****************以下是路径记忆用的数据结构
  // 连边两端节点均被路径记忆（或钉住记忆）即可认为这条连边被记忆
  this.isRemember = () => (this.sourceNode.isRemember || this.sourceNode.isPinRemember) && (this.targetNode.isRemember || this.targetNode.isPinRemember)

  // ****************以下是关系扩展用的数据结构
  this.relationshipTypeExpand = [];
  this.isRelationshipExpand = false;
  this.relationshipTypeExpandData = {
    nodes: [],
    links: []
  };
}

// 根据原始数据获取相应数据结构的连边，放止污染原始数据（可作为图谱接口统一方法）
export function createEdges (originalEdges, callback) {
  return originalEdges.map((d, index) => {
    // 实例化
    const edge = new Edge(d);
    // 更新节点关联连边数据
    edge.sourceNode.links.push(edge);
    edge.targetNode.links.push(edge);
    // 调用回调
    if (callback) callback(edge, index);

    return edge
  });
}

/*
=========================== 点边绘制及更新的过渡效果方法 （可作为统一的图谱绘制方法） ===========================
 */

/**
 * （可作为统一的绘制入口）
 * 淡入淡出更新节点绘图
 * @param nodeRootG [d3.selection格式，svg元素节点的根group]
 * @param nodes [拟在图谱上渲染的节点数组]
 * @param nodeDrawOption [额外参数，包括节点大小、颜色编码标准以及是否封装（针对如弧线布局的特定布局，可作废）]
 * @param callback [回调函数，主要用于绘制完成后的事件绑定等]
 */
export function updateNodeSvg (nodeRootG, nodes, nodeDrawOption = {
  nodeSize: 18,
  setColorByKey: 'group',
  isPackage: false
}, callback) {
  var g = nodeRootG.selectAll('g');
  g = g.data(nodes, d => d.id);

  let count = 0;
  if (g.exit().data().length) {
    console.log('点淡出动画开始')
    g.exit()
      .attr('opacity', 1)
      .transition()
      .duration(800)
      .attr('opacity', 0)
      .on('end', () => {
        count++;
        if (count === g.exit().data().length) {
          g.exit().remove();
          g = g.enter().append('g').attr('class', 'node').lower();
          drawCircle(g);
          drawText(g);
          g = g.merge(g);
          g = nodeRootG.selectAll('g');
          // 调用回调，以完成相关的事件绑定
          console.log('点淡出动画结束')
          callback(g)
        }
      })
  } else {
    g.exit().remove();
    g = g.enter().append('g').attr('class', 'node').lower();
    drawCircle(g);
    drawText(g);
    g = g.merge(g);
    g = nodeRootG.selectAll('g');

    // 调用回调，以完成相关的事件绑定
    callback(g)
  }

  // 绘制节点
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

  // 绘制文本
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
}

/**
 * （可作为统一的绘制入口）
 * 淡入淡出更新连边绘图
 * @param linkRootG [d3.selection格式，svg元素连边的根group]
 * @param links [拟在图谱上渲染的连边数组]
 * @param linkDrawOption [额外参数，可作废]
 * @param callback [回调函数，主要用于绘制完成后的事件绑定等]
 */
export function updateLinkSvg (linkRootG, links, linkDrawOption = {}, callback) {
  var g = linkRootG.selectAll('g');
  g = g.data(links, d => d.id);
  let count = 0;
  if (g.exit().data().length) {
    console.log('边淡出动画开始')
    g.exit()
      .attr('opacity', 1)
      .transition()
      .duration(800)
      .attr('opacity', 0)
      .on('end', () => {
        count++;
        if (count === g.exit().data().length) {
          g.exit().remove();
          g = g.enter().append('g').attr('class', 'link')
            .append('path')
            .attr('stroke', d => linkColor[d.group] || 'black')
            .style('stroke-width', 1)
            .attr('id', (d, i) => 'edgepath' + i)
            .attr('marker-end', null);
          g = g.merge(g);

          // 调用回调，以完成相关的事件绑定
          g = linkRootG.selectAll('g');
          console.log('边淡出动画结束')
          callback(g);
        }
      })
  } else {
    g.exit().remove();
    g = g.enter().append('g').attr('class', 'link')
      .append('path')
      .attr('stroke', d => linkColor[d.group] || 'black')
      .style('stroke-width', 1)
      .attr('id', (d, i) => 'edgepath' + i)
      .attr('marker-end', null);
    g = g.merge(g);

    // 调用回调，以完成相关的事件绑定
    g = linkRootG.selectAll('g');
    callback(g);
  }
}

/**
 * （可作为统一的图谱方法）
 * 节点移动（带过渡效果）
 * @param nodeG [d3.selection格式，svg元素节点的group，node g对象]
 * @param isTransition 是否启用过渡动画
 */
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

/**
 * （可作为统一的图谱方法）
 * 连边移动（带过渡效果）
 * @param linkG [d3.selection格式，svg元素连边的group，path对象]
 * @param isTransition 是否启用过渡动画
 */
export function moveLink (linkG, isTransition) {
  if (isTransition) {
    linkG
      .transition()
      .duration(800)
      .attr('marker-end', 'url(#arrow)')
      .attr('d', d => `M ${d.sourceNode.x} ${d.sourceNode.y} L ${d.targetNode.x} ${d.targetNode.y}`);
  } else {
    linkG
      .attr('opacity', 1)
      .attr('d', d => `M ${d.sourceNode.x} ${d.sourceNode.y} L ${d.targetNode.x} ${d.targetNode.y}`);
  }
}

/*
=========================== 点边高亮方法（可作为统一的图谱设置方法） ===========================
 */

/**
 * （可作为统一的图谱设置方法）
 * 节点高亮
 * @param oldNodeG [旧节点,d3.selection格式]
 * @param newNodeG [新节点,d3.selection格式]
 */
export function highlightNode (oldNodeG, newNodeG) {
  // 旧的去掉高亮
  if (oldNodeG) {
    oldNodeG.select('circle')
      .attr('stroke', 'grey')
      .style('stroke-opacity', 0.3)
      .attr('stroke-width', '1px')
  }
  // 新的添加高亮
  newNodeG.select('circle')
    .attr('stroke', 'orange')
    .style('stroke-opacity', 1)
    .attr('stroke-width', '2.5px')
}

/**
 * （可作为统一的图谱设置方法）
 * 节点高亮
 * @param oldLinkG [旧连边,d3.selection格式]
 * @param newLinkG [新连边,d3.selection格式]
 */
export function highlightLink (oldLinkG, newLinkG) {
  // // 旧的去掉高亮
  // if (oldLinkG) {
  //   oldLinkG
  //     .style('stroke-width', 1)
  // }
  // // 新的添加高亮
  // newLinkG
  //   .style('stroke-width', 3)

  // do somethings...
}

// ========================下面时是其他布局算法中借助的东西========================
export const colorin = '#00f';
export const colorout = '#f00';
export const colornone = '#ccc';

// 弧线、邻接矩阵布局中绑定图数据（力引导中没有用到，可作废）
export function setAllNodeByIdMap (arr) {
  allNodeByIdMap = new Map(arr.map(d => [d.id, d]));
  return true
}

// 绘画节点的配置（力引导中没有用到，可作废）
export function NodeDrawOption (option) {
  this.nodeSize = option.nodeSize; // 节点大小 number
  this.setColorByKey = option.setColorByKey; // 节点颜色编码属性 string
  this.isEncapsulation = option.isEncapsulation; // 布尔值 ，表示是否封装，如果节点被二次封装就要取节点的data属性，针对特定的布局算法，比如弧线布局
}

// 绘画节点（力引导中没有用到，其他布局中用到了，但这种绘制没有动画，可考虑作废）
export function drawNodeSvg (svg, nodes, nodeDrawOption = {nodeSize: 10, setColorByKey: 'group', isPackage: false}) {
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

// 绘画连边（力引导中没有用到，其他布局中用到了，但这种绘制没有动画，可考虑作废）
export function drawLinkSvg (svg, links, linkDrawOption = {nodeSize: 10, setColorByKey: 'group'}) {
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
