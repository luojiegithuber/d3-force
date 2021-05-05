
import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';
import {Node, Edge, createNodes, createEdges, colorin, colorout, colornone} from './object.js';
const colors = d3.scaleOrdinal(d3.schemeCategory10);
export function setColor (x) {
  return colors(x);
}
// const width = 1000

// const allNodes = [];
const nodeRadius = 10;
const ringRadius = 50;


function createContric (data, svg, callFunSelectNode) {
  // ——————————【数据预处理阶段】————————-
  
  const {allNodes,nodes,edges} = handelData(data)
  //createIncomingAndOutgoing(allNodes, edges)
  console.log(allNodes)
  // ——————————【绘图阶段】————————-

  svg
    .attr('viewBox', [-960 / 2, -500 / 2, 960, 500]);

  svg = svg
    .call(d3.zoom()
      .scaleExtent([1 / 50, 4])
      .on('zoom', e => {
        svg.attr('transform', e.transform);
      }))
    .append('g')

  const rings = hierarchyNodeByDegree(allNodes).map((d, index) => {
    return {degree: index}
  });
  // console.log(rings)

  svg
    .append('g')
    .selectAll('circle')
    .data(rings)
    .enter().append('circle')
    .style('fill', 'none')
    .style('stroke-opacity', '0.5')
    .style('stroke', d => setColor(d.degree))
    .attr('r', function (d) {
      return d.degree * ringRadius
    })

  // console.log('所有的节点', allNodes)

  var nodeG = svg
    .append('g')
    .selectAll('circle')
    .data(allNodes)
    .enter()
    .append('g')
    .on('mouseover', overed)
    .on('mouseout', outed)
    .on('click', (e, d) => {
      console.log('在同心圆布局中选择了节点', d);
      callFunSelectNode(d);
    })

  nodeG
    .append('circle')
    .attr('r', nodeRadius)
    .attr('fill', d => setColor(d.degree))
    .append('title')
    .text(function (d) { return `${d.id}` })

  nodeG
    .append('text')
    .style('fill', '#000')
    .style('font-size', '15px')
    .style('text-anchor', 'middle')
    .text(function (d) {
      return (d.label)
    })
    .each(function (d) { d.text = this; })

  var node = nodeG.selectAll('circle')
  var text = nodeG.selectAll('text')
  // console.log(node)

  var linksFun = d3
    .forceLink(edges)
    .id(function (d) {
      return d.id;
    })
    .distance(d => 50)

  var simulation = d3.forceSimulation(allNodes)
    .force('charge', d3.forceCollide().radius(0))
    //.force('link', linksFun)
    .force('r', d3.forceRadial(function (d) { return d.degree * ringRadius; }))
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
    node
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; });

    text.attr('transform', function (d) {
      return 'translate(' + d.x + ',' + (d.y + 5) + ')';
    });

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
function handelData (data) {
  const allNodes = [];

  const nodes = createNodes(data.nodes,node => {
    allNodes.push(node);
  });

  const edges = createEdges(data.edges,edge => {
    //排除自指向的结点干扰pathNum
    if(edge.sourceNode !== edge.targetNode ){
      edge.sourceNode.pathNum++;
      edge.targetNode.pathNum++;
  
      const path = [edge.sourceNode, edge.targetNode]
  
      edge.sourceNode.outgoing.push(path);
      edge.targetNode.incoming.push(path)
    }

  });


  return {
    allNodes:allNodes.sort((a, b) => b.pathNum - a.pathNum),
    nodes,
    edges,
  };
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


export default createContric
