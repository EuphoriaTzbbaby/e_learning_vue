<template>
    <div class="sweet-confession">
        <div class="message-box">
            <h1>{{ currentMessage }}</h1>
        </div>
        <!-- 女主角 -->
        <div class="heroine-container">
            <div class="heroine">
                <!-- 女主角头像（SVG） -->
                <svg class="heroine-avatar"
                    :class="{ 'happy': heroineMood === 'happy', 'thinking': heroineMood === 'thinking' }" width="120"
                    height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                    <!-- 脸部 -->
                    <circle cx="60" cy="60" r="50" fill="#ffe6cc" stroke="#ff9999" stroke-width="2" />
                    <!-- 头发 -->
                    <path d="M10,60 C10,20 110,20 110,60 C110,80 90,100 60,110 C30,100 10,80 10,60 Z" fill="#ff9999" />
                    <!-- 眼睛（动态变化） -->
                    <circle cx="45" cy="50" r="8" fill="#333" class="eye" />
                    <circle cx="75" cy="50" r="8" fill="#333" class="eye" />
                    <!-- 嘴（动态变化） -->
                    <path
                        :d="heroineMood === 'happy' ? 'M45,75 Q60,90 75,75' : heroineMood === 'thinking' ? 'M45,75 Q60,70 75,75' : 'M45,75 Q60,80 75,75'"
                        fill="none" stroke="#ff6666" stroke-width="4" class="mouth" />
                </svg>
                <!-- 气泡 -->
                <div class="speech-bubble" v-if="showSpeechBubble">
                    <span>{{ heroineSpeech }}</span>
                    <div class="bubble-tail"></div>
                </div>
            </div>
        </div>
        <div class="button-group">
            <el-button type="primary" round @click="handleAccept" :style="{ transform: `scale(${acceptButtonScale})` }"
                class="accept-button">
                可以哦
            </el-button>
            <el-button type="warning" round @click="handleThink" v-if="!showResponse"
                :style="{ transform: `scale(${thinkButtonScale})` }" class="think-button">
                再想想
            </el-button>
        </div>
        <div v-if="showResponse || thinkCount > 0" class="response-box">
            <h2>{{ responseMessage }}</h2>
        </div>
        <!-- 粒子效果容器 -->
        <div class="particle-container" v-if="showParticles">
            <div v-for="n in 10" :key="n" :class="`particle particle-${n}`" :style="{
                left: `${particlePositions[n - 1].left}%`,
                top: `${particlePositions[n - 1].top}%`,
                animationDelay: `${particlePositions[n - 1].delay}ms`
            }"></div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { ElButton } from 'element-plus';

// 初始表白语句数组
const messages: string[] = [
    '能不能做我女朋友？',
    '我喜欢你很久了，可以在一起吗？',
    '你愿意和我一起看星星吗？',
    '做我女朋友好不好呀？',
    '我想和你一起走下去，可以吗？',
    '你是我心中的唯一，愿意和我在一起吗？'
];

// “再想想”后的甜蜜表白语句数组
const sweetMessages: string[] = [
    '我真的很喜欢你，再考虑一下好吗？💖',
    '你是我最重要的人，愿意给我一个机会吗？🌟',
    '我会一直对你好，能不能再想想呀？💌',
    '没有你我会很难过，拜托做我女朋友吧！💕',
    '你是我的小幸运，可以再给我一次机会吗？🌸',
    '我愿意为你做任何事，再想想好不好？💓'
];

// 粒子位置和延迟类型
interface ParticlePosition {
    left: number;
    top: number;
    delay: number;
}

