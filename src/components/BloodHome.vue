<template>
  <div id="blood-home">
    <div class="home-container">
      <div class="blood-home-symbol">
          <div class="title-icon"/>
          <span style="font-size: 30px;font-family: PingFangSC, PingFangSC-Medium;font-weight:500;color: #ffffff;">&nbsp;血缘查询</span>
      </div>

      <div class="blood-home-introduce">
        统一资产管理及元数据信息查询平台，丰富的元数据信息及多样化 搜索方式，帮助用户快速定位目标数据，“逛数据”后“用数据”， 汇聚全域数据，助力数据共享
      </div>

      <blood-search-box></blood-search-box>
    </div>
  </div>
</template>

<script>

import BloodSearchBox from './BloodSearchBox'

export default {
  name: 'BloodHome',
  components: {

    BloodSearchBox

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

<style scoped lang='scss'>
@import '../assets/css/common.scss';

#blood-home{
    @include percentage-fill;
    background-color: aquamarine;
    @include background-img-set('../assets/imgs/universe.jpg');

    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
}

.title-icon{
    @include title-icon;
    border-radius:25px;
    background-image: url("../assets/icons/血缘.png");
    background-position: center;
    background-size:contain;
}

.blood-home-symbol{
    @include align-by-axis;
}

.blood-home-introduce{
    width: 600px;
    height: 66px;
    opacity: 0.8;
    font-size: 16px;
    font-family: PingFangSC, PingFangSC-Regular;
    font-weight: 400;
    text-align: left;
    color: #ffffff;
    line-height: 22px;

    margin-top: 20px;
    margin-bottom: 50px;
}

</style>
