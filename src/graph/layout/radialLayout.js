import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';
import {Node, Edge, createNodes, createEdges, setColor, colorin, colorout, colornone} from './object.js';

function dfs (node) {
  if (node.isRootDFS) {
    return
  }
  node.isRootDFS = true;
  node.outgoing.forEach(edge => {
    const childrenNode = edge.targetNode;
    edge.isRootDFS = true;
    dfs(childrenNode)
  })
}

function handelData (data, rootId, allNodeByIdMap) {
  let nodes = createNodes(data.nodes, node => {
    // 新增三个新属性，在这里会派上用场
    node.parentId = undefined;
    node.hierarchyNum = 0;
    node.indegree = 0;
    node.isRootDFS = false;

    allNodeByIdMap.set(node.id, node)
  });
  let edges = createEdges(data.edges, edge => {
    // 新增1个新属性，指能被根通过dfs访问到的边
    edge.isRootDFS = false;
  });

  const hierarchys = []; // 层级金字塔数组（二维数组）
  let curHierarchyNum = 0; // 当前层级

  const queue = []; // 队列，用于辅助【拓扑排序】

  // 过滤掉 自指向结点（去环操作）
  edges = edges.filter(d => {
    if (d.source === d.target) {
      return false
    } else {
      d.sourceNode.outgoing.push(d);
      d.targetNode.incoming.push(d);
      // d.targetNode.indegree++;
      return true;
    }
  })

  // 选取根，并放在第一层级
  // 默认选取方式是选择数组中第一个入度为0的结点
  if (rootId) {
    const root = allNodeByIdMap.get(rootId);
    queue.push(root);
  } else {
    nodes.forEach(d => {
      if (d.incoming.length === 0) {
        queue.push(d);
      }
    })
  }

  // if (queue[0]) {
  //   console.log('根结点是', queue[0])
  // } else {
  //   console.log('没有合适的根结点')
  //   return
  // }

  hierarchys.push([]);

  dfs(queue[0]);

  // 结点的outgoing 和 incoming 全都变成空数组
  // 我只要dfs能访问到的结点
  // 因为要二次过滤边
  nodes = nodes.filter(node => {
    if (node.isRootDFS) {
      node.outgoing = [];
      node.incoming = [];
      return true
    }
  });

  // 第二遍过滤
  edges = edges.filter(d => {
    if (d.isRootDFS) {
      d.sourceNode.outgoing.push(d);
      d.targetNode.incoming.push(d);
      d.targetNode.indegree++;
      return true;
    }
  });

  // 拓扑排序操作
  while (queue.length !== 0) {
    const tempNode = queue.shift()
    if (tempNode.hierarchyNum !== curHierarchyNum) {
      hierarchys.push([]);
      curHierarchyNum++;
    }
    hierarchys[hierarchys.length - 1].push(tempNode);
    // console.log(tempNode.id,tempNode.hierarchyNum)
    tempNode.outgoing.forEach(edge => {
      const targetNode = edge.targetNode;
      // console.log('此时out结点',targetNode)
      targetNode.indegree--;
      if (targetNode.indegree === 0) {
        targetNode.hierarchyNum = tempNode.hierarchyNum + 1;
        queue.push(targetNode);
      }
    })
  }

  // console.log('【层级】', hierarchys)

  // link是不可能跨越两级的，根据这个可以过滤边
  // 同时不需要自转边
  function copyNode (node) {
    return new Node(node.data)
  }

  let newEdges = edges.filter(d => {
    const sourceNode = d.sourceNode;
    const targetNode = d.targetNode;
    if ((targetNode.hierarchyNum - sourceNode.hierarchyNum) === 1) {
      if (!targetNode.parentId) {
        targetNode.parentId = sourceNode.id;
      } else {
        // 多个父亲，就复制一个孩子联系第二个父亲
        const newTargetNodeCopy = copyNode(targetNode);
        newTargetNodeCopy.parentId = sourceNode.id;
        nodes.push(newTargetNodeCopy)
      }
      return true;
    } else {
      return false;
    }
  });

  // console.log('【过滤多余的边后】', newEdges)
  // console.log('【最终版本的结点】', nodes)

  return nodes
}

