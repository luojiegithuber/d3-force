import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';
import {createNodes, createEdges, drawNodeSvg, drawLinkSvg} from './object.js';

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

  const nodes = createNodes(original_data.nodes, node => {
  });

  const edges = createEdges(original_data.edges, edge => {
  });

  if (!nodes) return;
  const max_radius = d3.min([width - margin.left - margin.right, height - margin.top - margin.bottom]) / 2;
  let nodeSize = ((2 * Math.PI * max_radius / nodes.length) * 0.3 / 2);

  // 绑定缩放
  svg = svg
    .call(d3.zoom()
      .scaleExtent([1 / 50, 4])
      .on('zoom', e => {
        svg.attr('transform', e.transform);
      }))
    .append('g');

  /* ----------初始化连边------------------------ */
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
  // 连边绘制
  const linksData = edges;
  const linkDrawOption = {};
  const linkG = drawLinkSvg(svg, linksData, linkDrawOption);
  let links = linkG.selectAll('path');

  /* ----------------------初始化节点----------------------------- */
  // 节点绘画
  const nodesData = nodes;
  const nodeDrawOption = {nodeSize: nodeSize, setColorByKey: 'group', isPackage: false}
  const nodeG = drawNodeSvg(svg, nodesData, nodeDrawOption);
  nodeG
    .call(
      d3.drag()
        .on('start', dragstart)
        .on('drag', dragg)
        .on('end', dragend)
    );
  nodeG.selectAll('circle')
    .on('mouseover', d => {
    })
    .on('mouseout', d => {
    })
    .on('click', (e, d) => {
      console.log('点击了', d)
    });


  /* ---------------------定义力导引模型---------------------- */
  let simulation = d3.forceSimulation();
  simulation.nodes(nodes).on('tick', ticked);
  simulation
    .force('link', d3.forceLink(edges).id(d => d.id).distance(max_radius / 2))
    .force('charge', d3.forceManyBody().strength(-max_radius).distanceMax(max_radius * 2))
    .force('center', d3.forceCenter().x(width / 2).y(height / 2));

  function ticked () {
    nodeG.attr('transform', (d) => `translate(${d.x},${d.y})`);
    links.attr('d', d => `M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`);
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

export default createForceDirectedGraph_SVG;
