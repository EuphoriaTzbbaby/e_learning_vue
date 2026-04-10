<template>
  <div class="profile-page">
    <el-card class="profile-card" v-loading="loading">
      <div class="header">
        <h2>个人信息</h2>
      </div>

      <!-- 头像区域 -->
      <div class="avatar-section">
        <div class="avatar-wrapper">
          <el-avatar :src="avatarUrl" :size="120">
            {{ (form.username || 'U').slice(0, 1).toUpperCase() }}
          </el-avatar>
          <el-tag v-if="form.role" :type="getRoleTagType(form.role)" class="role-tag">
            {{ getRoleLabel(form.role) }}
          </el-tag>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="section-title">
        <el-icon><User /></el-icon>
        <span>基本信息</span>
      </div>

      <el-form :model="form" label-width="100px" class="profile-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" placeholder="请输入用户名" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入真实姓名" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" clearable />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="角色" prop="role">
              <el-select v-model="form.role" style="width: 100%" disabled>
                <el-option label="学生" value="student" />
                <el-option label="教师" value="teacher" />
                <el-option label="管理员" value="admin" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="头像地址" prop="avatar">
          <el-input v-model="form.avatar" placeholder="例如: avatar.jpg 或完整URL" clearable>
            <template #append>
              <el-button @click="previewAvatar" :disabled="!form.avatar">预览</el-button>
            </template>
          </el-input>
          <div class="avatar-tip">支持 OSS Key 或完整 URL</div>
        </el-form-item>
      </el-form>

      <!-- 账户状态 -->
      <div class="section-title">
        <el-icon><InfoFilled /></el-icon>
        <span>账户状态</span>
      </div>

      <div class="status-info">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="info-item">
              <div class="info-label">账户状态</div>
              <div class="info-value">
                <el-tag :type="form.state === 1 ? 'success' : 'danger'" size="large">
                  {{ form.state === 1 ? '正常' : '禁用' }}
                </el-tag>
              </div>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="info-item">
              <div class="info-label">注册时间</div>
              <div class="info-value">{{ form.createdAt || '暂无' }}</div>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="info-item">
              <div class="info-label">最后更新</div>
              <div class="info-value">{{ form.updatedAt || '暂无' }}</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 安全设置 -->
      <div class="section-title">
        <el-icon><Lock /></el-icon>
        <span>安全设置</span>
      </div>

      <div class="security-section">
        <div class="security-item">
          <div class="security-label">
            <el-icon><Key /></el-icon>
            <span>登录密码</span>
          </div>
          <div class="security-value">
            <el-button type="primary" link @click="showPasswordDialog = true">
              修改密码
            </el-button>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <el-button @click="resetByRemote" :loading="loading">
          <el-icon><RefreshRight /></el-icon>
          重置
        </el-button>
        <el-button type="primary" @click="saveProfile" :loading="saving">
          <el-icon><Check /></el-icon>
          保存修改
        </el-button>
      </div>
    </el-card>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="showPasswordDialog"
      title="修改密码"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            v-model="passwordForm.currentPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码（至少6位）"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="changePassword" :loading="changingPassword">
          确认修改
        </el-button>
      </template>
    </el-dialog>

    <!-- 头像预览对话框 -->
    <el-dialog v-model="showAvatarDialog" title="头像预览" width="400px" center>
      <div class="avatar-preview-dialog">
        <el-avatar :src="avatarUrl" :size="200">
          {{ (form.username || 'U').slice(0, 1).toUpperCase() }}
        </el-avatar>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { User, InfoFilled, Lock, Key, RefreshRight, Check } from '@element-plus/icons-vue'
import usersApi from '../../api/users'
import type { FormInstance, FormRules } from 'element-plus'

interface ProfileForm {
  id: number | null
  username: string
  name: string
  email: string
  role: string
  avatar: string
  state: number
  createdAt: string
  updatedAt: string
}

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const loading = ref(false)
const saving = ref(false)
const changingPassword = ref(false)
const showPasswordDialog = ref(false)
const showAvatarDialog = ref(false)
const passwordFormRef = ref<FormInstance>()

const currentUser = JSON.parse(localStorage.getItem('user') || '{}') || null
const currentUserId = Number(currentUser?.id || 0)

