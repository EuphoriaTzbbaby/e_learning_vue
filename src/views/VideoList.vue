<template>
    <el-container>
        <el-row>
            <el-col :span="24">
                <el-button @click="addVideo">新增视频</el-button>
                <el-table :data="videos" style="width: 100%">
                    <el-table-column prop="title" label="视频标题" width="180" />
                    <el-table-column prop="duration" label="时长" width="100" />
                    <el-table-column prop="videoUrl" label="视频地址" />
                    <el-table-column label="操作">
                        <template #default="{ row }">
                            <el-button size="small" @click="editVideo(row)">编辑</el-button>
                            <el-button size="small" @click="deleteVideo(row.id)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-col>
        </el-row>
    </el-container>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import videoApi from '../api/video';

export default defineComponent({
    name: 'VideoList',
    setup() {
        const videos = ref([]);

        const fetchVideos = async () => {
            try {
                const albumId = 1; // Replace with dynamic albumId
                const response = await videoApi.getAllVideos(albumId);
                videos.value = response.data;
            } catch (error) {
                console.error('Error fetching videos:', error);
            }
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

        onMounted(fetchVideos);

        return {
            videos,
            addVideo,
            editVideo,
            deleteVideo,
        };
    },
});
</script>

<style scoped>
/* Add your styles here */
</style>