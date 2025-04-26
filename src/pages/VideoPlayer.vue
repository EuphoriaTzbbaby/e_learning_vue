<template>
    <div class="video-container">
        <video controls width="100%" height="auto" :src="videoSrc"></video>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const videoSrc = ref('https://www.w3schools.com/html/mov_bbb.mp4') // 替换为你的视频地址
</script>

<style scoped>
.video-container {
    padding: 20px;
    max-width: 900px;
    margin: 0 auto;
}
</style>