const form = ref<ProfileForm>({
  id: currentUserId || null,
  username: '',
  name: '',
  email: '',
  role: 'student',
  avatar: '',
  state: 1,
  createdAt: '',
  updatedAt: ''
})

const passwordForm = ref<PasswordForm>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  console.log(rule);
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== passwordForm.value.newPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = ref<FormRules>({
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
})

const avatarUrl = computed(() => {
  if (!form.value.avatar) return ''
  if (/^https?:\/\//.test(form.value.avatar)) return form.value.avatar
  return `https://cwwdka.oss-cn-beijing.aliyuncs.com/${form.value.avatar}`
})

const getRoleTagType = (role: string) => {
  const typeMap: Record<string, any> = {
    student: '',
    teacher: 'warning',
    admin: 'danger'
  }
  return typeMap[role] || ''
}

const getRoleLabel = (role: string) => {
  const labelMap: Record<string, string> = {
    student: '学生',
    teacher: '教师',
    admin: '管理员'
  }
  return labelMap[role] || role
}

const previewAvatar = () => {
  showAvatarDialog.value = true
}

const fillForm = (data: any) => {
  form.value = {
    id: Number(data?.id ?? currentUserId ?? 0) || null,
    username: data?.username || '',
    name: data?.name || '',
    email: data?.email || '',
    role: data?.role || 'student',
    avatar: data?.avatar || '',
    state: data?.state ?? 1,
    createdAt: data?.createdAt || '',
    updatedAt: data?.updatedAt || ''
  }
}

const resetByRemote = async () => {
  if (!currentUserId) {
    ElMessage.warning('未检测到登录用户，请重新登录')
    return
  }
  loading.value = true
  try {
    const res = await usersApi.getUserById(currentUserId)
    fillForm(res.data)
    ElMessage.success('信息已重置')
  } catch (error) {
    console.error('load profile failed:', error)
    ElMessage.error('获取个人信息失败')
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  if (!form.value.id) {
    ElMessage.warning('用户信息异常，请重新登录')
    return
  }
  if (!form.value.email) {
    ElMessage.warning('邮箱不能为空')
    return
  }
  if (!form.value.username) {
    ElMessage.warning('用户名不能为空')
    return
  }

  saving.value = true
  try {
    const payload = {
      id: form.value.id,
      username: form.value.username,
      name: form.value.name,
      email: form.value.email,
      avatar: form.value.avatar
    }
    await usersApi.updateUser(payload)
    ElMessage.success('个人信息已保存')

    const mergedUser = { ...(currentUser || {}), ...payload }
    localStorage.setItem('user', JSON.stringify(mergedUser))
  } catch (error) {
    console.error('save profile failed:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const changePassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      changingPassword.value = true
      try {
        // 这里应该调用修改密码的API
        // await usersApi.changePassword({
        //   userId: currentUserId,
        //   currentPassword: passwordForm.value.currentPassword,
        //   newPassword: passwordForm.value.newPassword
        // })
        
        ElMessage.success('密码修改成功，请重新登录')
        showPasswordDialog.value = false
        passwordForm.value = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
        // 可以选择跳转到登录页
        // router.push('/login')
      } catch (error) {
        console.error('change password failed:', error)
        ElMessage.error('密码修改失败')
      } finally {
        changingPassword.value = false
      }
    }
  })
}

onMounted(() => {
  void resetByRemote()
})
</script>

<style scoped>
.profile-page {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  min-height: calc(100vh - 60px);
}

.profile-card {
  max-width: 900px;
  margin: 0 auto;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin: 30px 0;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.role-tag {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  padding: 2px 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 28px 0 16px;
  padding-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
  border-bottom: 1px solid #e4e7ed;
}

.section-title .el-icon {
  font-size: 18px;
}

.profile-form {
  margin-top: 16px;
}

.avatar-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.status-info {
  margin-top: 16px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.info-item {
  text-align: center;
}

.info-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.info-value {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.security-section {
  margin-top: 16px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: white;
  border-radius: 6px;
  margin-bottom: 8px;
}

.security-item:last-child {
  margin-bottom: 0;
}

.security-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.security-label .el-icon {
  font-size: 16px;
  color: #409eff;
}

.actions {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.avatar-preview-dialog {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-input.is-disabled .el-input__inner) {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #909399;
  cursor: not-allowed;
}
</style>
