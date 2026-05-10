<template>
    <div class="course-list">
        <!-- 页面标题区 -->
        <div class="page-header">
            <div class="header-content">
                <h1 class="page-title">
                    <el-icon class="title-icon"><VideoCamera /></el-icon>
                    视频合集
                </h1>
                <p class="page-subtitle">选择感兴趣的课程开始学习吧</p>
            </div>
        </div>

        <!-- 骨架屏 -->
        <el-skeleton v-if="loading" animated :count="4">
            <template #template>
                <el-card class="album-card">
                    <el-skeleton-item variant="image" style="width: 100%; height: 200px" />
                    <div style="margin-top: 16px">
                        <el-skeleton-item variant="text" style="width: 50%" />
                        <el-skeleton-item variant="text" style="width: 80%" />
                        <el-skeleton-item variant="text" style="width: 60%" />
                    </div>
                </el-card>
            </template>
        </el-skeleton>

        <!-- 视频合集展示 -->
        <div v-else class="albums-container">
            <el-empty v-if="paginatedAlbums.length === 0" description="暂无视频合集" />
            <el-row :gutter="24" v-else>
                <el-col v-for="album in paginatedAlbums" :key="album.id" :xs="24" :sm="12" :md="8" :lg="8">
                    <el-card shadow="hover" class="album-card" :body-style="{ padding: '0px' }">
                        <div class="card-image-wrapper">
                            <img :src="album.coverUrl" class="cover-image" alt="cover" />
                            <div class="card-overlay">
                                <el-button type="primary" size="large" circle :icon="VideoPlay" @click="goToDetail(album)" />
                            </div>
                            <div class="card-badge">
                                <el-tag type="warning" effect="dark" size="small">
                                    <el-icon><VideoCamera /></el-icon>
                                    课程
                                </el-tag>
                            </div>
                        </div>
                        <div class="card-content">
                            <h3 class="album-title">{{ album.title }}</h3>
                            <p class="album-description">{{ album.description || '暂无简介' }}</p>
                            <div class="card-footer">
                                <div class="album-meta">
                                    <el-icon><Collection /></el-icon>
                                    <span>合集</span>
                                </div>
                                <el-button type="primary" text bg :icon="ArrowRight" @click="goToDetail(album)">
                                    开始学习
                                </el-button>
                            </div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </div>

        <!-- 分页 -->
        <div class="pagination" v-if="albums.length > pageSize">
            <el-pagination 
                background 
                layout="prev, pager, next" 
                :page-size="pageSize" 
                :total="albums.length"
                :current-page="currentPage" 
                @current-change="handlePageChange" 
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import videoAlbumApi from '../../api/videoAlbum'
import { VideoCamera, ArrowRight, VideoPlay, Collection } from '@element-plus/icons-vue'

const router = useRouter()
const albums = ref<any[]>([])
const loading = ref(true)

const pageSize = 4
const currentPage = ref(1)

const paginatedAlbums = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    return albums.value.slice(start, start + pageSize)
})

const fetchAlbums = async () => {
    try {
        const res = await videoAlbumApi.getAllAlbums()
        albums.value = (res.data || []).sort((a: any, b: any) => b.id - a.id)
    } catch (err) {
        console.error('加载视频合集失败', err)
    } finally {
        loading.value = false
    }
}

const handlePageChange = (page: number) => {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToDetail = (album: any) => {
    console.log('进入学习', album)
    router.push({
        name: 'videoPlayer',
        query: {
            title: album.title,
            albumId: album.id
        }
    })
}

onMounted(fetchAlbums)
</script>

<style scoped>
.course-list {
    padding: 0;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
    min-height: calc(100vh - 60px);
}

/* 页面标题区 */
.page-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 40px 32px;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;
}

.page-header::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
    border-radius: 50%;
}

.page-header::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: 10%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    border-radius: 50%;
}

.header-content {
    position: relative;
    z-index: 1;
}

.page-title {
    font-size: 32px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 8px 0;
    display: flex;
    align-items: center;
    gap: 12px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.title-icon {
    font-size: 36px;
}

.page-subtitle {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
}

/* 专辑容器 */
.albums-container {
    padding: 0 32px;
}

/* 专辑卡片 */
.album-card {
    margin-bottom: 24px;
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    background: #fff;
}

.album-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(102, 126, 234, 0.2);
}

.card-image-wrapper {
    position: relative;
    overflow: hidden;
}

.cover-image {
    width: 100%;
    height: 180px;
    object-fit: cover;
    transition: transform 0.5s ease;
}

.album-card:hover .cover-image {
    transform: scale(1.08);
}

.card-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.album-card:hover .card-overlay {
    opacity: 1;
}

.card-badge {
    position: absolute;
    top: 12px;
    left: 12px;
}

.card-content {
    padding: 20px;
}

.album-title {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0 0 8px 0;
    line-height: 1.4;
}

.album-description {
    font-size: 14px;
    color: #666;
    margin: 0 0 16px 0;
    line-height: 1.5;
    display: -webkit-box;
    /* -webkit-line-clamp: 2; */
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 42px;
}

.card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
}

.album-meta {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #999;
}

/* 分页 */
.pagination {
    display: flex;
    justify-content: center;
    padding: 32px;
}

/* 响应式 */
@media (max-width: 768px) {
    .page-header {
        padding: 28px 20px;
    }

    .page-title {
        font-size: 24px;
    }

    .albums-container {
        padding: 0 16px;
    }

    .album-card {
        margin-bottom: 16px;
    }
}
</style>