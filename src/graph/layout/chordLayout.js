import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';

function createChordLayout (data, svg, callFunSelectNode) {
  data = dataMatrix(data)

  const names = data.names === undefined ? d3.range(data.length) : data.names
  const colors = data.colors === undefined ? d3.quantize(d3.interpolateRainbow, names.length) : data.colors
  const width = 500
  const height = width
  const outerRadius = Math.min(width, height) * 0.5 - 60
  const innerRadius = outerRadius - 10
  const color = d3.scaleOrdinal(names, colors)
  const ribbon = d3.ribbon()
    .radius(innerRadius - 1)
    .padAngle(1 / innerRadius)
  const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
  const chord = d3.chord()
    .padAngle(10 / innerRadius)
    .sortSubgroups(d3.descending)
    .sortChords(d3.descending)
  const formatValue = d3.format('d')
  // tickStep = d3.tickStep(0, d3.sum(data.flat()), 100)
  const tickStep = 1
  // console.log(tickStep)

  //* *******************************************

  svg
    .attr('viewBox', [-width / 2, -height / 2, width, height]);

  svg = svg
    .call(d3.zoom()
      .scaleExtent([1 / 2, 4])
      .on('zoom', e => {
        svg.attr('transform', e.transform);
      }))
    .append('g')

  const chords = chord(data);

  const group = svg.append('g')
    .attr('font-size', 10)
    .attr('font-family', 'sans-serif')
    .selectAll('g')
    .data(chords.groups)
    .join('g')
    .on('click', (e, d) => {
      console.log('在 弦图 布局中选择了节点', data.nodes[d.index]);
      callFunSelectNode(data.nodes[d.index]);
    });

  group.append('path')
    .attr('fill', d => color(names[d.index]))
    .attr('d', arc);

  group.append('title')
    .text(d => `${names[d.index]}
  ${formatValue(d.value)}`);

  const groupTick = group.append('g')
    .selectAll('g')
    .data(ticks)
    .join('g')
    .attr('transform', d => `rotate(${d.angle * 180 / Math.PI - 90}) translate(${outerRadius},0)`);

  groupTick.append('line')
    .attr('stroke', 'currentColor')
    .attr('x2', 6);

  groupTick.append('text')
    .attr('stroke', 'grey')
    .attr('x', 8)
    .attr('dy', '0.30em')
    .attr('transform', d => d.angle > Math.PI ? 'rotate(180) translate(-16)' : null)
    .attr('text-anchor', d => d.angle > Math.PI ? 'end' : null)
  // .text(d => d.value);
    .text(d => formatValue(d.value));

  group.select('text')
  // .attr("font-weight", "bold")
    .attr('stroke', 'black')
    .text(function (d) {
      return this.getAttribute('text-anchor') === 'end'
        ? `↑ ${names[d.index]}`
        : `${names[d.index]} ↓`;
    });

  svg.append('g')
    .attr('fill-opacity', 0.8)
    .selectAll('path')
    .data(chords)
    .join('path')
    .style('mix-blend-mode', 'multiply')
    .attr('fill', d => color(names[d.source.index]))
    .attr('d', ribbon)
    .append('title')
    .text(d => `${formatValue(d.source.value)} ${names[d.target.index]} → ${names[d.source.index]}${d.source.index === d.target.index ? '' : `\n${formatValue(d.target.value)} ${names[d.source.index]} → ${names[d.target.index]}`}`);

  function ticks ({startAngle, endAngle, value}) {
    const k = (endAngle - startAngle) / value;
    // console.log(startAngle, endAngle, value, k)
    return d3.range(0, value, tickStep).map(value => {
      return {value, angle: value * k + startAngle};
    });
  }
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
    matrix[targetNode.matrixIndex][sourceNode.matrixIndex]++;
  })

  return Object.assign(matrix, {
    nodes: data.nodes,
    names: data.nodes.map(d => d.label),
    colors: [ '#3957ff', '#d3fe14', '#c9080a', '#fec7f8', '#0b7b3e', '#0bf0e9', '#c203c8', '#fd9b39', '#888593', '#906407', '#98ba7f', '#fe6794', '#10b0ff', '#ac7bff', '#fee7c0', '#964c63', '#1da49c', '#0ad811', '#bbd9fd', '#fe6cfe' ]
  });
}

export default createChordLayout
