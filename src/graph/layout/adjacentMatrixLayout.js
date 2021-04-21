
import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';

function createAdjacentMatrixLayout (data, svg) {
  const colorGroup = d3.scaleOrdinal(data.nodes.map(d => d.group).sort(d3.ascending), d3.schemeCategory10)

  data = dataMatrix(data);
  const color = d3.scaleSequentialSqrt([0, d3.max(data.values, d => d3.max(d))], d3.interpolateOrRd)

  const margin = ({top: 20, right: 1, bottom: 40, left: 50});
  const height = 15; //
  const width = 800;
  const innerHeight = height * data.names.length;

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

  svg
    .attr('viewBox', [-50, -50, width, innerHeight + margin.top + margin.bottom])
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
    .attr('fill', d => colorGroup(d.group))
    .attr('transform', 'translate(12,-30) rotate(-90)')

  svg.append('g')
    .call(yAxis)
    .selectAll('text')
    .data(data.nodes)
    .attr('fill', d => colorGroup(d.group))

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
}

function dataMatrix (data) {
  const n = data.nodes.length;
  const matrix = []
  for (let i = 0; i < n; i++) {
    matrix.push(new Array(n).fill(0))
  }
  const mapNode = new Map(data.nodes.map((d, index) => {
    d.matrixIndex = index;
    return [ d.id, d ];
  }))

  data.edges.forEach(edge => {
    const sourceNode = mapNode.get(edge.source);
    const targetNode = mapNode.get(edge.target);
    matrix[sourceNode.matrixIndex][targetNode.matrixIndex]++;
    // matrix[targetNode.matrixIndex][sourceNode.matrixIndex]++;
  })

  return {
    names: data.nodes.map(d => d.label),
    values: matrix,
    nodes: data.nodes,
    edges: data.edges
  };
}

export default createAdjacentMatrixLayout;
