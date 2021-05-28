<template>
  <vue-context-menu :contextMenuData="contextMenuData"
                    @checkNode="checkNode"
                    @shrinkNode="shrinkNode"
                    @pinNode="pinNode"
                    @expandNodeAll="expandNode('ALL')"
                    @expandNodeRECOMMEND="expandNode('RECOMMEND')"
                    @expandNodeOTHERS="expandNode('OTHERS')"
                    @expandNodePK_FK="expandNode('PK_FK')"
                    @expandNodeDATA_FLOW="expandNode('DATA_FLOW')"
                    @expandNodeLOGICAL_PHYSICAL="expandNode('LOGICAL_PHYSICAL')"
                    @expandNodeLAST_PARENT_CHILD="expandNode('LAST_PARENT_CHILD')"
                    @expandNodeNEXT_PARENT_CHILD="expandNode('NEXT_PARENT_CHILD')"
                    @linkRelationshipExpand="linkRelationshipExpand()"
  >
  </vue-context-menu>
</template>
<script>
import {getNodeNextJump, getRelationshipExpandEdge} from '@/request/api';// 导入我们的api接口
export default {
  name: 'app',
  data () {
    return {
      node: null,
      callBackEndHandle: null, // 右键事件结束回调函数
      // contextmenu data (菜单数据)
      contextMenuData: {
        // the contextmenu name(@1.4.1 updated)
        menuName: 'demo',
        // The coordinates of the display(菜单显示的位置)
        axis: {
          x: null,
          y: null
        },
        // Menu options (菜单选项)
        menulists: []

      },

      nodeMenulists: [{
        fnHandler: 'checkNode', // Binding events(绑定事件)
        btnName: '查看节点信息' // The name of the menu option (菜单名称)
      },
        // {
        //   btnName: '隐藏'
        // },
      {
        fnHandler: 'pinNode',
        btnName: '钉住'
      },
      {
        btnName: '关系扩展',
        children: []
      },
      {
        fnHandler: 'shrinkNode',
        btnName: '收缩'
      }],

      linkMenulists: [{
        fnHandler: 'linkRelationshipExpand',
        btnName: '关系扩展'
      }, {
        btnName: '隐藏'
      }, {
        btnName: '删除'
      }],

      expandDict: {
        BusinessCatalog: [
          {
            btnName: '+所有',
            fnHandler: 'expandNodeAll'
          },
          {
            btnName: '+其他关系',
            fnHandler: 'expandNodeOTHERS'
          },
          {
            btnName: ' 上游父子关系',
            fnHandler: 'expandNodeLAST_PARENT_CHILD'
          },
          {
            btnName: ' 下游父子关系',
            fnHandler: 'expandNodeNEXT_PARENT_CHILD'
          }
        ],
        BusinessLogicEntity: [
          {
            btnName: '+所有',
            fnHandler: 'expandNodeAll'
          },
          {
            btnName: '+推荐关系',
            fnHandler: 'expandNodeRECOMMEND'
          },
          {
            btnName: ' 逻辑物理关系',
            fnHandler: 'expandNodeLOGICAL_PHYSICAL'
          },
          {
            btnName: ' 上游父子关系',
            fnHandler: 'expandNodeLAST_PARENT_CHILD'
          },
          {
            btnName: '+其他关系',
            fnHandler: 'expandNodeOTHERS'
          },
          {
            btnName: ' 下游父子关系',
            fnHandler: 'expandNodeNEXT_PARENT_CHILD'
          }
        ],
        BusinessLogicEntityColumn: [
          {
            btnName: '+所有',
            fnHandler: 'expandNodeAll'
          },
          {
            btnName: '+推荐关系',
            fnHandler: 'expandNodeRECOMMEND'
          },
          {
            btnName: ' 上游父子关系',
            fnHandler: 'expandNodeLAST_PARENT_CHILD'
          },
          {
            btnName: '+其他关系',
            fnHandler: 'expandNodeOTHERS'
          },
          {
            btnName: ' 逻辑物理关系',
            fnHandler: 'expandNodeLOGICAL_PHYSICAL'
          }
        ],
        DATABASE: [
          {
            btnName: '+所有',
            fnHandler: 'expandNodeAll'
          },
          {
            btnName: '+其他关系',
            fnHandler: 'expandNodeOTHERS'
          },
          {
            btnName: ' 下游父子关系',
            fnHandler: 'expandNodeNEXT_PARENT_CHILD'
          }
        ],
        TABLE: [
          {
            btnName: '+所有',
            fnHandler: 'expandNodeAll'
          },
          {
            btnName: '+推荐关系',
            fnHandler: 'expandNodeRECOMMEND'
          },
          {
            btnName: ' 数据流关系',
            fnHandler: 'expandNodeDATA_FLOW'
          },
          {
            btnName: ' 主外键关系',
            fnHandler: 'expandNodePK_FK'
          },
          {
            btnName: ' 上游父子关系',
            fnHandler: 'expandNodeLAST_PARENT_CHILD'
          },
          {
            btnName: '+其他关系',
            fnHandler: 'expandNodeOTHERS'
          },
          {
            btnName: ' 逻辑物理关系',
            fnHandler: 'expandNodeLOGICAL_PHYSICAL'
          },
          {
            btnName: ' 下游父子关系',
            fnHandler: 'expandNodeNEXT_PARENT_CHILD'
          }
        ],
        COLUMN: [
          {
            btnName: '+所有',
            fnHandler: 'expandNodeAll'
          },
          {
            btnName: '+推荐关系',
            fnHandler: 'expandNodeRECOMMEND'
          },

          {
            btnName: ' 上游父子关系',
            fnHandler: 'expandNodeLAST_PARENT_CHILD'
          },
          {
            btnName: '+其他关系',
            fnHandler: 'expandNodeOTHERS'
          },
          {
            btnName: ' 逻辑物理关系',
            fnHandler: 'expandNodeLOGICAL_PHYSICAL'
          },
          {
            btnName: ' 数据流关系',
            fnHandler: 'expandNodeDATA_FLOW'
          },
          {
            btnName: ' 主外键关系',
            fnHandler: 'expandNodePK_FK'
          }
        ],
        JOB: [
          {
            btnName: '+所有',
            fnHandler: 'expandNodeAll'
          },
          {
            btnName: '+其他关系',
            fnHandler: 'expandNodeOTHERS'
          },
          {
            btnName: ' 下游父子关系',
            fnHandler: 'expandNodeNEXT_PARENT_CHILD'
          }
        ],
        NODE: [
          {
            btnName: '+所有',
            fnHandler: 'expandNodeAll'
          },
          {
            btnName: '+推荐关系',
            fnHandler: 'expandNodeRECOMMEND'
          },
          {
            btnName: ' 数据流关系',
            fnHandler: 'expandNodeDATA_FLOW'
          },
          {
            btnName: ' 上游父子关系',
            fnHandler: 'expandNodeLAST_PARENT_CHILD'
          },
          {
            btnName: '+其他关系',
            fnHandler: 'expandNodeOTHERS'
          },
          {
            btnName: ' 下游父子关系',
            fnHandler: 'expandNodeNEXT_PARENT_CHILD'
          }
        ],
        ColumnLineage: [
          {
            btnName: '+所有',
            fnHandler: 'expandNodeAll'
          },
          {
            btnName: '+推荐关系',
            fnHandler: 'expandNodeRECOMMEND'
          },
          {
            btnName: ' 数据流关系',
            fnHandler: 'expandNodeDATA_FLOW'
          },
          {
            btnName: ' 上游父子关系',
            fnHandler: 'expandNodeLAST_PARENT_CHILD'
          }
        ]
      }
    }
  },
  methods: {

    // 统一的扩展或收缩——对已经扩展的进行收缩，对未扩展的进行扩展
    expandOrShrinkNode () {

    },

    // 边的关系扩展
    linkRelationshipExpand () {
      getRelationshipExpandEdge(this.link.data).then(res => {
        if (res.message === 'success') {
          console.log('【扩散边】新取得的数据', res.content)
          this.bus.$emit('addEdgeRelationshipExpand', {
            link: this.link,
            newGraph: res.content
          })
        }
        // this.callBackEndHandle();
      })
    },

    expandNode (relationship_type = 'ALL') {
      this.callBackEndHandle();
      if (this.node.isExpandChildren) {
        // 如果之前请求过节点了，那就不需要再请求，直接用现成的
        console.log('已经请求过该节点，直接扩展')
        this.bus.$emit('addNewGraph', {
          node: this.node,
          newGraph: {
            nodes: this.node.isExpandChildNode,
            edges: this.node.isExpandChildLink
          }
        })
        // this.callBackEndHandle();
        return;
      }
      getNodeNextJump(this.node.data, relationship_type).then(res => {
        if (res.message === 'success') {
          console.log('新取得的数据', res.content)

          this.bus.$emit('addNewGraph', {
            node: this.node,
            newGraph: res.content
          })
        }
        // this.callBackEndHandle();
      })
    },

    shrinkNode () {
      this.bus.$emit('shrinkNode', this.node)
    },

    setNodeContextMenu (contextData, cbEnd) {
      if (!contextData) {
        this.node = null;
        let x = -1000;
        let y = -1000;
        this.contextMenuData.axis = {
          x, y
        }
        return
      }

      if (contextData.node) {
        this.node = contextData.node;
        this.nodeMenulists[2].children = this.expandDict[this.node.group];
        this.contextMenuData.menulists = this.nodeMenulists
      } else {
        this.link = contextData.link;
        this.contextMenuData.menulists = this.linkMenulists;
      }

      let x = contextData.position[0];
      let y = contextData.position[1];
      // Get the current location
      this.contextMenuData.axis = {
        x, y
      };

      this.callBackEndHandle = cbEnd;
    },

    checkNode () {
      console.log(this.node)
    },

    // 钉住
    pinNode () {
      this.bus.$emit('pinNode', this.node)
    }

  }
}
</script>

<style>
  .vue-contextmenu-listWrapper {
    padding: 0;
  }

  ul {
    display: block;
    padding: 0;
  }

  .btn-wrapper-simple {
    height: 25px;
  }

  .no-child-btn {
    display: block;
    height: 25px !important;
  }

</style>
