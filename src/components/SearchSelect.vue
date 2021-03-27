<template>
  <div>
    <a-select default-value="table name" style="width: 120px" @change="handleChange">
      <a-select-option value="table name">
        表名
      </a-select-option>
      <a-select-option value="task id">
        任务id
      </a-select-option>
      <a-select-option value="indicator" >
        指标
      </a-select-option>
      <a-select-option value="chart" >
        图表
      </a-select-option>
      <a-select-option value="ES index">
        ES索引
      </a-select-option>
      <a-select-option value="topic">
        topic
      </a-select-option>
      <a-select-option value="hdfs">
        hdfs
      </a-select-option>
    </a-select>

  </div>
</template>
<script>
export default {
  methods: {
    handleChange (value) {
      console.log(`selected ${value}`)
    }
  }
}
</script>
