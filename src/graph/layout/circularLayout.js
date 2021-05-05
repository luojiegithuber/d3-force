import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';
import {Node, Edge, createNodes, createEdges, setColor, colorin, colorout, colornone} from './object.js';

const width = 960
const radius = 500

const tree = d3.cluster()
  .size([2 * Math.PI, radius - 100])

function createCircularLayout (data, svg, beta = 0.85, callFunSelectNode) {
  const line = d3.lineRadial()
    .curve(d3.curveBundle.beta(beta)) // d3.lineRadial.curve()方法用于为lineRadial绘制曲线。
    .radius(d => d.y) // 它设置或获取半径访问器。如果提供了半径，则它必须是数字或返回代表半径的数字的函数。
    .angle(d => d.x) // 设置或返回角度访问器。如果提供了角度，则它必须是数字或返回表示弧度角的数字的函数。

  const color = d3.scaleOrdinal(data.nodes.map(d => d.group).sort(d3.ascending), d3.schemeCategory10)
  data = handelData(data)

  const root = tree(createIncomingAndOutgoing(d3.hierarchy(data)
    .sort((a, b) => d3.ascending(b.data.pathNum, a.data.pathNum))));
    // ascending计算两个值的自然顺序

  console.log('rootTree', root)

  svg = svg
    .attr('viewBox', [-width / 2, -width / 2, width, width])
    .call(d3.zoom()
      .scaleExtent([1 / 50, 4])
      .on('zoom', e => {
        svg.attr('transform', e.transform)
      }))
    .append('g')

  const node = svg.append('g')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 30)
    .selectAll('g')
    .data(root.leaves())

  var g = node.enter().append('g')
    .on('click', (e, d) => {
      console.log('在 圆形/捆图 布局中选择了节点', d.data);
      callFunSelectNode(d.data);
    })
    .on('mouseover', overed)
    .on('mouseout', outed)

  g
    .attr('transform', d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y + 20},0) rotate(${-d.x * 180 / Math.PI + 90})`)
    .append('circle')
    .style('fill', d => '#ff9e6d')
    .style('stroke', '#000')
    .attr('r', 20)

  g
    .append('text')
    .attr('transform', d => `translate(0,10)`)
    .style('fill', '#000')
    .style('font-size', '30px')
    .style('text-anchor', 'middle')
    .text(function (d) {
       return (d.data.id)
    })
    .each(function (d) { d.text = this; })
    // .on('mouseover', overed)
    // .on('mouseout', outed)

  // console.log('flatmap', root.leaves().flatMap(leaf => leaf.outgoing))

  const link = svg.append('g')
    .attr('stroke', colornone)
    .attr('fill', 'none')
    .selectAll('path')
    .data(root.leaves().flatMap(leaf => leaf.outgoing))
    .join('path')
    .style('mix-blend-mode', 'multiply')
    .attr('d', ([i, o]) => line(i.path(o)))
    .each(function (d) { d.path = this; });

  // console.log('【link】', link)

  function overed (event, d) {
    link.style('mix-blend-mode', null);
    d3.select(this).attr('font-weight', 'bold');
    d3.selectAll(d.incoming.map(d => d.path)).attr('stroke', colorin).raise();
    d3.selectAll(d.incoming.map(([d]) => d.text)).attr('fill', colorin).attr('font-weight', 'bold');
    d3.selectAll(d.outgoing.map(d => d.path)).attr('stroke', colorout).raise();
    d3.selectAll(d.outgoing.map(([, d]) => d.text)).attr('fill', colorout).attr('font-weight', 'bold');
  }

  function outed (event, d) {
    link.style('mix-blend-mode', 'multiply');
    d3.select(this).attr('font-weight', null);
    d3.selectAll(d.incoming.map(d => d.path)).attr('stroke', null);
    d3.selectAll(d.incoming.map(([d]) => d.text)).attr('fill', null).attr('font-weight', null);
    d3.selectAll(d.outgoing.map(d => d.path)).attr('stroke', null);
    d3.selectAll(d.outgoing.map(([, d]) => d.text)).attr('fill', null).attr('font-weight', null);
  }

  // 数据分层，使其变成d3.hierarchy能处理的格式
  function handelData (data) {

    const root = new Node({id: 'root'});
    root.children = [];

    const nodes = createNodes(data.nodes,node => {
      root.children.push(node)
    });
    const edges = createEdges(data.edges,edge => {
      edge.sourceNode.pathNum++;
      edge.targetNode.pathNum++;
    });

    root.edges = edges;

    return root
  }

  // 这一步根据import生成incoming
  // 在这里的时候结点已经是二次封装了
  function createIncomingAndOutgoing (root) {
    const treenodes = root.leaves();
    const allTreeNodeByIdMap = new Map(treenodes.map(d => [d.data.id, d]));

    treenodes.forEach(treenode => {
      treenode.incoming = [];
      treenode.outgoing = [];
      treenode.pathNum = treenode.pathNum;
    })

    const edges = root.data.edges;

    edges.forEach(edge => {
      const sourceTreeNode = allTreeNodeByIdMap.get(edge.source);
      const targetTreeNode = allTreeNodeByIdMap.get(edge.target);

      const path = [sourceTreeNode, targetTreeNode]

      sourceTreeNode.outgoing.push(path);
      targetTreeNode.incoming.push(path)
    })

    return root;
  }
}

export default createCircularLayout;
