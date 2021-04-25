import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';

const orderFun = {
  byId: (a, b) => d3.ascending(a.id, b.id),
  byLabel: (a, b) => d3.ascending(a.data.label, b.data.label),
  byGroup: (a, b) => d3.ascending(a.group, b.group),
  byPathNum: (a, b) => d3.ascending(b.pathNum, a.pathNum)
}

function createGraph (data) {
  const nodes = data.nodes.map(d => ({
    id: d.id,
    sourceLinks: [],
    targetLinks: [],
    group: d.group,
    pathNum: 0,
    data: d
  }));

  const nodeById = new Map(nodes.map(d => [d.id, d]));

  const links = data.edges.map(edge => {
    const sourceNode = nodeById.get(edge.source);
    const targetNode = nodeById.get(edge.target);
    sourceNode.pathNum++;
    targetNode.pathNum++;

    const link = {
      source: sourceNode,
      target: targetNode,
      value: edge.weight,
      data: edge
    }

    sourceNode.sourceLinks.push(link);
    targetNode.targetLinks.push(link);

    return link
  });

  return {nodes, links};
}

function createArcLayout (data, svg, callFunSelectNode) {
  let graph = createGraph(data)

  const color = d3.scaleOrdinal(graph.nodes.map(d => d.group).sort(d3.ascending), d3.schemeCategory10)
  const step = 30

  const margin = ({top: 20, right: 20, bottom: 20, left: 100})
  // const margin = ({top: 0, right: 0, bottom: 0, left: 0})

  const height = (data.nodes.length - 1) * step + margin.top + margin.bottom
  // const width = 800;
  const y = d3.scalePoint(graph.nodes.map(d => d.id).sort(d3.ascending), [margin.top, height - margin.bottom])

  svg = svg
    .call(d3.zoom()
      .scaleExtent([1 / 2, 4])
      .on('zoom', zoomed))
    .append('g')
  // .attr("transform",`rotate(-90) translate(-${height-100},0)`)

  /* var buttonDiv = document.createElement('div');
  buttonDiv.innerHTML = `
    【排序指标】
    <select id="orderBySelectInArcLayout">
      <option value="byId" selected="selected">ID</option>
      <option value="byGroup">分类</option>
      <option value="byLabel"">文本</option>
      <option value="byPathNum">度数</option>
    </select>
    `;

  const svgHTML = svg._groups[0][0]
  const svgHTMLparent = svgHTML.parentNode
  // console.log(document.getElementById('canvas').innerHTML)
  // const svgHTMLparent = document.getElementById('canvas');

  svgHTMLparent.insertBefore(buttonDiv, svgHTML); */

  function zoomed (e) {
    svg.attr('transform', e.transform);
  }

  svg.append('style').text(`

    .hover path {
      stroke: #ccc;
    }

    .hover text {
      fill: #ccc;
    }

    .hover g.primary text {
      fill: black;
      font-weight: bold;
    }

    .hover g.secondary text {
      fill: #333;
    }

    .hover path.primary {
      stroke: #333;
      stroke-opacity: 1;
    }


  `);

  const label = svg.append('g')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 10)
    .attr('text-anchor', 'end')
    .selectAll('g')
    .data(graph.nodes)
    .join('g')
    .attr('transform', d => `translate(${margin.left},${d.y = y(d.id)})`)
    .call(g => g.append('text')
      .attr('x', -6)
      .attr('dy', '0.35em')
      .attr('fill', d => d3.lab(color(d.group)).darker(2))
      .text(d => d.data.label))
    .call(g => g.append('circle')
      .attr('r', 5)
      .attr('fill', d => color(d.group)));

  const path = svg.insert('g', '*')
    .attr('fill', 'none')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', 1.5)
    .selectAll('path')
    .data(graph.links)
    .join('path')
    .attr('stroke', d => d.source.group === d.target.group ? color(d.source.group) : '#aaa')
    .attr('d', arc);

  const overlay = svg.append('g')
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .selectAll('rect')
    .data(graph.nodes)
    .join('rect')
    .attr('width', margin.left + 40)
    .attr('height', step)
    .attr('y', d => y(d.id) - step / 2)
    .on('mouseover', (e, d) => {
      svg.classed('hover', true);
      label.classed('primary', n => n === d);
      label.classed('secondary', n => n.sourceLinks.some(l => l.target === d) || n.targetLinks.some(l => l.source === d));
      path.classed('primary', l => l.source === d || l.target === d).filter('.primary').raise();
    })
    .on('mouseout', (e, d) => {
      svg.classed('hover', false);
      label.classed('primary', false);
      label.classed('secondary', false);
      path.classed('primary', false).order();
    })
    .on('click', nodeSelectChange);

  function nodeSelectChange (e, d) {
    console.log('在弧线布局中选择了节点', d.data);
    callFunSelectNode(d.data)
  }

  // 暴露给外界自行调用更新函数
  // 当然同时暴露了orderFun
  function update (sortFun) {
    // console.log(sortFun)
    y.domain(graph.nodes.sort(sortFun).map(d => d.id));

    const t = svg.transition()
      .duration(750);

    label.transition(t)
      .delay((d, i) => i * 20)
      .attrTween('transform', d => {
        const i = d3.interpolateNumber(d.y, y(d.id));
        return t => `translate(${margin.left},${d.y = i(t)})`;
      });

    path.transition(t)
      .duration(750 + graph.nodes.length * 20)
      .attrTween('d', d => () => arc(d));

    overlay.transition(t)
      .delay((d, i) => i * 20)
      .attr('y', d => y(d.id) - step / 2);
  }

  function arc (d) {
    const y1 = d.source.y;
    const y2 = d.target.y;
    const r = Math.abs(y2 - y1) / 2;
    return `M${margin.left},${y1}A${r},${r} 0,0,${y1 < y2 ? 1 : 0} ${margin.left},${y2}`;
  }

  return {
    orderFun,
    update
  }
}

export default createArcLayout;
