<template>
  <div class="radial-root-selection">
    <div>当前选中中心节点id：<span style="color:#00C1DE;cursor:pointer;">{{this.$store.state.nodeData.id}}</span></div>
    <a-button type="primary" @click="changeRadialLayoutRoot">
      以当前选中的节点为辐射中心
    </a-button>
  </div>
</template>
<script>
export default {
  data () {
    return {

    };
  },

  methods: {
    changeRadialLayoutRoot () {
      const layoutOption = {
        rootId: this.$store.state.nodeData.id
      }
      // ————》【】
      this.bus.$emit('changeLayoutOption',layoutOption)
    }
  }
};
</script>
<style scoped lang='scss'>

.order-nodes-selection{
  display: flex;
  justify-content: center;
  align-items: center;
  height:50px
}

</style>
