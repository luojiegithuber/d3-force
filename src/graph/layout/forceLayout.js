import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';
import {createNodes, createEdges} from './object.js';

function createForceDirectedGraph (original_data, canvas, callFunSelectNode) {
  let curSelectedNode = null;
  const colors = d3.scaleOrdinal(d3.schemeCategory10);
  const width = canvas.width;
  const height = canvas.height;

  // 可视化容器边距参数
  const margin = ({
    top: height / 9,
    right: width / 12,
    bottom: height / 9,
    left: width / 12
  });

  const max_radius = d3.min([width - margin.left - margin.right, height - margin.top - margin.bottom]) / 2;
  let nodeSize = ((2 * Math.PI * max_radius / original_data.nodes.length) * 0.3 / 2);
  const nodes = createNodes(original_data.nodes);
  const links = createEdges(original_data.edges);

  let transform = d3.zoomIdentity;
  let context = canvas.getContext('2d');

  const simulation = d3.forceSimulation(nodes) // 创建一个新的力学仿真.
    .force('link', d3.forceLink(links).id(d => d.id)) // 添加或移除一个力模型.
    .force('charge', d3.forceManyBody().strength(d => -max_radius * 1.5))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .alphaTarget(1)

  simulation
    .nodes(nodes)
    .on('tick', simulationUpdate);

  simulation.force('link')
    .links(links);

  d3.select(canvas)
    .call(d3.drag()
      .container(canvas)
      .subject(dragsubject)
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended))

    .call(d3.zoom()
      .scaleExtent([1 / 10, 8])
      .on('zoom', zoomed));

  /*   nodes.forEach((d, i) => {
    d.x = 0;
    d.y = 0;
  });
 */
  function dragsubject (e) {
    let i;
    let x = transform.invertX(e.x);
    let y = transform.invertY(e.y);
    let dx;
    let dy;
    for (i = nodes.length - 1; i >= 0; --i) {
      const node = nodes[i];
      dx = x - node.x;
      dy = y - node.y;
      if (dx * dx + dy * dy < nodeSize * nodeSize) {
        node.x = transform.applyX(node.x);
        node.y = transform.applyY(node.y);
        nodeSelectChange(node);
        curSelectedNode = node;
        return node;
      }
    }
  }

  function nodeSelectChange (d) {
    console.log('在力导向布局中选择了节点', d);
    callFunSelectNode(d)
  }

  function dragstarted (e) {
    e.subject.fx = transform.invertX(e.x);
    e.subject.fy = transform.invertY(e.y);
    if (!e.active) simulation.alphaTarget(0.3).restart();
  }

  function dragged (e) {
    e.subject.fx = transform.invertX(e.x);
    e.subject.fy = transform.invertY(e.y);
  }

  function dragended (e) {
    if (!e.active) simulation.alphaTarget(0);
    e.subject.fx = null;
    e.subject.fy = null;
  }

  function zoomed (e) {
    transform = e.transform;
    simulationUpdate();
  }

  function simulationUpdate () {
    context.save(); // 保存当前环境的状态
    context.clearRect(0, 0, width, height); // 清空给定矩形内的指定像素
    context.translate(transform.x, transform.y); // 方法重新映射画布上的 (0,0) 位置
    context.scale(transform.k, transform.k); // 缩放当前绘图，更大或更小
    links.forEach(d => {
      context.beginPath(); // 起始一条路径，或重置当前路径
      context.moveTo(d.source.x, d.source.y); // 把路径移动到画布中的指定点，不创建线条
      context.lineTo(d.target.x, d.target.y); // 添加一个新点，然后在画布中创建从该点到最后指定点的线条
      context.stroke(); // 绘制已定义的路径
    });
    nodes.forEach((d, i) => {
      context.beginPath();
      context.fillStyle = setColor(d.group); // 设置或返回用于填充绘画的颜色、渐变或模式。
      context.arc(d.x, d.y, nodeSize, 0, 2 * Math.PI, true); // 方法创建弧/曲线（用于创建圆或部分圆）
      context.fill(); // 填充当前绘图（路径）
      context.beginPath();
      context.font = '12px Arial';
      context.fillStyle = 'black';
      context.textAlign = 'center';
      context.fillText(d.label, d.x, d.y + 2.5);
      context.fill(); // 填充当前绘图（路径）
    });
    if (curSelectedNode) {
      context.beginPath();
      context.arc(curSelectedNode.x, curSelectedNode.y, nodeSize, 0, 2 * Math.PI, true); // 方法创建弧/曲线（用于创建圆或部分圆）
      context.fillStyle = setColor(curSelectedNode.group); // 设置或返回用于填充绘画的颜色、渐变或模式。
      context.lineWidth = 2;
      context.stroke();
      context.fill(); // 填充当前绘图（路径）
      context.beginPath();
      context.font = '10px Arial';
      context.fillStyle = 'black';
      context.textAlign = 'center';
      context.fillText(curSelectedNode.label, curSelectedNode.x, curSelectedNode.y + 2.5);
      context.fill(); // 填充当前绘图（路径）
    }

    context.restore(); // 返回之前保存过的路径状态和属性
  }

  function setColor (x) {
    return colors(x);
  }
}

export default createForceDirectedGraph
