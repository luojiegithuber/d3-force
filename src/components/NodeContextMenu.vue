<template>
  <vue-context-menu :contextMenuData="contextMenuData"
                    @checkNode="checkNode"
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
        callBackEndHandle: null, // 右键事件结束回调函数

        // 菜单数据
        contextMenuData: {
          menuName: 'demo',
          // 菜单显示的位置
          axis: {
            x: null,
            y: null
          },
          // 菜单选项
          menulists: []
        },

        // 节点菜单项
        nodeMenulists:
          [
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
              btnName: '隐藏'
            }],

        // 连边菜单项
        linkMenulists: {
          // 通用连边
          COMMON: [
            {
              btnName: '隐藏'
            }, {
              btnName: '删除'
            }
          ],
          // 主外键关系类型的连边
          PK_FK: [
            {
              fnHandler: 'expandLinkPK_FK',
              btnName: '关系扩展'
            }, {
              btnName: '隐藏'
            }, {
              btnName: '删除'
            }
          ]

        },
      }
    },

    methods: {
      /**
       * （需调用外部交互接口addEdgeRelationshipExpand）
       * 右键-连边的关系扩展
       * @param {string} relationshipType [扩展的类型]
       */
      expandLink (relationshipType = 'PK_FK') {
        getRelationshipExpandEdge(this.link.data).then(res => {
          if (res.message === 'success') {
            console.log('【扩散边】新取得的数据', res.content);
            this.bus.$emit('addEdgeRelationshipExpand', {
              link: this.link,
              newGraph: res.content
            }, {relationshipType: relationshipType})
          }
          // this.callBackEndHandle();
        })
      },

      /**
       * （需调用外部交互接口addNewGraph）
       * 右键-节点的关系扩展
       * @param {string} relationshipType [扩展的类型]
       */
      expandNode (relationshipType = 'RECOMMEND') {
        // 调用扩展节点的回调函数
        this.callBackEndHandle();

        // 如果已经层级扩展过，则将“使用缓存读取数据”的信息传达给扩展函数addNewGraph
        if (this.node.isExpandChildren[relationshipType]) {
          // console.log(`已经请求过该节点的${relationshipType}类型，直接搞渲染`)
          this.bus.$emit('addNewGraph', {
            node: this.node,
            newGraph: {
              nodes: this.node.isExpandChildNodeMap[relationshipType],
              edges: this.node.isExpandChildNodeMap[relationshipType]
            }
          }, {relationshipType: relationshipType});
        } else {
          // 否则发送请求
          getNodeNextJump(this.node.data, relationshipType).then(res => {
            if (res.message === 'success') {
              // console.log('新取得的数据', res.content)
              this.bus.$emit('addNewGraph', {
                node: this.node,
                newGraph: res.content
              }, {relationshipType: relationshipType})
            }
          })
        }
      },

      /**
       * （内部调用）
       * 设置点边右键菜单项
       * @param {Object} contextData [右键菜单的上下文数据信息，主要包括所选的点边数据和鼠标坐标]
       * @param {function} cbEnd [执行右键菜单的回调函数]
       */
      setNodeLinkContextMenu (contextData, cbEnd) {
        if (!contextData) {
          this.node = null;
          let x = -1000;
          let y = -1000;
          this.contextMenuData.axis = {
            x, y
          };
          return
        }
        // 动态设置节点右键菜单选项
        if (contextData.node) {
          this.node = contextData.node;
          this.nodeMenulists[1].children = this.expandDictByNodeType(this.node);
          // 设置节点右键钉住和解锁的文本切换
          this.nodeMenulists[2].btnName = this.node.isPinStatus ? '解除钉住' : '钉住';
          this.contextMenuData.menulists = this.nodeMenulists;
        }
        // 动态设置连边右键菜单选项
        if (contextData.link) {
          this.link = contextData.link;
          if (this.link.group === 'PK_FK' && this.link.sourceNode.group === 'TABLE' && this.link.targetNode.group === 'TABLE') {
            // 唯有 T-> PK_FK -> T 类型的边才有主外键扩展
            this.contextMenuData.menulists = this.linkMenulists.PK_FK;
          } else {
            this.contextMenuData.menulists = this.linkMenulists.COMMON;
          }
        }
        // 获取鼠标位置
        let x = contextData.position[0];
        let y = contextData.position[1];
        this.contextMenuData.axis = {
          x, y
        };
        this.callBackEndHandle = cbEnd;
      },

      /**
       * （调用外部交互接口）
       * 右键-查看节点信息
       */
      checkNode () {
        console.log('所选择节点的信息为', this.node)
        // do something else
      },

      /**
       * （需调用外部交互接口pinNode）
       * 右键-钉住/解锁
       */
      pinNode () {
        this.bus.$emit('pinNode', this.node)
      },

      /**
       * （内部调用）
       * 节点扩展与收缩展示文字的动态渲染
       * @param {Object} node [所选择的节点]
       * @returns {({btnName: string, fnHandler: string}|{btnName: string, fnHandler: string}|{btnName: string, fnHandler: string}|{btnName: string, fnHandler: string})[]}
       */
      expandDictByNodeType (node) {
        let menuDict;
        switch (node.group) {
          case 'BusinessCatalog': {
            menuDict = [
              {
                btnName: '+所有' + (node.currentExpandStatus.ALL ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeAll'
              },
              {
                btnName: '+其他关系' + (node.currentExpandStatus.OTHERS ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeOTHERS'
              },
              {
                btnName: ' 上游父子关系' + (node.currentExpandStatus.LAST_PARENT_CHILD ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeLAST_PARENT_CHILD'
              },
              {
                btnName: ' 下游父子关系' + (node.currentExpandStatus.NEXT_PARENT_CHILD ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeNEXT_PARENT_CHILD'
              }
            ];
            break;
          }
          case 'BusinessLogicEntity': {
            menuDict = [
              {
                btnName: '+所有' + (node.currentExpandStatus.ALL ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeAll'
              },
              {
                btnName: '+推荐关系' + (node.currentExpandStatus.RECOMMEND ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeRECOMMEND'
              },
              {
                btnName: ' 逻辑物理关系' + (node.currentExpandStatus.LOGICAL_PHYSICAL ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeLOGICAL_PHYSICAL'
              },
              {
                btnName: ' 上游父子关系' + (node.currentExpandStatus.LAST_PARENT_CHILD ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeLAST_PARENT_CHILD'
              },
              {
                btnName: '+其他关系' + (node.currentExpandStatus.OTHERS ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeOTHERS'
              },
              {
                btnName: ' 下游父子关系' + (node.currentExpandStatus.NEXT_PARENT_CHILD ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeNEXT_PARENT_CHILD'
              }
            ];
            break;
          }
          case 'BusinessLogicEntityColumn': {
            menuDict = [
              {
                btnName: '+所有' + (node.currentExpandStatus.ALL ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeAll'
              },
              {
                btnName: '+推荐关系' + (node.currentExpandStatus.RECOMMEND ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeRECOMMEND'
              },
              {
                btnName: ' 上游父子关系' + (node.currentExpandStatus.LAST_PARENT_CHILD ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeLAST_PARENT_CHILD'
              },
              {
                btnName: '+其他关系' + (node.currentExpandStatus.OTHERS ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeOTHERS'
              },
              {
                btnName: ' 逻辑物理关系' + (node.currentExpandStatus.LOGICAL_PHYSICAL ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeLOGICAL_PHYSICAL'
              }
            ];
            break;
          }
          case 'DATABASE': {
            menuDict = [
              {
                btnName: '+所有' + (node.currentExpandStatus.ALL ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeAll'
              },
              {
                btnName: '+其他关系' + (node.currentExpandStatus.OTHERS ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeOTHERS'
              },
              {
                btnName: ' 下游父子关系' + (node.currentExpandStatus.NEXT_PARENT_CHILD ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeNEXT_PARENT_CHILD'
              }
            ];
            break;
          }
          case 'TABLE': {
            menuDict = [
              {
                btnName: '+所有' + (node.currentExpandStatus.ALL ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeAll'
              },
              {
                btnName: '+推荐关系' + (node.currentExpandStatus.RECOMMEND ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeRECOMMEND'
              },
              {
                btnName: ' 数据流关系' + (node.currentExpandStatus.DATA_FLOW ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeDATA_FLOW'
              },
              {
                btnName: ' 主外键关系' + (node.currentExpandStatus.PK_FK ? ' (已扩展)' : ''),
                fnHandler: 'expandNodePK_FK'
              },
              {
                btnName: ' 上游父子关系' + (node.currentExpandStatus.LAST_PARENT_CHILD ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeLAST_PARENT_CHILD'
              },
              {
                btnName: '+其他关系' + (node.currentExpandStatus.OTHERS ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeOTHERS'
              },
              {
                btnName: ' 逻辑物理关系' + (node.currentExpandStatus.LOGICAL_PHYSICAL ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeLOGICAL_PHYSICAL'
              },
              {
                btnName: ' 下游父子关系' + (node.currentExpandStatus.NEXT_PARENT_CHILD ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeNEXT_PARENT_CHILD'
              }
            ];
            break;
          }
          case 'COLUMN': {
            menuDict = [
              {
                btnName: '+所有' + (node.currentExpandStatus.ALL ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeAll'
              },
              {
                btnName: '+推荐关系' + (node.currentExpandStatus.RECOMMEND ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeRECOMMEND'
              },

              {
                btnName: ' 上游父子关系' + (node.currentExpandStatus.LAST_PARENT_CHILD ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeLAST_PARENT_CHILD'
              },
              {
                btnName: '+其他关系' + (node.currentExpandStatus.OTHERS ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeOTHERS'
              },
              {
                btnName: ' 逻辑物理关系' + (node.currentExpandStatus.LOGICAL_PHYSICAL ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeLOGICAL_PHYSICAL'
              },
              {
                btnName: ' 主外键关系' + (node.currentExpandStatus.PK_FK ? ' (已扩展)' : ''),
                fnHandler: 'expandNodePK_FK'
              }
            ];
            break;
          }
          case 'JOB': {
            menuDict = [
              {
                btnName: '+所有' + (node.currentExpandStatus.ALL ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeAll'
              },
              {
                btnName: '+其他关系' + (node.currentExpandStatus.OTHERS ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeOTHERS'
              },
              {
                btnName: ' 下游父子关系' + (node.currentExpandStatus.NEXT_PARENT_CHILD ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeNEXT_PARENT_CHILD'
              }
            ];
            break;
          }
          case 'NODE': {
            menuDict = [
              {
                btnName: '+所有' + (node.currentExpandStatus.ALL ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeAll'
              },
              {
                btnName: '+推荐关系' + (node.currentExpandStatus.RECOMMEND ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeRECOMMEND'
              },
              {
                btnName: ' 数据流关系' + (node.currentExpandStatus.DATA_FLOW ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeDATA_FLOW'
              },
              {
                btnName: ' 上游父子关系' + (node.currentExpandStatus.LAST_PARENT_CHILD ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeLAST_PARENT_CHILD'
              },
              {
                btnName: '+其他关系' + (node.currentExpandStatus.OTHERS ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeOTHERS'
              },
              {
                btnName: ' 下游父子关系' + (node.currentExpandStatus.NEXT_PARENT_CHILD ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeNEXT_PARENT_CHILD'
              }
            ];
            break;
          }
          case 'ColumnLineage': {
            menuDict = [
              {
                btnName: '+所有' + (node.currentExpandStatus.ALL ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeAll'
              },
              {
                btnName: '+推荐关系' + (node.currentExpandStatus.RECOMMEND ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeRECOMMEND'
              },
              {
                btnName: ' 数据流关系' + (node.currentExpandStatus.DATA_FLOW ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeDATA_FLOW'
              },
              {
                btnName: ' 上游父子关系' + (node.currentExpandStatus.LAST_PARENT_CHILD ? ' (已扩展)' : ''),
                fnHandler: 'expandNodeLAST_PARENT_CHILD'
              }
            ];
            break;
          }
        }
        return menuDict;
      }
    },
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
