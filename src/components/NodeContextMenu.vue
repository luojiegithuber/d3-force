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
                    @expandLinkPK_FK="expandLink('PK_FK')"
  >
  </vue-context-menu>
</template>
<script>
  import {getNodeNextJump, getRelationshipExpandEdge} from '@/request/api';// 导入我们的api接口
  export default {
    name: 'app',
    data () {
      return {
        node: null, // 当前操作的节点
        link: null, // 当前操作的边
        lastExpandNodeId: null,  // 上一次扩展操作的节点
        lastExpandEdgeId: null,  // 上一次扩展操作的节点
        lastRelationshipType: null, // 上一次扩展操作的类型
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

        nodeMenulists: {
          COMMON: [
            {
              fnHandler: 'checkNode', // Binding events(绑定事件)
              btnName: '查看节点信息' // The name of the menu option (菜单名称)
            },
            {
              btnName: '关系扩展',
              children: []
            },
            {
              fnHandler: 'pinNode',
              btnName: '钉住'
            },
            {
              btnName: '隐藏',
            }],
          COLUMN: [
            {
              fnHandler: 'checkNode', // Binding events(绑定事件)
              btnName: '查看节点信息' // The name of the menu option (菜单名称)
            },
            {
              btnName: '关系扩展',
              children: []
            },
            {
              btnName: '隐藏',
            }]
        },

        linkMenulists: {
          COMMON: [
            {
              btnName: '隐藏'
            }, {
              btnName: '删除'
            }
          ],
          PK_FK: [
            {
              fnHandler: 'expandLinkPK_FK',
              btnName: '关系扩展'
            }, {
              btnName: '隐藏'
            }, {
              btnName: '删除'
            }
          ],

        },

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
      expandLink (relationship_type = 'PK_FK') {
        getRelationshipExpandEdge(this.link.data).then(res => {
          if (res.message === 'success') {
            console.log('【扩散边】新取得的数据', res.content)
            this.bus.$emit('addEdgeRelationshipExpand', {
              link: this.link,
              newGraph: res.content
            }, {relationship_type: relationship_type})
          }
          // this.callBackEndHandle();
        })
      },

      expandNode (relationship_type = 'RECOMMEND') {
        this.callBackEndHandle();
        // if (this.lastExpandNodeId === this.node.id && this.lastRelationshipType === relationship_type) {
        //   console.log(`重复上次请求操作，不需要重新渲染图`);
        //   return;
        // }
        if (this.node.isExpandChildren[relationship_type]) {
          this.lastExpandNodeId = this.node.id;
          this.lastRelationshipType = relationship_type;
          // 如果之前请求过节点了，那就不需要再请求，直接用现成的
          console.log(`已经请求过该节点的${relationship_type}类型，直接扩展`)
          this.bus.$emit('addNewGraph', {
            node: this.node,
            newGraph: {
              nodes: this.node.isExpandChildNodeMap[relationship_type],
              edges: this.node.isExpandChildNodeMap[relationship_type]
            }
          }, {relationship_type: relationship_type})
          // this.callBackEndHandle();
          return;
        }
        getNodeNextJump(this.node.data, relationship_type).then(res => {
          this.lastExpandNodeId = this.node.id;
          this.lastRelationshipType = relationship_type;
          if (res.message === 'success') {
            // console.log('新取得的数据', res.content)
            this.bus.$emit('addNewGraph', {
              node: this.node,
              newGraph: res.content
            }, {relationship_type: relationship_type})
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

        // 动态设置节点右键菜单
        if (contextData.node) {
          this.node = contextData.node;
          // 设置节点右键关系扩展菜单
          // if (this.node.pk_fk_group_id) {
          //   // 通过边主外键扩展的节点没有钉住功能
          //   this.nodeMenulists.COLUMN[1].children = this.expandDict[this.node.group];
          //   this.contextMenuData.menulists = this.nodeMenulists.COLUMN;
          // } else {
            this.nodeMenulists.COMMON[1].children = this.expandDict[this.node.group];
            // 设置节点右键钉住和解锁的文本切换
            this.nodeMenulists.COMMON[2].btnName = this.node.isPinStatus ? '解除钉住' : '钉住';
            this.contextMenuData.menulists = this.nodeMenulists.COMMON;
          // }


        }
        // 动态设置连边右键菜单
        if (contextData.link) {
          this.link = contextData.link;
          if (this.link.group === 'PK_FK' && this.link.sourceNode.group === 'TABLE' && this.link.targetNode.group === 'TABLE') {
            // 唯有 T-> PK_FK -> 类型的边才有主外键扩展
            this.contextMenuData.menulists = this.linkMenulists.PK_FK;
          } else {
            this.contextMenuData.menulists = this.linkMenulists.COMMON;
          }
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
        console.log('所选择节点的信息为', this.node)
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
