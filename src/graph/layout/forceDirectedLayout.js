
import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';
import {createNodes, createEdges, drawNodeSvg, updateNodeSvg} from './object.js';

function createForceDirectedGraph_SVG2 (originalData, svg, callFunSelectNode, option, callFunShowNodeContextMenu) {
  let width = svg.attr('width'),
    height = svg.attr('height');

  // 可视化容器边距参数
  const margin = ({
    top: height / 9,
    right: width / 12,
    bottom: height / 9,
    left: width / 12
  });

  var allNodeByIdMap = new Map();
  var allLinkByIdMap = new Map();

  const max_radius = d3.min([width - margin.left - margin.right, height - margin.top - margin.bottom]) / 2;
  let nodeSize = ((2 * Math.PI * max_radius / originalData.nodes.length) * 0.3 / 2);

  /*   const nodes = createNodes(originalData.nodes);
  const links = createEdges(originalData.edges); */
  var a = {
    'id': 'a',
    'label': 'a',
    'group': '1'
  };
  var b = {
    'id': 'b',
    'label': 'b',
    'group': '2'
  };
  var c = {
    'id': 'c',
    'label': 'c',
    'group': '3'
  };

  var alink = {
    'id': '11',
    'source': 'a',
    'target': 'b',
    'sourceNode': a,
    'targetNode': b
  };
  var blink = {
    'id': '22',
    'source': 'b',
    'target': 'c',
    'sourceNode': b,
    'targetNode': c
  };
  var clink = {
    'id': '33',
    'source': 'c',
    'target': 'a',
    'sourceNode': c,
    'targetNode': a
  };
  /*
  var nodes = [a, b, c]
  var links = [alink, blink, clink] */

  var nodes = createNodes(originalData.nodes, node => {
    allNodeByIdMap.set(node.id, node)
  });
  var links = createEdges(originalData.edges, link => {
    allLinkByIdMap.set(link.id, link)
  });

  /*   nodes.push(a)
  nodes.push(b)
  nodes.push(c)

  links.push(alink); // Add a-b.
  links.push(blink); // Add b-c.
  links.push(clink); // Add c-a. */

  let simulation = d3.forceSimulation();
  simulation.nodes(nodes).on('tick', ticked);
  simulation
    .force('link', d3.forceLink(links).id(d => d.id).distance(max_radius / 2))
    .force('charge', d3.forceManyBody().strength(-max_radius).distanceMax(max_radius * 2))
    .force('center', d3.forceCenter().x(width / 2).y(height / 2));

  svg = svg
    .call(d3.zoom()
      .scaleExtent([1 / 50, 4])
      .on('zoom', e => {
        svg.attr('transform', e.transform);
      }))
    .append('g');
  var link = svg.append('g').attr('class', 'links').attr('stroke', '#ccc').attr('stroke-width', 1.5).selectAll('.link');
  var nodeRootG = svg.append('g').attr('class', 'nodes')
  var nodesG = null;

  restart();
  /*   var g = svg.append('g').attr('transform', 'translate(' + 1000 / 2 + ',' + 800 / 2 + ')');
  const nodeDrawOption = {nodeSize: 8, setColorByKey: 'group', isPackage: false}
  var nodeG = drawNodeSvg(g, nodes, nodeDrawOption)

  var link = g.append('g').attr('stroke', '#000').attr('stroke-width', 1.5).selectAll('.link');
  restart();
 */
  /*   d3.timeout(function () {
    links.push(alink); // Add a-b.
    links.push(blink); // Add b-c.
    links.push(clink); // Add c-a.
    restart();
  }, 1000); */

  /*   var d;
  d3.interval(function () {
    d = nodes.pop(); // Remove c.
    restart();
  }, 2000, d3.now());

  d3.interval(function () {
    nodes.push(d); // Re-add c.
  }, 2000, d3.now() + 1000); */

  function restart () {
    nodesG = updateNodeSvg(nodeRootG, nodes)

    // Apply the general update pattern to the links.
    link = link.data(links, function (d) { return d.id; });
    link.exit().remove();
    link = link.enter().append('line').merge(link);

    // Update and restart the simulation.
    simulation.nodes(nodes);
    simulation.force('link').links(links);
    simulation.alpha(1).restart();
  }

  function ticked () {
    nodesG
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .on('click', (e, d) => {
        console.log('在力导向布局中选择了节点', d);
        callFunSelectNode(d)
      })
      .on('contextmenu', (e, d) => {
        callFunShowNodeContextMenu({
          node: d,
          position: [e.clientX, e.clientY]
        })
        e.preventDefault();
      })
      .call(
        d3.drag()
          .on('start', dragstart)
          .on('drag', dragg)
          .on('end', dragend)
      );

    link.attr('x1', function (d) { return d.sourceNode.x; })
      .attr('y1', function (d) { return d.sourceNode.y; })
      .attr('x2', function (d) { return d.targetNode.x; })
      .attr('y2', function (d) { return d.targetNode.y; });
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

  function addNewGraph (obj) {
    const newGraph = obj.newGraph;
    const newNodes = newGraph.nodes.filter(node => {
      return !allNodeByIdMap.has(node.guid);
    });
    const newLinks = newGraph.edges.filter(link => {
      return !allLinkByIdMap.has(link.guid);
    });

    console.log('新的图数据', newGraph)
    nodes.push(...createNodes(newNodes));
    links.push(...createEdges(newLinks));
    restart();
  }

  return {
    addNewGraph
  }
}
export default createForceDirectedGraph_SVG2
