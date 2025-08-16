<template>
  <div class="navbar-layout">
    <!-- 顶部菜单栏 -->
    <div class="top-menu">
      <el-menu
        class="top-menu-bar"
        router
        :default-active="$route.path"
        background-color="#2d3a4b"
        text-color="#ffffff"
        active-text-color="#409EFF"
        mode="horizontal"
      >
        <el-menu-item index="/xhs/notes">
          <i class="el-icon-video-camera"></i>
          <span>笔记合集</span>
        </el-menu-item>
        <el-menu-item index="/xhs/noteComments">
          <i class="el-icon-video-camera"></i>
          <span>评论合集</span>
        </el-menu-item>
        <el-menu-item index="/xhs/emotion">
          <i class="el-icon-video-camera"></i>
          <span>情感可视化</span>
        </el-menu-item>
        <el-menu-item index="/xhs/gender">
          <i class="el-icon-video-camera"></i>
          <span>性别可视化</span>
        </el-menu-item>
        <el-menu-item index="/xhs/ipLocation">
          <i class="el-icon-video-camera"></i>
          <span>ip可视化</span>
        </el-menu-item>
        <!-- 操作按钮 -->
        <div class="menu-actions">
          <el-button type="primary" size="small" @click="showNoteDialog = true">添加笔记</el-button>
          <el-button type="success" size="small" @click="showCommentDialog = true">添加评论</el-button>
          <el-button type="warning" size="small" @click="showClassifyDialog = true">情感分析</el-button>
        </div>
      </el-menu>
    </div>

    <!-- 添加笔记对话框 -->
    <el-dialog v-model="showNoteDialog" title="添加小红书笔记" width="400px" center>
      <el-input
        v-model="noteUrl"
        placeholder="请输入小红书笔记链接"
        clearable
      />
      <template #footer>
        <el-button @click="showNoteDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddNote">确认</el-button>
      </template>
    </el-dialog>

    <!-- 添加评论对话框 -->
    <el-dialog v-model="showCommentDialog" title="获取小红书评论" width="400px" center>
      <el-input
        v-model="commentNoteUrl"
        placeholder="请输入小红书笔记链接"
        clearable
      />
      <template #footer>
        <el-button @click="showCommentDialog = false">取消</el-button>
        <el-button type="success" @click="handleAddComment">确认</el-button>
      </template>
    </el-dialog>

    <!-- 情感分析对话框 -->
    <el-dialog v-model="showClassifyDialog" title="情感分析" width="400px" center>
      <el-input
        v-model="classifyText"
        placeholder="请输入要分析的文本"
        clearable
      />
      <template #footer>
        <el-button @click="showClassifyDialog = false">取消</el-button>
        <el-button type="warning" @click="handleClassify">分析</el-button>
      </template>
    </el-dialog>

    <!-- 主内容区域 -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { fetchNoteInfo, fetchComments, classifyTextSentiment } from '../api/xhs'
import notesApi from '../api/notes'
import noteCommentsApi from '../api/noteComments'

// 控制对话框显示
const showNoteDialog = ref(false)
const showCommentDialog = ref(false)
const showClassifyDialog = ref(false)

// 表单数据
const noteUrl = ref('')
const commentNoteUrl = ref('')
const classifyText = ref('')

// 添加笔记处理函数
const handleAddNote = async () => {
  if (!noteUrl.value) {
    ElMessage.warning('请输入笔记链接');
    return;
  }
  try {
    // 1. 先调用获取笔记信息接口
    const res = await fetchNoteInfo({ note_url: noteUrl.value });
    if (!res.success) {
      ElMessage.error('获取笔记信息失败：' + res.message);
      return;
    }
    const noteInfo = res.note_info;
    console.log('✅ 获取到笔记信息：', noteInfo);

    // 2. 调用 createNote 接口保存到后端
    const createdNote = await notesApi.createNote({
      noteId: noteInfo.noteId,
      title: noteInfo.title,
      url: noteInfo.url,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    });

    ElMessage.success(`笔记《${createdNote.title}》添加成功`);
    showNoteDialog.value = false;
    noteUrl.value = '';
  } catch (error) {
    console.error('❌ 添加笔记失败:', error);
    ElMessage.error('添加笔记失败，请稍后重试');
  }
};

const fillDefault = (val: any, fallback = '未知') => {
  return val === undefined || val === null || val === '' ? fallback : val
}

const handleAddComment = async () => {
  if (!commentNoteUrl.value) {
    ElMessage.warning('请输入笔记链接');
    return;
  }
  try {
    console.log('✅ 获取评论信息：', commentNoteUrl.value);
    const res = await fetchComments({ note_url: commentNoteUrl.value });
    console.log('✅ 评论信息：', res);

    if (!res.comments || res.comments.length === 0) {
      ElMessage.info('该笔记暂无评论');
      return;
    }

    // 整理数据，构造批量插入需要的数组
    const commentsBatch = res.comments.map(comment => ({
      noteId: fillDefault(comment.note_id),
      userId: fillDefault(comment.user_id),
      nickname: fillDefault(comment.nickname),
      content: fillDefault(comment.content),
      gender: fillDefault(comment.gender),
      ipLocation: fillDefault(comment.ip_location),
      level: fillDefault(comment.level),
      commentId: fillDefault(comment.comment_id),
      likeCount: comment.likes_count ?? 0,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }));

    // 调用批量插入接口
    await noteCommentsApi.batchCreateComments(commentsBatch);

    ElMessage.success(`成功写入 ${commentsBatch.length} 条评论`);
    showCommentDialog.value = false;
    commentNoteUrl.value = '';
  } catch (err) {
    console.error('❌ 获取或写入评论失败:', err);
    ElMessage.error('获取或写入评论失败');
  }
};


// 情感分析处理函数
const handleClassify = async () => {
  console.log('✅ 情感分析：', classifyText.value)
  if (!classifyText.value) {
    ElMessage.warning('请输入要分析的文本');
    return;
  }
  try {
    console.log('✅ 情感分析：', 111)
    const res = await classifyTextSentiment({ text: classifyText.value });
    if (!res.success) {
      ElMessage.error('情感分析失败：' + res.message);
      return;
    }
    console.log('✅ 情感分析：', 222)
    ElMessage.success(`情感分析结果：${res.label}（置信度：${(res.confidence * 100).toFixed(2)}%）`);
    showClassifyDialog.value = false;
    classifyText.value = '';
  } catch (error) {
    console.error('❌ 情感分析失败:', error);
    ElMessage.error('情感分析失败，请稍后重试');
  }
};
</script>

<style scoped>
.navbar-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f0f2f5;
  width: 100%;
}

.top-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  width: 100%;
}

.top-menu-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  line-height: 60px;
  background-color: #2d3a4b;
  color: white;
  padding: 0 20px;
  border-bottom: 1px solid #1f2a36;
}

.menu-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>