<template>
    <div class="course-list">
        <el-page-header content="查看课程" icon="null" class="header" />

        <!-- 骨架屏 -->
        <el-skeleton v-if="loading" animated :count="4">
            <template #template>
                <el-card class="album-card">
                    <el-skeleton-item variant="image" style="width: 100%; height: 220px" />
                    <div style="margin-top: 10px">
                        <el-skeleton-item variant="text" style="width: 60%" />
                        <el-skeleton-item variant="text" style="width: 90%" />
                        <el-skeleton-item variant="text" style="width: 40%" />
                    </div>
                </el-card>
            </template>
        </el-skeleton>

        <!-- 视频合集展示 -->
        <el-row :gutter="24" v-else>
            <el-col v-for="album in paginatedAlbums" :key="album.id" :xs="24" :sm="12" :md="12" :lg="12">
                <el-card shadow="hover" class="album-card">
                    <img :src="album.coverUrl" class="cover-image" alt="cover" />
                    <div class="album-info">
                        <h2>
                            <el-icon style="vertical-align: middle; margin-right: 6px;">
                                <VideoCamera />
                            </el-icon>
                            {{ album.title }}
                        </h2>
                        <p class="description">{{ album.description }}</p>
                        <el-button type="primary" size="small" plain :icon="ArrowRight" @click="goToDetail(album)">
                            进入学习
                        </el-button>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 分页 -->
        <div class="pagination">
            <el-pagination background layout="prev, pager, next" :page-size="pageSize" :total="albums.length"
                :current-page="currentPage" @current-change="handlePageChange" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import videoAlbumApi from '../../api/videoAlbum'
import { VideoCamera, ArrowRight } from '@element-plus/icons-vue'

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
        albums.value = res.data || []
    } catch (err) {
        console.error('加载视频合集失败', err)
    } finally {
        loading.value = false
    }
}

const handlePageChange = (page: number) => {
    currentPage.value = page
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

// ✅ 正确挂载
onMounted(fetchAlbums)
</script>

<style scoped>
.course-list {
    padding: 24px;
    background-color: #f9fafb;
    min-height: 100vh;
}

.header {
    margin-bottom: 24px;
}

.album-card {
    margin-bottom: 24px;
    padding: 12px;
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s;
    background-color: #fff;
}

.album-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
}

.cover-image {
    width: 100%;
    height: 220px;
    object-fit: cover;
    border-radius: 10px;
}

.album-info {
    margin-top: 16px;
}

.album-info h2 {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
}

.description {
    font-size: 14px;
    color: #666;
    line-height: 1.5;
    max-height: 42px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pagination {
    display: flex;
    justify-content: center;
    margin-top: 30px;
}
</style>