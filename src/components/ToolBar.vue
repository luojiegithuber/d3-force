<template>
  <div class="toolbar-justify">
      <div>
        <span style="font-weight:bold">● 布局选择：</span>
        <a-select :options="options" v-model="layoutId" :default-value="layoutId" style="width: 200px" @change="onChangeSelectLayout">
        </a-select>
      </div>
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
const options = [
  { label: '同心圆', value: 1 },
  { label: '弦图', value: 2 },
  { label: '弧线图', value: 3 },
  { label: '邻接矩阵', value: 4 },
  { label: '圆形布局', value: 5 },
  { label: '捆图布局', value: 6 },
  { label: '力导向', value: 7 },
  { label: '网格', value: 8 },
  { label: '有向分层', value: 9 },
  { label: '径向布局', value: 10 },
];

export default {
  props: {
    isFullScreen: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      options: options,
      layoutId: 10
    }
  },

  methods: {
    onChangeSelectLayout (layoutId) {
      // this.bus.$emit('changeGraphLayout', e.target.value)
      this.$store.dispatch('changeLayoutIdFun', layoutId)
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
