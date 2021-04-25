// 这里是选择布局的地方哦

import createCentric from './concentric'
import createChordLayout from './chordLayout'
import createArcLayout from './arcLayout'
import createAdjacentMatrixLayout from './adjacentMatrixLayout'
import createCircularLayout from './circularLayout'

import createForceDirectedGraph from './force'
import createGridGraph from './gridLayout'

function Option (option) {
  this.beta = option.beta
}


function Link (edge) {
  this.source = edge.source;
  this.target = edge.target;
  this.weight = edge.weight;
  this.data = edge;
}

function Node (node) {
  this.id = node.id;
  this.group = node.group;
  this.label = node.label;

  this.matrixIndex = 0;
  this.pathNum = 0;

  this.data = node;
}


const createGraphLayoutFun = {
  1: createCentric,
  2: createChordLayout,
  3: createArcLayout,
  4: createAdjacentMatrixLayout,
  5: (data, selection, cbFunSelectNode) => createCircularLayout(data, selection, 0, cbFunSelectNode),
  6: (data, selection, cbFunSelectNode) => createCircularLayout(data, selection, 0.85, cbFunSelectNode),
  7: createForceDirectedGraph,
  8: createGridGraph,
}

// LayoutObj 应该有一个基类
function selectGraphLayout (layoutId, data, htmlDom, cbFunSelectNode) {
  const LayoutObj = createGraphLayoutFun[layoutId](data, htmlDom, cbFunSelectNode);
  return LayoutObj;
}

export default selectGraphLayout;
