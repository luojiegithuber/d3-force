import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';

export function Node (node) {
  this.id = node.guid;
  this.group = node.type_name; // 类
  this.label = node.guid; // 先固定文本避免卡顿
  this.pathNum = 0; // 出入度总数
  this.x = undefined; // 自定义
  this.y = undefined; // 自定义
  this.data = node;
  this.incoming = []; // 高亮显示线的时候会用到
  this.outgoing = []; // 高亮显示线的时候会用到
  this.matrixIndex = 0; // 矩阵轴中的位置
}

export function createNodes (arr, callback) {
  return arr.map((d, index) => {
    const node = new Node(d);
    allNodeByIdMap.set(node.id, node)
    callback(node, index);
    return node;
  });
}

export function Edge (edge) {
  this.id = edge.guid;
  this.group = edge.type_name; // 类
  this.label = edge.guid; // 先固定文本避免卡顿
  this.source = edge.source;
  this.target = edge.target;
  this.sourceNode = allNodeByIdMap.get(edge.source); // 上面的Node类型
  this.targetNode = allNodeByIdMap.get(edge.target);
}

export function createEdges (arr, callback) {
  const edges = arr.map((d, index) => {
    const edge = new Edge(d);
    callback(edge, index);
    return edge
  })

  return edges;
}
const colors = d3.scaleOrdinal(d3.schemeCategory10);
export function setColor (x) {
  return colors(x);
}

export var allNodeByIdMap = new Map();
export function setAllNodeByIdMap (arr) {
  allNodeByIdMap = new Map(arr.map(d => [d.id, d]));
  return true
}

export const colorin = '#00f';
export const colorout = '#f00';
export const colornone = '#ccc';
export const nodeColor = '#ff9e6d';
