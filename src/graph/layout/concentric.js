
import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';
const colorin = '#00f'
const colorout = '#f00'
const colornone = '#ccc'
// const width = 1000
// const radius = width / 2
// const allNodes = [];
var allNodeMap = null;

function createContric (data, svg, callFunSelectNode) {
  const edges = data.edges;
  const allNodes = packingNode(data).sort((a, b) => b.pathNum - a.pathNum)
  console.log('【封装后的nodes】', allNodes);
  console.log('【分层后的nodes】', hierarchyNodeByDegree(allNodes));
  bilink(allNodes, edges)

  svg
    .attr('viewBox', [-960 / 2, -500 / 2, 960, 500]);

  svg = svg
    .call(d3.zoom()
      .scaleExtent([1 / 2, 4])
      .on('zoom', e => {
        svg.attr('transform', e.transform);
      }))
    .append('g')

  // 颜色比例尺（固定10种颜色）
  const colors = d3.scaleOrdinal(d3.schemeCategory10);
  function colorNode (d) {
    return colors(d.degree);
  }

  // const svg = d3.select('svg')

  const rings = hierarchyNodeByDegree(allNodes).map((d, index) => {
    return {degree: index}
  });
  console.log(rings)

  svg
    .append('g')
    .selectAll('circle')
    .data(rings)
    .enter().append('circle')
    .style('fill', 'none')
    .style('stroke-opacity', '0.5')
    .style('stroke', colorNode)
    .attr('r', function (d) {
      return d.degree * 50
    })

  console.log('所有的节点', allNodes)

  var nodeG = svg
    .append('g')
    .selectAll('circle')
    .data(allNodes)
    .enter()
    .append('g')
    .on('mouseover', overed)
    .on('mouseout', outed)
    .on('click', (e, d) => {
      console.log('在同心圆布局中选择了节点', d.data);
      callFunSelectNode(d.data);
    })

  nodeG
    .append('circle')
    .attr('r', 10)
    .attr('fill', function (d) { return colorNode(d); })
    .append('title')
    .attr('width', 100)
    .attr('height', 100)
    .text(function (d) { return `${d.id}       ` })

  nodeG
    .append('text')
    .style('fill', '#000')
    .style('font-size', '15px')
    .style('text-anchor', 'middle')
    .text(function (d) {
      return (d.id)
    })
    .each(function (d) { d.text = this; })

  var node = nodeG.selectAll('circle')
  var text = nodeG.selectAll('text')
  console.log(node)

  var linksFun = d3
    .forceLink()
    .id(function (d) {
      return d.id;
    });

  var simulation = d3.forceSimulation(allNodes)
    .force('charge', d3.forceCollide().radius(0))
    .force('link', linksFun)
    .force('r', d3.forceRadial(function (d) { return d.degree * 50; }))
    .on('tick', ticked);

    /* simulation.force("link") // 绘制边
        .links(edges); */

  var edge = svg
    .append('g')
    .lower()
    .attr('stroke', colornone)
    .attr('fill', 'none')
    .selectAll('path')
    .data(simulation.nodes().flatMap(leaf => leaf.outgoing))
    .enter().append('path')

  function overed (event, d) {
    edge.style('mix-blend-mode', null);
    d3.select(this).attr('font-weight', 'bold');
    d3.selectAll(d.incoming.map(d => d.path)).attr('stroke', colorin).raise();
    d3.selectAll(d.incoming.map(([d]) => d.text)).attr('fill', colorin).attr('font-weight', 'bold');
    d3.selectAll(d.outgoing.map(d => d.path)).attr('stroke', colorout).raise();
    d3.selectAll(d.outgoing.map(([, d]) => d.text)).attr('fill', colorout).attr('font-weight', 'bold');
  }

  function outed (event, d) {
    edge.style('mix-blend-mode', 'multiply');
    d3.select(this).attr('font-weight', null);
    d3.selectAll(d.incoming.map(d => d.path)).attr('stroke', null);
    d3.selectAll(d.incoming.map(([d]) => d.text)).attr('fill', null).attr('font-weight', null);
    d3.selectAll(d.outgoing.map(d => d.path)).attr('stroke', null);
    d3.selectAll(d.outgoing.map(([, d]) => d.text)).attr('fill', null).attr('font-weight', null);
  }

  function ticked () {
    // console.log(1)

    node
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; });

    text.attr('transform', function (d) {
      return 'translate(' + d.x + ',' + (d.y + 5) + ')';
    });

    // if(edge)edge.selectAll("path").remove()
    edge
      .data(simulation.nodes().flatMap(leaf => leaf.outgoing))
      .style('mix-blend-mode', 'multiply')
      .attr('d', ([i, o]) => {
        const path = d3.path();
        path.moveTo(i.x, i.y);
        path.lineTo(o.x, o.y);
        path.closePath();
        return path
      })
      .each(function (d) { d.path = this; });
  }
}

// 额外封装node
function packingNode (data) {
  const nodes = data.nodes;
  const edges = data.edges;
  function Node (obj) {
    this.id = obj.id;
    this.pathNum = 0;
    this.data = obj;
    this.incoming = [];
    this.outgoing = [];
  }

  const allNodes = [];

  allNodeMap = new Map(nodes.map(d => {
    const node = new Node(d);
    allNodes.push(node)
    return [d.id, node]
  }))

  edges.forEach(edge => {
    const sourceNode = allNodeMap.get(edge.source);
    const targetNode = allNodeMap.get(edge.target);

    sourceNode.pathNum++;
    targetNode.pathNum++;
  })

  return allNodes;
}

function hierarchyNodeByDegree (nodes) {
  const allArr = [];
  let curPathNum = -1;
  let samePathNumArr = [];
  // let headNode;
  let degree = -1;

  nodes.forEach(d => {
    if (curPathNum !== d.pathNum) {
      allArr.push(samePathNumArr);
      samePathNumArr = [];
      degree++;
      d.degree = degree;
      samePathNumArr.push(d)
      curPathNum = d.pathNum;
    } else {
      d.degree = degree;
      samePathNumArr.push(d)
    }
  })

  allArr.push(samePathNumArr)
  allArr.shift()
  console.log('allArr', allArr);

  return allArr
}

// 这一步根据import生成incoming
function bilink (nodes, edges) {
  console.log('【根】', nodes, edges)
  edges.forEach(edge => {
    const sourceNode = allNodeMap.get(edge.source);
    const targetNode = allNodeMap.get(edge.target);

    const path = [sourceNode, targetNode]

    sourceNode.outgoing.push(path);
    targetNode.incoming.push(path)
  })
}

export default createContric
