<template>
    <div class="user-page">
        <el-card class="user-card">
            <template #header>
                <div class="card-header">
                    <span class="title">用户管理</span>
                    <div class="header-actions">
                        <el-button type="success" @click="exportUsers" :icon="Download">
                            导出Excel
                        </el-button>
                        <el-button type="warning" @click="importDialogVisible = true" :icon="Upload">
                            批量导入
                        </el-button>
                        <el-button type="primary" @click="openAddDialog" :icon="Plus">新增用户</el-button>
                    </div>
                </div>
            </template>

            <div class="filter-container">
                <el-input 
                    v-model="searchVal" 
                    placeholder="搜索用户名/邮箱" 
                    clearable 
                    :prefix-icon="Search"
                    @keyup.enter="handleSearch"
                    class="filter-item search-input"
                />
                <el-select v-model="roleFilter" placeholder="角色筛选" clearable class="filter-item role-select">
                    <el-option label="学生" value="student" />
                    <el-option label="管理员" value="admin" />
                </el-select>
                <el-button type="primary" @click="handleSearch" :icon="Search">查询</el-button>
                <el-button @click="resetSearch" :icon="Refresh">重置</el-button>
                <el-button 
                    v-if="selectedIds.length > 0" 
                    type="danger" 
                    @click="batchDelete" 
                    :icon="Delete"
                >
                    批量删除 ({{ selectedIds.length }})
                </el-button>
                <el-button 
                    v-if="selectedIds.length > 0" 
                    type="warning" 
                    @click="batchToggleState(true)"
                    :icon="Lock"
                >
                    批量禁用
                </el-button>
                <el-button 
                    v-if="selectedIds.length > 0" 
                    type="success" 
                    @click="batchToggleState(false)"
                    :icon="Unlock"
                >
                    批量启用
                </el-button>
            </div>

            <el-table 
                v-loading="loading"
                :data="paginatedUsers" 
                style="width: 100%" 
                border 
                stripe
                @selection-change="handleSelectionChange"
            >
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column prop="username" label="用户名" width="120" align="center" />
                <el-table-column prop="name" label="姓名" width="120" align="center" />
                <el-table-column prop="email" label="邮箱" min-width="200" align="center" />
                <el-table-column prop="role" label="角色" width="100" align="center">
                    <template #default="{ row }">
                        <el-tag :type="getRoleTag(row.role)">{{ row.role }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="state" label="状态" width="100" align="center">
                    <template #default="{ row }">
                        <el-tag v-if="row.state === 1" type="danger">禁用</el-tag>
                        <el-tag v-else type="success">正常</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="createdAt" label="创建时间" width="180" align="center" sortable>
                    <template #default="{ row }">
                        {{ formatTime(row.createTime || row.createdAt) }}
                    </template>
                </el-table-column>
                <el-table-column prop="updatedAt" label="更新时间" width="180" align="center" sortable>
                    <template #default="{ row }">
                        {{ formatTime(row.updateTime || row.updatedAt) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
                        <el-divider direction="vertical" />
                        <el-button
                            v-if="row.state === 1"
                            link
                            type="success"
                            @click="toggleUserState(row)"
                        >
                            启用
                        </el-button>
                        <el-button
                            v-else
                            link
                            type="warning"
                            @click="toggleUserState(row)"
                        >
                            禁用
                        </el-button>
                        <el-divider direction="vertical" />
                        <el-button link type="danger" @click="deleteUser(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <el-pagination 
                    v-if="filteredUsers.length" 
                    v-model:current-page="currentPage" 
                    :page-size="pageSize" 
                    :total="filteredUsers.length"
                    layout="total, sizes, prev, pager, next, jumper" 
                    :page-sizes="[10, 20, 50, 100]"
                    @size-change="handleSizeChange"
                    @current-change="handlePageChange" 
                />
            </div>
        </el-card>

        <el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑用户' : '新增用户'" width="500px">
            <el-form :model="formUser" label-width="100px" status-icon>
                <el-form-item label="用户名" required>
                    <el-input v-model="formUser.username" placeholder="请输入用户名" />
                </el-form-item>

                <el-form-item label="姓名" required>
                    <el-input v-model="formUser.name" placeholder="请输入真实姓名" />
                </el-form-item>

                <el-form-item label="邮箱" required>
                    <el-input v-model="formUser.email" placeholder="请输入邮箱地址" />
                </el-form-item>

                <el-form-item label="密码" required>
                    <el-input 
                        v-model="formUser.password" 
                        type="password"
                        placeholder="请输入密码" 
                        show-password 
                    />
                </el-form-item>

                <el-form-item label="角色" required>
                    <el-radio-group v-model="formUser.role">
                        <el-radio label="student">学生</el-radio>
                        <el-radio label="admin">管理员</el-radio>
                    </el-radio-group>
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="submitLoading" @click="submitUser">
                    {{ isEditMode ? '保存修改' : '确定新增' }}
                </el-button>
            </template>
        </el-dialog>

        <!-- 批量导入对话框 -->
        <el-dialog v-model="importDialogVisible" title="批量导入用户" width="600px">
            <el-alert
                title="导入说明"
                type="info"
                :closable="false"
                style="margin-bottom: 20px"
            >
                <template #default>
                    <p>1. 请下载模板文件，按照模板格式填写用户信息</p>
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
                <el-table-column prop="username" label="用户名" width="150" />
                <el-table-column prop="name" label="姓名" width="120" />
                <el-table-column prop="email" label="邮箱" min-width="200" />
                <el-table-column prop="role" label="角色" width="100">
                    <template #default="{ row }">
                        <el-tag :type="getRoleTag(row.role)">{{ row.role }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="password" label="密码" width="120" />
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
import { defineComponent, ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Delete, Download, Upload, UploadFilled, Lock, Unlock } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import usersApi from '../../api/users'

export default defineComponent({
    name: 'UserList',
    setup() {
        const users = ref<any[]>([])
        const loading = ref(false)
        const submitLoading = ref(false)
        const currentPage = ref(1)
        const pageSize = ref(10)
        const selectedIds = ref<number[]>([])

        const dialogVisible = ref(false)
        const isEditMode = ref(false)
        const formUser = ref<any>({
            id: null,
            username: '',
            name: '',
            email: '',
            password: '',
            role: 'student',
            state: 0
        })

        const searchVal = ref('')
        const roleFilter = ref('')
        const importDialogVisible = ref(false)
        const previewDialogVisible = ref(false)
        const importing = ref(false)
        const uploadRef = ref()
        const selectedFile = ref<File | null>(null)
        const previewData = ref<any[]>([])

        const validPreviewCount = computed(() => {
            return previewData.value.filter(item => item._valid).length
        })

        const fetchUsers = async () => {
            loading.value = true
            try {
                const response = await usersApi.getAllUsers()
                users.value = Array.isArray(response.data) ? response.data : []
            } catch (error) {
                console.error('Error fetching users:', error)
                ElMessage.error('获取用户列表失败')
            } finally {
                loading.value = false
            }
        }

        const filteredUsers = computed(() => {
            let result = users.value
            if (roleFilter.value) {
                result = result.filter(u => u.role === roleFilter.value)
            }
            if (searchVal.value.trim()) {
                const val = searchVal.value.toLowerCase()
                result = result.filter(u => 
                    u.username?.toLowerCase().includes(val) || 
                    u.email?.toLowerCase().includes(val)
                )
            }
            return result
        })

        const handleSearch = () => {
            currentPage.value = 1
        }

        const resetSearch = () => {
            searchVal.value = ''
            roleFilter.value = ''
            currentPage.value = 1
        }

        const handlePageChange = (page: number) => {
            currentPage.value = page
        }

        const handleSizeChange = (val: number) => {
            pageSize.value = val
            currentPage.value = 1
        }

        const paginatedUsers = computed(() => {
            const start = (currentPage.value - 1) * pageSize.value
            return filteredUsers.value.slice(start, start + pageSize.value)
        })

        const getRoleTag = (role: string) => {
            switch (role) {
                case 'admin': return 'danger'
                case 'teacher': return 'warning'
                case 'student': return 'success'
                default: return 'info'
            }
        }

        const handleSelectionChange = (selection: any[]) => {
            selectedIds.value = selection.map(item => item.id)
        }

        const openAddDialog = () => {
            isEditMode.value = false
            formUser.value = {
                id: null,
                username: '',
                name: '',
                email: '',
                password: '',
                role: 'student',
                state: 0
            }
            dialogVisible.value = true
        }

        const openEditDialog = (user: any) => {
            isEditMode.value = true
            formUser.value = {
                ...user
            }
            dialogVisible.value = true
        }

        const formatTime = (val: any) => {
            if (!val) return '-'
            if (typeof val === 'number' || (typeof val === 'string' && /^\d+$/.test(val))) {
                const n = typeof val === 'number' ? val : Number(val)
                const ms = n < 1e12 ? n * 1000 : n
                const dNum = dayjs(ms)
                if (dNum.isValid()) return dNum.format('YYYY-MM-DD HH:mm:ss')
            }
            const d = dayjs(val)
            if (!d.isValid()) return String(val)
            return d.format('YYYY-MM-DD HH:mm:ss')
        }

        const submitUser = async () => {
            if (!formUser.value.email || !formUser.value.role || !formUser.value.username || !formUser.value.name) {
                ElMessage.warning('请填写用户名、姓名、邮箱与角色')
                return
            }
            if (!formUser.value.password) {
                ElMessage.warning('请填写密码')
                return
            }

            submitLoading.value = true
            const payload: any = { ...formUser.value }
            if ('classId' in payload) {
                delete payload.classId
            }
            // 新增用户时设置默认头像和时间戳
            if (!isEditMode.value) {
                if (!payload.avatar) {
                    payload.avatar = 'avatar.jpg'
                }
                payload.createdAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
                payload.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
            } else {
                // 编辑时更新 updatedAt
                payload.updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
            }
            
            try {
                if (isEditMode.value) {
                    await usersApi.updateUser(payload)
                    ElMessage.success('用户更新成功')
                } else {
                    await usersApi.addUser(payload)
                    ElMessage.success('用户新增成功')
                }
                dialogVisible.value = false
                fetchUsers()
            } catch (error) {
                console.error('Submit user failed:', error)
                ElMessage.error('操作失败')
            } finally {
                submitLoading.value = false
            }
        }

        const deleteUser = async (id: number) => {
            try {
                await ElMessageBox.confirm('确定要删除该用户吗？此操作不可撤销。', '删除确认', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                })
                await usersApi.deleteUser(id)
                ElMessage.success('删除成功')
                fetchUsers()
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('Delete user failed:', error)
                    ElMessage.error('删除失败')
                }
            }
        }

        const batchDelete = async () => {
            if (selectedIds.value.length === 0) return
            try {
                await ElMessageBox.confirm(`确定要批量删除选中的 ${selectedIds.value.length} 个用户吗？`, '批量删除确认', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                })
                // 假设后端支持批量删除，或者循环调用
                await Promise.all(selectedIds.value.map(id => usersApi.deleteUser(id)))
                ElMessage.success('批量删除成功')
                fetchUsers()
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('Batch delete failed:', error)
                    ElMessage.error('部分删除失败')
                }
            }
        }

        const toggleUserState = async (user: any) => {
            const current = user?.state === 1 ? 1 : 0
            const next = current === 1 ? 0 : 1
            const actionText = next === 1 ? '禁用' : '启用'
            try {
                await ElMessageBox.confirm(`确定要${actionText}该用户吗？`, '状态确认', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                })
                await usersApi.updateUser({ ...user, state: next })
                ElMessage.success(`用户已${actionText}`)
                fetchUsers()
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('Toggle user state failed:', error)
                    ElMessage.error('操作失败')
                }
            }
        }

        const batchToggleState = async (disable: boolean) => {
            if (selectedIds.value.length === 0) return
            const actionText = disable ? '禁用' : '启用'
            try {
                await ElMessageBox.confirm(
                    `确定要批量${actionText}选中的 ${selectedIds.value.length} 个用户吗？`,
                    '批量操作确认',
                    {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning'
                    }
                )
                await Promise.all(
                    selectedIds.value.map(id => {
                        const user = users.value.find(u => u.id === id)
                        if (user) {
                            return usersApi.updateUser({ ...user, state: disable ? 1 : 0 })
                        }
                    })
                )
                ElMessage.success(`批量${actionText}成功`)
                fetchUsers()
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('Batch toggle state failed:', error)
                    ElMessage.error('操作失败')
                }
            }
        }

        const exportUsers = async () => {
            try {
                const response = await usersApi.getAllUsers()
                const userList = Array.isArray(response.data) ? response.data : []
                
                const exportData = userList.map((u: any) => ({
                    '用户名': u.username,
                    '姓名': u.name,
                    '邮箱': u.email,
                    '角色': u.role,
                    '状态': u.state === 1 ? '禁用' : '正常',
                    '创建时间': u.createdAt || u.createTime || '',
                    '更新时间': u.updatedAt || u.updateTime || ''
                }))

                const ws = XLSX.utils.json_to_sheet(exportData)
                const wb = XLSX.utils.book_new()
                XLSX.utils.book_append_sheet(wb, ws, '用户列表')
                XLSX.writeFile(wb, `用户数据_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`)
                
                ElMessage.success('导出成功')
            } catch (error) {
                console.error('Export users failed:', error)
                ElMessage.error('导出失败')
            }
        }

        const downloadTemplate = () => {
            const templateData = [
                { '用户名': 'student1', '姓名': '张三', '邮箱': 'student1@example.com', '角色': 'student', '密码': '123456' },
                { '用户名': 'admin1', '姓名': '李四', '邮箱': 'admin1@example.com', '角色': 'admin', '密码': '123456' }
            ]
            const ws = XLSX.utils.json_to_sheet(templateData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, '用户导入模板')
            XLSX.writeFile(wb, '用户导入模板.xlsx')
            ElMessage.success('模板下载成功')
        }

        const handleFileChange = (file: any) => {
            selectedFile.value = file.raw
        }

        const handleExceed = () => {
            ElMessage.warning('只能上传一个文件')
        }

        const confirmImport = () => {
            if (!selectedFile.value) {
                ElMessage.warning('请先选择文件')
                return
            }

            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const data = e.target?.result
                    const workbook = XLSX.read(data, { type: 'binary' })
                    const sheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[sheetName]
                    const jsonData = XLSX.utils.sheet_to_json(worksheet)

                    // 验证数据
                    const validatedData = jsonData.map((row: any) => {
                        const item: any = {
                            username: row['用户名'] || '',
                            name: row['姓名'] || '',
                            email: row['邮箱'] || '',
                            role: row['角色'] || 'student',
                            password: row['密码'] || '123456'
                        }

                        // 验证必填字段
                        if (!item.username) {
                            item._valid = false
                            item._error = '缺少用户名'
                        } else if (!item.name) {
                            item._valid = false
                            item._error = '缺少姓名'
                        } else if (!item.email) {
                            item._valid = false
                            item._error = '缺少邮箱'
                        } else if (!item.email.includes('@')) {
                            item._valid = false
                            item._error = '邮箱格式错误'
                        } else if (!['student', 'admin'].includes(item.role)) {
                            item._valid = false
                            item._error = '角色无效(仅支持student/admin)'
                        } else {
                            item._valid = true
                        }

                        return item
                    })

                    previewData.value = validatedData
                    importDialogVisible.value = false
                    previewDialogVisible.value = true
                } catch (error) {
                    console.error('Parse file failed:', error)
                    ElMessage.error('文件解析失败，请检查文件格式')
                }
            }
            reader.readAsBinaryString(selectedFile.value)
        }

        const executeImport = async () => {
            const validData = previewData.value.filter(item => item._valid)
            if (validData.length === 0) {
                ElMessage.warning('没有有效的数据可导入')
                return
            }

            importing.value = true
            try {
                let successCount = 0
                let failCount = 0

                for (const item of validData) {
                    try {
                        await usersApi.addUser({
                            username: item.username,
                            name: item.name,
                            email: item.email,
                            role: item.role,
                            password: item.password,
                            state: 0,
                            avatar: 'avatar.jpg',
                            createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                            updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
                        })
                        successCount++
                    } catch (error) {
                        failCount++
                        console.error(`Import user ${item.username} failed:`, error)
                    }
                }

                ElMessage.success(`导入完成：成功 ${successCount} 条，失败 ${failCount} 条`)
                previewDialogVisible.value = false
                selectedFile.value = null
                fetchUsers()
            } catch (error) {
                console.error('Import failed:', error)
                ElMessage.error('导入失败')
            } finally {
                importing.value = false
            }
        }

        onMounted(fetchUsers)

        return {
            loading,
            submitLoading,
            users,
            filteredUsers,
            currentPage,
            pageSize,
            paginatedUsers,
            dialogVisible,
            isEditMode,
            formUser,
            searchVal,
            roleFilter,
            selectedIds,
            importDialogVisible,
            previewDialogVisible,
            importing,
            uploadRef,
            previewData,
            validPreviewCount,
            Plus, Search, Refresh, Delete, Download, Upload, UploadFilled, Lock, Unlock,
            handleSearch,
            resetSearch,
            openAddDialog,
            openEditDialog,
            submitUser,
            deleteUser,
            batchDelete,
            toggleUserState,
            batchToggleState,
            exportUsers,
            downloadTemplate,
            handleFileChange,
            handleExceed,
            confirmImport,
            executeImport,
            handlePageChange,
            handleSizeChange,
            handleSelectionChange,
            getRoleTag,
            formatTime
        }
    }
})
</script>

<style scoped>
.user-page {
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

.header-actions {
    display: flex;
    gap: 10px;
}

.filter-container {
    margin-bottom: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
}

.filter-item {
    width: 200px;
}

.search-input {
    width: 250px;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}
</style>
