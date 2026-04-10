<template>
  <div class="english-page">
    <el-card class="english-card">
      <div class="header">
        <h2>English cnm fuck mlgb</h2>
        <div class="header-actions">
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
          <el-button type="success" @click="exportVocabulary">导出词汇</el-button>
          <el-button type="warning" @click="importDialogVisible = true">批量导入</el-button>
        </div>
      </div>

      <el-table
        v-if="englishList.length"
        :data="paginatedList"
        style="width: 100%"
        border
        stripe
      >
        <el-table-column prop="content" label="英文内容" width="300" align="center" />
        <el-table-column prop="coreKey" label="分类" width="150" align="center" />
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
        <el-form-item label="分类">
          <el-select v-model="form.coreKey" placeholder="请选择分类">
            <el-option label="单词" value="单词" />
            <el-option label="短语" value="短语" />
            <el-option label="句子" value="句子" />
          </el-select>
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

    <!-- 批量导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="批量导入词汇" width="600px">
      <el-alert
        title="导入说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #default>
          <p>1. 请下载模板文件，按照模板格式填写词汇信息</p>
          <p>2. 支持的文件格式：.xlsx</p>
        </template>
      </el-alert>
      
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :limit="1"
        :on-change="handleFileChange"
        :on-exceed="handleExceed"
        accept=".xlsx"
        drag
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传 xlsx 文件，且不超过 2MB
          </div>
        </template>
      </el-upload>

      <div style="margin-top: 20px">
        <el-button type="primary" link @click="downloadTemplate">
          <el-icon><Download /></el-icon>
          下载模板文件
        </el-button>
      </div>

      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImport" :loading="importing">
          确认导入
        </el-button>
      </template>
    </el-dialog>

    <!-- 导入预览对话框 -->
    <el-dialog v-model="previewDialogVisible" title="导入预览" width="80%">
      <el-table :data="previewData" border stripe max-height="400">
        <el-table-column prop="content" label="单词" width="180" />
        <el-table-column prop="translation" label="翻译" min-width="200" />
        <el-table-column prop="coreKey" label="分类" width="120" />
        <el-table-column prop="comment" label="备注" width="150" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row._valid" type="success">有效</el-tag>
            <el-tag v-else type="danger">{{ row._error || '无效' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="previewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="executeImport" :loading="importing">
          确认导入 ({{ validPreviewCount }} 条有效数据)
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed} from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Download, UploadFilled } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
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
    // console.log(currentUser.id, 999);
    const last = ref<English>() // 为了获取最后一个 egId，为了同时新增 reviewState
    const fetchEnglishList = async () => {
      try {
        const res = await englishApi.getEnglishByuserId(currentUser.id);
        // const res = await englishApi.getAllEnglish();
        console.log(res);
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
      ef: 2.5,
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
          reviewState.value.ef = 2.5;
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

    // ========== 导出功能 ==========
    const exportVocabulary = () => {
      const exportData = englishList.value.map(w => ({
        '单词': w.content,
        '翻译': w.translation,
        '分类': w.coreKey,
        '备注': w.comment || '',
        '练习次数': w.textCnt || 0,
        '创建时间': w.createDate || '',
        '更新时间': w.updateDate || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '词汇列表');
      XLSX.writeFile(wb, `我的词汇_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`);
      ElMessage.success(`导出成功，共 ${exportData.length} 条数据`);
    };

    // ========== 导入功能 ==========
    const importDialogVisible = ref(false);
    const previewDialogVisible = ref(false);
    const previewData = ref<any[]>([]);
    const selectedFile = ref<any>(null);
    const importing = ref(false);
    const uploadRef = ref();

    const validPreviewCount = computed(() => 
      previewData.value.filter(item => item._valid).length
    );

    const downloadTemplate = () => {
      const templateData = [
        { '单词': 'apple', '翻译': '苹果', '分类': '单词', '备注': '常见水果' },
        { '单词': 'look at', '翻译': '看着', '分类': '短语', '备注': '常用短语' },
        { '单词': 'I love you', '翻译': '我爱你', '分类': '句子', '备注': '常用句子' }
      ];
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '词汇导入模板');
      XLSX.writeFile(wb, '词汇导入模板.xlsx');
      ElMessage.success('模板下载成功');
    };

    const handleFileChange = (file: any) => {
      selectedFile.value = file.raw;
    };

    const handleExceed = () => {
      ElMessage.warning('只能上传一个文件');
    };

    const confirmImport = () => {
      if (!selectedFile.value) {
        ElMessage.warning('请先选择文件');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // 验证数据
          const validatedData = jsonData.map((row: any) => {
            const item: any = {
              content: row['单词'] || row['content'] || '',
              translation: row['翻译'] || row['translation'] || '',
              coreKey: row['分类'] || row['coreKey'] || '单词',
              comment: row['备注'] || row['comment'] || '无'
            };

            // 验证必填字段
            if (!item.content) {
              item._valid = false;
              item._error = '缺少单词';
            } else if (!item.translation) {
              item._valid = false;
              item._error = '缺少翻译';
            } else if (!['单词', '短语', '句子'].includes(item.coreKey)) {
              item._valid = false;
              item._error = '分类无效(仅支持单词/短语/句子)';
            } else {
              item._valid = true;
            }

            return item;
          });

          previewData.value = validatedData;
          importDialogVisible.value = false;
          previewDialogVisible.value = true;
        } catch (error) {
          console.error('Parse file failed:', error);
          ElMessage.error('文件解析失败，请检查文件格式');
        }
      };
      reader.readAsBinaryString(selectedFile.value);
    };

    const executeImport = async () => {
      const validData = previewData.value.filter(item => item._valid);
      if (validData.length === 0) {
        ElMessage.warning('没有有效的数据可导入');
        return;
      }

      importing.value = true;
      try {
        let successCount = 0;
        let failCount = 0;

        for (const item of validData) {
          try {
            // 添加词汇
            const newWord: English = {
              egId: 0,
              userId: userId,
              content: item.content,
              translation: item.translation,
              coreKey: item.coreKey,
              comment: item.comment,
              isDeleted: '0',
              status: 'draft',
              isTaboo: 0,
              textCnt: 0,
              createDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              updateDate: dayjs().format('YYYY-MM-DD HH:mm:ss')
            };
            
            await englishApi.addEnglish(newWord);
            
            // 添加复习状态
            const newReview: ReviewState = {
              id: 0,
              userId: userId,
              egId: last.value?.egId ? last.value.egId + successCount + 1 : successCount + 1,
              intervalDays: 0,
              ef: 2.5,
              strength: 0,
              difficulty: Math.min(1.0, item.content.length / 10 * 0.1),
              forgettingIdx: 0,
              repetitions: 0,
              lastReview: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              nextReview: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              createDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              updateDate: dayjs().format('YYYY-MM-DD HH:mm:ss')
            };
            
            await reviewApi.addReview(newReview);
            successCount++;
          } catch (error) {
            failCount++;
            console.error(`Import word ${item.content} failed:`, error);
          }
        }

        ElMessage.success(`导入完成：成功 ${successCount} 条，失败 ${failCount} 条`);
        previewDialogVisible.value = false;
        selectedFile.value = null;
        fetchEnglishList();
      } catch (error) {
        console.error('Import failed:', error);
        ElMessage.error('导入失败');
      } finally {
        importing.value = false;
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
      handlePageChange,
      exportVocabulary,
      importDialogVisible,
      previewDialogVisible,
      previewData,
      importing,
      uploadRef,
      validPreviewCount,
      downloadTemplate,
      handleFileChange,
      handleExceed,
      confirmImport,
      executeImport
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
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
</style>
