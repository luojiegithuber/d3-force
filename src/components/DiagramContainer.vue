<template>
  <div id="demo">
    <div style="background-color:#fff;padding:10px 0px;margin:10px 0px;display:flex;justify-content:center;align-items:center;">

      <div class="title-icon"/>
      <blood-search-box></blood-search-box>
    </div>
    <div class="diagram-container">
      <diagram-operate></diagram-operate>
      <blood-sidebar>信息侧边栏</blood-sidebar>
    </div>
  </div>
</template>

<script>

import DemoThree from './DemoThree'
import BloodSearchBox from './BloodSearchBox'
import ToolBar from './ToolBar'
import DiagramOperate from './DiagramOperate'
// import InfoSidebar from './InfoSidebar';
import BloodSidebar from './BloodSidebar'
import NodeContextMenu from './NodeContextMenu'

export default {
  name: 'HelloWorld',
  components: {

    DemoThree,
    BloodSearchBox,
    ToolBar,
    DiagramOperate,
    BloodSidebar,
    NodeContextMenu
  },
  data () {
    return {

    }
  },
  mounted () {

  },
  methods: {

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

.diagram-container{
  //@include box-border;
  @include percentage-fill(100%,90%);

  display: flex;
  padding: 5px 0px;
}

#demo{
  @include percentage-fill;
}

.title-icon{
    @include title-icon;
    border-radius:25px;
    background-image: url("../assets/icons/血缘.png");
    background-position: center;
    background-repeat: no-repeat;
    background-size:70%;

    margin-right: 15px;
    box-shadow: 0px 0px 2px 2px rgba($color: #8b8b8b, $alpha: 0.1);

}
</style>
