
import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';
import {createNodes, createEdges, drawNodeSvg, updateNodeSvg, updateLinkSvg, moveNode, moveLink} from './object.js';

function createForceDirectedGraph (originalData, svg, callFunSelectNode, option, callFunShowNodeContextMenu) {
  const width = svg.attr('width');
  const height = svg.attr('height');

  // 可视化容器边距参数
  const margin = ({
    top: height / 9,
    right: width / 12,
    bottom: height / 9,
    left: width / 12
  });

  var allNodeByIdMap = new Map();
  var allLinkByIdMap = new Map();

  const maxRadius = d3.min([width - margin.left - margin.right, height - margin.top - margin.bottom]) / 2;
  let nodeSize = ((2 * Math.PI * maxRadius / originalData.nodes.length) * 0.3 / 2);

  var nodes = createNodes(originalData.nodes, node => {
    allNodeByIdMap.set(node.id, node)
  });
  var links = createEdges(originalData.edges, link => {
    allLinkByIdMap.set(link.id, link)
  });

  const simulation = d3.forceSimulation();
  simulation.nodes(nodes).on('tick', ticked);
  simulation
    .force('link', d3.forceLink(links).id(d => d.id).distance(maxRadius / 2))
    .force('charge', d3.forceManyBody().strength(-maxRadius).distanceMax(maxRadius * 2))
    .force('center', d3.forceCenter().x(width / 2).y(height / 2));

  svg = svg
    .call(d3.zoom()
      .scaleExtent([1 / 50, 4])
      .on('zoom', e => {
        svg.attr('transform', e.transform);
      }))
    .append('g');

  // 点和边的骨架设置
  var linkRootG = svg.append('g').attr('class', 'links')
  var linkG = null;
  var nodeRootG = svg.append('g').attr('class', 'nodes')
  var nodeG = null;

  // 初始化
  restart();

  // 增量重绘函数
  function restart () {
    // 节点绘制更新
    nodeG = updateNodeSvg(nodeRootG, nodes, {
      nodeSize: nodeSize,
      setColorByKey: 'group',
      isPackage: false
    })
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

    // 边绘制/更新
    linkG = updateLinkSvg(linkRootG, links).on('click', (e, d) => {
      console.log('在力导向布局中选择了边', d);
    }).selectAll('path')

    // 仿真器更新
    simulation.nodes(nodes);
    simulation.force('link').links(links);
    simulation.alpha(1).restart();
  }

  function ticked () {
    moveNode(nodeG); // 对其中的g transform translate
    moveLink(linkG); // 对path进行设置
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

  // 已经扩展过得的节点再次扩展
  function expandGraph (node) {
    if (node.isExpandChildren) {
      nodes.push(...node.expandChildrenNode);
      links.push(...node.expandChildrenLink);
      node.expandChildrenNode.forEach(childNode => {
        expandGraph(childNode)
      })
    }
  }

  // 增量函数
  /* obj {
  *    node: 发出请求的单个节点
  *    newGraph: 新的图数据
  *  }
  */
  function addNewGraph (obj) {
    const rootNode = obj.node;
    const newGraph = obj.newGraph;

    if (rootNode.isExpandChildren) {
      expandGraph(rootNode)
    } else {
    // 过滤原本存在的节点
      const newNodes = newGraph.nodes.filter(node => {
        if (allNodeByIdMap.has(node.guid)) {
        // 如果已经存在，过滤
          return false;
        } else {
          allNodeByIdMap.set(node.guid, node);
          return true
        }
      });

      // 同上
      const newLinks = newGraph.edges.filter(link => {
        if (allLinkByIdMap.has(link.guid)) {
        // 如果已经存在，过滤
          return false;
        } else {
          allLinkByIdMap.set(link.guid, link);
          return true
        }
      });

      const newChildrenNodes = createNodes(newNodes);
      rootNode.expandChildrenNode = newChildrenNodes;
      rootNode.isExpandChildNodeMap = {}; // 根据id判断是不是子节点
      rootNode.expandChildrenNode.forEach(d => {
        rootNode.isExpandChildNodeMap[d.id] = d;
      });

      const newChildrenLinks = createEdges(newLinks);
      rootNode.expandChildrenLink = newChildrenLinks;
      rootNode.isExpandChildLinkMap = {}; // 根据id判断是不是子线
      rootNode.expandChildrenLink.forEach(d => {
        rootNode.isExpandChildLinkMap[d.id] = d;
      });

      nodes.push(...newChildrenNodes);
      links.push(...newChildrenLinks);

      rootNode.isExpandChildren = true; // 表明扩展过了
    }

    restart();
  }

  function shrinkNode (rootNode) {
    if (!rootNode.isExpandChildren) {
      return
    }
    nodes = nodes.filter(node => {
      if (rootNode.isExpandChildNodeMap[node.id]) {
        node.isShrink = true;
        return false;
      } else {
        return true;
      }
    })
    links = links.filter(link => {
      if (rootNode.isExpandChildLinkMap[link.id]) {
        link.isShrink = true;
        return false;
      } else {
        return true;
      }
    })
    // dfs 收缩
    rootNode.expandChildrenNode.forEach(childNode => {
      shrinkNode(childNode);
    }

    )
    restart();
  }

  return {
    addNewGraph,
    shrinkNode
  }
}
export default createForceDirectedGraph
