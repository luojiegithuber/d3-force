import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';
import {
  createNodes,
  createEdges,
  updateNodeSvg,
  updateLinkSvg,
  moveNode,
  moveLink,
  highlightNode,
  highlightLink
} from './object.js';

import {getNodeNextJump} from '@/request/api';// 导入我们的api接口

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
  var allNodeByIdMap = new Map(); // 保存了所有请求过的节点 包括不可见的节点（无记忆、被收缩的）
  var allCurNodeByIdMap = new Map(); // 仅仅保存当前可见节点,是上面的子集
  var allLinkByIdMap = new Map();
  var allCurLinkByIdMap = new Map(); // 仅仅保存当前可见节点,是上面的子集
  var linkExpandByIdMap = new Map(); // 边扩展记录，保存了哪些边是被扩展过了的

  var noRememberNodes = []; // 缓存被过滤的节点
  var noRememberLinks = []; // 缓存被过滤的边

  var allNodes = [];
  var allLinks = [];

  var isVisualizeNoRemember = true

  var isTransitionStatus = false;

  var curNode = null;  // 当前操作节点
  var lastNode = null;  // 上一次操作的节点
  var curNodeSelection = null; // d3格式的节点
  var curLinkSelection = null; // d3格式的节点

  // 当前点击扩展的类型
  var curExpandRelationshipType = null;

  // 根据节点个数计算初始节点大小，最小半径为15
  let maxRadius = d3.min([width - margin.left - margin.right, height - margin.top - margin.bottom]) / 2;
  let nodeSize = d3.max([((2 * Math.PI * maxRadius / originalData.nodes.length) * 0.3 / 2), 15]);
  if (nodeSize >= 15) {
    nodeSize = 15;
  }

  // 获取节点及边数据，防止污染原始数据
  var nodes = createNodes(originalData.nodes, node => {
    allNodeByIdMap.set(node.id, node)
  });

  var links = createEdges(originalData.edges, link => {
    allLinkByIdMap.set(link.id, link)
  });
  // 力仿真器
  const simulation = d3.forceSimulation();
  simulation.nodes(nodes)
    .on('tick', ticked)
    .on('end', tickEnd);

  function tickEnd () {
    if (isTransitionStatus) {
      moveNode(nodeG, true); // 对其中的g transform translate
      moveLink(linkG, true); // 对path进行设置
      isTransitionStatus = false;
    }
  }

  simulation
    // .force('link', d3.forceLink(links).id(d => d.id).distance(d => linkDistance(d.group)))
    .force('link', d3.forceLink(links).id(d => d.id).distance(maxRadius / 1.75))
    .force('charge', d3.forceManyBody().strength(-maxRadius * 0.5).distanceMax(maxRadius * 2))
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
      // 绑定点击事件，点击后即可扩展默认关系
      .on('click', function (e, d) {
        // 设置为路径记忆的节点
        // rememberNode(d)

        // 将非记忆路径的点边进行过滤
        // nodes = nodes.filter(item => item.isRemember);
        // nodes.forEach(item=>item.isShrink = true)
        // links = links.filter(item => item.sourceNode.isRemember && item.targetNode.isRemember);
        // filterNoRemember(d)

        console.log('在力导向布局中选择了节点', d);
        d3.select(this).raise()
        // 要让this有效别用箭头函数
        highlightNode(curNodeSelection, d3.select(this))
        curNode = d;
        curNodeSelection = d3.select(this);
        callFunSelectNode(d)
        e.stopPropagation(); // 停止冒泡

        // 点击即扩展，获取默认的扩展节点
        /*         if (d.isExpandChildren) {
          // 如果之前请求过节点了，那就不需要再请求，直接用现成的
          console.log('已经请求过该节点，直接扩展');
          addNewGraph({
            node: d,
            newGraph: {
              nodes: d.isExpandChildNode,
              edges: d.isExpandChildLink
            }
          });
        } else {
          // 否则，通过新的请求获取新数据
          getNodeNextJump(d.data, 'ALL').then(res => {
            if (res.message === 'success') {
              console.log('新取得的数据', res.content);
              addNewGraph({
                node: d,
                newGraph: res.content
              })
            }
          })
        } */
        // d.isShrink = false;
      })
      // 绑定右键菜单
      .on('contextmenu', function (e, d) {
        highlightNode(curNodeSelection, d3.select(this))
        d3.select(this).raise()
        curNode = d;
        curNodeSelection = d3.select(this);
        callFunShowNodeContextMenu({
          node: d,
          position: [e.clientX, e.clientY]
        }, () => {
          console.log('右键事件执行结束')
          rememberNode(d)
          // 如果当前操作的节点与上一次操作的节点不同，则过滤掉非路径记忆节点
          // 否则可以不用过滤掉非路径记忆节点，直接在操作节点的基础上扩展其他内容
          if (!lastNode || (lastNode.id !== curNode.id)) {
            filterNoRemember(d);
          }
          lastNode = d;
          // switchVisualizeRemember(false);
          // restart();
        }) // 传递节点数据和鼠标点击所在位置，在这个位置显示右键菜单栏
        // filterNoRemember(d);
        e.stopPropagation(); // 停止冒泡，避免被宏观监听到单击事件
        e.preventDefault(); // 阻止浏览器默认右键单击事件
      })
      .call(
        d3.drag()
          .on('start', dragstart)
          .on('drag', dragg)
          .on('end', dragend)
      )

    nodeG
      .attr('transform', (d) => `translate(${d.x},${d.y})`)

    // 边绘制/更新
    linkG = updateLinkSvg(linkRootG, links)
      .on('click', (e, d) => {
        console.log('在力导向布局中选择了边', d);
        e.stopPropagation(); // 停止冒泡
      }).selectAll('path')
      .on('contextmenu', function (e, d) {
        // console.log(curLinkSelection, d3.select(this))
        highlightLink(curLinkSelection, d3.select(this))
        curLinkSelection = d3.select(this)
        callFunShowNodeContextMenu({
          link: d,
          position: [e.clientX, e.clientY]
        }, () => {
          console.log('边右键事件执行结束')
          // filterNoRemember()
        })
        e.stopPropagation(); // 停止冒泡，避免被宏观监听到单击事件
        e.preventDefault(); // 阻止浏览器默认右键单击事件
      })
      .on('mouseover', function (e, d) {
        d3.select(this).style('cursor', 'pointer')
      })
    linkG
      .attr('d', d => `M ${d.sourceNode.x} ${d.sourceNode.y} L ${d.targetNode.x} ${d.targetNode.y}`)

    allCurNodeByIdMap = new Map(nodes.map(node => {
      node.isBeShrinked = false;
      node.lastCoordinateX = node.x;
      node.lastCoordinateY = node.y;
      return [node.id, node]
    }))
    allCurLinkByIdMap = new Map(links.map(link => {
      link.isBeShrinked = false;
      link.lastCoordinateX = link.x;
      link.lastCoordinateY = link.y;
      return [link.id, link]
    }))

    // 扩展之后如果当前的节点启用了钉住，则对扩展出来的节点增加钉住功能
    if (curNode && curNode.isPinStatus) {
      curNode.links.forEach(link => {
        console.log(link.sourceNode, link.targetNode)
        if (link.sourceNode.id === curNode.id && allCurLinkByIdMap.has(link.id)) {
          allNodeByIdMap.get(link.targetNode.id).isPinRemember = true;
        }
        if (link.targetNode.id === curNode.id && allCurLinkByIdMap.has(link.id)) {
          allNodeByIdMap.get(link.sourceNode.id).isPinRemember = true;
        }
      })
    }

    // 仿真器更新
    simulation.nodes(nodes);
    simulation.force('link').links(links)
    // 设置以下四个参数达到过渡动画效果

    // simulation.force('collision', d3.forceCollide(0.5))
    // simulation.alphaDecay(0.0005)
    // simulation.velocityDecay(0.6)
    // simulation.force('center', d3.forceCenter().x(width/2).y(height/2))
    simulation.alpha(1).restart();

  }

  // 对点边位置进行移动更新
  function ticked () {
    if (!isTransitionStatus) {
      moveNode(nodeG); // 对其中的g transform translate
      moveLink(linkG); // 对path进行设置
    } else {
      for (let i = 0; i < 10; i++) {
        simulation.tick();
      }
    }
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
    isTransitionStatus = true;
    if (!rootNode.isShrink[curExpandRelationshipType]) {
      console.log(`节点的${curExpandRelationshipType}已经是扩展状态`, rootNode)
      // 已经是扩展状态却还需要扩展的原因还有一个——————暴露无记忆子节点！！！！
      // expandChildNoRememberNode1(rootNode)
      rootNode.expandChildrenLink[curExpandRelationshipType].forEach(childLink => {
        if (!allCurLinkByIdMap.has(childLink.id)) {
          links.push(childLink);
        }
      })
      rootNode.expandChildrenNode[curExpandRelationshipType].forEach(childNode => {
        if (!allCurNodeByIdMap.has(childNode.id)) {
          childNode.x = rootNode.x
          childNode.y = rootNode.y
          nodes.push(childNode);
          // expandChildNode(childNode)
        }
      })
      restart();

      // restart();
    } else {
      rootNode.isShrink[curExpandRelationshipType] = false;
      expandChildNode(rootNode)
      restart();
    }

    /*     function expandChildNoRememberNode1 (childNode) {
      if (!childNode.isShrink) {
        // 子节点没有收缩的话，仅仅可视化记忆点边
        childNode.expandChildrenLink.forEach(childLink => {
          if (!allCurLinkByIdMap.has(childLink.id)) {
            // 假如当前界面不存在，但是母节点处于扩散态（不收缩态）
            links.push(childLink);
          }
        })
        childNode.expandChildrenNode.forEach(childNode => {
          if (!allCurNodeByIdMap.has(childNode.id)) {
            nodes.push(childNode);
            expandChildNoRememberNode2(childNode)
          }
        })
      }
    }

    function expandChildNoRememberNode2 (childNode) {
      if (!childNode.isShrink) {
        // 子节点没有收缩的话，仅仅可视化记忆点边
        childNode.expandChildrenLink.forEach(childLink => {
          if (childLink.isRemember()) {
            // 假如当前界面不存在，但是母节点处于扩散态（不收缩态）
            links.push(childLink);
          }
        })
        childNode.expandChildrenNode.forEach(childNode => {
          if (childNode.isRemember) {
            nodes.push(childNode);
            expandChildNoRememberNode2(childNode)
          }
        })
      }
    }
 */
    function expandChildNode (childNode) {
      // 根据记忆需求，被动扩展的时候，如果原本节点是收缩状态就不要扩展
      if (isVisualizeNoRemember) {
        if (!childNode.isShrink[curExpandRelationshipType]) {
          childNode.expandChildrenLink[curExpandRelationshipType].forEach(childLink => {
            links.push(childLink);
          })
          childNode.expandChildrenNode[curExpandRelationshipType].forEach(childNode => {
            nodes.push(childNode);
            // expandChildNode(childNode)
          })
        }
      } else {
        if (!childNode.isShrink) {
          childNode.expandChildrenLink[curExpandRelationshipType].forEach(childLink => {
            if (childLink.isRemember()) {
              links.push(childLink);
            }
          })
          childNode.expandChildrenNode[curExpandRelationshipType].forEach(childNode => {
            if (childNode.isRemember || childNode.isPinRemember) {
              nodes.push(childNode);
              // expandChildNode(childNode)
            }
          })
        }
      }
    }
  }

  // 增量函数
  /* obj {
  *    node: 发出请求的单个节点
  *    newGraph: 新的图数据
  *  }
  */
  function addNewGraph (obj, params) {
    const rootNode = obj.node;
    const newGraph = obj.newGraph;
    curExpandRelationshipType = params.relationship_type;
    if (newGraph.nodes.length === 0 && newGraph.edges.length === 0) {
      console.log(`没有对应的${curExpandRelationshipType}扩展数据`);
      return;
    }
    if (rootNode.isExpandChildren[curExpandRelationshipType]) {
      expandNode(rootNode);
    } else {
      // 过滤原本存在的节点
      const newNodes = newGraph.nodes.filter(node => {
        if (allNodeByIdMap.has(node.guid)) {
          // 如果已经存在，过滤
          // 如果此时又被隐藏着，应当可视化出来,但是也别忘了边
          rootNode.expandChildrenNode[curExpandRelationshipType].push(allNodeByIdMap.get(node.guid))
          if (!allCurNodeByIdMap.has(node.guid)) {
            // console.log('重复且隐藏节点', allNodeByIdMap.get(node.guid))
            nodes.push(allNodeByIdMap.get(node.guid))

            // rootNode.expandChildrenNode.push(allNodeByIdMap.get(node.guid))
          }

          return false;
        } else {
          // allNodeByIdMap.set(node.guid, node);
          return true
        }
      });

      // 同上
      const newLinks = newGraph.edges.filter(link => {
        if (allLinkByIdMap.has(link.guid)) {
          rootNode.expandChildrenLink[curExpandRelationshipType].push(allLinkByIdMap.get(link.guid))
          // 如果已经存在，过滤
          if (!allCurLinkByIdMap.has(link.guid)) {
            // console.log('重复且隐藏边', allNodeByIdMap.get(node.guid))
            links.push(allLinkByIdMap.get(link.guid))
          }
          return false;
        } else {
          // allLinkByIdMap.set(link.guid, link);
          return true
        }
      });
      // console.log('初始根节点位置', rootNode.x, rootNode.y)
      const newChildrenNodes = createNodes(newNodes, node => {
        allNodeByIdMap.set(node.id, node);
        node.x = rootNode.x;
        node.y = rootNode.y;
      });

      // rootNode.expandChildrenNode.push(...newChildrenNodes);
      /* newChildrenNodes.forEach(d => {
        rootNode.isExpandChildNodeMap[d.id] = d;
      }); */

      const newChildrenLinks = createEdges(newLinks, link => {
        allLinkByIdMap.set(link.id, link);
      });

      // rootNode.expandChildrenLink.push(...newChildrenLinks);
      newChildrenLinks.forEach(d => {
        /*         rootNode.isExpandChildLinkMap[d.id] = d; */
        linkTwoNodes(d.sourceNode, d.targetNode, d)
      });

      allNodes.push(...newChildrenNodes)
      allLinks.push(...newChildrenLinks)
      nodes.push(...newChildrenNodes);
      links.push(...newChildrenLinks);

      rootNode.isExpandChildren[curExpandRelationshipType] = true; // 表明扩展过了
      // expandNode(rootNode)
      isTransitionStatus = true

      restart();
    }
  }

  // 可视化记忆节点开关
  function switchVisualizeRemember (checked) {
    isVisualizeNoRemember = checked
    if (checked) {
      visualizeNoRemember();
    } else {
      filterNoRemember();
    }
    restart();
  }

  // 收缩
  function shrinkNode (rootNode) {
    /*     // ——————————【路径记忆3】
    filterNoRemember();
    restart()
    return; */
    // ——————————【路径记忆2】
    if (rootNode.isShrink[curExpandRelationshipType]) {
      console.log(`节点的${curExpandRelationshipType}已经是收缩状态`, rootNode)
    } else {
      rootNode.isShrink[curExpandRelationshipType] = true;
      shrinkChildNode(rootNode)
      restart();
    }

    function shrinkChildNode (childNode) {
      if (!childNode.isExpandChildren[curExpandRelationshipType]) {
        // 没有请求过节点，不配收缩
        return
      }
      // 将需要收缩的关联节点进行过滤
      nodes = nodes.filter(node => {
        if (!childNode.isExpandChildNodeMap[curExpandRelationshipType][node.id]) {
          return true
        } else {
          node.isBeShrinked = true; // 是否处于被父节点收缩的状态
          return false
        }
      });
      // 看不见的、非记忆的节点也要收缩标记
      noRememberNodes.forEach(node => {
        if (childNode.isExpandChildNodeMap[curExpandRelationshipType][node.id]) {
          node.isBeShrinked = true;
        }
      })
      // 将需要收缩的关联边进行过滤
      links = links.filter(link => {
        if (!childNode.isExpandChildLinkMap[curExpandRelationshipType][link.id]) {
          return true
        } else {
          link.isBeShrinked = true; // 是否处于被父节点收缩的状态
          return false
        }
      });
      noRememberLinks.forEach(link => {
        if (childNode.isExpandChildLinkMap[curExpandRelationshipType][link.id]) {
          link.isBeShrinked = true;
        }
      })
      // 递归地执行收缩
      childNode.expandChildrenNode[curExpandRelationshipType].forEach(childNode => {
        shrinkChildNode(childNode);
      })
    }
  }

  // 钉住
  function pinNode (handelNode) {
    // 由于操作了该节点，所以记忆
    handelNode.isRemember = true;
    handelNode.isPinRemember = true;
    var link_node;

    // 已经钉住了，则解锁
    if (handelNode.isPinStatus) {
      handelNode.isPinStatus = false;
      // 路径记忆——忘记相连的节点
      handelNode.links.forEach(link => {
        if (link.sourceNode.id === handelNode.id && allCurLinkByIdMap.has(link.id)) {
          link_node = allNodeByIdMap.get(link.targetNode.id);
          link_node.isPinRemember = false;
        }
        if (link.targetNode.id === handelNode.id && allCurLinkByIdMap.has(link.id)) {
          link_node = allNodeByIdMap.get(link.sourceNode.id);
          link_node.isPinRemember = false;
        }
      })
    }
    // 否则执行钉住
    else {
      handelNode.isPinStatus = true;
      // 路径记忆——记住相连的节点
      handelNode.links.forEach(link => {
        if (link.sourceNode.id === handelNode.id && allCurLinkByIdMap.has(link.id)) {
          link_node = allNodeByIdMap.get(link.targetNode.id);
          link_node.isPinRemember = true;
        }
        if (link.targetNode.id === handelNode.id && allCurLinkByIdMap.has(link.id)) {
          link_node = allNodeByIdMap.get(link.sourceNode.id);
          link_node.isPinRemember = true;
        }
      })
    }
  }

  // 记住一个节点和其相关节点
  function rememberNode (handelNode) {
    handelNode.isRemember = true;
    // restart();
  }

  // 操作某一个节点的时候，过滤掉不被记忆的节点和与之相互关联的边
  // 入参：正在被操作的节点
  function filterNoRemember (handelNode) {
    nodes = nodes.filter(node => {
      if (node.isRemember || node.isPinRemember) {
        return true;
      } else {
        noRememberNodes.push(node);
        return false
      }
    });
    links = links.filter(link => {
      if (link.isRemember()) {
        return true;
      } else {
        noRememberLinks.push(link)
        return false
      }
    });
    allCurNodeByIdMap = new Map(nodes.map(node => [node.id, node]))
    allCurLinkByIdMap = new Map(links.map(link => [link.id, link]))
    // restart();
  }

  // 恢复被全局过滤掉的边

  function visualizeNoRemember () {
    nodes.push(...allNodes.filter(d => !d.isBeShrinked && !allCurNodeByIdMap.has(d.id)))
    links.push(...allLinks.filter(d => !d.isBeShrinked && !allCurLinkByIdMap.has(d.id)))
    allCurNodeByIdMap = new Map(nodes.map(node => [node.id, node]))
    allCurLinkByIdMap = new Map(links.map(link => [link.id, link]))
    // restart();
    noRememberNodes = [];
    noRememberLinks = [];
  }

  // 边的关系扩展
  function addEdgeRelationshipExpand (obj, params) {
    curExpandRelationshipType = params.relationship_type;
    const handleLink = obj.link;

    // const nodeA = handleLink.sourceNode;
    // const nodeB = handleLink.targetNode;
    isTransitionStatus = true;
    // console.log(obj.newGraph.nodes.map(d => d.guid), obj.newGraph.edges.map(d => d.source + '——>' + d.target))

    // 关系扩展后的z节点肯定有所属的数据表, 【一定是 T 指向 z】
    // 因此我们可以设置初始位置

    // 根据这条边处理的事务：T增加z节点，新增z的初始位置设置为T处
    function handleTzLink (link) {
      if (link.sourceNode.group === 'TABLE') {
        const TableNode = link.sourceNode;
        const zNode = link.targetNode;

        if (!TableNode.isExpandChildNodeMap[curExpandRelationshipType][zNode.id]) {
          // 互相成为彼此的下一跳节点
          linkTwoNodes(TableNode, zNode, handleLink)

          zNode.x = TableNode.x
          zNode.y = TableNode.y
        }
      }
    }

    let newNodes = obj.newGraph.nodes.filter(node => {
      if (!allNodeByIdMap.has(node.guid)) {
        return true
      } else {
        // 节点存在，但是由于不被记忆被隐藏的时候，应当调出来
        if (!allCurNodeByIdMap.has(node.guid)) {
          nodes.push(allNodeByIdMap.get(node.guid))
        }
        return false
      }
    })
    let newLinks = obj.newGraph.edges.filter(link => {
      if (!allLinkByIdMap.has(link.guid)) {
        return true
      } else {
        // 边存在，但是由于不被记忆被隐藏的时候，应当调出来
        if (!allCurLinkByIdMap.has(link.guid)) {
          links.push(allLinkByIdMap.get(link.guid))
        }
        return false
      }
    })

    newNodes = createNodes(newNodes, node => {
      allNodeByIdMap.set(node.id, node)
    });

    newLinks = createEdges(newLinks, link => {
      handleTzLink(link)
      allLinkByIdMap.set(link.id, link)
    });

    allNodes.push(...newNodes)
    allLinks.push(...newLinks)

    // console.log(newNodes.map(d => d.id), newLinks.map(d => d.sourceNode.id + '——>' + d.targetNode.id))

    nodes.push(...newNodes);
    links.push(...newLinks);

    linkExpandByIdMap.set(handleLink.id, handleLink); // 记录这条边是进行扩展操作了的
    deleteLink(handleLink)

    // handleLink.isRelationshipExpand = true; // 表明关系扩展过了

    restart();
  }

  function deleteLink (handleLink) {
    links = links.filter(link => link.id !== handleLink.id) // 视图层 去掉操作边，永久消失
    allLinks = allLinks.filter(link => link.id !== handleLink.id) // 全部数据 去掉操作边，永久消失
    allCurLinkByIdMap.delete(handleLink.id)
    allLinkByIdMap.delete(handleLink.id)
  }

  // 互相成为彼此的下一跳
  function linkTwoNodes (nodeA, nodeB, link) {
    if (!nodeA.isExpandChildNodeMap[curExpandRelationshipType][nodeB.id]) {
      nodeA.expandChildrenNode[curExpandRelationshipType].push(nodeB);
      nodeA.isExpandChildNodeMap[curExpandRelationshipType][nodeB.id] = nodeB;
      nodeA.expandChildrenLink[curExpandRelationshipType].push(link);
      nodeA.isExpandChildLinkMap[curExpandRelationshipType][link.id] = link;

      nodeB.expandChildrenNode[curExpandRelationshipType].push(nodeA);
      nodeB.isExpandChildNodeMap[curExpandRelationshipType][nodeA.id] = nodeA;
      nodeB.expandChildrenLink[curExpandRelationshipType].push(link);
      nodeB.isExpandChildLinkMap[curExpandRelationshipType][link.id] = link;
    }
  }

  return {
    addNewGraph,
    shrinkNode,
    pinNode,
    switchVisualizeRemember,
    addEdgeRelationshipExpand,
    filterNoRemember
  }
}

export default createForceDirectedGraph