export default defineComponent({
    name: 'SweetConfession',
    components: {
        ElButton
    },
    setup() {
        // 当前显示的表白语句
        const currentMessage = ref<string>(messages[0]);
        // 响应消息（点击按钮后显示）
        const responseMessage = ref<string>('');
        // 是否显示最终响应消息（点击“可以哦”后）
        const showResponse = ref<boolean>(false);
        // “可以哦”按钮的缩放比例
        const acceptButtonScale = ref<number>(1);
        // “再想想”按钮的缩放比例
        const thinkButtonScale = ref<number>(1);
        // “再想想”点击次数
        const thinkCount = ref<number>(0);
        // 是否显示粒子效果
        const showParticles = ref<boolean>(false);
        // 粒子位置和延迟
        const particlePositions = ref<ParticlePosition[]>([]);
        // 女主角心情状态（'normal' | 'thinking' | 'happy'）
        const heroineMood = ref<string>('normal');
        // 女主角气泡文字
        const heroineSpeech = ref<string>('');
        // 是否显示气泡
        const showSpeechBubble = ref<boolean>(false);
        // 定时器 ID
        let messageTimer: number | null = null;

        // 音效
        const thinkSound = new Audio('https://cdn.pixabay.com/audio/2023/08/07/12-57-27-606_200x200.mp3'); // 轻柔音效
        const acceptSound = new Audio('https://cdn.pixabay.com/audio/2023/08/07/12-58-29-964_200x200.mp3'); // 欢快音效

        // 初始化粒子位置
        const initParticlePositions = (): void => {
            particlePositions.value = Array.from({ length: 10 }, () => ({
                left: Math.random() * 80 + 10, // 10% 到 90% 之间
                top: Math.random() * 80 + 10,  // 10% 到 90% 之间
                delay: Math.random() * 2000     // 0 到 2000ms
            }));
        };

        // 随机切换表白语句（初始语句）
        const changeMessage = (): void => {
            const randomIndex: number = Math.floor(Math.random() * messages.length);
            currentMessage.value = messages[randomIndex];
        };

        // 切换为“再想想”后的甜蜜语句
        const changeToSweetMessage = (): void => {
            const randomIndex: number = Math.floor(Math.random() * sweetMessages.length);
            currentMessage.value = sweetMessages[randomIndex];
        };

        // 启动定时器，每 3 秒刷新表白语句
        const startMessageTimer = (): void => {
            messageTimer = setInterval(() => {
                if (!showResponse.value && thinkCount.value === 0) {
                    changeMessage();
                }
            }, 3000) as unknown as number;
        };

        // 停止定时器
        const stopMessageTimer = (): void => {
            if (messageTimer) {
                clearInterval(messageTimer);
                messageTimer = null;
            }
        };

        // 播放音效
        const playSound = (audio: HTMLAudioElement): void => {
            audio.currentTime = 0; // 重置音效到开头
            audio.play().catch((err) => {
                console.error('音效播放失败:', err);
            });
        };

        // 点击“可以哦”按钮
        const handleAccept = (): void => {
            stopMessageTimer();
            showResponse.value = true;
            showParticles.value = false; // 停止粒子效果
            responseMessage.value = '耶！太开心了，我们在一起吧！💕';
            heroineMood.value = 'happy';
            heroineSpeech.value = '太好了！我愿意！';
            showSpeechBubble.value = true;
            playSound(acceptSound); // 播放欢快音效
        };

        // 点击“再想想”按钮
        const handleThink = (): void => {
            stopMessageTimer();
            thinkCount.value += 1;
            // “可以哦”按钮放大 0.2 倍（初始为 1）
            acceptButtonScale.value += 0.2;
            // 限制最大放大倍数（2 倍）
            if (acceptButtonScale.value > 2) {
                acceptButtonScale.value = 2;
            }
            // “再想想”按钮缩小 0.1 倍（初始为 1）
            thinkButtonScale.value -= 0.1;
            // 限制最小缩小倍数（0.5 倍）
            // if (thinkButtonScale.value < 0.5) {
            //     thinkButtonScale.value = 0.5;
            // }
            changeToSweetMessage(); // 切换为甜蜜表白语句
            responseMessage.value = `没关系，我会一直等你，直到你愿意的那一天！（你已经想了 ${thinkCount.value} 次啦）🌸`;
            heroineMood.value = 'thinking';
            heroineSpeech.value = thinkCount.value === 1 ? '真的要再想想吗？' : `我好期待你的答案哦！（第 ${thinkCount.value} 次）`;
            showSpeechBubble.value = true;
            showParticles.value = true; // 显示粒子效果
            playSound(thinkSound); // 播放轻柔音效
        };

        // 组件挂载时启动定时器并初始化粒子位置
        onMounted(() => {
            initParticlePositions();
            startMessageTimer();
        });

        // 组件销毁时清理定时器
        onUnmounted(() => {
            stopMessageTimer();
        });

        return {
            currentMessage,
            responseMessage,
            showResponse,
            acceptButtonScale,
            thinkButtonScale,
            thinkCount,
            showParticles,
            particlePositions,
            heroineMood,
            heroineSpeech,
            showSpeechBubble,
            handleAccept,
            handleThink
        };
    }
});
</script>

