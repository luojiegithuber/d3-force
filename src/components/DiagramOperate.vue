<template>
  <div id="diagram-operate">

    <tool-bar :is-full-screen = isFullScreen></tool-bar>
    <div style="display:flex;align-items:center">
    <a-input-search
    placeholder="支持名称和任务id精准搜索"
    style="width: 500px;margin-right:32px"
    @search="onSearch" />

      <span style="margin-right:16px;color:#666666">
        <img style="width:16px;height:16px" src="../assets/icons/icon-rising.png"/>
        直接上游表数：5
      </span>

      <span style="margin-right:16px;color:#666666">
        <img style="width:16px;height:16px" src="../assets/icons/icon-falling.png"/>
        直接下游表数：5
      </span>
    </div>

    <demo-three ref="demo3"></demo-three>

  </div>
</template>

<script>

import DemoThree from './DemoThree'
// import BloodSearchBox from './BloodSearchBox';
import ToolBar from './ToolBar'

export default {
  name: 'HelloWorld',
  components: {

    DemoThree,
    // BloodSearchBox,
    ToolBar
  },
  data () {
    return {
      isFullScreen: false // 当前是否全屏
    }
  },

  computed: {

    // 响应绑定子组件的图表
    myDiagram: function () {
      return this.$refs.demo3.myDiagram
    }
  },
  mounted () {

  },
  methods: {

    // 在画布里面寻找节点
    onSearch (value) {
      let key = value

      try {
        // 找到目标节点
        let goalNode = this.myDiagram.findNodeForKey(key)

        // 但是我们必须要取消掉之前选中的节点
        this.$refs.demo3.cancelSelect()

        // 将搜索的节点高亮显示
        goalNode.isSelected = 'true'

        // 然后将我们搜索的节点变成子节点的curSelectedNode————当前选中节点
        this.$refs.demo3.curSelectedNode = goalNode

        // 将你搜索的节点居中
        this.myDiagram.commandHandler.scrollToPart(goalNode)
      } catch (e) {
        console.log('异常：', e)
        this.$message.error('查找失败')
      }
    },

    // 测试，请求新的节点数据 18 19
    testGetNewData () {
      this.$refs.demo3.getNewData()
    },

    // 全屏放大
    canvasFullScreen () {
      this.launchFullScreen()
    },

    // 进入全屏
    launchFullScreen () {
      let element = document.getElementById('diagram-operate')

      if (element.requestFullscreen) {
        element.requestFullscreen()
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen()
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen()
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen()
      }

      this.isFullScreen = !this.isFullScreen
    },

    exitFullscreen () {
      let element = document.getElementById('diagram-operate')
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.mozExitFullScreen) {
        document.mozExitFullScreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      }

      this.isFullScreen = !this.isFullScreen
    },

    // 下载图表
    canvasDownload () {
      this.makeBlob()
    },

    myCallback (blob) {
      var url = window.URL.createObjectURL(blob)
      var filename = 'myBlobFile.png'

      var a = document.createElement('a')
      a.style = 'display: none'
      a.href = url
      a.download = filename

      // IE 11
      if (window.navigator.msSaveBlob !== undefined) {
        window.navigator.msSaveBlob(blob, filename)
        return
      }

      document.body.appendChild(a)
      requestAnimationFrame(function () {
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      })
    },

    makeBlob () {
      this.myDiagram = this.$refs.demo3.myDiagram
      var blob = this.myDiagram.makeImageData({
        background: 'white',
        returnType: 'blob',
        callback: this.myCallback
      })
    }

  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang='scss'>
@import '../assets/css/common.scss';

h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

#diagram-operate{
    //@include box-border;
    flex-grow: 1;
    display: flex;
    flex-direction:column;
    background-color: #fff;
    margin-right: 5px;

    padding: 5px;

}

</style>
