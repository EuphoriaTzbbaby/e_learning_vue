<template>
    <div class="video-page">
        <el-card class="video-card">
            <template #header>
                <div class="card-header">
                    <div class="header-left">
                        <span class="title">视频资源管理</span>
                        <el-tag v-if="route.query.albumTitle" type="success" size="large">
                            当前合集：{{ route.query.albumTitle }}
                        </el-tag>
                    </div>
                    <div class="header-right">
                        <el-button v-if="route.query.albumId" @click="goBackToCollection" :icon="Refresh">
                            返回合集管理
                        </el-button>
                        <el-button type="primary" @click="openAddDialog" :icon="Plus">添加视频</el-button>
                    </div>
                </div>
            </template>

            <div class="filter-container">
                <el-input 
                    v-model="searchVal" 
                    placeholder="搜索视频标题" 
                    clearable 
                    :prefix-icon="Search"
                    @keyup.enter="handleSearch"
                    class="filter-item search-input"
                />
                <el-select v-model="albumFilter" placeholder="所属合集筛选" clearable class="filter-item album-select">
                    <el-option 
                        v-for="album in albums" 
                        :key="album.id" 
                        :label="album.title" 
                        :value="album.id" 
                    />
                </el-select>
                <el-button type="primary" @click="handleSearch" :icon="Search">查询</el-button>
                <el-button @click="resetSearch" :icon="Refresh">重置</el-button>
            </div>

            <el-table 
                v-loading="loading"
                :data="paginatedVideos" 
                style="width: 100%" 
                border 
                stripe
            >
                <el-table-column prop="id" label="ID" width="80" align="center" sortable />
                <el-table-column prop="title" label="视频标题" min-width="200" align="center">
                    <template #default="{ row }">
                        <span class="video-title">{{ row.title.replace('.mp4', '') }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="所属合集" width="180" align="center">
                    <template #default="{ row }">
                        <el-tag size="small">{{ getAlbumName(row.albumId) }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="duration" label="时长" width="120" align="center">
                    <template #default="{ row }">
                        {{ formatDuration(row.duration) }}
                    </template>
                </el-table-column>
                <el-table-column prop="createTime" label="上传时间" width="180" align="center" sortable />
                <el-table-column label="操作" width="220" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="viewVideo(row.videoUrl)" :icon="VideoPlay">预览</el-button>
                        <el-divider direction="vertical" />
                        <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
                        <el-divider direction="vertical" />
                        <el-button link type="danger" @click="deleteVideo(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <el-pagination 
                    v-if="filteredVideos.length" 
                    v-model:current-page="currentPage" 
                    v-model:page-size="pageSize"
                    :total="filteredVideos.length"
                    layout="total, sizes, prev, pager, next, jumper" 
                    :page-sizes="[10, 20, 50]"
                    @size-change="handleSizeChange"
                    @current-change="handlePageChange" 
                />
            </div>
        </el-card>

        <!-- 新增/编辑视频对话框 -->
        <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑视频' : '新增视频'" width="600px">
            <el-form :model="formVideo" label-width="120px" status-icon>
                <!-- 只在未从合集跳转时显示合集选择 -->
                <el-form-item label="所属合集" required v-if="!route.query.albumId && !isEditMode">
                    <el-select 
                        v-model="formVideo.albumId" 
                        placeholder="请选择合集" 
                        style="width: 100%;"
                        @change="handleAlbumChange"
                    >
                        <el-option 
                            v-for="album in albums" 
                            :key="album.id" 
                            :label="album.title" 
                            :value="album.id" 
                        />
                    </el-select>
                    <div class="form-tip">选择合集后，OSS目录将自动设置为: e_learning/合集名称</div>
                </el-form-item>

                <el-form-item label="视频文件" required v-if="!isEditMode">
                    <el-upload
                        :action="uploadUrl"
                        :data="{ prefix: formVideo.ossPrefix }"
                        :before-upload="beforeVideoUpload"
                        :on-success="handleVideoUploadSuccess"
                        :show-file-list="true"
                        :disabled="!formVideo.ossPrefix"
                        accept="video/*"
                    >
                        <el-button type="primary" :disabled="!formVideo.ossPrefix" :icon="Upload">
                            选择视频文件
                        </el-button>
                        <template #tip>
                            <div class="el-upload__tip">支持 mp4、avi、mov 等格式，最大 500MB。上传后将自动提取视频标题。</div>
                        </template>
                    </el-upload>
                </el-form-item>

                <el-form-item label="视频标题" required>
                    <el-input v-model="formVideo.title" placeholder="上传视频后自动填充，可修改" />
                </el-form-item>

                <el-form-item label="视频URL" required v-if="isEditMode">
                    <el-input v-model="formVideo.videoUrl" placeholder="请输入视频 URL" />
                </el-form-item>

                <el-form-item label="OSS Key" v-if="!isEditMode">
                    <el-input v-model="formVideo.ossKey" placeholder="上传成功后自动生成" disabled />
                </el-form-item>

                <el-form-item label="OSS目录" v-if="!isEditMode">
                    <el-input v-model="formVideo.ossPrefix" placeholder="选择合集后自动设置" disabled />
                </el-form-item>

                <el-form-item label="视频时长(秒)">
                    <el-input-number v-model="formVideo.duration" :min="0" placeholder="秒" style="width: 100%;" />
                </el-form-item>

                <el-form-item label="排序值">
                    <el-input-number v-model="formVideo.sortOrder" :min="0" style="width: 100%;" disabled />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button 
                    type="primary" 
                    :loading="submitLoading" 
                    @click="submitVideo"
                    :disabled="!isEditMode && !formVideo.videoUrl"
                >
                    {{ isEditMode ? '保存修改' : '确定' }}
                </el-button>
            </template>
        </el-dialog>

        <!-- 播放视频对话框 -->
        <el-dialog v-model="playDialogVisible" title="视频预览" width="800px" destroy-on-close>
            <div class="video-preview-container">
                <video 
                    v-if="playVideoUrl" 
                    :src="playVideoUrl" 
                    controls 
                    autoplay 
                    class="video-player"
                ></video>
                <el-result v-else icon="error" title="无法加载视频" sub-title="视频链接无效" />
            </div>
        </el-dialog>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, Refresh, VideoPlay, Upload } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import videoApi from '../../api/video';
import videoAlbumApi from '../../api/videoAlbum';
import { getUploadUrl, getFolders } from '../../api/oss';

export default defineComponent({
    name: 'VideoList',
    setup() {
        const route = useRoute();
        const router = useRouter();
        const videos = ref<any[]>([]);
        const albums = ref<any[]>([]);
        const loading = ref(false);
        const submitLoading = ref(false);
        const currentPage = ref(1);
        const pageSize = ref(10);
        const searchVal = ref('');
        const albumFilter = ref<number | string>('');

        const dialogVisible = ref(false);
        const isEditMode = ref(false);
        const formVideo = ref({
            id: null,
            albumId: null,
            title: '',
            ossPrefix: '',
            ossKey: '',
            videoUrl: '',
            duration: 0,
            sortOrder: 0,
            createTime: ''
        });

        const playDialogVisible = ref(false);
        const playVideoUrl = ref('');
        
        // OSS相关
        const ossFolders = ref<string[]>([]);
        const uploadUrl = getUploadUrl();

        const fetchAlbums = async () => {
            try {
                const res = await videoAlbumApi.getAllAlbums();
                albums.value = Array.isArray(res.data) ? res.data : [];
                
                // 如果从合集管理页面跳转过来，自动选中合集
                if (route.query.albumId) {
                    albumFilter.value = Number(route.query.albumId);
                }
            } catch (error) {
                console.error('Fetch albums failed:', error);
            }
        };

        const fetchOssFolders = async () => {
            try {
                const res = await getFolders();
                if (res.data.success) {
                    ossFolders.value = res.data.folders;
                }
            } catch (error) {
                console.error('Fetch OSS folders failed:', error);
            }
        };

        const fetchVideos = async () => {
            loading.value = true;
            try {
                const response = await videoApi.getAllVideos();
                videos.value = Array.isArray(response.data) ? response.data : [];
            } catch (error) {
                console.error('Error fetching videos:', error);
                ElMessage.error('获取视频列表失败');
            } finally {
                loading.value = false;
            }
        };

        const filteredVideos = computed(() => {
            let result = videos.value;
            if (albumFilter.value) {
                result = result.filter(v => v.albumId === albumFilter.value);
            }
            if (searchVal.value.trim()) {
                const val = searchVal.value.toLowerCase();
                result = result.filter(v => v.title.toLowerCase().includes(val));
            }
            return result;
        });

        const paginatedVideos = computed(() => {
            const start = (currentPage.value - 1) * pageSize.value;
            return filteredVideos.value.slice(start, start + pageSize.value);
        });

        const getAlbumName = (albumId: number) => {
            const album = albums.value.find(a => a.id === albumId);
            return album ? album.title : `合集 ${albumId}`;
        };

        const formatDuration = (seconds: number) => {
            if (!seconds) return '00:00';
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        const handleSearch = () => {
            currentPage.value = 1;
        };

        const resetSearch = () => {
            searchVal.value = '';
            albumFilter.value = '';
            currentPage.value = 1;
        };

        const handlePageChange = (page: number) => {
            currentPage.value = page;
        };

        const handleSizeChange = (val: number) => {
            pageSize.value = val;
            currentPage.value = 1;
        };

        const openAddDialog = () => {
            isEditMode.value = false;
            
            // 如果从合集跳转过来，使用跳转的合集ID
            let defaultAlbumId: number | null = null;
            let defaultOssPrefix = '';
            
            if (route.query.albumId) {
                defaultAlbumId = Number(route.query.albumId);
                // 根据合集ID找到合集名称，生成OSS目录
                const album = albums.value.find(a => a.id === defaultAlbumId);
                if (album) {
                    defaultOssPrefix = `e_learning/${album.title}`;
                }
            } else {
                // 否则使用筛选的合集或第一个合集
                defaultAlbumId = albumFilter.value || (albums.value.length > 0 ? albums.value[0].id : null);
                if (defaultAlbumId) {
                    const album = albums.value.find(a => a.id === defaultAlbumId);
                    if (album) {
                        defaultOssPrefix = `e_learning/${album.title}`;
                    }
                }
            }
            
            // 计算当前选中合集下的视频数量
            const currentAlbumVideos = videos.value.filter(v => v.albumId === defaultAlbumId);
            const nextSortOrder = currentAlbumVideos.length + 1;
            
            formVideo.value = {
                id: null,
                albumId: defaultAlbumId as any,
                title: '',
                ossPrefix: defaultOssPrefix,
                ossKey: '',
                videoUrl: '',
                duration: 0,
                sortOrder: nextSortOrder,
                createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
            };
            dialogVisible.value = true;
        };

        const handleAlbumChange = (albumId: number) => {
            // 选择合集时，自动设置OSS目录和重新计算排序值
            const album = albums.value.find(a => a.id === albumId);
            if (album) {
                formVideo.value.ossPrefix = `e_learning/${album.title}`;
            }
            
            // 重新计算排序值
            const currentAlbumVideos = videos.value.filter(v => v.albumId === albumId);
            formVideo.value.sortOrder = currentAlbumVideos.length + 1;
        };

        const openEditDialog = (video: any) => {
            isEditMode.value = true;
            formVideo.value = { ...video };
            dialogVisible.value = true;
        };

        const submitVideo = async () => {
            if (!formVideo.value.title || !formVideo.value.albumId || !formVideo.value.videoUrl) {
                ElMessage.warning('请填写必要信息');
                return;
            }
            submitLoading.value = true;
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
                console.error('Submit video failed:', error);
                ElMessage.error('操作失败');
            } finally {
                submitLoading.value = false;
            }
        };

        const beforeVideoUpload = (file: File) => {
            if (!formVideo.value.ossPrefix) {
                ElMessage.warning('请先选择OSS目录');
                return false;
            }
            
            const isVideo = file.type.startsWith('video/');
            const isLt500M = file.size / 1024 / 1024 < 500;
            
            if (!isVideo) {
                ElMessage.error('只能上传视频文件！');
                return false;
            }
            if (!isLt500M) {
                ElMessage.error('视频文件大小不能超过 500MB！');
                return false;
            }
            
            return true;
        };

        const handleVideoUploadSuccess = (response: any) => {
            if (response.success) {
                ElMessage.success('视频上传成功！');
                
                // 从响应中获取 ossKey 和 url
                const ossKey = response.ossKey || response.data?.ossKey || '';
                const videoUrl = response.url || response.data?.url || '';
                
                // 设置 ossKey 和 videoUrl
                formVideo.value.ossKey = ossKey;
                formVideo.value.videoUrl = videoUrl;
                
                // 自动提取视频标题：从 ossKey 中提取文件名（去除扩展名）
                if (ossKey && !formVideo.value.title) {
                    const fileName = ossKey.split('/').pop() || '';
                    const titleWithoutExt = fileName.replace(/\.[^/.]+$/, '');
                    formVideo.value.title = titleWithoutExt;
                }
                
                // 确保 ossKey 格式为：e_learning/合集名称/视频标题
                if (formVideo.value.albumId && formVideo.value.title) {
                    const album = albums.value.find(a => a.id === formVideo.value.albumId);
                    if (album) {
                        // 提取文件扩展名
                        const ext = ossKey.split('.').pop() || 'mp4';
                        // 生成规范的 ossKey
                        formVideo.value.ossKey = `e_learning/${album.title}/${formVideo.value.title}.${ext}`;
                    }
                }
            } else {
                ElMessage.error('上传失败：' + (response.message || '未知错误'));
            }
        };

        const goBackToCollection = () => {
            router.push('/admin/courseManage');
        };

        const deleteVideo = async (id: number) => {
            try {
                await ElMessageBox.confirm('确定要删除该视频吗？此操作不可撤销。', '删除确认', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning',
                });
                await videoApi.deleteVideo(id);
                ElMessage.success('删除成功');
                fetchVideos();
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('Delete video failed:', error);
                    ElMessage.error('删除失败');
                }
            }
        };

        const viewVideo = (videoUrl: string) => {
            playVideoUrl.value = videoUrl;
            playDialogVisible.value = true;
        };

        const triggerUpload = () => {
            ElMessage.info('请在下方选择OSS目录后上传视频');
        };

        onMounted(() => {
            fetchAlbums();
            fetchVideos();
            fetchOssFolders();
        });

        return {
            route,
            router,
            loading,
            submitLoading,
            videos,
            albums,
            filteredVideos,
            currentPage,
            pageSize,
            paginatedVideos,
            dialogVisible,
            formVideo,
            isEditMode,
            playDialogVisible,
            playVideoUrl,
            searchVal,
            albumFilter,
            ossFolders,
            uploadUrl,
            Plus, Search, Refresh, VideoPlay, Upload,
            handleSearch,
            resetSearch,
            handlePageChange,
            handleSizeChange,
            openAddDialog,
            openEditDialog,
            submitVideo,
            deleteVideo,
            viewVideo,
            getAlbumName,
            formatDuration,
            triggerUpload,
            beforeVideoUpload,
            handleVideoUploadSuccess,
            goBackToCollection,
            handleAlbumChange
        };
    }
});
</script>

<style scoped>
.video-page {
    padding: 0;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 15px;
}

.header-right {
    display: flex;
    gap: 10px;
}

.title {
    font-size: 18px;
    font-weight: bold;
}

.filter-container {
    margin-bottom: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
}

.filter-item {
    width: 200px;
}

.search-input {
    width: 250px;
}

.video-title {
    font-weight: 500;
    color: #409EFF;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

.video-preview-container {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #000;
    border-radius: 8px;
    overflow: hidden;
}

.video-player {
    width: 100%;
    max-height: 500px;
    display: block;
}

.form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
}
</style>
