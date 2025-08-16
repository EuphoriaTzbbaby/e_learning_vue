<template>
  <div class="note-page">
    <el-card class="note-card">
      <div class="header">
        <h2>📒 笔记评论管理</h2>
        <div class="search-bar">
          <el-input
            v-model="selectVal"
            placeholder="请输入笔记ID或用户ID进行搜索"
            clearable
            style="width: 300px; margin-right: 10px"
            @keyup.enter="searchComments"
          />
          <el-button type="primary" icon="el-icon-search" @click="searchComments">搜索</el-button>
        </div>
      </div>

      <el-table v-if="comments.length" :data="paginatedComments" border stripe style="width: 100%">
        <el-table-column label="序号" width="80" align="center">
          <template #default="{ $index }">
            <span>{{ ($index + 1) + (currentPage - 1) * pageSize }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="noteId" label="笔记ID" width="250" align="center" />
        <el-table-column prop="userId" label="用户ID" width="250" align="center" />
        <el-table-column prop="nickname" label="昵称" width="120" align="center" />
        <el-table-column prop="gender" label="性别" width="120" align="center" />
        <el-table-column prop="ipLocation" label="IP" width="100" align="center" />
        <el-table-column prop="content" label="评论内容" min-width="200" align="center" />
        <el-table-column prop="likeCount" label="👍 点赞数" width="100" align="center" />
        <el-table-column label="创建时间" width="180" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ formatDate(row.createdAt) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" icon="el-icon-edit" @click="openEditDialog(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" icon="el-icon-delete" @click="deleteComment(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else description="暂无评论" />

      <el-pagination
        v-if="comments.length"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="comments.length"
        layout="prev, pager, next, jumper, ->, total"
        @current-change="handlePageChange"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" title="编辑评论" width="600px">
      <el-form :model="formComment" label-width="100px">
        <el-form-item label="内容">
          <el-input type="textarea" v-model="formComment.content" />
        </el-form-item>
        <el-form-item label="点赞数">
          <el-input type="number" v-model="formComment.likeCount" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitComment">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import noteCommentsApi from '../../api/noteComments';
import dayjs from 'dayjs';

export default defineComponent({
  name: 'NoteCommentList',
  setup() {
    interface Comment {
      id: number;
      noteId: string;
      userId: string;
      nickname: string;
      gender: string;
      ipLocation: string;
      content: string;
      likeCount: number;
      createdAt: string;
    }
    const comments = ref<Comment[]>([]);
    const currentPage = ref(1);
    const pageSize = 10;
    const selectVal = ref('');

    const dialogVisible = ref(false);
    const isEditMode = ref(false);
    const formComment = ref({
      id: null,
      content: '',
      likeCount: 0
    });

    const fetchComments = async () => {
      try {
        comments.value = (await noteCommentsApi.getAllComments()) as Array<{
          id: number;
          noteId: string;
          userId: string;
          nickname: string;
          gender: string;
          ipLocation: string;
          content: string;
          likeCount: number;
          createdAt: string;
        }>;
      } catch (err) {
        ElMessage.error('获取评论失败');
        console.error(err);
      }
    };

    const searchComments = async () => {
      if (!selectVal.value.trim()) {
        ElMessage.warning('请输入搜索值');
        return;
      }
      try {
        comments.value = (await noteCommentsApi.getCommentsBySelectVal(selectVal.value.trim())) as Array<{
          id: number;
          noteId: string;
          userId: string;
          nickname: string;
          gender: string;
          ipLocation: string;
          content: string;
          likeCount: number;
          createdAt: string;
        }>;
        currentPage.value = 1;
      } catch (err) {
        ElMessage.error('搜索失败');
        console.error(err);
      }
    };

    const resetSearch = () => {
      selectVal.value = '';
      fetchComments();
    };

    const paginatedComments = computed(() => {
      const start = (currentPage.value - 1) * pageSize;
      return comments.value.slice(start, start + pageSize);
    });

    const handlePageChange = (page: number) => {
      currentPage.value = page;
    };

    const openEditDialog = (row: any) => {
      isEditMode.value = true;
      formComment.value = {
        id: row.id,
        content: row.content,
        likeCount: row.likeCount
      };
      dialogVisible.value = true;
    };

    const submitComment = async () => {
      try {
        if (isEditMode.value && formComment.value.id) {
          await noteCommentsApi.updateComment(formComment.value.id, {
            content: formComment.value.content,
            likeCount: formComment.value.likeCount
          });
          ElMessage.success('评论更新成功');
          dialogVisible.value = false;
          fetchComments();
        }
      } catch (err) {
        console.error(err);
        ElMessage.error('提交失败');
      }
    };

    const deleteComment = async (id: number) => {
      try {
        await ElMessageBox.confirm('确定要删除该评论吗？', '删除确认', {
          type: 'warning'
        });
        await noteCommentsApi.deleteCommentById(id);
        ElMessage.success('删除成功');
        fetchComments();
      } catch (err) {
        if (err !== 'cancel') {
          console.error(err);
          ElMessage.error('删除失败');
        }
      }
    };

    const formatDate = (val: string) => {
      return dayjs(val).format('YYYY-MM-DD HH:mm:ss');
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
      openEditDialog,
      submitComment,
      deleteComment,
      handlePageChange,
      formatDate,
      selectVal,
      searchComments,
      resetSearch
    };
  }
});
</script>

<style scoped>
.note-page {
  padding: 30px;
  background-color: #f5f7fa;
}

.note-card {
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.search-bar {
  display: flex;
  align-items: center;
}
</style>
