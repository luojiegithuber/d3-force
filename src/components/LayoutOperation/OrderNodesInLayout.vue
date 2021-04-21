<template>
  <div class="order-nodes-selection">
    <a-select style="width: 150px" @change="handleChange" :disabled="disabled" :value="value">
      <a-select-option value="byId">
        ID
      </a-select-option>
      <a-select-option value="byGroup">
        Group类别
      </a-select-option>
      <a-select-option value="byLabel">
        Label文本
      </a-select-option>
      <a-select-option value="byPathNum">
        PathNum度数
      </a-select-option>
    </a-select>
  </div>
</template>
<script>
export default {
  data () {
    return {
      value: undefined,
      radioStyle: {
        display: 'block',
        height: '30px',
        lineHeight: '30px'
      },
      disabled: false
    };
  },
  watch: {
    '$store.state.layoutId': function (val) {
      this.disabled = val !== 3;
      this.value = undefined;
    }
  },
  methods: {
    handleChange (value) {
      this.$store.dispatch('changeLayoutOrderIdFun', value)
      this.value = value;
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