<style scoped lang="scss">
.sweet-confession {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
    /* 甜美粉色渐变背景 */
    font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
    color: #fff;
    text-align: center;
    padding: 20px;
    position: relative;
    overflow: hidden;

    /* 添加背景装饰：心形图案 */
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24"><path fill="rgba(255,255,255,0.2)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>') repeat;
        opacity: 0.3;
        z-index: 0;
    }
}

.message-box {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    padding: 30px 50px;
    margin-bottom: 20px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(5px);
    z-index: 1;

    h1 {
        font-size: 2.5rem;
        font-weight: 600;
        color: #fff;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        animation: fadeIn 1s ease-in-out;
    }
}

/* 女主角样式 */
.heroine-container {
    position: relative;
    margin-bottom: 20px;
    z-index: 1;
}

.heroine {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.heroine-avatar {
    animation: float 2s ease-in-out infinite;

    .eye {
        transition: transform 0.3s ease;
    }

    .mouth {
        transition: d 0.3s ease;
    }

    &.thinking {
        .eye {
            transform: translateY(2px);
            /* 眼睛下移，表现出思考 */
        }
    }

    &.happy {
        .eye {
            transform: scale(1.2);
            /* 眼睛放大，表现出开心 */
        }
    }
}

.speech-bubble {
    position: absolute;
    top: -50px;
    background: rgba(255, 255, 255, 0.9);
    color: #ff6666;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 1rem;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    animation: bubblePop 0.5s ease-in-out;

    .bubble-tail {
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 10px solid rgba(255, 255, 255, 0.9);
    }
}

.button-group {
    display: flex;
    gap: 20px;
    z-index: 1;

    .el-button {
        font-size: 1.2rem;
        padding: 15px 30px;
        transition: transform 0.5s ease, box-shadow 0.5s ease;
        /* 确保缩放过程平滑 */
    }

    .accept-button {
        animation: pulse 1.5s infinite;

        /* 添加心跳动画（基于阴影） */
        &:hover {
            transform: scale(1.1);
            /* 悬停时额外放大 */
        }
    }

    .think-button {
        &:hover {
            transform: scale(0.9);
            /* 悬停时额外缩小 */
        }
    }
}

.response-box {
    margin-top: 20px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 15px;
    padding: 20px 40px;
    z-index: 1;

    h2 {
        font-size: 1.8rem;
        color: #fff;
        text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
        animation: slideUp 0.5s ease-in-out;
    }
}

/* 粒子效果 */
.particle-container {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 0;
}

.particle {
    position: absolute;
    width: 20px;
    height: 20px;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="rgba(255, 182, 193, 0.8)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>') no-repeat center;
    background-size: contain;
    opacity: 0;
    animation: float 3s ease-in-out infinite;
}

/* 动画效果 */
@keyframes float {
    0% {
        opacity: 0;
        transform: translateY(0) scale(0.5);
    }

    50% {
        opacity: 1;
        transform: translateY(-50px) scale(1);
    }

    100% {
        opacity: 0;
        transform: translateY(-100px) scale(0.5);
    }
}

@keyframes bubblePop {
    0% {
        opacity: 0;
        transform: scale(0.8);
    }

    100% {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes fadeIn {
    0% {
        opacity: 0;
        transform: translateY(20px);
    }

    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slideUp {
    0% {
        opacity: 0;
        transform: translateY(20px);
    }

    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.7);
        /* 蓝色阴影，与 primary 按钮颜色匹配 */
    }

    50% {
        box-shadow: 0 0 0 10px rgba(64, 158, 255, 0);
        /* 阴影扩散 */
    }

    100% {
        box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.7);
    }
}
</style>