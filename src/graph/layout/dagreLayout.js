import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';

import dagre from 'dagre';
import {
  Node,
  Edge,
  createNodes,
  createEdges,
  setColor,
  colorin,
  colorout,
  colornone,
  allNodeByIdMap,
  setAllNodeByIdMap
} from './object.js';

function createDagreLayout (original_data, svg, callFunSelectNode) {

  let width = svg.attr('width'),
    height = svg.attr('height');

  // 可视化容器边距参数
  const margin = ({
    top: height / 9,
    right: width / 12,
    bottom: height / 9,
    left: width / 12
  });

  let nodes = original_data['nodes'],
    edges = original_data['edges'],
    nodeSize = d3.min([width / nodes.length, height / nodes.length]) / 2.5;

  if (!nodes) return;

  const g = new dagre.graphlib.Graph({
    multigraph: true,
    compound: true,
  });
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph(() => ({}));

  // 设置节点
  nodes.forEach((node) => {
    //可任意设置，只用于计算节点相对坐标
    const verti = 0.00001;
    const hori = 0.00001;
    const width = nodeSize + 2 * hori;
    const height = nodeSize + 2 * verti;
    g.setNode(node.guid, {width, height});
  });

  // 设置边
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target, {
      weight: edge.weight || 1,
    });
  });
  dagre.layout(g);

  let coord;
  g.nodes().forEach(node => {
    coord = g.node(node);
    const i = nodes.findIndex((it) => it.guid === node);
    if (!nodes[i]) return;
    nodes[i].x = coord.x;
    nodes[i].y = coord.y;
  });
  g.edges().forEach(edge => {
    coord = g.edge(edge);
    const i = edges.findIndex(
      (it) => it.source === edge.v && it.target === edge.w
    );
  });

  // 根据画布尺寸重新映射节点坐标
  let Xscale = d3.scaleLinear().domain([d3.min(nodes.map(d => d.x)), d3.max(nodes.map(d => d.x))]).range([0, width - margin.left - margin.right]);
  let Yscale = d3.scaleLinear().domain([d3.min(nodes.map(d => d.y)), d3.max(nodes.map(d => d.y))]).range([0, height - margin.top - margin.bottom]);
  let node_hash = new Map();
  nodes.forEach(node => {
    node.x = margin.left + Xscale(node.x);
    node.y = margin.top + Yscale(node.y);
    node_hash.set(node.guid, node)
  });

  //绘制边
  //设置箭头样式
  let defs = svg.append('defs');
  let arrowMarker = defs.append('marker')
    .attr('id', 'arrow')
    .attr('markerUnits', 'strokeWidth')
    .attr('markerWidth', nodeSize)
    .attr('markerHeight', nodeSize)
    .attr('viewBox', `0 0 ${nodeSize} ${nodeSize}`)
    .attr('refX', `${1.1 * nodeSize}`)
    .attr('refY', `6`)
    .attr('orient', 'auto');
  arrowMarker.append('path')
    .attr('d', 'M2,2 L10,6 L2,10 L6,6 L2,2')
    .attr('fill', '#999');
  svg.append('g')
    .attr('stroke', '#cccccc')
    .attr('marker-end', 'url(#arrow)')
    .selectAll('path')
    .data(edges)
    .join('path')
    .attr('d', d => `M ${node_hash.get(d.source).x},${node_hash.get(d.source).y} L ${node_hash.get(d.target).x},${node_hash.get(d.target).y}`)
    .attr('stroke-width', 2);

  // 绘制节点
  svg.append('g')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .selectAll('circle')
    .data(nodes)
    .join('circle')
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('r', nodeSize)
    .attr('fill', '#cccccc')
    .append('title')
    .text(d => d.id);

  // 绘制节点标识
  svg.append('g')
    .selectAll('text')
    .data(nodes)
    .join('text')
    .attr('x', d => d.x)
    .attr('y', d => d.y)
    .style('fill', '#000')
    .style('font-size', `${nodeSize / 1.2}px`)
    .style('text-anchor', 'middle')
    .style('alignment-baseline', 'middle')
    .style('cursor', 'default')
    .attr('pointer-events', 'none')
    .text(d => 'L');
}

export default createDagreLayout;
