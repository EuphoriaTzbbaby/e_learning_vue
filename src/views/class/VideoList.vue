<template>
    <div class="video-page">
        <el-card class="video-card">
            <div class="header">
            <h2 style="margin-bottom: 10px;">视频管理</h2>
            <div class="tools">
                <div class="search-actions">
                    <el-input
                        v-model="searchVal"
                        placeholder="请输入视频标题"
                        clearable
                        @keyup.enter="handleSearch"
                        style="width: 200px"
                    />
                    <el-button type="primary" @click="handleSearch">搜索</el-button>
                    <el-button @click="resetSearch">重置</el-button>
                </div>
                <el-button type="success" @click="openAddDialog">新增视频</el-button>
            </div>
        </div>


            <el-table v-if="videos.length" :data="paginatedVideos" style="width: 100%" border stripe>
                <el-table-column label="序号" width="100" align="center">
                    <template #default="{ $index }">
                        <span>{{ ($index + 1) + (currentPage - 1) * pageSize }}</span>
                    </template>
                </el-table-column>

                <el-table-column prop="title" label="视频标题" width="200" align="center">
                    <template #default="{ row }">
                        <span>{{ row.title.replace('.mp4', '') }}</span>
                    </template>
                </el-table-column>

                <el-table-column prop="duration" label="时长" width="150" align="center" />

                <el-table-column label="视频地址" align="center">
                    <template #default="{ row }">
                        <span>{{ encodeChineseUrl(row.videoUrl) }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="操作" width="400" align="center">
                    <template #default="{ row }">
                        <el-button size="medium" type="primary" @click="openEditDialog(row)">编辑</el-button>
                        <el-button size="medium" type="danger" @click="deleteVideo(row.id)">删除</el-button>
                        <el-button size="medium" type="success" @click="viewVideo(row.videoUrl)">查看</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <el-empty v-else description="暂无视频" />

            <el-pagination
                v-if="videos.length"
                :current-page="currentPage"
                :page-size="pageSize"
                :total="videos.length"
                layout="prev, pager, next, jumper, ->, total"
                @current-change="handlePageChange"
            />
        </el-card>

        <!-- 新增/编辑视频对话框 -->
        <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑视频' : '新增视频'" width="600px">
            <el-form :model="formVideo" label-width="100px">
                <el-form-item label="所属专辑 ID">
                    <el-input v-model="formVideo.albumId" type="number" />
                </el-form-item>

                <el-form-item label="视频标题">
                    <el-input v-model="formVideo.title" />
                </el-form-item>

                <el-form-item label="OSS Key">
                    <el-input v-model="formVideo.ossKey" />
                </el-form-item>

                <el-form-item label="视频地址">
                    <el-input v-model="formVideo.videoUrl" />
                </el-form-item>

                <el-form-item label="视频时长">
                    <el-input v-model="formVideo.duration" type="number" />
                </el-form-item>

                <el-form-item label="排序值">
                    <el-input v-model="formVideo.sortOrder" type="number" />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitVideo">{{ isEditMode ? '保存修改' : '确定' }}</el-button>
            </template>
        </el-dialog>

        <!-- 播放视频对话框 -->
        <el-dialog v-model="playDialogVisible" :title="'播放视频'" width="80%">
            <video v-if="playVideoUrl" :src="playVideoUrl" controls autoplay style="width: 100%; height: 80vh;"></video>
            <span v-else>暂无视频播放链接</span>
        </el-dialog>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import videoApi from '../../api/video';
import dayjs from 'dayjs';
import { ElMessage, ElMessageBox } from 'element-plus';

export default defineComponent({
    name: 'VideoList',
    setup() {
        const videos = ref([]);
        const currentPage = ref(1);
        const pageSize = 10;

        const dialogVisible = ref(false);
        const isEditMode = ref(false);
        const formVideo = ref({
            id: null,
            albumId: 1,
            title: '',
            ossKey: '',
            videoUrl: '',
            duration: 0,
            sortOrder: 0,
            createTime: ''
        });

        const playDialogVisible = ref(false);
        const playVideoUrl = ref('');

        const searchVal = ref('');

        const fetchVideos = async () => {
            try {
                const response = await videoApi.getAllVideos();
                videos.value = response.data;
            } catch (error) {
                console.error('Error fetching videos:', error);
            }
        };

        const handleSearch = async () => {
            if (!searchVal.value.trim()) {
                fetchVideos();
                return;
            }
            try {
                const response = await videoApi.getVideosBySelectVal(searchVal.value.trim());
                videos.value = response.data;
                currentPage.value = 1;
            } catch (error) {
                console.error('搜索失败:', error);
                ElMessage.error('搜索失败');
            }
        };

        const resetSearch = () => {
            searchVal.value = '';
            fetchVideos();
        };

        const handlePageChange = (page: number) => {
            currentPage.value = page;
        };

        const paginatedVideos = computed(() => {
            const start = (currentPage.value - 1) * pageSize;
            const end = start + pageSize;
            return videos.value.slice(start, end);
        });

        const encodeChineseUrl = (url: string) => {
            return url.replace(/[\u4e00-\u9fa5]+/g, match => encodeURIComponent(match));
        };

        const openAddDialog = () => {
            isEditMode.value = false;
            formVideo.value = {
                id: null,
                albumId: 1,
                title: '',
                ossKey: '',
                videoUrl: '',
                duration: 0,
                sortOrder: 0,
                createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
            };
            dialogVisible.value = true;
        };

        const openEditDialog = (video: any) => {
            isEditMode.value = true;
            formVideo.value = { ...video };
            dialogVisible.value = true;
        };

        const submitVideo = async () => {
            try {
                if (isEditMode.value) {
                    await videoApi.updateVideo(formVideo.value);
                    ElMessage.success('视频更新成功');
                } else {
                    await videoApi.addVideo(formVideo.value);
                    ElMessage.success('视频新增成功');
                }
                dialogVisible.value = false;
                fetchVideos();
            } catch (error) {
                console.error('操作失败：', error);
                ElMessage.error('操作失败');
            }
        };

        const deleteVideo = async (id: number) => {
            try {
                await ElMessageBox.confirm(
                    '确定要删除该视频吗？此操作不可撤销。',
                    '删除确认',
                    {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning',
                    }
                );

                await videoApi.deleteVideo(id);
                ElMessage.success('删除成功');
                fetchVideos();
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('删除失败：', error);
                    ElMessage.error('删除失败');
                }
            }
        };

        const viewVideo = (videoUrl: string) => {
            playVideoUrl.value = videoUrl;
            playDialogVisible.value = true;
        };

        onMounted(fetchVideos);

        return {
            videos,
            currentPage,
            pageSize,
            paginatedVideos,
            dialogVisible,
            formVideo,
            isEditMode,
            openAddDialog,
            openEditDialog,
            submitVideo,
            deleteVideo,
            handlePageChange,
            encodeChineseUrl,
            playDialogVisible,
            playVideoUrl,
            viewVideo,
            searchVal,
            handleSearch,
            resetSearch
        };
    }
});
</script>

<style scoped>
.video-page {
    padding: 20px;
}

.video-card {
    padding: 20px;
}

.header {
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
}

.tools {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
}

.search-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

</style>
