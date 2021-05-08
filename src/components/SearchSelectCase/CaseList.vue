<template>
  <div class="caselist">
    <a-list item-layout="horizontal" :data-source="demo">
      <a-list-item slot="renderItem" slot-scope="item, index">
        <a-list-item-meta
          description="Ant Design, a design language for background applications, is refined by Ant UED Team"
        >
          <a slot="title" href="https://www.antdv.com/">{{ item.title }}</a>
          <a-avatar
            slot="avatar"
            src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"
          />
        </a-list-item-meta>
      </a-list-item>
    </a-list>
  </div>
</template>
<script>
import caseData from '../../../static/data/casedata.json'
const demo = [
  {
    title: 'Ant Design Title 1'
  },
  {
    title: 'Ant Design Title 2'
  },
  {
    title: 'Ant Design Title 3'
  },
  {
    title: 'Ant Design Title 4'
  }
];
export default {
  data () {
    return {
      demo
    };
  },

  created () {
    console.log(caseData)
  }
};
</script>
<style>
.caselist{
  height: 70vh;
  width: 300px;
  overflow: scroll;
  border: 1px solid red;

  position:absolute;
  bottom: 0;
}
</style>
