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
      <a-list item-layout="horizontal" :data-source="caseData" itemLayout='vertical' style="padding:5px">
        <a-list-item slot="renderItem" slot-scope="item, index">
          <a-list-item-meta
            :description="descriptionByItem(item)"
          >
            <a slot="title" href="#" @click="selectCase(item)"><b>{{ item.case_id }}</b></a>
            <a-avatar
              shape="square"
              slot="avatar"
              src="https://z3.ax1x.com/2021/05/10/gt3w5Q.png"
            />
          </a-list-item-meta>

          <div class="case-content">
              <span style="width: 35px;color:#A9A9A9">评分</span>
              <a-rate :default-value="5" disabled />
            <div class="case-description">
              <span style="width: 35px;color:#A9A9A9">描述</span>
              <span style="width: 85%">可视化技术使人能够在三维图形世界中直接对具有形体的信息进行操作，和计算机直接交流。这种技术已经把人和机器的力量以一种直觉而自然的方式加以统一，这种革命性的变化无疑将极大地提高人们的工作效率。</span>
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
      caseData: [],
      visible: true,
      placement: 'left'
    };
  },

  methods: {
    showDrawer () {
      this.visible = true;
    },
    onClose () {
      this.visible = false;
    },

    descriptionByItem (caseItem) {
      return `节点规模：${caseItem.relative_nodes_number}  |  类型统计
      ：${Object.keys(caseItem.relative_nodes_entity_type).length}
      `;
    },

    selectCase (caseItem) {
      this.$emit('onSelectCase', caseItem)
    }
  },

  created () {
    this.caseData = Object.values(caseData)
    console.log(this.caseData)
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
