<template>
    <div class="reply-page">
        <el-card class="reply-card">
            <template #header>
                <div class="card-header">
                    <span class="title">回复管理</span>
                    <el-button type="primary" @click="openAddDialog" :icon="Plus">新增回复</el-button>
                </div>
            </template>

            <div class="filter-container">
                <el-input 
                    v-model="searchVal" 
                    placeholder="搜索回复内容" 
                    clearable 
                    :prefix-icon="Search"
                    class="filter-item search-input"
                />
                <el-button type="primary" @click="handleSearch" :icon="Search">查询</el-button>
                <el-button @click="resetSearch" :icon="Refresh">重置</el-button>
            </div>

            <el-table 
                v-loading="loading"
                :data="paginatedReplies" 
                style="width: 100%" 
                border 
                stripe
            >
                <el-table-column prop="id" label="ID" width="80" align="center" sortable />
                <el-table-column prop="content" label="回复内容" min-width="300">
                    <template #default="{ row }">
                        <div class="reply-content-cell">{{ row.content }}</div>
                    </template>
                </el-table-column>
                <el-table-column label="用户关系" width="200" align="center">
                    <template #default="{ row }">
                        <el-tag size="small">{{ row.userId }}</el-tag>
                        <el-icon class="reply-arrow"><Right /></el-icon>
                        <el-tag size="small" type="info">{{ row.replyToUserId }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="commentId" label="所属评论" width="100" align="center" />
                <el-table-column prop="createTime" label="时间" width="180" align="center" sortable />
                <el-table-column label="操作" width="150" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
                        <el-divider direction="vertical" />
                        <el-button link type="danger" @click="deleteReply(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <el-pagination 
                    v-if="filteredReplies.length" 
                    v-model:current-page="currentPage" 
                    :page-size="pageSize" 
                    :total="filteredReplies.length"
                    layout="total, prev, pager, next, jumper" 
                    @current-change="handlePageChange" 
                />
            </div>
        </el-card>

        <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑回复' : '新增回复'" width="500px">
            <el-form :model="formReply" label-width="120px">
                <el-form-item label="回复内容" required>
                    <el-input v-model="formReply.content" type="textarea" :rows="3" placeholder="请输入回复内容" />
                </el-form-item>

                <el-form-item label="发送用户 ID" required>
                    <el-input v-model="formReply.userId" placeholder="请输入发送者 ID" />
                </el-form-item>

                <el-form-item label="目标用户 ID" required>
                    <el-input v-model="formReply.replyToUserId" placeholder="请输入目标用户 ID" />
                </el-form-item>

                <el-form-item label="所属评论 ID" required>
                    <el-input v-model="formReply.commentId" placeholder="请输入评论 ID" />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="submitLoading" @click="submitReply">
                    {{ isEditMode ? '保存修改' : '确定' }}
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, Refresh, Right } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import replyApi from '../../api/reply';

export default defineComponent({
    name: 'ReplyList',
    setup() {
        const replies = ref<any[]>([]);
        const loading = ref(false);
        const submitLoading = ref(false);
        const currentPage = ref(1);
        const pageSize = 10;
        const searchVal = ref('');

        const dialogVisible = ref(false);
        const isEditMode = ref(false);
        const formReply = ref({
            id: null,
            content: '',
            userId: '',
            replyToUserId: '',
            commentId: '',
            createTime: ''
        });

        const fetchReplies = async () => {
            loading.value = true;
            try {
                const response = await replyApi.getAllReplys();
                replies.value = Array.isArray(response.data) ? response.data : [];
            } catch (error) {
                console.error('获取回复失败:', error);
                ElMessage.error('获取回复列表失败');
            } finally {
                loading.value = false;
            }
        };

        const filteredReplies = computed(() => {
            if (!searchVal.value.trim()) return replies.value;
            const val = searchVal.value.toLowerCase();
            return replies.value.filter(r => r.content?.toLowerCase().includes(val));
        });

        const paginatedReplies = computed(() => {
            const start = (currentPage.value - 1) * pageSize;
            return filteredReplies.value.slice(start, start + pageSize);
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
            formReply.value = {
                id: null,
                content: '',
                userId: '',
                replyToUserId: '',
                commentId: '',
                createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
            };
            dialogVisible.value = true;
        };

        const openEditDialog = (reply: any) => {
            isEditMode.value = true;
            formReply.value = { ...reply };
            dialogVisible.value = true;
        };

        const submitReply = async () => {
            if (!formReply.value.content || !formReply.value.userId || !formReply.value.commentId) {
                ElMessage.warning('请填写必要信息');
                return;
            }
            submitLoading.value = true;
            try {
                if (isEditMode.value && formReply.value.id !== null) {
                    await replyApi.updateReply(formReply.value.id, formReply.value.content);
                    ElMessage.success('回复更新成功');
                } else {
                    const payload = { ...formReply.value };
                    await replyApi.addReply(payload);
                    ElMessage.success('回复新增成功');
                }
                dialogVisible.value = false;
                fetchReplies();
            } catch (error) {
                console.error('操作失败：', error);
                ElMessage.error('操作失败');
            } finally {
                submitLoading.value = false;
            }
        };

        const deleteReply = async (id: number) => {
            try {
                await ElMessageBox.confirm('确定要删除该回复吗？此操作不可撤销。', '删除确认', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                await replyApi.deleteReply(id);
                ElMessage.success('删除成功');
                fetchReplies();
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('删除失败：', error);
                    ElMessage.error('删除失败');
                }
            }
        };

        onMounted(fetchReplies);

        return {
            loading,
            submitLoading,
            replies,
            filteredReplies,
            currentPage,
            pageSize,
            paginatedReplies,
            dialogVisible,
            isEditMode,
            formReply,
            searchVal,
            Plus, Search, Refresh, Right,
            openAddDialog,
            openEditDialog,
            submitReply,
            deleteReply,
            handlePageChange,
            handleSearch,
            resetSearch
        };
    }
});
</script>

<style scoped>
.reply-page {
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

.reply-content-cell {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.reply-arrow {
    margin: 0 8px;
    vertical-align: middle;
    color: #909399;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}
</style>
