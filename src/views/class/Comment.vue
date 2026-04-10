<template>
    <div class="comment-page">
        <el-card class="comment-card">
            <template #header>
                <div class="card-header">
                    <span class="title">评论管理</span>
                    <el-button type="primary" @click="openAddDialog" :icon="Plus">新增评论</el-button>
                </div>
            </template>

            <div class="filter-container">
                <el-input 
                    v-model="searchVal" 
                    placeholder="搜索评论内容" 
                    clearable 
                    :prefix-icon="Search"
                    class="filter-item search-input"
                />
                <el-button type="primary" @click="handleSearch" :icon="Search">查询</el-button>
                <el-button @click="resetSearch" :icon="Refresh">重置</el-button>
            </div>

            <el-table 
                v-loading="loading"
                :data="paginatedComments" 
                style="width: 100%" 
                border 
                stripe
            >
                <el-table-column prop="id" label="ID" width="80" align="center" sortable />
                <el-table-column prop="content" label="评论内容" min-width="300">
                    <template #default="{ row }">
                        <div class="comment-content-cell">{{ row.content }}</div>
                    </template>
                </el-table-column>
                <el-table-column prop="userId" label="用户 ID" width="100" align="center" />
                <el-table-column prop="videoId" label="视频 ID" width="100" align="center" />
                <el-table-column prop="createTime" label="创建时间" width="180" align="center" sortable />
                <el-table-column label="操作" width="150" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
                        <el-divider direction="vertical" />
                        <el-button link type="danger" @click="deleteComment(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <el-pagination 
                    v-if="filteredComments.length" 
                    v-model:current-page="currentPage" 
                    :page-size="pageSize" 
                    :total="filteredComments.length"
                    layout="total, prev, pager, next, jumper" 
                    @current-change="handlePageChange" 
                />
            </div>
        </el-card>

        <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑评论' : '新增评论'" width="500px">
            <el-form :model="formComment" label-width="100px">
                <el-form-item label="评论内容" required>
                    <el-input v-model="formComment.content" type="textarea" :rows="3" placeholder="请输入评论内容" />
                </el-form-item>

                <el-form-item label="用户 ID" required>
                    <el-input v-model="formComment.userId" placeholder="请输入用户 ID" />
                </el-form-item>

                <el-form-item label="视频 ID" required>
                    <el-input v-model="formComment.videoId" placeholder="请输入视频 ID" />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="submitLoading" @click="submitComment">
                    {{ isEditMode ? '保存修改' : '确定' }}
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, Refresh } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import commentApi from '../../api/comment';

export default defineComponent({
    name: 'CommentList',
    setup() {
        const comments = ref<any[]>([]);
        const loading = ref(false);
        const submitLoading = ref(false);
        const currentPage = ref(1);
        const pageSize = 10;
        const searchVal = ref('');

        const dialogVisible = ref(false);
        const isEditMode = ref(false);
        const formComment = ref({
            id: null,
            content: '',
            userId: '',
            videoId: '',
            createTime: ''
        });

        const fetchComments = async () => {
            loading.value = true;
            try {
                const response = await commentApi.getAllComments();
                comments.value = Array.isArray(response.data) ? response.data : [];
            } catch (error) {
                console.error('Error fetching comments:', error);
                ElMessage.error('获取评论列表失败');
            } finally {
                loading.value = false;
            }
        };

        const filteredComments = computed(() => {
            if (!searchVal.value.trim()) return comments.value;
            const val = searchVal.value.toLowerCase();
            return comments.value.filter(c => c.content?.toLowerCase().includes(val));
        });

        const paginatedComments = computed(() => {
            const start = (currentPage.value - 1) * pageSize;
            return filteredComments.value.slice(start, start + pageSize);
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

        const openAddDialog = () => {
            isEditMode.value = false;
            formComment.value = {
                id: null,
                content: '',
                userId: '',
                videoId: '',
                createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
            };
            dialogVisible.value = true;
        };

        const openEditDialog = (comment: any) => {
            isEditMode.value = true;
            formComment.value = { ...comment };
            dialogVisible.value = true;
        };

        const submitComment = async () => {
            if (!formComment.value.content || !formComment.value.userId || !formComment.value.videoId) {
                ElMessage.warning('请填写必要信息');
                return;
            }
            submitLoading.value = true;
            try {
                if (isEditMode.value) {
                    await commentApi.updateComment(formComment.value);
                    ElMessage.success('评论更新成功');
                } else {
                    await commentApi.addComment(formComment.value);
                    ElMessage.success('评论新增成功');
                }
                dialogVisible.value = false;
                fetchComments();
            } catch (error) {
                console.error('Submit comment failed:', error);
                ElMessage.error('操作失败');
            } finally {
                submitLoading.value = false;
            }
        };

        const deleteComment = async (id: number) => {
            try {
                await ElMessageBox.confirm('确定要删除该评论吗？此操作不可撤销。', '删除确认', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning',
                });
                await commentApi.deleteComment(id);
                ElMessage.success('删除成功');
                fetchComments();
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('Delete comment failed:', error);
                    ElMessage.error('删除失败');
                }
            }
        };

        onMounted(fetchComments);

        return {
            loading,
            submitLoading,
            comments,
            filteredComments,
            currentPage,
            pageSize,
            paginatedComments,
            dialogVisible,
            isEditMode,
            formComment,
            searchVal,
            Plus, Search, Refresh,
            openAddDialog,
            openEditDialog,
            submitComment,
            deleteComment,
            handlePageChange,
            handleSearch,
            resetSearch
        };
    }
});
</script>

<style scoped>
.comment-page {
    padding: 0;
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

.filter-container {
    margin-bottom: 20px;
    display: flex;
    gap: 12px;
}

.filter-item {
    width: 250px;
}

.comment-content-cell {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}
</style>
