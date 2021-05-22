import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';
import {
  createNodes,
  createEdges,
  updateNodeSvg,
  updateLinkSvg,
  moveNode,
  moveLink,
  highlightNode
} from './object.js';

function createForceDirectedGraph (originalData, svg, callFunSelectNode, option, callFunShowNodeContextMenu) {
  // 获取画布尺寸
  const width = svg.attr('width');
  const height = svg.attr('height');

  // 可视化容器边距参数
  const margin = ({
    top: height / 9,
    right: width / 12,
    bottom: height / 9,
    left: width / 12
  });

  // 点边哈希记录
  var allNodeByIdMap = new Map();
  var allLinkByIdMap = new Map();

  // 当前操作节点
  var curNodeSelection = null; // d3格式的节点

  // 根据节点个数计算初始节点大小，最小半径为15
  const maxRadius = d3.min([width - margin.left - margin.right, height - margin.top - margin.bottom]) / 2;
  const nodeSize = d3.max([((2 * Math.PI * maxRadius / originalData.nodes.length) * 0.3 / 2), 18]);

  // 获取节点及边数据，防止污染原始数据
  var nodes = createNodes(originalData.nodes, node => {
    allNodeByIdMap.set(node.id, node)
  });
  var links = createEdges(originalData.edges, link => {
    allLinkByIdMap.set(link.id, link)
  });

  // // 连边距离编码
  // const linkDistance = d3
  //   .scaleOrdinal()
  //   .domain([
  //     'TABLE',
  //     'BusinessCatalog',
  //     'BusinessLogicEntity',
  //     'BusinessLogicEntityColumn',
  //     'DATABASE',
  //     'COLUMN',
  //     'JOB',
  //     'NODE',
  //     'ColumnLineage'])
  //   .range(d3.range(maxRadius / 1.75, maxRadius * 9));

  // 力仿真器
  const simulation = d3.forceSimulation();
  simulation.nodes(nodes).on('tick', ticked);
  simulation
    // .force('link', d3.forceLink(links).id(d => d.id).distance(d => linkDistance(d.group)))
    .force('link', d3.forceLink(links).id(d => d.id).distance(maxRadius/1.75))
    .force('charge', d3.forceManyBody().strength(-maxRadius).distanceMax(maxRadius * 2))
    .force('center', d3.forceCenter().x(width / 2).y(height / 2))
    .force('collide', d3.forceCollide().strength(1).iterations(10))

  svg = svg
    // 放缩事件
    .call(d3.zoom()
      .scaleExtent([1 / 10, 8])
      .on('zoom', e => {
        svg.attr('transform', e.transform);
      }))
    // 取消模态对话框菜单
    .on('click', (e, d) => {
      callFunShowNodeContextMenu(null)
    })
    .append('g');

  // 设置连边箭头样式
  let defs = svg.append('defs');
  let arrowMarker = defs.append('marker')
    .attr('id', 'arrow')
    .attr('markerUnits', 'strokeWidth')
    .attr('markerWidth', nodeSize / 2)
    .attr('markerHeight', nodeSize / 2)
    .attr('viewBox', `-0 ${-nodeSize / 4} ${nodeSize / 2} ${nodeSize / 2}`)
    .attr('refX', `${nodeSize * 1.5}`)
    .attr('refY', `0`)
    .attr('orient', 'auto');
  arrowMarker.append('path')
    .attr('d', `M0,${-nodeSize / 4} L${nodeSize / 2},0 L0,${nodeSize / 4}`)
    .attr('fill', '#999')
    .style('stroke', 'none');

  // 点和边的骨架设置
  var linkRootG = svg.append('g').attr('class', 'links')
  var linkG = null;
  var nodeRootG = svg.append('g').attr('class', 'nodes')
  var nodeG = null;

  // 调用绘制函数进行初始化绘图
  restart();

  // 增量重绘函数
  function restart () {
    // 节点绘制更新
    nodeG = updateNodeSvg(nodeRootG, nodes, {
      nodeSize: nodeSize,
      setColorByKey: 'group',
      isPackage: false
    })
      // 绑定点击事件
      .on('click', function (e, d) {
        console.log('在力导向布局中选择了节点', d);
        // 要让this有效别用箭头函数
        highlightNode(curNodeSelection, d3.select(this))
        curNodeSelection = d3.select(this);
        callFunSelectNode(d)
        e.stopPropagation(); // 停止冒泡
      })
      // 绑定右键菜单
      .on('contextmenu', function (e, d) {
        highlightNode(curNodeSelection, d3.select(this))
        curNodeSelection = d3.select(this);
        callFunShowNodeContextMenu({
          node: d,
          position: [e.clientX, e.clientY]
        }) // 传递节点数据和鼠标点击所在位置，在这个位置显示右键菜单栏
        e.stopPropagation(); // 停止冒泡，避免被宏观监听到单击事件
        e.preventDefault(); // 阻止浏览器默认右键单击事件
      })
      .call(
        d3.drag()
          .on('start', dragstart)
          .on('drag', dragg)
          .on('end', dragend)
      );

    // 边绘制/更新
    linkG = updateLinkSvg(linkRootG, links)
      .on('click', (e, d) => {
        console.log('在力导向布局中选择了边', d);
        e.stopPropagation(); // 停止冒泡
      }).selectAll('path')

    // 仿真器更新
    simulation.nodes(nodes);
    console.logo(simulation.nodes())
    simulation.force('link').links(links);
    // simulation.force('center', d3.forceCenter().x(width/2).y(height/2))
    simulation.alpha(1).restart();

  }

  // 对点边位置进行移动更新
  function ticked () {
    moveNode(nodeG); // 对其中的g transform translate
    moveLink(linkG); // 对path进行设置
  }

  // 拖拽开始
  function dragstart (event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  // 拖拽时
  function dragg (event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  // 拖拽结束
  function dragend (event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  // 已经扩展过的节点再次扩展时，直接利用缓存
  function expandNode (rootNode) {
    if (!rootNode.isShrink) {
      console.log('节点已经是扩展状态')
    } else {
      rootNode.isShrink = false;
      expandChildNode(rootNode)

      restart();
    }

    function expandChildNode (childNode) {
      // 根据记忆需求，被动扩展的时候，如果原本节点是收缩状态就不要扩展
      if (!childNode.isShrink) {
        childNode.expandChildrenLink.forEach(childLink => {
          links.push(childLink);
        })
        childNode.expandChildrenNode.forEach(childNode => {
          nodes.push(childNode);
          expandChildNode(childNode)
        })
      }
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
      expandNode(rootNode)
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

      restart();
    }
  }

  // 收缩
  function shrinkNode (rootNode) {
    if (rootNode.isShrink) {
      console.log('节点已经是收缩状态')
    } else {
      rootNode.isShrink = true;
      shrinkChildNode(rootNode)

      restart();
    }

    function shrinkChildNode (childNode) {
      if (!childNode.isExpandChildren) {
        // 没有请求过节点，不配收缩
        return
      }
      // 将需要收缩的关联节点进行过滤
      nodes = nodes.filter(node => {
        return !childNode.isExpandChildNodeMap[node.id];
      });
      // 将需要收缩的关联边进行过滤
      links = links.filter(link => {
        return !childNode.isExpandChildLinkMap[link.id];
      });
      // 递归地执行收缩
      childNode.expandChildrenNode.forEach(childNode => {
        shrinkChildNode(childNode);
      })
    }
  }

  return {
    addNewGraph,
    shrinkNode
  }
}

export default createForceDirectedGraph
