
import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';
import {Node, Edge, createNodes, createEdges, setColor, colorin, colorout, colornone, allNodeByIdMap, setAllNodeByIdMap} from './object.js';

const rectHeight = 15;
const margin = ({top: 20, right: 1, bottom: 40, left: 50});

function createAdjacentMatrixLayout (data, svg) {
  const height = svg.style('height');
  const width = svg.style('width');

  data = dataMatrix(data);
  // console.log('矩阵数据结束')

  const color = d3.scaleSequentialSqrt([0, d3.max(data.values, d => d3.max(d))], d3.interpolateOrRd)

  const innerHeight = rectHeight * data.names.length;

  const y = d3.scaleBand()
    .domain(data.names)
    .rangeRound([margin.top, margin.top + innerHeight])

  const x = d3.scaleBand()
    .domain(data.names)
    .rangeRound([margin.left, margin.left + data.names.length * 15])

  /* yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSize(0))
    .call(g => g.select(".domain").remove()) */
  const yAxis = g => g
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSize(0))
    .call(g => g.select('.domain').remove())

  const xAxis = g => g
    .call(g => g.append('g')
      .attr('transform', `translate(0,${margin.top})`)
      .call(d3.axisTop(x).ticks(null, 'd'))
      .call(g => g.select('.domain').remove()))

  console.log('轴渲染结束')

  svg
    .attr('viewBox', [-width / 2, -height / 2, width, height])
    .attr('font-family', 'sans-serif')
    .attr('font-size', 10);

  svg = svg
    .call(d3.zoom()
      .scaleExtent([1 / 2, 4])
      .on('zoom', e => {
        svg.attr('transform', e.transform);
      }))
    .append('g')

  svg.append('g')
    .call(xAxis)
    .selectAll('text')
    .data(data.nodes)
    .attr('fill', 'black')
    .attr('transform', 'translate(12,-30) rotate(-90)')

  svg.append('g')
    .call(yAxis)
    .selectAll('text')
    .data(data.nodes)
    .attr('fill', 'black')

  console.log('节点渲染结束')

  svg.append('g')
    .selectAll('g')
    .data(data.values)
    .join('g')
    .attr('transform', (d, i) => `translate(50,${y(data.names[i])})`)
    .selectAll('rect')
    .data(d => d)
    .join('rect')
    .attr('x', (d, i) => (i * 15))
    .attr('width', (d, i) => 15)
    .attr('height', y.bandwidth())
    .attr('fill', d => isNaN(d) ? '#eee' : d === 0 ? '#fff' : color(d))
    .attr('stroke', 'grey')
    .attr('stroke-opacity', 1)
    .append('title')
    .text((d, i) => `${d}`);
  console.log('矩阵块渲染结束')
}

function dataMatrix (data) {
  const nodes = createNodes(data.nodes, (node, index) => {
    node.matrixIndex = index;
  });

  const n = nodes.length;
  const matrix = []
  for (let i = 0; i < n; i++) {
    matrix.push(new Array(n).fill(0))
  }

  const edges = createEdges(data.edges, edge => {
    matrix[edge.sourceNode.matrixIndex][edge.targetNode.matrixIndex]++;
  });

  return {
    names: nodes.map(d => d.id),
    values: matrix,
    nodes: nodes,
    edges: edges
  };
}

export default createAdjacentMatrixLayout;
