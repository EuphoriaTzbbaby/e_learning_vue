<template>
    <div class="reply-page">
        <el-card class="reply-card">
            <div class="header">
                <h2>评论回复管理</h2>
                <el-button type="primary" @click="openAddDialog">新增回复</el-button>
            </div>

            <el-table v-if="replies.length" :data="paginatedReplies" style="width: 100%" border stripe>
                <el-table-column prop="content" label="回复内容" width="500" align="center" />
                <el-table-column prop="userId" label="用户 ID" width="120" align="center" />
                <el-table-column prop="replyToUserId" label="回复给用户 ID" width="150" align="center" />
                <el-table-column prop="commentId" label="评论 ID" width="120" align="center" />
                <el-table-column prop="createTime" label="创建时间" width="350" align="center" />
                <el-table-column label="操作" width="550" align="center">
                    <template #default="{ row }">
                        <el-button size="medium" type="primary" @click="openEditDialog(row)">编辑</el-button>
                        <el-button size="medium" type="danger" @click="deleteReply(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <el-empty v-else description="暂无回复" />

            <el-pagination v-if="replies.length" :current-page="currentPage" :page-size="pageSize"
                :total="replies.length" layout="prev, pager, next, jumper, ->, total"
                @current-change="handlePageChange" />
        </el-card>

        <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑回复' : '新增回复'" width="600px">
            <el-form :model="formReply" label-width="120px">
                <el-form-item label="回复内容">
                    <el-input v-model="formReply.content" />
                </el-form-item>

                <el-form-item label="用户 ID">
                    <el-input v-model="formReply.userId" />
                </el-form-item>

                <el-form-item label="回复给用户 ID">
                    <el-input v-model="formReply.replyToUserId" />
                </el-form-item>

                <el-form-item label="评论 ID">
                    <el-input v-model="formReply.commentId" />
                </el-form-item>

                <el-form-item label="创建时间" v-if="formReply.createTime">
                    <el-input v-model="formReply.createTime" readonly />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitReply">{{ isEditMode ? '保存修改' : '确定' }}</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import replyApi from '../../api/reply';

export default defineComponent({
    name: 'ReplyList',
    setup() {
        const replies = ref([]);
        const currentPage = ref(1);
        const pageSize = 10;

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
            try {
                const response = await replyApi.getAllReplys();
                replies.value = response.data;
            } catch (error) {
                console.error('获取回复失败:', error);
            }
        };

        const paginatedReplies = computed(() => {
            const start = (currentPage.value - 1) * pageSize;
            return replies.value.slice(start, start + pageSize);
        });

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
            try {
                const payload = {
                    content: formReply.value.content,
                    userId: formReply.value.userId,
                    replyToUserId: formReply.value.replyToUserId,
                    commentId: formReply.value.commentId,
                    createTime: formReply.value.createTime
                };
                console.log(formReply.value, 6666666)
                if (isEditMode.value && formReply.value.id !== null) {
                    await replyApi.updateReply(formReply.value.id, formReply.value.content);
                    ElMessage.success('回复更新成功');
                } else {
                    await replyApi.addReply(payload);
                    ElMessage.success('回复新增成功');
                }

                dialogVisible.value = false;
                fetchReplies();
            } catch (error) {
                console.error('操作失败：', error);
                ElMessage.error('操作失败');
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
            replies,
            currentPage,
            pageSize,
            paginatedReplies,
            dialogVisible,
            isEditMode,
            formReply,
            openAddDialog,
            openEditDialog,
            submitReply,
            deleteReply,
            handlePageChange
        };
    }
});
</script>

<style scoped>
.reply-page {
    padding: 20px;
}

.reply-card {
    padding: 20px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
</style>
