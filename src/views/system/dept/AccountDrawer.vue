<!-- 机构账号管理抽屉 -->
<template>
  <el-drawer
    v-model="visible"
    title="机构账号管理"
    size="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-loading="loading" class="account-drawer">
      <!-- 机构信息 -->
      <div class="dept-info-card">
        <div class="info-header">
          <Icon icon="ep:office-building" class="header-icon" />
          <span class="dept-name">{{ deptInfo.name }}</span>
        </div>
        <div class="info-row">
          <span class="label">机构代码：</span>
          <span class="value">{{ deptInfo.orgCode || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">联络员：</span>
          <span class="value">{{ deptInfo.contactPerson || '-' }}</span>
        </div>
      </div>

      <!-- 账号信息 -->
      <div class="account-section">
        <div class="section-title">
          <Icon icon="ep:user" class="mr-5px" />
          账号信息
        </div>

        <!-- 已有账号 -->
        <div v-if="userInfo" class="account-card">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="用户账号">
              <span class="font-bold">{{ userInfo.username }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="账号状态">
              <el-tag :type="userInfo.status === 0 ? 'success' : 'danger'">
                {{ userInfo.status === 0 ? '正常' : '停用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="用户身份">
              {{ userInfo.nickname || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="手机号码">
              {{ userInfo.mobile || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="最后登录">
              {{ userInfo.loginDate ? formatDate(userInfo.loginDate) : '从未登录' }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDate(userInfo.createTime) }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 账号操作按钮 -->
          <div class="account-actions">
            <el-button type="primary" @click="handleEditUser" v-hasPermi="['system:user:update']">
              <Icon icon="ep:edit" class="mr-5px" />
              编辑账号
            </el-button>
            <el-button
              type="warning"
              plain
              @click="handleResetPassword"
              v-hasPermi="['system:user:update-password']"
            >
              <Icon icon="ep:key" class="mr-5px" />
              重置密码
            </el-button>
            <el-button
              :type="userInfo.status === 0 ? 'danger' : 'success'"
              plain
              @click="handleToggleUserStatus"
              v-hasPermi="['system:user:update']"
            >
              <Icon :icon="userInfo.status === 0 ? 'ep:video-pause' : 'ep:video-play'" class="mr-5px" />
              {{ userInfo.status === 0 ? '停用账号' : '启用账号' }}
            </el-button>
          </div>
        </div>

        <!-- 无账号 -->
        <div v-else class="no-account">
          <el-empty description="该机构暂无账号">
            <el-button type="primary" @click="handleCreateUser" v-hasPermi="['system:user:create']">
              <Icon icon="ep:plus" class="mr-5px" />
              创建账号
            </el-button>
          </el-empty>
        </div>
      </div>
    </div>
  </el-drawer>

  <!-- 创建/编辑用户弹窗 -->
  <Dialog
    v-model="userFormVisible"
    :title="userFormType === 'create' ? '创建机构账号' : '编辑机构账号'"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form
      ref="userFormRef"
      :model="userForm"
      :rules="userFormRules"
      label-width="100px"
    >
      <el-form-item label="用户账号" prop="username">
        <el-input
          v-model="userForm.username"
          placeholder="请输入用户账号"
          :disabled="userFormType === 'update'"
        />
      </el-form-item>
      <el-form-item v-if="userFormType === 'create'" label="用户密码" prop="password">
        <el-input
          v-model="userForm.password"
          type="password"
          placeholder="请输入用户密码"
          show-password
        />
      </el-form-item>
      <el-form-item label="用户身份" prop="nickname">
        <el-input v-model="userForm.nickname" placeholder="请输入用户身份" />
      </el-form-item>
      <el-form-item label="真实姓名" prop="realName">
        <el-input v-model="userForm.realName" placeholder="请输入真实姓名（将同步为机构联络员）" />
      </el-form-item>
      <el-form-item label="手机号码" prop="mobile">
        <el-input v-model="userForm.mobile" placeholder="请输入手机号码" maxlength="11" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="userForm.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="性别" prop="sex">
        <el-radio-group v-model="userForm.sex">
          <el-radio :label="1">男</el-radio>
          <el-radio :label="2">女</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="userForm.remark" type="textarea" placeholder="请输入备注" :rows="2" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="userFormVisible = false">取消</el-button>
      <el-button type="primary" @click="handleUserFormSubmit" :loading="submitLoading">
        确定
      </el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'
import * as UserApi from '@/api/system/user'
import type { FormInstance, FormRules } from 'element-plus'

defineOptions({ name: 'AccountDrawer' })

const emit = defineEmits<{
  success: []
}>()

const message = useMessage()

const visible = ref(false)
const loading = ref(false)
const deptInfo = ref<any>({})
const userInfo = ref<any>(null)

// 用户表单相关
const userFormVisible = ref(false)
const userFormType = ref<'create' | 'update'>('create')
const userFormRef = ref<FormInstance>()
const submitLoading = ref(false)
const userForm = reactive({
  id: undefined as number | undefined,
  username: '',
  password: '',
  nickname: '',
  realName: '',
  mobile: '',
  email: '',
  sex: undefined as number | undefined,
  remark: '',
  deptId: undefined as number | undefined
})

const userFormRules: FormRules = {
  username: [
    { required: true, message: '请输入用户账号', trigger: 'blur' },
    { min: 4, max: 30, message: '用户账号长度为4-30个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入用户密码', trigger: 'blur' },
    { min: 6, max: 16, message: '密码长度为6-16位', trigger: 'blur' }
  ],
  nickname: [{ required: true, message: '请输入用户身份', trigger: 'blur' }],
  mobile: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
}

/** 格式化日期 */
const formatDate = (date: string | Date | undefined) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/** 打开抽屉 */
const open = async (dept: any) => {
  visible.value = true
  deptInfo.value = dept
  await loadUserInfo(dept.id)
}

/** 加载用户信息 */
const loadUserInfo = async (deptId: number) => {
  loading.value = true
  try {
    // 通过机构ID查询用户
    userInfo.value = await UserApi.getUserByDeptId(deptId)
  } catch (error) {
    console.error('加载用户信息失败:', error)
    userInfo.value = null
  } finally {
    loading.value = false
  }
}

/** 创建用户 */
const handleCreateUser = () => {
  userFormType.value = 'create'
  resetUserForm()
  userForm.deptId = deptInfo.value.id
  // 默认使用机构联络员信息
  if (deptInfo.value.contactPerson) {
    userForm.nickname = deptInfo.value.contactPerson
    userForm.realName = deptInfo.value.contactPerson
  }
  if (deptInfo.value.contactPhone) {
    userForm.mobile = deptInfo.value.contactPhone
  }
  userFormVisible.value = true
}

/** 编辑用户 */
const handleEditUser = () => {
  if (!userInfo.value) return
  userFormType.value = 'update'
  resetUserForm()
  userForm.id = userInfo.value.id
  userForm.username = userInfo.value.username
  userForm.nickname = userInfo.value.nickname || ''
  userForm.realName = userInfo.value.realName || ''
  userForm.mobile = userInfo.value.mobile || ''
  userForm.email = userInfo.value.email || ''
  userForm.sex = userInfo.value.sex
  userForm.remark = userInfo.value.remark || ''
  userForm.deptId = deptInfo.value.id
  userFormVisible.value = true
}

/** 重置表单 */
const resetUserForm = () => {
  userForm.id = undefined
  userForm.username = ''
  userForm.password = ''
  userForm.nickname = ''
  userForm.realName = ''
  userForm.mobile = ''
  userForm.email = ''
  userForm.sex = undefined
  userForm.remark = ''
  userFormRef.value?.resetFields()
}

/** 提交用户表单 */
const handleUserFormSubmit = async () => {
  await userFormRef.value?.validate()
  submitLoading.value = true
  try {
    if (userFormType.value === 'create') {
      await UserApi.createUser({
        username: userForm.username,
        password: userForm.password,
        nickname: userForm.nickname,
        realName: userForm.realName,
        mobile: userForm.mobile,
        email: userForm.email,
        sex: userForm.sex,
        remark: userForm.remark,
        deptId: userForm.deptId,
        status: 0 // 默认启用
      } as any)
      message.success('账号创建成功')
      emit('success') // 通知父组件刷新列表
    } else {
      await UserApi.updateUser({
        id: userForm.id!,
        username: userForm.username, // 后端校验必填，虽然不可修改但需要传递
        nickname: userForm.nickname,
        realName: userForm.realName, // 真实姓名将同步更新机构联络员
        mobile: userForm.mobile, // 手机号将同步更新机构联络电话
        email: userForm.email,
        sex: userForm.sex,
        remark: userForm.remark,
        deptId: userForm.deptId
      } as any)
      message.success('账号更新成功')
      emit('success') // 通知父组件刷新列表
    }
    userFormVisible.value = false
    await loadUserInfo(deptInfo.value.id)
  } catch (error: any) {
    console.error('操作失败:', error)
    const errorMsg = error?.data?.msg || error?.message || '操作失败'
    message.error(errorMsg)
  } finally {
    submitLoading.value = false
  }
}

/** 重置密码 */
const handleResetPassword = async () => {
  if (!userInfo.value) return
  try {
    const result = await message.prompt(
      `请输入"${userInfo.value.username}"的新密码`,
      '重置密码'
    )
    const password = result.value
    if (!password) return
    await UserApi.resetUserPassword(userInfo.value.id, password)
    message.success(`密码已重置为: ${password}`)
  } catch {}
}

/** 切换用户状态 */
const handleToggleUserStatus = async () => {
  if (!userInfo.value) return
  const newStatus = userInfo.value.status === 0 ? 1 : 0
  const statusText = newStatus === 0 ? '启用' : '停用'
  try {
    await message.confirm(`确认要${statusText}"${userInfo.value.username}"吗？`)
    await UserApi.updateUserStatus(userInfo.value.id, newStatus)
    message.success(`${statusText}成功`)
    await loadUserInfo(deptInfo.value.id)
  } catch {}
}

/** 关闭抽屉 */
const handleClose = () => {
  deptInfo.value = {}
  userInfo.value = null
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.account-drawer {
  padding: 0 10px;
}

.dept-info-card {
  background: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;

  .info-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    .header-icon {
      font-size: 20px;
      color: var(--el-color-primary);
      margin-right: 8px;
    }

    .dept-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .info-row {
    display: flex;
    align-items: center;
    margin-top: 8px;
    font-size: 14px;

    .label {
      color: var(--el-text-color-secondary);
      width: 80px;
    }

    .value {
      color: var(--el-text-color-primary);
    }
  }
}

.account-section {
  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
  }
}

.account-card {
  .account-actions {
    margin-top: 20px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
}

.no-account {
  padding: 40px 0;
}
</style>
