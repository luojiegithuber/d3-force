<template>
    <a-drawer
      title="案例搜索结果"
      placement="left"
      :closable="false"
      :visible="visible"
      @close="onClose"
      :width="400"
    >
<!--   <div class="caselist"> -->
<!--     <div class="caselist-title">
      <h3><b>案例搜索结果</b></h3>
      <hr/>
    </div> -->
    <div class="caselist-content">
      <a-list item-layout="horizontal" :data-source="caseNodes" itemLayout='vertical' style="padding:5px">
        <a-list-item slot="renderItem" slot-scope="item, index">
          <a-list-item-meta
            :description="item.guid"
          >
            <a slot="title" href="#" @click="selectNode(item)"><b>{{ item.display_text }}</b></a>
            <a-avatar
              shape="square"
              slot="avatar"
              src="https://z3.ax1x.com/2021/05/10/gt3w5Q.png"
            />
          </a-list-item-meta>

          <div class="case-content">
              <span style="width: 35px;color:#A9A9A9">评分&nbsp;</span>
              <span v-if="item.classifications">
                <a-tag :key="index" v-for="(classification,index) in item.classifications" :color="tagColor[classification]">{{classification}}</a-tag>
              </span>
              <a-rate :default-value="5" disabled />
            <div class="case-description">
              <span style="width: 35px;color:#A9A9A9">描述&nbsp;</span>
              <span style="width: 85%">描述文字 描述文字 描述文字</span>
            </div>
          </div>

          <!-- <a-rate :default-value="2" disabled /> -->
        </a-list-item>
      </a-list>
    </div>
<!--   </div> -->
  </a-drawer>
</template>
<script>
import caseData from '../../../static/data/casedata.json'

export default {
  data () {
    return {
      caseData: [], // 搜索到的所有案例
      caseIndex: 1, // 案例X
      caseItem: {}, // 单个案例
      caseNodes: [], // 展示框用
      visible: true,
      placement: 'left',
      tagColor: {
        'L1': 'purple',
        'L2': 'orange',
        'L3': 'green'
      }
    };
  },

  methods: {

    showDrawer () {
      this.visible = true;
    },
    onClose () {
      this.visible = false;
    },

    /*     descriptionByItem (caseItem) {
      return `节点规模：${caseItem.relative_nodes_number}  |  类型统计
      ：${Object.keys(caseItem.relative_nodes_entity_type).length}
      `;
    },
 */
    selectNode (node) {
      this.$emit('onSelectNode', node)
    }
  },

  created () {
    this.caseData = Object.values(caseData);
    this.caseItem = this.caseData[this.caseIndex - 1];
    this.caseNodes = this.caseItem.relative_nodes_details
    // console.log(this.caseData)
  }
};
</script>
<style  scoped>
.caselist-title{
  text-align: center;
  padding: 5px;
}

.caselist{
  width: 100%;

  background-color: white;
  border-radius: 5px;
  box-shadow: 0px 0px 10px #888888;
/*   padding: 5px; */

  position:absolute;
  top: 10vh;
}

.caselist-content{

  width: 100%;
/*   overflow-y: scroll; */

}

.case-description{
  display: flex;
}

.ant-list-vertical .ant-list-item-meta {
  margin-bottom: 0px;
}

.caselist ::-webkit-scrollbar{
  width:5px;
}

.caselist ::-webkit-scrollbar-track{
  background: #eee;
  border-radius:2px;
}

.caselist ::-webkit-scrollbar-thumb{
  background: #ccc;
  border-radius:5px;
}

.caselist ::-webkit-scrollbar-thumb:hover{
  background: #c0c0c0;
}

.caselist ::-webkit-scrollbar-corner{
  background: #179a16;
}
</style>
