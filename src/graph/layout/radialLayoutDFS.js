import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';
import {Node, Edge, createNodes, createEdges, setColor, colorin, colorout, colornone} from './object.js';
var allNodeById = new Map();

function handelData (data) {
  const nodes = createNodes(data.nodes, node => {
    // 新增三个新属性，在这里会派上用场
    node.parentId = undefined;
    node.hierarchyNum = 0;

    allNodeById.set(node.id, node)
  });
  var edges = createEdges(data.edges);

  var root = null;

  // 过滤掉 自指向结点（去环操作）
  edges = edges.filter(d => {
    if (d.source === d.target) {
      return false
    } else {
      d.sourceNode.outgoing.push(d);
      d.targetNode.incoming.push(d);
      return true;
    }
  })

  // 选取根，并放在第一层级
  // 默认选取方式是选择数组中第一个入度为0的结点
  nodes.forEach(d => {
    if (d.id === '0') {
      root = d;
    }
  })

  const newNodes = [];

  console.log('根结点是', root)
  dfs(root, {hierarchyNum: -1})

  function dfs (node, parentNode) {
    // 如果已经有一个父母结点且两次算出的hierarchyNum一致，就可以用来copy了
    /**      1              1
    *       / \            / \
    *      2   3   →      2   3
    *       \ /          /     \
    *        4          4       4(copy,不会赋予孩子)
    *        |          |
    *        5          5
    **/
    // 还得多造一个该节点的复制品

    if (node.parentId !== undefined && (parentNode.hierarchyNum + 1) === node.hierarchyNum) {
      console.log('重复结点', node, parentNode)
      const newChildrenNodeCopy = copyNode(node)
      newChildrenNodeCopy.parentId = parentNode.id;
      newNodes.push(newChildrenNodeCopy);
      return
    }

    if (node.parentId !== undefined && (parentNode.hierarchyNum + 1) < node.hierarchyNum) {
      // 尽可能取层级高的父母,否则不要了

    } else {
      node.parentId = parentNode.id;
      node.hierarchyNum = parentNode.hierarchyNum + 1
      newNodes.push(node);
      node.outgoing.forEach(edge => {
        const childrenNode = edge.targetNode;
        dfs(childrenNode, node)
      })
    }
  }

  // link是不可能跨越两级的，根据这个可以过滤边
  // 同时不需要自转边

  function copyNode (node) {
    return new Node(node.data)
  }

  console.log('【最终版本的结点】', newNodes)

  return newNodes
}

function createRadialLayout (data, svg, callFunSelectNode) {
  // ——————————【数据预处理阶段】————————-

  var width = 800
  var radius = 500 / 2

  const tree = d3.tree()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth)
  const nodes = handelData(data)

  var data2 = d3.stratify()
    .id(function (d) { return d.id; })
    .parentId(function (d) { return d.parentId; })
    (nodes);

  //* *************************

  // data = d3.hierarchy(datajson)
  //    .sort((a, b) => d3.ascending(a.data.name, b.data.name))

  const root = tree(data2);

  svg.attr('viewBox', [-800 / 2, -500 / 2, 800, 500]);

  svg = svg.call(d3.zoom()
    .scaleExtent([1 / 50, 4])
    .on('zoom', e => {
      svg.attr('transform', e.transform);
    }))
    .append('g')

  svg.append('g')
    .attr('fill', 'none')
    .attr('stroke', '#555')
    .attr('stroke-opacity', 0.4)
    .attr('stroke-width', 1.5)
    .selectAll('path')
    .data(root.links())
    .join('path')
    .attr('d', d3.linkRadial()
      .angle(d => d.x)
      .radius(d => d.y));

  svg.append('g')
    .selectAll('circle')
    .data(root.descendants())
    .join('circle')
    .attr('transform', d => `
          rotate(${d.x * 180 / Math.PI - 90})
          translate(${d.y},0)
        `)
    .attr('fill', d => d.children ? 'black' : 'green')
    .attr('r', 5)
    .on('click', (e, d) => {
      console.log('在辐射径向布局中选择了节点', d.data);
      callFunSelectNode(d.data);
    })

  svg.append('g')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 10)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-width', 3)
    .selectAll('text')
    .data(root.descendants())
    .join('text')
    .attr('transform', d => `
          rotate(${d.x * 180 / Math.PI - 90}) 
          translate(${d.y},0) 
          rotate(${d.x >= Math.PI ? 180 : 0})
        `)
    .attr('dy', '0.31em')
    .attr('x', d => d.x < Math.PI === !d.children ? 6 : -6)
    .attr('text-anchor', d => d.x < Math.PI === !d.children ? 'start' : 'end')
    .text(d => d.data.id)
    .clone(true).lower()
    .attr('stroke', 'white');
}

export default createRadialLayout
