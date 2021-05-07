import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';
import {Node, Edge, createNodes, createEdges, setColor, colorin, colorout, colornone, allNodeByIdMap, setAllNodeByIdMap} from './object.js';

const orderFun = {
  byId: (a, b) => d3.ascending(a.id, b.id),
  byLabel: (a, b) => d3.ascending(a.data.label, b.data.label),
  byGroup: (a, b) => d3.ascending(a.group, b.group),
  byPathNum: (a, b) => d3.ascending(b.pathNum, a.pathNum)
}

function createGraph (data) {
  const nodes = createNodes(data.nodes, node => {
    // allNodeByIdMap.set(node.id, node)
  })

  const edges = createEdges(data.edges, edge => {
    edge.sourceNode.pathNum++;
    edge.targetNode.pathNum++;
    edge.sourceNode.incoming.push(edge);
    edge.targetNode.outgoing.push(edge);
  })

  return {nodes, edges};
}

function createArcLayout (data, svg, callFunSelectNode) {
  let graph = createGraph(data)
  console.log(graph)

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
      .text(d => d.label))
    .call(g => g.append('circle')
      .attr('r', 5)
      .attr('fill', d => color(d.group)));

  const path = svg.insert('g', '*')
    .attr('fill', 'none')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', 1.5)
    .selectAll('path')
    .data(graph.edges)
    .join('path')
    .attr('stroke', d => d.sourceNode.group === d.targetNode.group ? color(d.sourceNode.group) : '#aaa')
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
      label.classed('secondary', n => n.incoming.some(l => l.targetNode === d) || n.outgoing.some(l => l.sourceNode === d));
      path.classed('primary', l => l.sourceNode === d || l.targetNode === d).filter('.primary').raise();
    })
    .on('mouseout', (e, d) => {
      svg.classed('hover', false);
      label.classed('primary', false);
      label.classed('secondary', false);
      path.classed('primary', false).order();
    })
    .on('click', nodeSelectChange);

  function nodeSelectChange (e, d) {
    console.log('在弧线布局中选择了节点', d);
    callFunSelectNode(d)
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
    const y1 = d.sourceNode.y;
    const y2 = d.targetNode.y;
    const r = Math.abs(y2 - y1) / 2;
    return `M${margin.left},${y1}A${r},${r} 0,0,${y1 < y2 ? 1 : 0} ${margin.left},${y2}`;
  }

  return {
    orderFun,
    update
  }
}

export default createArcLayout;
