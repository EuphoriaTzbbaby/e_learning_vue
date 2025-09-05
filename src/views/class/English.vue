<template>
  <div class="english-page">
    <el-card class="english-card">
      <div class="header">
        <h2>English cnm fuck mlgb</h2>
        <el-input
          v-model="searchVal"
          placeholder="请输入关键词、臭贝贝"
          clearable
          prefix-icon="el-icon-search"
          size="large"
          style="width: 300px;"
        />
        <el-button type = "success" @click="searchEnglish">搜索</el-button>
        <el-button type="warning" @click="sortContent">排序</el-button>
        <el-button type="danger" @click="reset">重置</el-button>
        <el-button type="primary" @click="openAddDialog">新增内容</el-button>
      </div>

      <el-table
        v-if="englishList.length"
        :data="paginatedList"
        style="width: 100%"
        border
        stripe
      >
        <el-table-column prop="content" label="英文内容" width="300" align="center" />
        <el-table-column prop="coreKey" label="关键词" width="150" align="center" />
        <el-table-column prop="translation" label="翻译" width="300" align="center" />
        <el-table-column prop="comment" label="备注" width="100" align="center" />
        <el-table-column prop="isTaboo" label="是否熟悉" width="100" align="center" />
        <el-table-column prop="textCnt" label="练习次数" width="100" align="center" />
        <el-table-column prop="createDate" label="创建时间" width="200" align="center" />
        <el-table-column label="操作" width="250" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteEnglish(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else description="暂无数据" />

      <el-pagination
        v-if="englishList.length"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="englishList.length"
        layout="prev, pager, next, jumper, ->, total"
        @current-change="handlePageChange"
      />
    </el-card>

    <!-- 弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑内容' : '新增内容'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="英文内容">
          <el-input v-model="form.content" type="textarea" />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="form.coreKey" />
        </el-form-item>
        <el-form-item label="翻译">
          <el-input v-model="form.translation" type="textarea" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.comment" />
        </el-form-item>
        <el-form-item label="是否熟悉">
          <el-input v-model="form.isTaboo" />
        </el-form-item>
        <el-form-item label="练习次数">
          <el-input v-model="form.textCnt" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" placeholder="请选择">
            <el-option label="草稿" value="draft" />
            <el-option label="发布" value="published" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEnglish">{{ isEditMode ? '保存修改' : '确定' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed} from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import englishApi from '../../api/english';
import reviewApi from '../../api/reviewState';
import type { English } from '../../interface/english';
import type { ReviewState } from '../../interface/reviewState';
// 获取用户信息(存储在浏览器里了)
const currentUser = JSON.parse(localStorage.getItem('user') || '{}') || null
const userId = currentUser.id;
export default defineComponent({
  name: 'EnglishPage',
  setup() {
    // 分页
    const currentPage = ref(1);
    const pageSize = 10;
        const paginatedList = computed(() => {
      const start = (currentPage.value - 1) * pageSize;
      return englishList.value.slice(start, start + pageSize);
    });
    const handlePageChange = (page: number) => {
      currentPage.value = page;
    };
    // 搜索
    const searchVal = ref('');
      const searchEnglish = async () => {
      try {
        const res = await englishApi.getEnglishBySelectVal(searchVal.value);
        englishList.value = res.data.filter((item: any) => item.userId == userId && item.isDeleted == 0);
        keyList.value = Array.from(new Set(res.data.map((item: any) => item.coreKey)));
      } catch (err) {
        console.error(err);
      }
    };
    // 按照 coreKey排序
    const keyList = ref([])
    const sortKey = ref(0)
    const sortContent = () => {
      let i = 0, j = englishList.value.length - 1;
      while(i < j) {
        while(i < j && englishList.value[i].coreKey == keyList.value[sortKey.value]) i++;
        while(i < j && englishList.value[j].coreKey != keyList.value[sortKey.value]) j--;
        if(i < j) {
          [englishList.value[i], englishList.value[j]] = [englishList.value[j], englishList.value[i]];
        }
      }
      const substr = englishList.value.slice(0, i);
      substr.sort((a, b) => 
        Date.parse(a.createDate) - Date.parse(b.createDate)
      );
      englishList.value = [...substr, ...englishList.value.slice(i)];
      sortKey.value = (sortKey.value + 1) % keyList.value.length;
    }
    // 重置
    const reset = () => {
      sortKey.value = 0;
      fetchEnglishList();
    }
    // 获取所有english信息
    const form = ref<English>({
      egId : 0,
      userId : userId,
      content: '',
      coreKey: '',
      translation: '',
      comment: '',
      createDate: '',
      updateDate: '',
      isDeleted: '',
      status: 'draft',
      isTaboo: 0,
      textCnt: 0,
    });
    const englishList = ref<English[]>([]);
    const last = ref<English>() // 为了获取最后一个 egId，为了同时新增 reviewState
    const fetchEnglishList = async () => {
      try {
        const res = await englishApi.getAllEnglish();
        last.value = res.data[res.data.length - 1];
        englishList.value = res.data.filter((item: any) => item.userId == userId && item.isDeleted == 0);
        keyList.value = Array.from(new Set(res.data.map((item: any) => item.coreKey)));

      } catch (err) {
        console.error(err);
      }
    };
    // 隐藏弹窗(编辑 / 新增)
    const dialogVisible = ref(false);
    const isEditMode = ref(false);
    const openAddDialog = () => {
      isEditMode.value = false;
      form.value = {
        egId : 0,
        userId : userId,
        content: '',
        coreKey: defaultCoreKey.value,
        translation: '',
        comment: '无',
        createDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updateDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        isDeleted: '0',
        status: 'draft',
        isTaboo: 0,
        textCnt: 0,
      };
      dialogVisible.value = true;
    };
    const openEditDialog = (row: any) => {
      isEditMode.value = true;
      form.value = { ...row };
      form.value.updateDate = dayjs().format('YYYY-MM-DD HH:mm:ss');
      dialogVisible.value = true;
    };
    // 处理编辑/新增的提交
    const reviewState = ref<ReviewState>({
      id: 0,
      userId: userId,
      egId : 0,
      intervalDays: 0,
      strength: 0,
      difficulty: 0,
      forgettingIdx: 0,
      repetitions : 0,
      lastReview: '',
      nextReview: '',
      createDate: '',
      updateDate: '',
    });
    const defaultCoreKey = ref('单词') // 控制默认 corekey
    const submitEnglish = async () => {
      try {
        if (isEditMode.value) {
          await englishApi.updateEnglish(form.value);
          ElMessage.success('修改成功');
        } else {
          defaultCoreKey.value = form.value.coreKey;
          await englishApi.addEnglish(form.value);
          ElMessage.success('单词新增成功');

          // 新增成功后再生成 reviewState
          reviewState.value.userId = userId;
          reviewState.value.egId = last.value?.egId ? last.value.egId + 1 : 1;
          reviewState.value.intervalDays = 0;
          reviewState.value.strength = 0;
          reviewState.value.difficulty = form.value.content.length / 10 * 0.1;
          reviewState.value.difficulty = Math.min(1.0, reviewState.value.difficulty);
          reviewState.value.forgettingIdx = 0;
          reviewState.value.repetitions = 0;

          const v = dayjs().format('YYYY-MM-DD HH:mm:ss');
          reviewState.value.lastReview = v;
          reviewState.value.nextReview = v;
          reviewState.value.createDate = v;
          reviewState.value.updateDate = v;
          console.log(reviewState.value,99999999)
          // 再新增复习状态
          await reviewApi.addReview(reviewState.value);
          ElMessage.success('复习状态新增成功');

        }
        dialogVisible.value = false;
        fetchEnglishList();
      } catch (err) {
        console.error(err);
        ElMessage.error('操作失败');
      }
    };
    // 删除(逻辑删除)，实际表中会记录这条信息的
    const deleteEnglish = async (row : any) => {
      try {
        await ElMessageBox.confirm('确定删除该记录？', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        form.value = { ...row };
        form.value.isDeleted = '1';
        form.value.updateDate = dayjs().format('YYYY-MM-DD HH:mm:ss');
        console.log(form.value);
        await englishApi.updateEnglish(form.value);
        // ElMessage.success('修改成功')
        // await englishApi.deleteEnglish(id);
        ElMessage.success('删除成功');
        fetchEnglishList();
      } catch (err) {
        if (err !== 'cancel') {
          ElMessage.error('删除失败');
        }
      }
    };
    // 按Enter键进行搜索
    const handleKeyDown = (event: KeyboardEvent) => {
      if(event.key == 'Enter') {
        searchEnglish();
      }
    };
    // 源头，就那么多
    onMounted(() => {
      fetchEnglishList();
      window.addEventListener('keydown', handleKeyDown);
    });
    return {
      englishList,
      currentPage,
      pageSize,
      paginatedList,
      dialogVisible,
      isEditMode,
      form,
      searchVal,
      searchEnglish,
      sortContent,
      reset,
      openAddDialog,
      openEditDialog,
      submitEnglish,
      deleteEnglish,
      handlePageChange
    };
  }
});
</script>

<style scoped>
.english-page {
  padding: 20px;
}

.english-card {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
