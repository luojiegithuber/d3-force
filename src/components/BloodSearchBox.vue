<template>
  <div id="blood-search-box">
      <search-select></search-select>

      <a-input
      placeholder=""
      :value="content"

      style="width:400px"
      />

      <a-button
      type="primary"
      icon="search"
      style="background-color:#00C1DE;border-color:#00C1DE;">
        搜索
      </a-button>
  </div>
</template>

<script>

import SearchSelect from './SearchSelect'

export default {
  name: 'BloodSearchBox',
  components: {
    SearchSelect
  },
  data () {
    return {
      content: ''
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

#blood-search-box{
    padding:10px 0px;
    //background-color: #fff;
    display: flex;
    justify-content:center;
    width:600px;
}

</style>
