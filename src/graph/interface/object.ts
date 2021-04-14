// 图模型抽象接口
export interface Properties {
  [propName: string]: any;
}

// 节点
export interface Nodes {
  id: string | number;
  name?: string;
  x?: number;
  y?: number;
  class?: string;
  properties?: Properties;
  size?: number | number[];

  [propName: string]: any;
}

// 边
export interface Edges {
  id: string | number;
  source: string | number;
  target: string | number;
  name?: string;
  class?: string;
  properties?: Properties;

  [propName: string]: any;
}

// 布局参数
export interface LayoutData {
  nodes: Array<Nodes>;
  edges: Array<Edges>;
}