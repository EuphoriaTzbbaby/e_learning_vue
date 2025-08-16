<template>
    <div class="comment-page">
        <el-card class="comment-card">
            <div class="header">
                <h2>评论管理</h2>
                <el-button type="primary" @click="openAddDialog">新增评论</el-button>
            </div>

            <el-table v-if="comments.length" :data="paginatedComments" style="width: 100%" border stripe>
                <el-table-column prop="content" label="评论内容" width="500" align="center" />
                <el-table-column prop="userId" label="用户 ID" width="300" align="center" />
                <el-table-column prop="videoId" label="视频 ID" width="200" align="center" />
                <el-table-column prop="createTime" label="创建时间" width="400" align="center" />
                <el-table-column label="操作" width="550" align="center">
                    <template #default="{ row }">
                        <el-button size="medium" type="primary" @click="openEditDialog(row)">编辑</el-button>
                        <el-button size="medium" type="danger" @click="deleteComment(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <el-empty v-else description="暂无评论" />

            <el-pagination v-if="comments.length" :current-page="currentPage" :page-size="pageSize"
                :total="comments.length" layout="prev, pager, next, jumper, ->, total"
                @current-change="handlePageChange" />
        </el-card>

        <!-- 弹窗 -->
        <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑评论' : '新增评论'" width="600px">
            <el-form :model="formComment" label-width="100px">
                <el-form-item label="评论内容">
                    <el-input v-model="formComment.content" />
                </el-form-item>

                <el-form-item label="用户 ID">
                    <el-input v-model="formComment.userId" />
                </el-form-item>

                <el-form-item label="视频 ID">
                    <el-input v-model="formComment.videoId" />
                </el-form-item>

                <el-form-item label="创建时间" v-if="formComment.createTime">
                    <el-input v-model="formComment.createTime" readonly />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitComment">{{ isEditMode ? '保存修改' : '确定' }}</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import commentApi from '../../api/comment'; // 替换为你实际的接口路径

export default defineComponent({
    name: 'CommentList',
    setup() {
        const comments = ref([]);
        const currentPage = ref(1);
        const pageSize = 10;

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
            try {
                const response = await commentApi.getAllComments();
                comments.value = response.data;
            } catch (error) {
                console.error('Error fetching comments:', error);
            }
        };

        const paginatedComments = computed(() => {
            const start = (currentPage.value - 1) * pageSize;
            return comments.value.slice(start, start + pageSize);
        });

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
                console.error('操作失败：', error);
                ElMessage.error('操作失败');
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
                    console.error('删除失败：', error);
                    ElMessage.error('删除失败');
                }
            }
        };

        onMounted(fetchComments);

        return {
            comments,
            currentPage,
            pageSize,
            paginatedComments,
            dialogVisible,
            isEditMode,
            formComment,
            openAddDialog,
            openEditDialog,
            submitComment,
            deleteComment,
            handlePageChange
        };
    }
});
</script>

<style scoped>
.comment-page {
    padding: 20px;
}

.comment-card {
    padding: 20px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
</style>
