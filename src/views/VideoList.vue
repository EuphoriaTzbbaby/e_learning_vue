<template>
    <div class="video-page">
        <el-card class="video-card">
            <div class="header">
                <h2>视频管理</h2>
                <el-button type="primary" @click="addVideo">新增视频</el-button>
            </div>

            <el-table v-if="videos.length" :data="paginatedVideos" style="width: 100%" border stripe>
                <el-table-column label="序号" width="100" align="center">
                    <template #default="{ row, $index }">
                        <span>{{ ($index + 1) + (currentPage - 1) * pageSize }}</span>
                    </template>
                </el-table-column>

                <!-- 视频标题列，去除 .mp4 后缀 -->
                <el-table-column prop="title" label="视频标题" width="200" align="center">
                    <template #default="{ row }">
                        <span>{{ row.title.replace('.mp4', '') }}</span>
                    </template>
                </el-table-column>

                <!-- 时长列 -->
                <el-table-column prop="duration" label="时长" width="150" align="center" />

                <!-- 视频地址列，只编码中文部分 -->
                <el-table-column label="视频地址" align="center">
                    <template #default="{ row }">
                        <span>{{ encodeChineseUrl(row.videoUrl) }}</span>
                    </template>
                </el-table-column>

                <!-- 操作列 -->
                <el-table-column label="操作" width="300" align="center">
                    <template #default="{ row }">
                        <el-button size="medium" type="primary" @click="editVideo(row)">编辑</el-button>
                        <el-button size="medium" type="danger" @click="deleteVideo(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <el-empty v-else description="暂无视频" />

            <!-- 分页 -->
            <el-pagination v-if="videos.length" :current-page="currentPage" :page-size="pageSize" :total="videos.length"
                layout="prev, pager, next, jumper, ->, total" @current-change="handlePageChange" />
        </el-card>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import videoApi from '../api/video';

const VideoList = defineComponent({
    name: 'VideoList',
    setup() {
        const videos = ref([]);
        const currentPage = ref(1);
        const pageSize = 10;

        const fetchVideos = async () => {
            try {
                const albumId = 1;
                const response = await videoApi.getAllVideos(albumId);
                videos.value = response.data;
            } catch (error) {
                console.error('Error fetching videos:', error);
            }
        };

        const paginatedVideos = computed(() => {
            const start = (currentPage.value - 1) * pageSize;
            const end = start + pageSize;
            return videos.value.slice(start, end);
        });

        const handlePageChange = (page: number) => {
            currentPage.value = page;
        };

        const addVideo = () => {
            // Logic to add a new video
        };

        const editVideo = (video: any) => {
            // Logic to edit video
        };

        const deleteVideo = async (id: number) => {
            try {
                await videoApi.deleteVideo(id);
                fetchVideos(); // Refresh video list
            } catch (error) {
                console.error('Error deleting video:', error);
            }
        };

        // Encode only the Chinese part of the URL
        const encodeChineseUrl = (url: string) => {
            return url.replace(/[\u4e00-\u9fa5]+/g, (match) => encodeURIComponent(match));
        };

        onMounted(fetchVideos);

        return {
            videos,
            currentPage,
            pageSize,
            paginatedVideos,
            addVideo,
            editVideo,
            deleteVideo,
            handlePageChange,
            encodeChineseUrl,
        };
    },
});

export default VideoList;
</script>
