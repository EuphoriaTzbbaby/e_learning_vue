<template>
  <el-button type="primary">cnm</el-button>

</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { get } from '../utils/axios/index'

onMounted(async () => {
  const response = await get('/classes/selectAll')
  console.log(response.data)
  console.log('mounted')
})
</script>
<style scoped>
.read-the-docs {
  color: #888;
}
</style>
