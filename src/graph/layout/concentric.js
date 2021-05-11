import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';
import {createNodes, createEdges, colorin, colorout, colornone, drawNodeSvg, drawLinkSvg} from './object.js';

const colors = d3.scaleOrdinal(d3.schemeCategory10);

export function setColor (x) {
  return colors(x);
}

function createContric (original_data, svg, callFunSelectNode) {
  let width = svg.attr('width');
  let height = svg.attr('height');

  let data = original_data;

  // 可视化容器边距参数
  const margin = ({
    top: height / 9,
    right: width / 12,
    bottom: height / 9,
    left: width / 12
  });

  // 获取最大半径，并由此设置节点大小
  const max_graph_radius = d3.min([width - margin.left - margin.right, height - margin.top - margin.bottom]) / 2;
  let nodeSize = ((2 * Math.PI * max_graph_radius / data.nodes.length) * 0.3 / 2);

  // ——————————【数据预处理阶段】————————-
  const {allNodes, nodes, edges} = handelData(data);

  // ——————————【绘图阶段】————————-
  svg
    .attr('viewBox', [-width / 2, -height / 2, width, height]);

  svg = svg
    .call(d3.zoom()
      .scaleExtent([1 / 50, 4])
      .on('zoom', e => {
        svg.attr('transform', e.transform);
      }))
    .append('g');

  // 同心圆分层,画环
  const rings = hierarchyNodeByDegree(allNodes).map((d, index) => ({degree: index}));
  svg
    .append('g')
    .selectAll('circle')
    .data(rings)
    .enter().append('circle')
    .style('fill', 'none')
    .style('stroke-opacity', '0.5')
    .style('stroke', d => setColor(d.degree))
    .attr('r', d => d.degree * max_graph_radius / rings.length);

  // 仿真器
  let simulation = d3.forceSimulation(allNodes)
    .force('charge', d3.forceCollide().radius(0))
    .force('r', d3.forceRadial(d => d.degree * max_graph_radius / rings.length))
    .on('tick', ticked);

  // 节点绘画
  const nodeDrawOption = {nodeSize: 10, setColorByKey: 'degree'}
  const nodeG = drawNodeSvg(svg, allNodes, nodeDrawOption)
  nodeG
    .on('mouseover', overed)
    .on('mouseout', outed)
    .on('click', (e, d) => {
      console.log('在同心圆布局中选择了节点', d);
      callFunSelectNode(d);
    });

  // 边绘画
  const linkData = simulation.nodes().flatMap(leaf => leaf.outgoing);
  const linkDrawOption = {linkType: 'path'}
  const linkG = drawLinkSvg(svg, linkData, linkDrawOption)

  // 选择
  const nodeCircle = nodeG.selectAll('circle');
  const nodeText = nodeG.selectAll('text');

  // // 设置箭头样式
  // let defs = svg.append("defs");
  // let arrowMarker = defs.append("marker")
  //   .attr("id", "arrow")
  //   .attr("markerUnits", "strokeWidth")
  //   .attr("markerWidth", nodeSize+20)
  //   .attr("markerHeight", nodeSize+20)
  //   .attr("viewBox", `0 0 ${nodeSize} ${nodeSize}`)
  //   .attr("refX", `${1.1 * nodeSize}`)
  //   .attr("refY", `6`)
  //   .attr("orient", "auto");
  // let arrow_path = "M2,2 L10,6 L2,10 L6,6 L2,2";
  // arrowMarker.append("path")
  //   .attr("d", arrow_path)
  //   .attr("fill", "#999");

  // 鼠标节点交互事件1
  function overed (event, d) {
    linkG.style('mix-blend-mode', null);
    d3.select(this).attr('font-weight', 'bold');
    d3.selectAll(d.incoming.map(d => d.path)).attr('stroke', colorin).raise();
    d3.selectAll(d.incoming.map(([d]) => d.text)).attr('fill', colorin).attr('font-weight', 'bold');
    d3.selectAll(d.outgoing.map(d => d.path)).attr('stroke', colorout).raise();
    d3.selectAll(d.outgoing.map(([, d]) => d.text)).attr('fill', colorout).attr('font-weight', 'bold');
  }

  // 鼠标节点交互事件2
  function outed (event, d) {
    linkG.style('mix-blend-mode', 'multiply');
    d3.select(this).attr('font-weight', null);
    d3.selectAll(d.incoming.map(d => d.path)).attr('stroke', null);
    d3.selectAll(d.incoming.map(([d]) => d.text)).attr('fill', null).attr('font-weight', null);
    d3.selectAll(d.outgoing.map(d => d.path)).attr('stroke', null);
    d3.selectAll(d.outgoing.map(([, d]) => d.text)).attr('fill', null).attr('font-weight', null);
  }

  /*   // 绘画节点
  function drawNodeSvg (svg, nodes, option = {ndoeSize: 10}) {
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
      .attr('r', option.nodeSize)
      .attr('fill', d => setColor(d.degree))
      .append('title')
      .text(d => d.id);

    const nodesText = nodesG
      .append('text')
      .style('fill', '#000')
      .style('font-size', '15px')
      .style('text-anchor', 'middle')
      .style('cursor', 'default')
      .attr('pointer-events', 'none')
      .text(d => d.label)
      .each(function (d) {
        d.text = this;
      });

    return nodesG
  } */

  function ticked () {
    nodeCircle
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
    nodeText.attr('transform', d => `translate(${d.x},${d.y + 5})`);
    linkG
      .data(simulation.nodes().flatMap(leaf => leaf.outgoing))
      .style('mix-blend-mode', 'multiply')
      .attr('d', ([i, o]) => {
        const path = d3.path();
        path.moveTo(i.x, i.y);
        path.lineTo(o.x, o.y);
        path.closePath();
        return path
      })
      .each(function (d) {
        d.path = this;
      });
  }
}

// 额外封装node
function handelData (data) {
  const allNodes = [];

  const nodes = createNodes(data.nodes, node => {
    allNodes.push(node);
  });

  const edges = createEdges(data.edges, edge => {
    // 排除自指向的结点干扰pathNum
    if (edge.sourceNode !== edge.targetNode) {
      edge.sourceNode.pathNum++;
      edge.targetNode.pathNum++;
      const path = [edge.sourceNode, edge.targetNode]
      edge.sourceNode.outgoing.push(path);
      edge.targetNode.incoming.push(path)
    }
  });

  return {
    allNodes: allNodes.sort((a, b) => b.pathNum - a.pathNum),
    nodes,
    edges
  };
}

function hierarchyNodeByDegree (nodes) {
  const allArr = [];
  let curPathNum = -1;
  let samePathNumArr = [];
  let degree = -1;

  nodes.forEach(d => {
    if (curPathNum !== d.pathNum) {
      allArr.push(samePathNumArr);
      samePathNumArr = [];
      degree++;
      d.degree = degree;
      samePathNumArr.push(d);
      curPathNum = d.pathNum;
    } else {
      d.degree = degree;
      samePathNumArr.push(d)
    }
  });

  allArr.push(samePathNumArr);
  allArr.shift();

  return allArr
}

export default createContric
