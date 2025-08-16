<template>
  <div class="note-page">
    <el-card class="note-card">
      <div class="header">
        <h2>📓 笔记管理</h2>
        <div class="search-box">
          <el-input
            v-model="searchVal"
            placeholder="请输入关键词搜索"
            clearable
            style="width: 240px; margin-right: 10px"
            @keyup.enter="handleSearch"
          />
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </div>
      </div>

      <el-table v-if="notes.length" :data="paginatedNotes" border stripe style="width: 100%">
        <el-table-column label="序号" width="80" align="center">
          <template #default="{ $index }">
            <span>{{ ($index + 1) + (currentPage - 1) * pageSize }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="noteId" label="Note ID" width="220" align="center" />
        <el-table-column prop="title" label="标题" min-width="200" align="center" />
        <el-table-column label="链接" min-width="200" align="center">
          <template #default="{ row }">
            <a :href="row.url" target="_blank" rel="noopener noreferrer">{{ row.url }}</a>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ formatDate(row.createdAt) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteNote(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else description="暂无笔记" />

      <el-pagination
        v-if="notes.length"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="notes.length"
        layout="prev, pager, next, jumper, ->, total"
        @current-change="handlePageChange"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" title="编辑笔记" width="600px">
      <el-form :model="formNote" label-width="100px">
        <el-form-item label="标题">
          <el-input v-model="formNote.title" />
        </el-form-item>
        <el-form-item label="链接">
          <el-input v-model="formNote.url" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitNote">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import notesApi, { type NoteItem } from '../../api/notes';
import dayjs from 'dayjs';

export default defineComponent({
  name: 'NoteList',
  setup() {
    const notes = ref<NoteItem[]>([]);
    const currentPage = ref(1);
    const pageSize = 10;

    const searchVal = ref('');
    const dialogVisible = ref(false);
    const isEditMode = ref(false);
    const formNote = ref({
      id: null as number | null,
      title: '',
      url: ''
    });

    const fetchNotes = async () => {
      try {
        notes.value = await notesApi.getAllNotes();
      } catch (err) {
        ElMessage.error('获取笔记失败');
        console.error(err);
      }
    };

    const handleSearch = async () => {
      try {
        if (searchVal.value.trim() === '') {
          fetchNotes(); // 重置为全部笔记
        } else {
          notes.value = await notesApi.getNotesBySelectVal(searchVal.value);
          currentPage.value = 1;
        }
      } catch (err) {
        ElMessage.error('搜索失败');
        console.error(err);
      }
    };

    const paginatedNotes = computed(() => {
      const start = (currentPage.value - 1) * pageSize;
      return notes.value.slice(start, start + pageSize);
    });

    const handlePageChange = (page: number) => {
      currentPage.value = page;
    };

    const openEditDialog = (row: NoteItem) => {
      isEditMode.value = true;
      formNote.value = {
        id: row.id,
        title: row.title,
        url: row.url
      };
      dialogVisible.value = true;
    };

    const submitNote = async () => {
      try {
        if (isEditMode.value && formNote.value.id !== null) {
          await notesApi.updateNote(formNote.value.id, {
            title: formNote.value.title,
            url: formNote.value.url
          });
          ElMessage.success('笔记更新成功');
          dialogVisible.value = false;
          fetchNotes();
        }
      } catch (err) {
        ElMessage.error('提交失败');
        console.error(err);
      }
    };

    const deleteNote = async (id: number) => {
      try {
        await ElMessageBox.confirm('确定要删除该笔记吗？', '删除确认', {
          type: 'warning'
        });
        await notesApi.deleteNoteById(id);
        ElMessage.success('删除成功');
        fetchNotes();
      } catch (err) {
        if (err !== 'cancel') {
          ElMessage.error('删除失败');
          console.error(err);
        }
      }
    };

    const formatDate = (val: string) => {
      return dayjs(val).format('YYYY-MM-DD HH:mm:ss');
    };

    onMounted(fetchNotes);

    return {
      notes,
      currentPage,
      pageSize,
      paginatedNotes,
      dialogVisible,
      isEditMode,
      formNote,
      openEditDialog,
      submitNote,
      deleteNote,
      handlePageChange,
      formatDate,
      searchVal,
      handleSearch
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

.search-box {
  display: flex;
  align-items: center;
}
</style>
