<template>
  <div class="toolbar-justify">
      <a-checkbox-group @change="onCheckBoxChange">
        <a-checkbox value="A">
          力引导布局
        </a-checkbox>

        <a-checkbox value="B">
          圆形布局
        </a-checkbox>

        <a-checkbox value="C">
          同心圆布局
        </a-checkbox>

      </a-checkbox-group>
      <div class="diagram-icons-list">
          <a-icon v-show="!isFullScreen" type="fullscreen" @click="canvasFullScreen" />
          <a-icon v-show="isFullScreen" type="fullscreen-exit" @click="canvasFullScreen"/>
          <a-icon type="redo" />
          <a-icon type="download" @click="canvasDownload" />
          <a-icon type="plus-square" @click="testGetNewData"/>
          <a-icon type="minus-square" />
          <a-icon type="question-circle" @click="testChangeDiagram"/>
      </div>
  </div>
</template>
<script>
export default {
  props: {
    isFullScreen: {
      type: Boolean,
      default: false
    }
  },

  methods: {
    onCheckBoxChange (checkedValues) {
      console.log('checked = ', checkedValues)
    },

    canvasFullScreen () {
      if (!this.isFullScreen) {
        this.$parent.launchFullScreen()
      } else {
        this.$parent.exitFullscreen()
      }
    },

    canvasDownload () {
      this.$parent.canvasDownload()
    },

    testGetNewData () {
      this.$parent.testGetNewData()
    },

    testChangeDiagram () {

    }
  }
}
</script>

<style scoped lang='scss'>
@import '../assets/css/common.scss';

.diagram-icons-list i{
    color:#00C1DE;
    @include icon-operate;
}

.toolbar-justify{
    //@include box-border;
    display: flex;
    justify-content: space-between;
    background-color: #fff;

    padding: 5px;
}
</style>
