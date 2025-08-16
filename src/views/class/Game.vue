<template>
  <div class="game">
    <h2>击打小游戏</h2>
    <div class="name-input">
      <el-input v-model="targetName" placeholder="请输入要击打的名字" size="large" clearable />
    </div>

    <div v-if="targetName" class="main-area">
      <div class="target" @click="beat">
        <!-- <img src="../assets/avatar.jpg" alt="target" class="face" :class="{ hit: isHitting }" /> -->
        <div class="name-label">{{ targetName }}</div>
      </div>
      <div class="counter">已击打：{{ count }} 次</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const targetName = ref('')
const count = ref(0)
const isHitting = ref(false)

// 击打音效（放到 public/sounds/beat.mp3）
const beatSound = new Audio('/sounds/beat.mp3')
beatSound.volume = 0.8

function beat() {
  if (!targetName.value) return

  count.value++
  isHitting.value = true
  beatSound.currentTime = 0
  beatSound.play().catch(err => console.warn('音效播放失败', err))

  setTimeout(() => {
    isHitting.value = false
  }, 200)
}
</script>

<style scoped>
.game {
  text-align: center;
  padding: 30px;
}

.name-input {
  max-width: 300px;
  margin: 0 auto 30px;
}

.main-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.target {
  position: relative;
  cursor: pointer;
}

.face {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  transition: transform 0.1s ease;
}

.face.hit {
  transform: scale(0.85) rotate(-10deg);
}

.name-label {
  position: absolute;
  bottom: -25px;
  width: 100%;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #555;
}

.counter {
  margin-top: 20px;
  font-size: 20px;
}
</style>