function createRadialLayout (data, svg, callFunSelectNode, layoutOption = {}) {
  let width = svg.attr('width'),
    height = svg.attr('height');

  // 可视化容器边距参数
  const margin = ({
    top: height / 9,
    right: width / 12,
    bottom: height / 9,
    left: width / 12
  });

  // 获取最大半径，并由此设置节点大小
  const max_graph_radius = d3.min([width - margin.left - margin.right, height - margin.top - margin.bottom]) / 2;
  let nodeSize = ((2 * Math.PI * max_graph_radius / data.nodes.length) * 0.3 / 2);
  let allNodeByIdMap = new Map();

  // 不指定rootId的话默认使用入度为0的结点为根
  // console.log('layoutOption', layoutOption)
  // ——————————【数据预处理阶段】————————-

  const tree = d3.tree()
    .size([2 * Math.PI, max_graph_radius])
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
  const nodes = handelData(data, layoutOption.rootId, allNodeByIdMap);

  let data2 = d3.stratify()
    .id(d => d.id)
    .parentId(d => d.parentId)(nodes);
  const root = tree(data2);

  svg.attr('viewBox', [-width / 2, -height / 2, width, height]);

  // // 根据画布尺寸重新映射节点坐标(未完成)
  // let Xscale = d3.scaleLinear().domain([d3.min(root.descendants().map(d => d.x)), d3.max(root.descendants().map(d => d.x))]).range([0, width - margin.left - margin.right]);
  // let Yscale = d3.scaleLinear().domain([d3.min(root.descendants().map(d => d.y)), d3.max(root.descendants().map(d => d.y))]).range([0, height - margin.top - margin.bottom]);
  // let node_hash = new Map();
  // root.descendants().forEach(item => {
  //   item.x = margin.left + Xscale(item.x);
  //   item.y = margin.top + Yscale(item.y);
  //   node_hash.set(item.data.id, item.data)
  // });

  // 设置箭头样式
  let defs = svg.append('defs');
  let arrowMarker = defs.append('marker')
    .attr('id', 'arrow')
    .attr('markerUnits', 'strokeWidth')
    .attr('markerWidth', nodeSize * 1.5)
    .attr('markerHeight', nodeSize * 1.5)
    .attr('viewBox', `0 0 ${nodeSize} ${nodeSize}`)
    .attr('refX', `${1.1 * nodeSize}`)
    .attr('refY', `6`)
    .attr('orient', 'auto');
  arrowMarker.append('path')
    .attr('d', 'M2,2 L10,6 L2,10 L6,6 L2,2')
    .attr('fill', '#999');

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
      .radius(d => d.y))
    .attr('opacity', 0)
    .transition()
    .duration(1000)
    .delay(2000)
    .attr('opacity', 1)
    .attr('marker-end', 'url(#arrow)');

  const nodesSvg = svg.append('g')
    .selectAll('circle')
    .data(root.descendants())
    .join('circle')
    .attr('r', nodeSize)
    .attr('transform', d => `translate(0,0)`) // 这里可以模拟上一次布局的坐标
    .on('click', (e, d) => {
      console.log('在辐射径向布局中选择了节点', d.data);
      callFunSelectNode(d.data);
    })
    .attr('fill', d => d.children ? 'black' : 'green')
    .attr('x', d => d.x)
    .attr('y', d => d.y)
    .transition()
    .duration(2000)
    .attr('transform', d => `
      rotate(${d.x * 180 / Math.PI - 90})
      translate(${d.y},0) `)
    .on('end', () => {
      nodesSvg.each(function (d) {
        let circle = d3.select(this)
        let point = svg.node().createSVGPoint();// here roor is the svg's id
        point.x = circle.attr('x');// get the circle cx
        point.y = circle.attr('y');// get the circle cy
        let newPoint = point.matrixTransform(circle.node().getCTM());
        svg.append('circle')
          .attr('r', 5)
          .attr('fill', 'red')
          .attr('cx', newPoint.x - width / 2) // 减法操作排除viewBox影响
          .attr('cy', newPoint.y - height / 2) //
      })
    });

  function getElementCoords (element, coords) {
    let ctm = element.getCTM();
    let x = ctm.e + coords.x * ctm.a + coords.y * ctm.c;
    let y = ctm.f + coords.x * ctm.b + coords.y * ctm.d;
    return {x: x, y: y};
  }

  /*     .each(function (d) {
      let circle = d3.select(this)
      console.log(circle)
      let point = svg.node().createSVGPoint();// here roor is the svg's id
      point.x = circle.attr('x');// get the circle cx
      point.y = circle.attr('y');// get the circle cy
      let newPoint = point.matrixTransform(circle.node().getCTM());// new point after the transform
      console.log(circle.attr('transform'));
      console.log(newPoint);
    }); */

  // Pass in the element and its pre-transform coords
  /*   function getElementCoords (element, coords) {
    let ctm = element.getCTM();
    console.log('原始的', coords.x, coords.y, element.getCTM())
    let x = ctm.e + coords.x * ctm.a + coords.y * ctm.c;
    let y = ctm.f + coords.x * ctm.b + coords.y * ctm.d;
    console.log('转化后', x, y)
    return {x: x, y: y};
  }; */
  // Get post-transform coords from the element.

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
    .attr('opacity', 0)
    .transition()
    .duration(1000)
    .delay(2000)
    .attr('opacity', 1)
  /*     .clone(true).lower()
      .attr('stroke', 'white') */
}

export default createRadialLayout
