<template>
    <div class="album-page">
      <el-card class="album-card">
        <div class="header">
          <h2>视频合集管理</h2>
          <div style="display: flex; gap: 10px;">
            <el-input v-model="searchVal" placeholder="请输入标题关键词" clearable />
            <el-button @click="searchAlbums">搜索</el-button>
            <el-button @click="fetchAlbums" type="primary">重置</el-button>
            <el-button type="success" @click="openAddDialog">新增合集</el-button>
          </div>
        </div>
  
        <el-table
          v-if="albums.length"
          :data="paginatedAlbums"
          style="width: 100%"
          border
          stripe
        >
          <el-table-column prop="title" label="合集标题" width="200" align="center" />
          <el-table-column prop="description" label="描述" width="200" show-overflow-tooltip align="center" />
          <el-table-column prop="coverUrl" label="封面" width="720" align="center">
            <template #default="{ row }">
              <el-image
                style="width: 100%; height: 100%; object-fit: cover"
                :src="row.coverUrl"
                fit="cover"
                :preview-src-list="[row.coverUrl]"
              />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" align="center" />
          <el-table-column label="操作" width="300" align="center">
            <template #default="{ row }">
              <el-button size="medium" type="primary" @click="openEditDialog(row)">编辑</el-button>
              <el-button size="medium" type="danger" @click="deleteAlbum(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
  
        <el-empty v-else description="暂无视频合集" />
  
        <el-pagination
          v-if="albums.length"
          :current-page="currentPage"
          :page-size="pageSize"
          :total="albums.length"
          layout="prev, pager, next, jumper, ->, total"
          @current-change="handlePageChange"
        />
      </el-card>
  
      <!-- 弹窗 -->
      <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑合集' : '新增合集'" width="600px">
        <el-form :model="formAlbum" label-width="100px">
          <el-form-item label="合集标题">
            <el-input v-model="formAlbum.title" />
          </el-form-item>
  
          <el-form-item label="描述">
            <el-input v-model="formAlbum.description" />
          </el-form-item>
  
          <el-form-item label="封面地址">
            <el-input v-model="formAlbum.coverUrl" />
          </el-form-item>
  
          <el-form-item label="创建时间" v-if="formAlbum.createTime">
            <el-input v-model="formAlbum.createTime" readonly />
          </el-form-item>
        </el-form>
  
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAlbum">{{ isEditMode ? '保存修改' : '确定' }}</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, onMounted, computed } from 'vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import dayjs from 'dayjs';
  import classTeachersApi from '../../api/classTeachers'; // 保留你原来调用这个API的
  import videoAlbumApi from '../../api/videoAlbum';
  
  export default defineComponent({
    name: 'VideoAlbumList',
    setup() {
      const albums = ref<any[]>([]);
      const currentPage = ref(1);
      const pageSize = 3;
  
      const dialogVisible = ref(false);
      const isEditMode = ref(false);
      const formAlbum = ref<any>({
        id: null,
        title: '',
        description: '',
        coverUrl: '',
        createTime: ''
      });
  
      const searchVal = ref('');
  
      // 你原版获取合集的写法，保持不变
      const fetchAlbums = async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) return;
  
        try {
          // 1. 先获取 classId 列表
          const res = await classTeachersApi.getAlbumsByTeacherId(user.id);
          const classIdList = res.data.map((item: any) => item.classId);
  
          // 2. 并发调用 videoAlbumApi 获取每个 classId 对应的详细信息
          const details = await Promise.all(
            classIdList.map((id: number) =>
              videoAlbumApi
                .getAlbumByAlbumId(id)
                .then(res => res.data)
                .catch(() => null)
            )
          );
  
          // 3. 过滤掉无效/404 的结果
          albums.value = details.filter((item: any) => item !== null);
          currentPage.value = 1;
        } catch (err) {
          console.error('获取合集失败', err);
        }
      };
  
      const searchAlbums = async () => {
        if (!searchVal.value.trim()) {
          ElMessage.warning('请输入搜索关键词');
          return;
        }
  
        try {
          const response = await videoAlbumApi.getAlbumsBySelectVal(searchVal.value);
          albums.value = response.data;
          currentPage.value = 1;
        } catch (error) {
          console.error('搜索失败：', error);
          ElMessage.error('搜索失败');
        }
      };
  
      const paginatedAlbums = computed(() => {
        const start = (currentPage.value - 1) * pageSize;
        return albums.value.slice(start, start + pageSize);
      });
  
      const handlePageChange = (page: number) => {
        currentPage.value = page;
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
          console.error('操作失败：', error);
          ElMessage.error('操作失败');
        }
      };
  
      const deleteAlbum = async (id: number) => {
        try {
          await ElMessageBox.confirm('确定要删除该合集吗？此操作不可撤销。', '删除确认', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          });
  
          await videoAlbumApi.deleteAlbum(id);
          ElMessage.success('删除成功');
          fetchAlbums();
        } catch (error) {
          if (error !== 'cancel') {
            console.error('删除失败：', error);
            ElMessage.error('删除失败');
          }
        }
      };
  
      onMounted(fetchAlbums);
  
      return {
        albums,
        currentPage,
        pageSize,
        paginatedAlbums,
        dialogVisible,
        isEditMode,
        formAlbum,
        openAddDialog,
        openEditDialog,
        submitAlbum,
        deleteAlbum,
        handlePageChange,
        searchVal,
        searchAlbums,
        fetchAlbums
      };
    }
  });
  </script>
  
  <style scoped>
  .album-page {
    padding: 20px;
  }
  
  .album-card {
    padding: 20px;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 10px;
  }
  </style>
  