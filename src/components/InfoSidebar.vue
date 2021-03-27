<template>
  <div class="blood-drawer">
    <a-button type="primary" @click="showDrawer">
      Open
    </a-button>
    <a-drawer
      title="Basic Drawer"
      placement="right"
      :closable="true"
      :mask="false"
      :getContainer="false"
      :visible="visible"
      :after-visible-change="afterVisibleChange"
      width=300
      @close="onClose"
    >
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Some contents...</p>
    </a-drawer>
  </div>
</template>
<script>
export default {
  data () {
    return {
      visible: false
    }
  },
  methods: {
    afterVisibleChange (val) {
      console.log('visible', val)
    },
    showDrawer () {
      this.visible = true
    },
    onClose () {
      this.visible = false
    }
  }
}
</script>

<style scoped lang='scss'>
@import '../assets/css/common.scss';

    .blood-drawer{
        overflow: hidden;
        @include box-border;
    }

</style>
