
import * as d3 from '../../../static/d3/d3.v6-6-0.min.js';
import {Node, Edge, createNodes, createEdges, setColor, colorin, colorout, colornone} from './object.js';
var allNodeById = new Map();

function handelData (data) {

  const nodes = createNodes(data.nodes,node =>{
    
    //新增三个新属性，在这里会派上用场
    node.parentId = undefined;
    node.hierarchyNum = 0;
    node.indegree = 0;

    allNodeById.set(node.id,node)

  });
  var edges = createEdges(data.edges);


  const hierarchys = []; // 层级金字塔数组（二维数组）
  let curHierarchyNum = 0; // 当前层级

  const queue = []; // 队列，用于辅助【拓扑排序】

  //过滤掉 自指向结点（去环操作）
  edges = edges.filter(d => {
    if(d.source === d.target){
      return false
    }else{
      d.sourceNode.outgoing.push(d);
      d.targetNode.incoming.push(d);
      d.targetNode.indegree++;
      return true;
    }
    
  })

  //选取根，并放在第一层级
  //默认选取方式是选择数组中第一个入度为0的结点
  nodes.forEach(d => {
    if(d.incoming.length === 0){
      queue.push(d);
      hierarchys.push(new Array());
    }
  })

  //拓扑排序操作
  while(queue.length!==0){
    const tempNode = queue.shift()
    if(tempNode.hierarchyNum !== curHierarchyNum){
      hierarchys.push(new Array());
      curHierarchyNum++;
    }  
    hierarchys[hierarchys.length - 1].push(tempNode)
    //console.log(tempNode.id,tempNode.hierarchyNum)
    tempNode.outgoing.forEach(edge => {
      const targetNode = edge.targetNode;
      targetNode.indegree--;
      if(targetNode.indegree === 0){
        targetNode.hierarchyNum = tempNode.hierarchyNum + 1
        queue.push(targetNode);
      } 
    })
  }

  console.log('【层级】',hierarchys)

  // link是不可能跨越两级的，根据这个可以过滤边
  // 同时不需要自转边

  function copyNode(node){
    return new Node(node.data)
  }

  var newEdges = edges.filter(d => {
    const sourceNode = d.sourceNode;
    const targetNode = d.targetNode;
    if((targetNode.hierarchyNum - sourceNode.hierarchyNum) === 1){
      
      if(!targetNode.parentId){
        targetNode.parentId = sourceNode.id;
      }else{
        //多个父亲，就复制一个孩子联系第二个父亲
        const newTargetNodeCopy = copyNode(targetNode)
        newTargetNodeCopy.parentId = sourceNode.id;
        nodes.push(newTargetNodeCopy)
      }
      return true;
    }else{
      return false;
    }
    
  })


  console.log('【过滤多余的边后】',newEdges)
  console.log('【最终版本的结点】',nodes)

  return nodes
}

function createRadialLayout (data, svg, callFunSelectNode) {
  // ——————————【数据预处理阶段】————————-
  
  var width = 800
  var radius = 500/2
  
  const tree = d3.tree()
      .size([2 * Math.PI, radius])
      .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth)
  const nodes = handelData(data)
  
  var data2 = d3.stratify()
      .id(function(d) { return d.id; })
      .parentId(function(d) { return d.parentId; })
      (nodes);
  
  //**************************
  
  //data = d3.hierarchy(datajson)
  //    .sort((a, b) => d3.ascending(a.data.name, b.data.name))
  
    const root = tree(data2);
    
    
    svg.attr("viewBox", [-800/2,-500/2,800,500]);

    svg = svg.call(d3.zoom()
    .scaleExtent([1 / 50, 4])
    .on('zoom', e => {
      svg.attr('transform', e.transform);
    }))
    .append('g')
  
    svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5)
      .selectAll("path")
      .data(root.links())
      .join("path")
        .attr("d", d3.linkRadial()
            .angle(d => d.x)
            .radius(d => d.y));
    
    svg.append("g")
      .selectAll("circle")
      .data(root.descendants())
      .join("circle")
        .attr("transform", d => `
          rotate(${d.x * 180 / Math.PI - 90})
          translate(${d.y},0)
        `)
        .attr("fill", d => d.children ? "black" : "green")
        .attr("r", 5);
  
    svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
      .selectAll("text")
      .data(root.descendants())
      .join("text")
        .attr("transform", d => `
          rotate(${d.x * 180 / Math.PI - 90}) 
          translate(${d.y},0) 
          rotate(${d.x >= Math.PI ? 180 : 0})
        `)
        .attr("dy", "0.31em")
        .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
        .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
        .text(d => d.data.id)
      .clone(true).lower()
        .attr("stroke", "white");
}


export default createRadialLayout
