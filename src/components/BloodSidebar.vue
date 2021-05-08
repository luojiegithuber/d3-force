<template>

  <div class="blood-drawer" :class="{drawer_extend: isExtend, drawer_shrink: isShrink}">

    <div class="drawer-button" @click="slide">
        <a-icon v-show="isExtend" type="caret-right"  />
        <a-icon v-show="isShrink" type="caret-left" />
    </div>

    <div style="overflow:hidden" >
        <div style="width:318px;font:bold 1.5em Arial,sans-serif,bold;color:#666666;margin:10px">信息操作栏</div>
        <hr style="color:#666666;" />

        <!-------------------------------------------------------------->

        <sidebar-card card-title="节点信息">
          <div>ID：<span style="color:#00C1DE;cursor:pointer;">{{nodeData.id}}</span></div>
            <div>种类：{{nodeData.group}}</div>
            <div>节点文本：{{nodeData.label}}</div>
            <div>度数：{{nodeData.pathNum}}</div>
        </sidebar-card>

        <sidebar-card card-title="排序操作（目前仅支持Arc）">
          <OrderNodesInLayout></OrderNodesInLayout>
        </sidebar-card>

        <sidebar-card card-title="径向布局 中心选择" v-if="this.$store.state.layoutId === 10">
          <RadialLayoutRootSelection></RadialLayoutRootSelection>
        </sidebar-card>

        <!-------------------------------------------------------------->

    </div>
  </div>
</template>
<script>
import SidebarCard from './SidebarCard'
import OrderNodesInLayout from './LayoutOperation/OrderNodesInLayout'
import RadialLayoutRootSelection from './LayoutOperation/RadialLayoutRootSelection'

export default {

  components: {
    SidebarCard,
    OrderNodesInLayout,
    RadialLayoutRootSelection
  },

  watch: {
    '$store.state.nodeData': function (nodeData) {
      // console.log('当前选中的节点:', nodeData);
      this.nodeData = nodeData;
      // this.$store.dispatch('changeNodeFun', nodeData)
    }

  },

  data () {
    return {
      isExtend: true, // 和isShrink配套
      nodeData: {}
    }
  },

  computed: {

    isShrink: function () {
      return !this.isExtend
    }

  },

  methods: {
    slide () {
      this.isExtend = !this.isExtend
      this.toDiagramForArea()
    },

    // 通知兄弟组件Diagram需要改变大小了
    toDiagramForArea () {
      this.bus.$emit('toDiagramForArea', this.isExtend)
    }

  }
}
</script>

<style scoped lang='scss'>
@import '../assets/css/common.scss';
.drawer-button{
    color:#fff;

    /*垂直居中*/
    display: flex;
    justify-content: center;
    align-items: center;
}

.blood-drawer{
    //@include box-border;
    background-color: #fff;
    position: relative;

}

.drawer_extend{
    width:350px;
    -webkit-animation: extend 1s ; /* Chrome, Safari, Opera */
    animation: extend 1s ;
}

.drawer_shrink{
    width:0px;
    -webkit-animation: shrink 1s ; /* Chrome, Safari, Opera */
    animation: shrink 1s ;
}

/* Chrome, Safari, Opera */
@-webkit-keyframes shrink {
    0% {width: 350px;}
    100% {width: 0px;}
}

/* Standard syntax */
@keyframes shrink {
    0% {width: 350px;}
    100% {width: 0%;}
}

/* Chrome, Safari, Opera */
@-webkit-keyframes extend {
    0% {width: 0px;}
    100% {width: 350px;}
}

/* Standard syntax */
@keyframes extend {
    0% {width: 0px;}
    100% {width: 350px;}
}

//侧边栏按钮样式
.drawer-button{
    width: 13px;
    height: 8%;
    background-color: #d3d3d3;

    position: absolute;
    top:46%;
    left:-13px;

    z-index:100;

    cursor:pointer;
}

</style>
