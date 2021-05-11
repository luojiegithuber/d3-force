import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';
import {createNodes, createEdges} from './object.js';

// fix me ---- 用了该布局后，切换其他布局存在问题，该布局会污染数据和画布？

function createForceDirectedGraph_SVG (original_data, svg, callFunSelectNode) {
  let width = svg.attr('width'),
    height = svg.attr('height');

  // 可视化容器边距参数
  const margin = ({
    top: height / 9,
    right: width / 12,
    bottom: height / 9,
    left: width / 12
  });

  const max_radius = d3.min([width - margin.left - margin.right, height - margin.top - margin.bottom]) / 2;
  let nodeSize = ((2 * Math.PI * max_radius / original_data.nodes.length) * 0.3 / 2);

  // 绑定缩放
  svg = svg
    .call(d3.zoom()
      .scaleExtent([1 / 50, 4])
      .on('zoom', e => {
        svg.attr('transform', e.transform);
      }))
    .append('g');

  // 点边颜色映射
  // let node_categories = new Set(original_data.nodes.map(item => item.type_name)); //length:4
  // let edge_categories = new Set(original_data.edges.map(item => item.type_name)); //length:3
  const nodeColorScale = d3
    .scaleOrdinal()
    .domain(['AAAAAA', 'BBBBBB', 'CCCCCC', 'DDDDDD'])
    .range([
      '#ff9e6d',
      '#86cbff',
      '#c2e5a0',
      '#fff686'
    ]);
  const linkColorScale = d3
    .scaleOrdinal()
    .domain(['Edge-AAAAAA', 'Edge-BBBBBB', 'Edge-CCCCCC'])
    .range([
      '#9e79db',
      '#8dd3c7',
      '#009966'
    ]);

  let nodes = original_data.nodes;
  let edges = original_data.edges;
  /* ----------初始化连边------------------------ */

  let link = svg
    .selectAll('.links')
    .data(edges, d => d.guid)
    .enter()
    .append('g')
    .attr('class', 'links');
  let edgepaths = link // 连边上的标签位置,是的文字按照这个位置进行布局
    .append('path')
    .attr('class', 'edgepath')
    .attr('stroke', d => linkColorScale(d.type_name))
    .attr('id', (d, i) => 'edgepath' + i)
    .style('pointer-events', 'none')
    .attr('marker-end', 'url(#arrow)');
  let edgelabels = link
    .append('text')
    .style('pointer-events', 'none')
    .attr('class', 'edgelabel')
    .attr('id', (d, i) => 'edgelabel' + i)
    .attr('font-size', 12)
    .attr('fill', d => linkColorScale(d.type_name));
  edgelabels
    .append('textPath') // 要沿着<path>的形状呈现文本，请将文本包含在<textPath>元素中，该元素具有一个href属性，该属性具有对<path>元素的引用.
    .attr('xlink:href', (d, i) => '#edgepath' + i)
    .style('text-anchor', 'middle')
    .style('pointer-events', 'none')
    .attr('startOffset', '50%')
    .text(d => d.type_name);
  // 设置箭头样式
  let defs = svg.append('defs');
  let arrowMarker = defs.append('marker')
    .attr('id', 'arrow')
    .attr('markerUnits', 'strokeWidth')
    .attr('markerWidth', nodeSize)
    .attr('markerHeight', nodeSize)
    .attr('viewBox', `-0 ${-nodeSize / 2} ${nodeSize} ${nodeSize}`)
    .attr('refX', `${nodeSize * 2}`)
    .attr('refY', `0`)
    .attr('orient', 'auto');
  arrowMarker.append('path')
    // .attr("d", "M2,2 L10,6 L2,10 L6,6 L2,2")
    .attr('d', `M0,${-nodeSize / 2} L${nodeSize},0 L0,${nodeSize / 2}`)
    .attr('fill', '#999')
    .style('stroke', 'none');

  /* ----------------------初始化节点----------------------------- */
  let node = svg
    .selectAll('.nodes')
    .data(nodes, d => d.guid)
    .enter()
    .append('g')
    .attr('class', 'nodes')
    .attr('id', d => d.guid)
    .call(
      d3.drag()
        .on('start', dragstart)
        .on('drag', dragg)
        .on('end', dragend)
    );

  node
    .append('circle')
    .attr('r', nodeSize)
    .attr('stroke', 'grey')
    .style('stroke-opacity', 0.3)
    .attr('stroke-width', '1px')
    .style('fill', d => nodeColorScale(d.type_name))
    .on('mouseover', d => {
    })
    .on('mouseout', d => {
    })
    .on('click', d => {
      console.log('点击了', d)
    });
  node
    .append('text')
    // .style('alignment-baseline', 'middle')
    // .style('text-anchor;', 'middle')
    .style('cursor', 'default')
    .attr('pointer-events', 'none')
    .attr('dy', nodeSize / 2)
    .attr('dx', -nodeSize / 2)
    .text(d => d.type_name[0]);

  /* ---------------------定义力导引模型---------------------- */
  let simulation = d3.forceSimulation();
  simulation.nodes(nodes).on('tick', ticked);
  simulation
    .force('link', d3.forceLink(edges).id(d => d.guid).distance(max_radius / 2))
    .force('charge', d3.forceManyBody().strength(-max_radius).distanceMax(max_radius * 2))
    .force('center', d3.forceCenter().x(width / 2).y(height / 2));

  function ticked () {
    node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    edgepaths.attr('d', d => `M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`);
  }

  function dragstart (event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragg (event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragend (event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
}

export default createForceDirectedGraph_SVG
