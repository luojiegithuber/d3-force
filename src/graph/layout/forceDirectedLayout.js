import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';
import {
  createNodes,
  createEdges,
  updateNodeSvg,
  updateLinkSvg,
  moveNode,
  moveLink,
  highlightNode,
  highlightLink,
  Node
} from './object(整理版)';

/**
 力引导布局算法
 * @param {Object} originalData [原始图数据]
 * @param {HTMLDocument} svg [待渲染的svg DOM元素]
 * @param {function} callFunSelectNode [鼠标选择节点后的回调方法]
 * @param {Object} option [额外的参数] 在本文件中主要用于获取初始所选的左侧数据表节点数据
 * @param {function} callFunShowNodeContextMenu [唤醒鼠标右键菜单的方法]
 * @returns {{addEdgeRelationshipExpand: addEdgeRelationshipExpand, addNewGraph: addNewGraph, pinNode: pinNode}} [返回给前台右键菜单的调用]
 */
function createForceDirectedGraph (originalData, svg, callFunSelectNode, option, callFunShowNodeContextMenu) {

  // 获取画布尺寸（可作为全局图属性）
  const width = svg.attr('width');
  const height = svg.attr('height');

  // 进行画布的初始化设置并返回最大半径和节点大小以对力仿真器进行设置（可放在全局图属性中设置）
  var {maxRadius, nodeSize} = init();

  // 图谱点边哈希记录（可作为全局图属性）
  var allNodes = []; // 保存了所有请求过的节点数据 Array形式
  var allNodeByIdMap = new Map(); // 保存了所有请求过的节点数据 key-value形式
  var allCurNodeByIdMap = new Map(); // 仅仅保存当前图谱上可见节点的数据,是 allNodeByIdMap 的子集
  var allLinks = []; // 保存了所有请求过的连边数据 Array形式
  var allLinkByIdMap = new Map(); // 保存了所有请求过的连边数据 key-value形式
  var allCurLinkByIdMap = new Map(); // 仅仅保存当前图谱上可见连边的数据,是 allLinkByIdMap 的子集

  // 是否在重新渲染画布时开启过渡动画（可作为全局图属性）
  var isTransitionStatus = false;

  // 当前节点扩展类型，初始化为推荐关系RECOMMEND（可作为全局图属性）
  var curExpandRelationshipType = 'RECOMMEND';

  // 当前操作的节点和上一次扩展操作的节点（可作为全局图属性）
  var curNode = new Node(option.selectNode); // 将左侧列表数据表节点作为初始的当前操作节点
  curNode.currentExpandStatus[curExpandRelationshipType] = true; // 由于一开始展示默认关系（即推荐关系），需要将其对应的“当前扩展状态——推荐关系”标记为true
  curNode.isExpandChildren[curExpandRelationshipType] = true; // 同时将“是否已经请求过了该类子节点——推荐关系”标记为true（貌似没用）
  var lastExpandNode = new Node(option.selectNode); // 也同样初始化为最初的左侧列表数据表节点
  lastExpandNode.currentExpandStatus[curExpandRelationshipType] = true; // 将其对应的扩展状态标记为true（貌似没用）

  // 当前操作的点边元素，d3格式，用于鼠标选中时高亮效果（可作为全局图属性）
  var curNodeSelection = null;
  var curLinkSelection = null;

  // 当前扩展连边和上一次扩展的连边，同时其子数据并没有被记忆，如果其子数据被记忆了就将该变量置null（可作为全局图属性）
  var curRelationshipLink = null;
  var lastRelationshipLink = null;

  // 根据原始数据，生成预设数据结构的点数据，同时防止污染原始数据（可作为全局图属性）
  var nodes = createNodes(originalData.nodes, node => {
    // 设置图谱根节点的扩展以及路径记忆属性（针对初始左侧列表数据表数据）
    if (node.id === curNode.id) {
      node.currentExpandStatus[curExpandRelationshipType] = true;
      node.isExpandChildren[curExpandRelationshipType] = true;
      rememberNode(node);
    }
    // 添加节点哈希记录
    allNodeByIdMap.set(node.id, node)
  });

  var initIndex = nodes.findIndex(d => d.id === curNode.id); // 初始数据表的索引，局部变量
  // 根据原始数据，生成预设数据结构的点数据，同时防止污染原始数据（可作为全局图属性）
  var links = createEdges(originalData.edges, link => {
    // 添加连边哈希记录
    allLinkByIdMap.set(link.id, link);
    // 更新连边两端节点的默认扩展关系属性
    linkTwoNodes(link.sourceNode, link.targetNode, link);

    // 记录图谱根节点的默认展示关系数据（推荐关系）
    if (link.sourceNode.id !== curNode.id && !nodes[initIndex].isExpandChildNodeMap[curExpandRelationshipType].hasOwnProperty(link.sourceNode.id)) {
      nodes[initIndex].expandChildrenNode[curExpandRelationshipType].push(link.sourceNode);
      nodes[initIndex].isExpandChildNodeMap[curExpandRelationshipType][link.sourceNode.id] = link.sourceNode;
    }
    if (link.targetNode.id !== curNode.id && !nodes[initIndex].isExpandChildNodeMap[curExpandRelationshipType].hasOwnProperty(link.targetNode.id)) {
      nodes[initIndex].expandChildrenNode[curExpandRelationshipType].push(link.targetNode);
      nodes[initIndex].isExpandChildNodeMap[curExpandRelationshipType][link.targetNode.id] = link.targetNode;
    }
    nodes[initIndex].expandChildrenLink[curExpandRelationshipType].push(link);
    nodes[initIndex].isExpandChildLinkMap[curExpandRelationshipType][link.id] = link;
  });

  // 定义力仿真器（力引导布局变量）
  const simulation = d3.forceSimulation();
  simulation.nodes(nodes)
    .on('tick', ticked)
    .on('end', tickEnd)
    .force('link', d3.forceLink(links).id(d => d.id).distance(maxRadius / 1.75))
    .force('charge', d3.forceManyBody().strength(-maxRadius * 0.5).distanceMax(maxRadius * 2))
    .force('center', d3.forceCenter().x(width / 2).y(height / 2))
    .force('collide', d3.forceCollide().strength(1).iterations(10));

  // 点和边的骨架设置
  var linkRootG = svg.append('g').attr('class', 'links');
  var linkG = null;
  var nodeRootG = svg.append('g').attr('class', 'nodes');
  var nodeG = null;

  // 调用绘制函数进行初始化绘图
  render();

  // 用于修正一开始没有箭头的情况（由于增量时点边均采用淡入淡出的过渡效果，在初始连边是箭头是不存在的，需要手动设置）
  linkG.attr('marker-end', 'url(#arrow)');

  /**
   * （力引导布局方法）
   * 重绘渲染函数，用于异步更新图谱点边数据以及绑定的交互事件，同时重新绑定力仿真数据
   */
  function render () {
    // 手动停止力仿真器调度
    simulation.stop();

    // 使用Promise进行点边的更新
    const updateNodeSvgPromise = () => {
      return new Promise((resolve, reject) => {
        updateNodeSvg(nodeRootG, nodes, {
          nodeSize: nodeSize,
          setColorByKey: 'group',
          isPackage: false
        }, (nodeGTemp) => {
          nodeG = nodeGTemp;
          nodeG
            // 绑定点击事件
            .on('click', function (e, d) {
              // console.log('在力导向布局中选择了节点', d);
              d3.select(this).raise();
              // 高亮当前所选节点
              highlightNode(curNodeSelection, d3.select(this));
              // 更新当前操作的节点
              curNode = d;
              curNodeSelection = d3.select(this);
              // 用于详情信息面板的显示
              callFunSelectNode(d);
              e.stopPropagation(); // 停止冒泡
            })
            // 绑定右键菜单
            .on('contextmenu', function (e, d) {
              // 高亮当前所选节点
              highlightNode(curNodeSelection, d3.select(this));
              d3.select(this).raise();
              // 根据当前图上肉眼看到的节点判断是否已经全部扩展完，用于动态渲染右键扩展关系菜单项
              for (let relationshipType in d.currentExpandStatus) {
                d.currentExpandStatus[relationshipType] = isUnExtendable(d, relationshipType)
              }
              // 更新当前操作的节点
              curNode = d;
              curNodeSelection = d3.select(this);
              // 唤出右键菜单
              callFunShowNodeContextMenu({
                node: d,
                position: [e.clientX, e.clientY]
              }, () => {
                // console.log('右键扩展事件执行结束');
                rememberNode(d); // 对该右键扩展的节点进行路径记忆

                // 如果当前扩展的的节点是数据表节点，则需要进一步判断该节点的一跳关系下的作业节点，是否需要被记忆（即在T-j-T类型且两端T均被记忆的情况下，需要将j记忆）
                if (d.group === 'TABLE') {
                  d.links.forEach(link => {
                    if (link.sourceNode.group === 'NODE') {
                      for (let edge of link.sourceNode.links) {
                        if (edge.sourceNode.id === link.sourceNode.id && edge.targetNode.isRemember && edge.targetNode.id !== d.id) {
                          rememberNode(allNodeByIdMap.get(link.sourceNode.id));
                          break;
                        }
                        if (edge.targetNode.id === link.sourceNode.id && edge.sourceNode.isRemember && edge.sourceNode.id !== d.id) {
                          rememberNode(allNodeByIdMap.get(link.sourceNode.id));
                          break;
                        }
                      }
                    }
                    if (link.targetNode.group === 'NODE') {
                      for (let edge of link.targetNode.links) {
                        if (edge.targetNode.id === link.targetNode.id && edge.sourceNode.isRemember && edge.sourceNode.id !== d.id) {
                          rememberNode(allNodeByIdMap.get(link.targetNode.id));
                          break;
                        }
                        if (edge.sourceNode.id === link.targetNode.id && edge.targetNode.isRemember && edge.targetNode.id !== d.id) {
                          rememberNode(allNodeByIdMap.get(link.targetNode.id));
                          break;
                        }
                      }
                    }
                  })
                }

                // 如果当前扩展操作的节点与上一次操作的节点不同，则过滤掉非路径记忆节点
                // 否则可以不用过滤掉非路径记忆节点，直接在操作节点的基础上扩展其他内容
                if (lastExpandNode.id !== curNode.id) {
                  // console.log('clean');
                  filterNoRemember();
                }
                lastExpandNode = d
              });
              e.stopPropagation(); // 停止冒泡，避免被宏观监听到单击事件
              e.preventDefault(); // 阻止浏览器默认右键单击事件
            })
            // 绑定拖拽事件
            .call(
              d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended)
            );

          nodeG
            .attr('transform', (d) => `translate(${d.x},${d.y})`)
        });
        resolve('节点更新完毕')
      })
    };
    const updateLinkPromise = () => {
      return new Promise((resolve, reject) => {
        // 边绘制/更新
        updateLinkSvg(linkRootG, links, {}, (linkGTemp) => {
          linkG = linkGTemp.selectAll('path');
          linkG
            // 绑定点击事件
            .on('click', (e, d) => {
              // console.log('在力导向布局中选择了边', d);
              e.stopPropagation(); // 停止冒泡
            })
            // 绑定右键菜单事件
            .on('contextmenu', function (e, d) {
              // 高亮所选连边
              highlightLink(curLinkSelection, d3.select(this));
              // 更新当前所操作连边
              curLinkSelection = d3.select(this);
              // 唤出右键菜单
              callFunShowNodeContextMenu({
                link: d,
                position: [e.clientX, e.clientY]
              }, () => {
                // console.log('边右键事件执行结束')
              });
              e.stopPropagation(); // 停止冒泡，避免被宏观监听到单击事件
              e.preventDefault(); // 阻止浏览器默认右键单击事件
            })
            // 绑定鼠标悬浮事件
            .on('mouseover', function (e, d) {
              // 更新样式
              d3.select(this).style('cursor', 'pointer')
            })
            .selectAll('path');

          // 更新连边位置参数
          linkG
            .attr('d', d => `M ${d.sourceNode.x} ${d.sourceNode.y} L ${d.targetNode.x} ${d.targetNode.y}`);

          // 更新当前图谱的点边数据属性
          allCurNodeByIdMap = new Map(nodes.map(node => {
            node.lastCoordinateX = node.x;
            node.lastCoordinateY = node.y;
            return [node.id, node]
          }));
          allCurLinkByIdMap = new Map(links.map(link => {
            link.lastCoordinateX = link.x;
            link.lastCoordinateY = link.y;
            return [link.id, link]
          }));

          // 扩展之后如果当前的节点启用了钉住，则对扩展出来的节点增加钉住功能
          if (curNode && curNode.isPinStatus) {
            curNode.links.forEach(link => {
              if (link.sourceNode.id === curNode.id && allCurLinkByIdMap.has(link.id)) {
                allNodeByIdMap.get(link.targetNode.id).isPinRemember = true;
              }
              if (link.targetNode.id === curNode.id && allCurLinkByIdMap.has(link.id)) {
                allNodeByIdMap.get(link.sourceNode.id).isPinRemember = true;
              }
            })
          }

          // 根据当前图谱数据更新图中节点的扩展标识
          // console.log('更新图中所有节点的扩展标识');
          nodes.forEach(d => {
            for (let relationshipType in d.currentExpandStatus) {
              var existResult = isUnExtendable(d, relationshipType);
              d.currentExpandStatus[relationshipType] = existResult;
              allNodeByIdMap.get(d.id).currentExpandStatus[relationshipType] = existResult;
              allCurNodeByIdMap.get(d.id).currentExpandStatus[relationshipType] = existResult
            }
          });
          resolve(`边更新完毕`)
        })
      })
    };
    const pNodeUpdate = updateNodeSvgPromise();
    const pLinkUpdate = updateLinkPromise();
    Promise.all([pNodeUpdate, pLinkUpdate]).then((result) => {
      // 渲染更新完后再次设置力仿真器参数
      simulation.nodes(nodes);
      simulation.force('link').links(links);
      simulation.alpha(1).restart();
    }).catch((error) => {
      console.log(error)
    })
  }

  /**
   * （力引导布局方法）
   * 力仿真器调度函数-调度主体
   */
  function ticked () {
    // 过渡动画关闭，则表示节点坐标已计算完毕，可进行节点过渡变换
    if (!isTransitionStatus) {
      moveNode(nodeG); // 对节点进行过渡变换
      moveLink(linkG); // 对连边进行过渡变换
    } else {
      // 否则手动调用tick进行节点计算，采用10次
      for (let i = 0; i < 10; i++) {
        simulation.tick();
      }
    }
  }

  /**
   * （力引导布局方法）
   * 力仿真器调度函数-调度结束时
   */
  function tickEnd () {
    // 处于过渡动画状态中，表示进行节点过渡变换
    if (isTransitionStatus) {
      moveNode(nodeG, true); // 对节点进行过渡变换
      moveLink(linkG, true); // 对连边进行过渡变换
      isTransitionStatus = false; //过渡完成后关闭过渡标识
    }
  }

  /**
   * （力引导布局方法，可作为全局图谱交互事件设置）
   * 节点拖拽事件开始
   * @param event
   */
  function dragstarted (event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  /**
   * （力引导布局方法，可作为全局图谱交互事件设置）
   * 节点拖拽事件进行时
   * @param event
   */
  function dragged (event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  /**
   * （力引导布局方法，可作为全局图谱交互事件设置）
   * 节点拖拽事件结束
   * @param event
   */
  function dragended (event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  /**
   * 增量函数，扩展和收缩统一入口
   * @param {Object} obj [增量相关的图数据，包括所选的原始节点node和增量相关的图数据newGraph]
   * @param {Object} params [增量相关的参数，这里主要为扩展的关系记录relationshipType]
   */
  function addNewGraph (obj, params) {
    // 如果当前有非记忆的扩展边，则将其进行收缩复原
    if (curRelationshipLink) {
      shrinkLink(curRelationshipLink)
    }

    // 获取操作的节点数据和增量相关的图数据
    const rootNode = obj.node;
    const newGraph = obj.newGraph;

    // 更新当前扩展关系标识
    curExpandRelationshipType = params.relationshipType;
    if (rootNode.currentExpandStatus[curExpandRelationshipType]) {
      // 如果图谱上显示的当前操作节点已经扩展了该关系，则表现为收缩
      shrinkRelationshipNodes();
    } else {
      // 如果图谱上显示的当前操作节点还没有扩展该关系，则表现为扩展
      expandRelationshipNodes();
    }

    // 开启过渡效果并进行画布渲染
    isTransitionStatus = true;
    render();

    // 收缩相关扩展关系下的节点
    function shrinkRelationshipNodes () {
      // 更新当前操作节点的扩展相关状态
      rootNode.currentExpandStatus[curExpandRelationshipType] = false;

      // 遍历相关扩展的节点，将非路径记忆的节点从原始数据当中过滤掉
      rootNode.expandChildrenNode[curExpandRelationshipType].forEach(childNode => {
        if (allCurNodeByIdMap.has(childNode.id) && !childNode.isRemember && !childNode.isPinRemember && childNode.id !== rootNode.id) {
          nodes = nodes.filter(d => d.id !== childNode.id);
          links = links.filter(d => d.sourceNode.id !== childNode.id && d.targetNode.id !== childNode.id);
          // 当需要去除的是作业节点NODE类型时，再对其数据流关系DATA_FLOW的非记忆二跳点边数据进行过滤
          if (childNode.group === 'NODE' && curExpandRelationshipType === 'DATA_FLOW') {
            childNode.expandChildrenNode[curExpandRelationshipType].forEach(nodeItem => {
              if (allCurNodeByIdMap.has(nodeItem.id) && !nodeItem.isRemember && !nodeItem.isPinRemember && nodeItem.id !== childNode.id) {
                nodes = nodes.filter(d => d.id !== nodeItem.id);
                links = links.filter(d => d.sourceNode.id !== childNode.id && d.targetNode.id !== childNode.id);
              }
            });
            childNode.expandChildrenLink[curExpandRelationshipType].forEach(linkItem => {
              if (allCurLinkByIdMap.has(linkItem.id) && !linkItem.isRemember()) {
                links = links.filter(d => d.id !== linkItem.id);
              }
            });
          }
        }
      });

      // 遍历相关扩展的连边，将非路径记忆的连边从原始数据当中过滤掉
      rootNode.expandChildrenLink[curExpandRelationshipType].forEach(childLink => {
        if (allCurLinkByIdMap.has(childLink.id) && !childLink.isRemember()) {
          links = links.filter(d => d.id !== childLink.id);
        }
      });
    }

    // 扩展相关扩展关系下的节点
    function expandRelationshipNodes () {
      rootNode.currentExpandStatus[curExpandRelationshipType] = true; // 更新当前操作节点的扩展相关状态
      // 曾经扩展过该类关系，则从缓存中直接读取数据并扩展
      if (rootNode.isExpandChildren[curExpandRelationshipType]) {
        // expandNode(rootNode);
        // 遍历获取相关扩展的点边数据
        rootNode.expandChildrenNode[curExpandRelationshipType].forEach(childNode => {
          if (!allCurNodeByIdMap.has(childNode.id)) {
            // 设置新加入到图谱中被扩展的子节点初始坐标为父节点的位置
            childNode.x = rootNode.x;
            childNode.y = rootNode.y;

            nodes.push(childNode);
          }
        });

        rootNode.expandChildrenLink[curExpandRelationshipType].forEach(childLink => {
          if (!allCurLinkByIdMap.has(childLink.id)) {
            links.push(childLink);
          }
        });
      } else { // 否则为第一次扩展，需对数据进行处理
        // 过滤获取图谱上不存在的新节点
        const newNodes = newGraph.nodes.filter(node => {
          if (allNodeByIdMap.has(node.guid)) {
            // 如果节点已经被保存在全局属性allNodeByIdMap中，则过滤
            // 但如果此时该节点不显示在图谱中（即被隐藏），应当可视化出来
            if (!allCurNodeByIdMap.has(node.guid)) {
              // 设置节点的坐标为选择的扩展节点位置
              allNodeByIdMap.get(node.guid).x = rootNode.x;
              allNodeByIdMap.get(node.guid).y = rootNode.y;
              // 将该节点添加进图谱数据
              nodes.push(allNodeByIdMap.get(node.guid))
            }
            return false;
          } else {
            return true;
          }
        });
        // 过滤获取图谱上不存在的新连边（同上）
        const newLinks = newGraph.edges.filter(link => {
          if (allLinkByIdMap.has(link.guid)) {
            // 如果连边已经被保存在全局属性allNodeByIdMap中，则过滤
            // 但如果此时该节点不显示在图谱中（即被隐藏），应当可视化出来
            if (!allCurLinkByIdMap.has(link.guid)) {
              links.push(allLinkByIdMap.get(link.guid))
            }
            return false;
          } else {
            return true;
          }
        });

        // 生成指定数据结构类型的点边数据
        const newChildrenNodes = createNodes(newNodes, node => {
          allNodeByIdMap.set(node.id, node);
          node.x = rootNode.x;
          node.y = rootNode.y;
        });
        const newChildrenLinks = createEdges(newLinks, link => {
          allLinkByIdMap.set(link.id, link);
        });

        // 绑定连边两端节点的关联关系
        newChildrenLinks.forEach(d => {
          linkTwoNodes(d.sourceNode, d.targetNode, d)
        });

        // 更新全局点边数据记录
        allNodes.push(...newChildrenNodes);
        allLinks.push(...newChildrenLinks);

        // 更新图谱数据
        nodes.push(...newChildrenNodes);
        links.push(...newChildrenLinks);

        // 更新当前操作节点的扩展数据和扩展标识
        newGraph.edges.forEach(t => {
          var link = links.find(d => d.id === t.guid);
          if (!rootNode.isExpandChildNodeMap[curExpandRelationshipType][link.sourceNode.id]) {
            rootNode.expandChildrenNode[curExpandRelationshipType].push(link.sourceNode);
            rootNode.isExpandChildNodeMap[curExpandRelationshipType][link.sourceNode.id] = link.sourceNode;
          }
          if (!rootNode.isExpandChildNodeMap[curExpandRelationshipType][link.targetNode.id]) {
            rootNode.expandChildrenNode[curExpandRelationshipType].push(link.targetNode);
            rootNode.isExpandChildNodeMap[curExpandRelationshipType][link.targetNode.id] = link.targetNode;
          }
          if (!rootNode.isExpandChildLinkMap[curExpandRelationshipType][link.id]) {
            rootNode.expandChildrenLink[curExpandRelationshipType].push(link);
            rootNode.isExpandChildLinkMap[curExpandRelationshipType][link.id] = link;
          }
        });
        rootNode.isExpandChildren[curExpandRelationshipType] = true;
      }
    }
  }

  /**
   * 钉住与解锁统一入口
   * @param {Object} handelNode [所选择的操作节点]
   */
  function pinNode (handelNode) {
    // 当前操作节点已经钉住了，则解锁
    if (handelNode.isPinStatus) {
      // 更新操作节点的钉住和解锁状态
      handelNode.isPinStatus = false;
      handelNode.isPinRemember = false;
      // 取消相连节点的钉住记忆标识
      handelNode.links.forEach(link => {
        if (link.sourceNode.id === handelNode.id && allCurLinkByIdMap.has(link.id)) {
          allNodeByIdMap.get(link.targetNode.id).isPinRemember = false;
        }
        if (link.targetNode.id === handelNode.id && allCurLinkByIdMap.has(link.id)) {
          allNodeByIdMap.get(link.sourceNode.id).isPinRemember = false;
        }
        // 特殊处理——取消二跳数据流关系的钉住记忆标识
        if (link.sourceNode.group === 'NODE') {
          for (let edge of link.sourceNode.links) {
            if (edge.sourceNode.id === link.sourceNode.id) {
              allNodeByIdMap.get(edge.targetNode.id).isPinRemember = false;
            }
            if (edge.targetNode.id === link.sourceNode.id) {
              allNodeByIdMap.get(edge.sourceNode.id).isPinRemember = false;
            }
          }
        }
        if (link.targetNode.group === 'NODE') {
          for (let edge of link.targetNode.links) {
            if (edge.sourceNode.id === link.targetNode.id) {
              allNodeByIdMap.get(edge.targetNode.id).isPinRemember = false;
            }
            if (edge.targetNode.id === link.targetNode.id) {
              allNodeByIdMap.get(edge.sourceNode.id).isPinRemember = false;
            }
          }
        }
      })
    }
    // 当前操作节点未被钉住，执行钉住
    else {
      handelNode.isPinStatus = true;
      handelNode.isPinRemember = true;
      // 添加相连节点的钉住记忆标识
      handelNode.links.forEach(link => {
        if (link.sourceNode.id === handelNode.id && allCurLinkByIdMap.has(link.id)) {
          allNodeByIdMap.get(link.targetNode.id).isPinRemember = true;
        }
        if (link.targetNode.id === handelNode.id && allCurLinkByIdMap.has(link.id)) {
          allNodeByIdMap.get(link.sourceNode.id).isPinRemember = true;
        }
        // 特殊处理——添加二跳数据流关系的钉住记忆标识
        if (link.sourceNode.group === 'NODE') {
          for (let edge of link.sourceNode.links) {
            if (edge.sourceNode.id === link.sourceNode.id) {
              allNodeByIdMap.get(edge.targetNode.id).isPinRemember = true;
            }
            if (edge.targetNode.id === link.sourceNode.id) {
              allNodeByIdMap.get(edge.sourceNode.id).isPinRemember = true;
            }
          }
        }
        if (link.targetNode.group === 'NODE') {
          for (let edge of link.targetNode.links) {
            if (edge.sourceNode.id === link.targetNode.id) {
              allNodeByIdMap.get(edge.targetNode.id).isPinRemember = true;
            }
            if (edge.targetNode.id === link.targetNode.id) {
              allNodeByIdMap.get(edge.sourceNode.id).isPinRemember = true;
            }
          }
        }
      })
    }
  }

  /**
   * 路径记忆统一入口
   * @param {Object} handelNode [路径记忆的目标节点]
   */
  function rememberNode (handelNode) {
    handelNode.isRemember = true;
  }

  /**
   * 关系扩展后，过滤非路径记忆的点边数据
   */
  function filterNoRemember () {
    nodes = nodes.filter(node => node.isRemember || node.isPinRemember);
    links = links.filter(link => link.isRemember());

    // 更新图谱可见数据
    allCurNodeByIdMap = new Map(nodes.map(node => [node.id, node]));
    allCurLinkByIdMap = new Map(links.map(link => [link.id, link]));
  }

  /**
   * 连边关系扩展
   * @param {Object} obj [增量相关的图数据，包括所选的原始连边link和增量相关的图数据newGraph]
   * @param {Object} params [增量相关的参数，这里主要为扩展的关系记录relationshipType]
   */
  function addEdgeRelationshipExpand (obj, params) {
    // 收缩非记忆扩展边
    shrinkLink(curRelationshipLink);

    // 获取操作的连边和扩展关系
    const handleLink = obj.link;
    curExpandRelationshipType = params.relationshipType;

    // 曾经请求过该连边的扩展关系，则从缓存中读取数据
    if (handleLink.isRelationshipExpand) {
      let newNodes = handleLink.relationshipTypeExpandData.nodes.filter(node => !allCurNodeByIdMap.has(node.id));
      let newLinks = handleLink.relationshipTypeExpandData.links.filter(link => !allCurLinkByIdMap.has(link.id));
      nodes.push(...newNodes);
      links.push(...newLinks);
    } else {
      // 曾经没有请求过该连边的扩展关系，则处理新数据
      const handleLinkNodes = handleLink.relationshipTypeExpandData.nodes;
      const handleLinkLinks = handleLink.relationshipTypeExpandData.links;

      // 获取需往图谱上新增的节点数据
      let newNodes = obj.newGraph.nodes.filter(node => {
        if (!allNodeByIdMap.has(node.guid)) {
          return true
        } else {
          // 节点不在当前图谱上（即被隐藏了的），则添加进入图谱
          if (!allCurNodeByIdMap.has(node.guid)) {
            nodes.push(allNodeByIdMap.get(node.guid));
          }
          // 更新连边的相关扩展属性记录
          handleLinkNodes.push(allNodeByIdMap.get(node.guid));
          return false;
        }
      });
      // 获取需往图谱上新增的连边数据
      let newLinks = obj.newGraph.edges.filter(link => {
        if (!allLinkByIdMap.has(link.guid)) {
          return true
        } else {
          // 节点不在当前图谱上（即被隐藏了的），则添加进入图谱
          if (!allCurLinkByIdMap.has(link.guid)) {
            links.push(allLinkByIdMap.get(link.guid));
          }
          // 更新连边的相关扩展属性记录
          handleLinkLinks.push(allLinkByIdMap.get(link.guid));
          return false;
        }
      });

      // 生成指定数据结构类型的点边数据
      newNodes = createNodes(newNodes, node => {
        allNodeByIdMap.set(node.id, node);
        handleLinkNodes.push(node)
      });

      newLinks = createEdges(newLinks, link => {
        allLinkByIdMap.set(link.id, link);
        handleLinkLinks.push(link);

        // 关系扩展后的z节点肯定有所属的数据表,即一定是 T->z ，因此可以根据此设置节点的初始位置
        // 即根据边处理事务：T增加z节点，新增z的初始位置设置为T处
        handleTzLink(link);
      });

      // 更新图谱相关数据的属性记录
      allNodes.push(...newNodes);
      allLinks.push(...newLinks);
      nodes.push(...newNodes);
      links.push(...newLinks);

      // 将连边两端的数据表进行路径记忆
      rememberNode(handleLink.sourceNode);
      rememberNode(handleLink.targetNode);
    }

    // 删除当前扩展操作的连边
    links = links.filter(link => link.id !== handleLink.id);

    // 更新连边的扩展属性标识以及当前的扩展边
    handleLink.isRelationshipExpand = true;
    curRelationshipLink = handleLink;

    // 开启过渡效果并进行画布渲染
    isTransitionStatus = true;
    render();

    // 更新上一次连边扩展标识
    lastRelationshipLink = curRelationshipLink;

    function handleTzLink (link) {
      // 根据连边处理新增节点的初始坐标
      if (link.sourceNode.group === 'TABLE') {
        const TableNode = link.sourceNode;
        const zNode = link.targetNode;
        if (!TableNode.isExpandChildNodeMap[curExpandRelationshipType][zNode.id]) {
          // 绑定连边两端节点的关联关系
          linkTwoNodes(TableNode, zNode, handleLink);
          zNode.x = TableNode.x;
          zNode.y = TableNode.y;
        }
      }
    }
  }

  /**
   * 收缩先前扩展的连边图数据，并恢复连边
   * @param {Object} link [待收缩复原的连边数据]
   */
  function shrinkLink (link) {
    // 过滤非路径记忆的点边数据
    filterNoRemember();
    // 恢复原来的边并更新边扩展标识
    if (link) {
      links.push(link);
      curRelationshipLink = null;
    }
  }

  /**
   * 绑定连边两端节点的关联关系
   * @param {Object} nodeA [连边起始节点]
   * @param {Object} nodeB [连边目标节点]
   * @param {Object} link [连边]
   */
  function linkTwoNodes (nodeA, nodeB, link) {
    if (!nodeA.isExpandChildNodeMap[curExpandRelationshipType][nodeB.id]) {
      nodeA.expandChildrenNode[curExpandRelationshipType].push(nodeB);
      nodeA.isExpandChildNodeMap[curExpandRelationshipType][nodeB.id] = nodeB;
      nodeA.expandChildrenLink[curExpandRelationshipType].push(link);
      nodeA.isExpandChildLinkMap[curExpandRelationshipType][link.id] = link;
    }
    if (!nodeB.isExpandChildNodeMap[curExpandRelationshipType][nodeA.id]) {
      nodeB.expandChildrenNode[curExpandRelationshipType].push(nodeA);
      nodeB.isExpandChildNodeMap[curExpandRelationshipType][nodeA.id] = nodeA;
      nodeB.expandChildrenLink[curExpandRelationshipType].push(link);
      nodeB.isExpandChildLinkMap[curExpandRelationshipType][link.id] = link;
    }
  }

  /**
   *  判断节点对应扩展关系下的子节点是否全部在图中，用于动态渲染右键扩展菜单项
   * @param {Object} node [待判断的节点数据]
   * @param {string} relationshipType [扩展关系]
   * @returns {boolean} 但会结果为true表示已经全部扩展了，菜单项表示“已扩展”，否则表示“可扩展”
   */
  function isUnExtendable (node, relationshipType) {
    // 判断结果标识符
    var result = false;

    // 如果当前节点未被记忆说明还没有扩展过的，因此 node 的扩展节点肯定不在图中，可以扩展
    if (!node.isRemember || !node.isExpandChildren[relationshipType]) {
      result = true;
    } else {
      // 如果被记忆了则说明已经扩展过一次，那么就判断是否有东西
      // 从相关节点出发看图谱上是否有可扩展的东西
      var balanceNodes = node.expandChildrenNode[relationshipType].filter(d => d.id !== node.id); // 先过滤掉本身
      balanceNodes.forEach(childNode => {
        // 如果发现当前图谱上有不存在的节点，则表示还可以扩展
        if (!allCurNodeByIdMap.has(childNode.id)) {
          result = true;
        }
      });
      // 从相关连边出发看图谱上是否有可扩展的东西
      var balanceLinks = node.expandChildrenLink[relationshipType];
      balanceLinks.forEach(childLink => {
        // 如果发现当前图谱上有不存在的连边，则表示还可以扩展
        if (!allCurLinkByIdMap.has(childLink.id)) {
          result = true;
        }
      });
    }
    return !result;
  }

  /**
   * （可作为全局设置）
   * 初始化画布相关设置
   * @returns {{maxRadius: number, nodeSize: number}}
   */
  function init () {
    // 绑定 svg 元素基础事件——放缩以及点击取消对话框（可通过全局设置）
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

    // 根据节点个数计算初始节点大小，最小半径为15 （可作为全局图属性设置）
    // 可视化容器边距参数（可作为全局图属性）
    const margin = ({
      top: height / 9,
      right: width / 12,
      bottom: height / 9,
      left: width / 12
    });
    var maxRadius = d3.min([width - margin.left - margin.right, height - margin.top - margin.bottom]) / 2;
    var nodeSize = d3.max([((2 * Math.PI * maxRadius / originalData.nodes.length) * 0.3 / 2), 15]);
    if (nodeSize >= 15) {
      nodeSize = 15;
    }

    // 设置连边箭头样式（可通过全局设置）
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

    return {maxRadius, nodeSize};
  }

  // 下面返回的函数，主要用于前台菜单组件调用
  return {
    addNewGraph,
    pinNode,
    addEdgeRelationshipExpand,
  }
}

export default createForceDirectedGraph;
