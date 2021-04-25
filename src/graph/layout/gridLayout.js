
import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';
const allNodeById = {};

function Link (edge) {
  this.source = allNodeById[edge.source];
  this.target = allNodeById[edge.target];
  this.weight = edge.weight;
  this.data = edge;
}

function Node (node) {
  this.id = node.id;
  this.group = node.group;
  this.label = node.label;
  this.data = node;
  this.x = 200;
  this.y = 200;
}

function createNodeCoordinate (nodes, xNum, yNum) {
  // const  horizontalWidth = width/x_num;
  // const  verticalWidth =  height/y_num;
  const horizontalWidth = 80;
  const verticalWidth = 80;
  return nodes.map((d, index) => {
    const node = new Node(d);
    node.x = node.x + (index % xNum) * horizontalWidth
    node.y = node.y + Math.floor(index / xNum) * verticalWidth
    allNodeById[node.id] = node;
    return node
  })
}

function createLinkCoordinate (edges) {
  return edges.map((d, index) => {
    const link = new Link(d);

    return link
  })
}

function createGridGraph (data, canvas, callFunSelectNode) {
  var curSelectedNode = null;

  var radius = 10;
  var transform = d3.zoomIdentity;
  var context = canvas.getContext('2d');

  const width = canvas.width;
  const height = canvas.height;

  const nodes = createNodeCoordinate(data.nodes, 5, 4);
  const links = createLinkCoordinate(data.edges)

  console.log(nodes)

  const scale = d3.scaleOrdinal(d3.schemeCategory10);
  function colorNode (node) {
    const nodeColor = scale(node.group);
    return nodeColor;
  }

  simulationUpdate();

  /* const simulation = d3.forceSimulation(nodes) // 创建一个新的力学仿真.
    .force('link', d3.forceLink(links).id(function (d) { return d.id })) // 添加或移除一个力模型.
    .force('charge', d3.forceManyBody().strength(d => -80))
    .force('center', d3.forceCenter(width / 2, height / 2));

  simulation
    .nodes(nodes)
    .on('tick', simulationUpdate);

  simulation.force('link')
    .links(links);
*/
  d3.select(canvas)
    .call(d3.drag()
      .container(canvas)
      .subject(dragsubject)
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended))
    .call(d3.zoom()
      .scaleExtent([1 / 10, 8])
      .on('zoom', zoomed))

  function dragsubject (e) {
    // return simulation.find(e.x, e.y); //找最近的节点
    let i;
    let x = transform.invertX(e.x);
    let y = transform.invertY(e.y);
    let dx;
    let dy;
    for (i = nodes.length - 1; i >= 0; --i) {
      const node = nodes[i];
      dx = x - node.x;
      dy = y - node.y;

      if (dx * dx + dy * dy < radius * radius) {
        node.x = transform.applyX(node.x);
        node.y = transform.applyY(node.y);
        nodeSelectChange(node)
        curSelectedNode = node;
        return node;
      }
    }

    console.log('你拖动了画布')
  }

  function nodeSelectChange (d) {
    console.log('在网格布局中选择了节点', d.data);
    callFunSelectNode(d.data)
  }

  function dragstarted (e) {
    // d3.select(that).attr('stroke', 'black');
    // if (!e.active) simulation.alphaTarget(0.3).restart();
    // simulationUpdate()
    e.subject.x = transform.invertX(e.x);
    e.subject.y = transform.invertY(e.y);
  }

  function dragged (e) {
    simulationUpdate()
    e.subject.x = transform.invertX(e.x);
    e.subject.y = transform.invertY(e.y);
  }

  function dragended (e) {
    simulationUpdate()
    // if (!e.active) simulation.alphaTarget(0);
    e.subject.fx = null;
    e.subject.fy = null;
  }

  function zoomed (e) {
    // console.log('zooming')
    transform = e.transform;
    // console.log('transform',transform)
    simulationUpdate();
  }

  function simulationUpdate () {
    console.log('更新');
    context.save(); // 保存当前环境的状态

    context.clearRect(0, 0, width, height); // 清空给定矩形内的指定像素
    context.translate(transform.x, transform.y); // 方法重新映射画布上的 (0,0) 位置
    context.scale(transform.k, transform.k); // 缩放当前绘图，更大或更小

    links.forEach(function (d) {
      // console.log(d)
      context.beginPath(); // 起始一条路径，或重置当前路径
      context.strokeStyle = 'grey';
      context.moveTo(d.source.x, d.source.y); // 把路径移动到画布中的指定点，不创建线条
      context.lineTo(d.target.x, d.target.y); // 添加一个新点，然后在画布中创建从该点到最后指定点的线条
      context.stroke(); // 绘制已定义的路径
    });

    nodes.forEach((d, i) => {
      context.beginPath();
      context.fillStyle = colorNode(d) // 设置或返回用于填充绘画的颜色、渐变或模式。
      context.arc(d.x, d.y, radius, 0, 2 * Math.PI, true); // 方法创建弧/曲线（用于创建圆或部分圆）
      context.fill(); // 填充当前绘图（路径）
      context.beginPath();
      context.font = '10px Arial';
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.fillText(d.id, d.x, d.y + 2.5);
      context.fill(); // 填充当前绘图（路径）
    });

    if (curSelectedNode) {
      context.beginPath();
      context.arc(curSelectedNode.x, curSelectedNode.y, radius, 0, 2 * Math.PI, true); // 方法创建弧/曲线（用于创建圆或部分圆）
      context.fillStyle = colorNode(curSelectedNode) // 设置或返回用于填充绘画的颜色、渐变或模式。
      context.lineWidth = 2;
      context.stroke();
      context.fill(); // 填充当前绘图（路径）
      context.beginPath();
      context.font = '10px Arial';
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.fillText(curSelectedNode.id, curSelectedNode.x, curSelectedNode.y + 2.5);
      context.fill(); // 填充当前绘图（路径）
    }

    context.restore(); // 返回之前保存过的路径状态和属性
  }
}

export default createGridGraph
