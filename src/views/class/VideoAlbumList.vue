<template>
    <div class="album-page">
        <!-- 播放量统计卡片 -->
        <el-card class="stats-card">
            <template #header>
                <div class="card-header">
                    <span class="title">📊 播放量统计</span>
                    <el-button type="primary" size="small" @click="refreshStats" :icon="Refresh">刷新数据</el-button>
                </div>
            </template>
            <div class="stats-container">
                <div class="stat-item">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <el-icon size="24"><VideoPlay /></el-icon>
                    </div>
                    <div class="stat-info">
                        <div class="stat-label">总播放量</div>
                        <div class="stat-value">{{ totalPlayCount }}</div>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                        <el-icon size="24"><FolderOpened /></el-icon>
                    </div>
                    <div class="stat-info">
                        <div class="stat-label">合集数量</div>
                        <div class="stat-value">{{ albums.length }}</div>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                        <el-icon size="24"><VideoCamera /></el-icon>
                    </div>
                    <div class="stat-info">
                        <div class="stat-label">视频数量</div>
                        <div class="stat-value">{{ videos.length }}</div>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                        <el-icon size="24"><TrendCharts /></el-icon>
                    </div>
                    <div class="stat-info">
                        <div class="stat-label">平均播放量</div>
                        <div class="stat-value">{{ averagePlayCount }}</div>
                    </div>
                </div>
            </div>
        </el-card>

        <!-- 合集列表卡片 -->
        <el-card class="album-card">
            <template #header>
                <div class="card-header">
                    <span class="title">课程合集管理</span>
                    <el-button type="primary" @click="openAddDialog" :icon="Plus">新增合集</el-button>
                </div>
            </template>

            <div class="filter-container">
                <el-input 
                    v-model="searchVal" 
                    placeholder="搜索合集标题" 
                    clearable 
                    :prefix-icon="Search"
                    @keyup.enter="handleSearch"
                    class="filter-item search-input"
                />
                <el-button type="primary" @click="handleSearch" :icon="Search">查询</el-button>
                <el-button @click="resetSearch" :icon="Refresh">重置</el-button>
            </div>

            <el-table 
                v-loading="loading"
                :data="paginatedAlbums" 
                style="width: 100%" 
                border 
                stripe
            >
                <el-table-column prop="id" label="ID" width="80" align="center" sortable />
                <el-table-column label="封面" width="120" align="center">
                    <template #default="{ row }">
                        <el-image 
                            style="width: 80px; height: 60px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1)" 
                            :src="row.coverUrl" 
                            fit="cover"
                            :preview-src-list="[row.coverUrl]"
                            preview-teleported
                        >
                            <template #error>
                                <div class="image-slot">
                                    <el-icon><Picture /></el-icon>
                                </div>
                            </template>
                        </el-image>
                    </template>
                </el-table-column>
                <el-table-column prop="title" label="合集标题" min-width="180" align="center">
                    <template #default="{ row }">
                        <span class="album-title">{{ row.title }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
                
                <!-- 视频数量列 -->
                <el-table-column label="视频数量" width="100" align="center">
                    <template #default="{ row }">
                        <el-tag type="info" effect="plain">{{ getVideoCountByAlbum(row.id) }} 个</el-tag>
                    </template>
                </el-table-column>
                
                <!-- 合集播放量列 -->
                <el-table-column label="播放量" width="120" align="center" sortable :sort-method="(a: any, b: any) => getPlayCountByAlbum(a.id) - getPlayCountByAlbum(b.id)">
                    <template #default="{ row }">
                        <div class="play-count">
                            <el-icon><VideoPlay /></el-icon>
                            <span class="count-number">{{ getPlayCountByAlbum(row.id) }}</span>
                        </div>
                    </template>
                </el-table-column>
                
                <el-table-column prop="createTime" label="创建时间" width="180" align="center" sortable />
                <el-table-column label="操作" width="200" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
                        <el-divider direction="vertical" />
                        <el-button link type="info" @click="openVideoStatsDialog(row)">详情</el-button>
                        <el-divider direction="vertical" />
                        <el-button link type="danger" @click="deleteAlbum(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <el-pagination 
                    v-if="filteredAlbums.length" 
                    v-model:current-page="currentPage" 
                    v-model:page-size="pageSize"
                    :total="filteredAlbums.length"
                    layout="total, sizes, prev, pager, next, jumper" 
                    :page-sizes="[5, 10, 20]"
                    @size-change="handleSizeChange"
                    @current-change="handlePageChange" 
                />
            </div>
        </el-card>

        <!-- 新增/编辑合集对话框 -->
        <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑合集' : '新增合集'" width="500px">
            <el-form :model="formAlbum" label-width="100px" status-icon>
                <el-form-item label="合集标题" required>
                    <el-input v-model="formAlbum.title" placeholder="请输入合集标题" />
                </el-form-item>

                <el-form-item label="描述">
                    <el-input v-model="formAlbum.description" type="textarea" :rows="3" placeholder="合集详细介绍" />
                </el-form-item>

                <el-form-item label="封面地址" required>
                    <el-input v-model="formAlbum.coverUrl" placeholder="请输入封面图片 URL" />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="submitLoading" @click="submitAlbum">
                    {{ isEditMode ? '保存修改' : '确定' }}
                </el-button>
            </template>
        </el-dialog>

        <!-- 视频播放量详情对话框 -->
        <el-dialog v-model="videoStatsVisible" :title="`${currentAlbumTitle} - 视频播放量详情`" width="800px">
            <div class="video-stats-content">
                <div class="album-summary">
                    <div class="summary-item">
                        <span class="label">合集总播放量：</span>
                        <span class="value">{{ getPlayCountByAlbum(currentAlbumId) }}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">视频数量：</span>
                        <span class="value">{{ getVideoCountByAlbum(currentAlbumId) }} 个</span>
                    </div>
                </div>
                
                <el-table :data="albumVideos" style="width: 100%" border stripe max-height="400">
                    <el-table-column prop="id" label="视频ID" width="80" align="center" />
                    <el-table-column label="视频标题" min-width="200">
                        <template #default="{ row }">
                            {{ getPureTitle(row.title) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="播放量" width="120" align="center" sortable :sort-method="(a: any, b: any) => getVideoPlayCount(a.id) - getVideoPlayCount(b.id)">
                        <template #default="{ row }">
                            <div class="play-count">
                                <el-icon><VideoPlay /></el-icon>
                                <span class="count-number">{{ getVideoPlayCount(row.id) }}</span>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="duration" label="时长" width="100" align="center">
                        <template #default="{ row }">
                            {{ formatDuration(row.duration) }}
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </el-dialog>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, Refresh, Picture, VideoPlay, VideoCamera, FolderOpened, TrendCharts } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import videoAlbumApi from '../../api/videoAlbum';
import videoApi from '../../api/video';
import userActionLogApi from '../../api/userActionLog';

export default defineComponent({
    name: 'VideoAlbumList',
    setup() {
        const albums = ref<any[]>([]);
        const videos = ref<any[]>([]);
        const userLogs = ref<any[]>([]);
        const loading = ref(false);
        const submitLoading = ref(false);
        const currentPage = ref(1);
        const pageSize = ref(10);
        const searchVal = ref('');

        const dialogVisible = ref(false);
        const isEditMode = ref(false);
        const formAlbum = ref({
            id: null,
            title: '',
            description: '',
            coverUrl: '',
            createTime: ''
        });

        // 视频播放量详情对话框
        const videoStatsVisible = ref(false);
        const currentAlbumId = ref(0);
        const currentAlbumTitle = ref('');

        // 计算总播放量
        const totalPlayCount = computed(() => {
            return userLogs.value.filter(log => log.actionType === 'WATCH_VIDEO').length;
        });

        // 计算平均播放量
        const averagePlayCount = computed(() => {
            if (albums.value.length === 0) return 0;
            return Math.round(totalPlayCount.value / albums.value.length);
        });

        // 获取合集播放量
        const getPlayCountByAlbum = (albumId: number) => {
            // 获取该合集下的所有视频ID
            const albumVideos = videos.value.filter(v => v.albumId === albumId);
            const videoIds = albumVideos.map(v => v.id);
            
            // 统计这些视频的播放量
            return userLogs.value.filter(log => {
                if (log.actionType !== 'WATCH_VIDEO') return false;
                // 从 actionContent 中提取视频ID
                const match = log.actionContent.match(/ID:(\d+)/);
                if (match) {
                    const videoId = parseInt(match[1]);
                    return videoIds.includes(videoId);
                }
                return false;
            }).length;
        };

        // 获取视频播放量
        const getVideoPlayCount = (videoId: number) => {
            return userLogs.value.filter(log => {
                if (log.actionType !== 'WATCH_VIDEO') return false;
                // 从 actionContent 中提取视频ID
                const match = log.actionContent.match(/ID:(\d+)/);
                if (match) {
                    return parseInt(match[1]) === videoId;
                }
                return false;
            }).length;
        };

        // 获取合集下的视频数量
        const getVideoCountByAlbum = (albumId: number) => {
            return videos.value.filter(v => v.albumId === albumId).length;
        };

        // 获取当前合集的视频列表
        const albumVideos = computed(() => {
            return videos.value.filter(v => v.albumId === currentAlbumId.value);
        });

        // 打开视频播放量详情对话框
        const openVideoStatsDialog = (album: any) => {
            currentAlbumId.value = album.id;
            currentAlbumTitle.value = album.title;
            videoStatsVisible.value = true;
        };

        // 获取纯净标题（去掉后缀）
        const getPureTitle = (title: string) => {
            if (!title) return '';
            return title.slice(0, -4);
        };

        // 格式化时长
        const formatDuration = (seconds: number) => {
            if (!seconds) return '00:00';
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

        // 刷新统计数据
        const refreshStats = async () => {
            await Promise.all([fetchVideos(), fetchUserLogs()]);
            ElMessage.success('数据已刷新');
        };

        // 获取合集列表
        const fetchAlbums = async () => {
            loading.value = true;
            try {
                const response = await videoAlbumApi.getAllAlbums();
                albums.value = Array.isArray(response.data) ? response.data : [];
            } catch (error) {
                console.error('Error fetching albums:', error);
                ElMessage.error('获取合集列表失败');
            } finally {
                loading.value = false;
            }
        };

        // 获取视频列表
        const fetchVideos = async () => {
            try {
                const response = await videoApi.getAllVideos();
                videos.value = Array.isArray(response.data) ? response.data : [];
            } catch (error) {
                console.error('Error fetching videos:', error);
            }
        };

        // 获取用户日志
        const fetchUserLogs = async () => {
            try {
                const response = await userActionLogApi.getAll();
                userLogs.value = Array.isArray(response.data) ? response.data : [];
            } catch (error) {
                console.error('Error fetching user logs:', error);
            }
        };

        const filteredAlbums = computed(() => {
            if (!searchVal.value.trim()) return albums.value;
            const val = searchVal.value.toLowerCase();
            return albums.value.filter(a => a.title?.toLowerCase().includes(val));
        });

        const paginatedAlbums = computed(() => {
            const start = (currentPage.value - 1) * pageSize.value;
            return filteredAlbums.value.slice(start, start + pageSize.value);
        });

        const handleSearch = () => {
            currentPage.value = 1;
        };

        const resetSearch = () => {
            searchVal.value = '';
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
            formAlbum.value = {
                id: null,
                title: '',
                description: '',
                coverUrl: '',
                createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
            };
            dialogVisible.value = true;
        };

        const openEditDialog = (album: any) => {
            isEditMode.value = true;
            formAlbum.value = { ...album };
            dialogVisible.value = true;
        };

        const submitAlbum = async () => {
            if (!formAlbum.value.title || !formAlbum.value.coverUrl) {
                ElMessage.warning('请填写必要信息');
                return;
            }
            submitLoading.value = true;
            try {
                if (isEditMode.value) {
                    await videoAlbumApi.updateAlbum(formAlbum.value);
                    ElMessage.success('合集更新成功');
                } else {
                    await videoAlbumApi.addAlbum(formAlbum.value);
                    ElMessage.success('合集新增成功');
                }
                dialogVisible.value = false;
                fetchAlbums();
            } catch (error) {
                console.error('Submit album failed:', error);
                ElMessage.error('操作失败');
            } finally {
                submitLoading.value = false;
            }
        };

        const deleteAlbum = async (id: number) => {
            try {
                await ElMessageBox.confirm('确定要删除该合集吗？此操作不可撤销。', '删除确认', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning',
                });
                await videoAlbumApi.deleteAlbum(id);
                ElMessage.success('删除成功');
                fetchAlbums();
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('Delete album failed:', error);
                    ElMessage.error('删除失败');
                }
            }
        };

        onMounted(() => {
            fetchAlbums();
            fetchVideos();
            fetchUserLogs();
        });

        return {
            loading,
            submitLoading,
            albums,
            videos,
            userLogs,
            filteredAlbums,
            currentPage,
            pageSize,
            paginatedAlbums,
            dialogVisible,
            isEditMode,
            formAlbum,
            searchVal,
            videoStatsVisible,
            currentAlbumId,
            currentAlbumTitle,
            albumVideos,
            totalPlayCount,
            averagePlayCount,
            Plus, Search, Refresh, Picture, VideoPlay, VideoCamera, FolderOpened, TrendCharts,
            handleSearch,
            resetSearch,
            handlePageChange,
            handleSizeChange,
            openAddDialog,
            openEditDialog,
            submitAlbum,
            deleteAlbum,
            getPlayCountByAlbum,
            getVideoPlayCount,
            getVideoCountByAlbum,
            openVideoStatsDialog,
            getPureTitle,
            formatDuration,
            refreshStats
        };
    }
});
</script>

<style scoped>
.album-page {
    padding: 0;
}

.stats-card {
    margin-bottom: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.title {
    font-size: 18px;
    font-weight: bold;
}

.stats-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    padding: 10px 0;
}

.stat-item {
    display: flex;
    align-items: center;
    padding: 20px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
}

.stat-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    margin-right: 16px;
    flex-shrink: 0;
}

.stat-info {
    flex: 1;
}

.stat-label {
    font-size: 14px;
    color: #909399;
    margin-bottom: 8px;
}

.stat-value {
    font-size: 28px;
    font-weight: bold;
    color: #303133;
}

.filter-container {
    margin-bottom: 20px;
    display: flex;
    gap: 12px;
}

.filter-item {
    width: 250px;
}

.album-title {
    font-weight: bold;
    color: #303133;
}

.image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #f5f7fa;
    color: #909399;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

.play-count {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #409eff;
    font-weight: bold;
}

.count-number {
    font-size: 16px;
}

.video-stats-content {
    padding: 10px 0;
}

.album-summary {
    display: flex;
    gap: 30px;
    margin-bottom: 20px;
    padding: 15px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    color: white;
}

.summary-item {
    display: flex;
    align-items: center;
    gap: 10px;
}

.summary-item .label {
    font-size: 14px;
    opacity: 0.9;
}

.summary-item .value {
    font-size: 20px;
    font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .stats-container {
        grid-template-columns: 1fr;
    }
    
    .stat-item {
        padding: 15px;
    }
    
    .stat-icon {
        width: 50px;
        height: 50px;
    }
    
    .stat-value {
        font-size: 24px;
    }
}
</style>
