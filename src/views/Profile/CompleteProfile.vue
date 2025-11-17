<template>
  <div class="complete-profile-container">
    <div class="complete-profile-card">
      <!-- 顶部提示 -->
      <div class="alert-header">
        <el-icon class="alert-icon"><WarningFilled /></el-icon>
        <div class="alert-content">
          <h2 class="alert-title">完善账户信息</h2>
          <p class="alert-desc">为了确保账户安全和系统合规,请先完善您的个人信息并修改初始密码</p>
        </div>
      </div>

      <!-- 步骤指示器 -->
      <div class="steps-container">
        <el-steps :active="currentStep" align-center finish-status="success">
          <el-step title="完善基本信息" description="填写实名和联系方式" />
          <el-step title="修改密码" description="设置新密码" />
          <el-step title="完成" description="开始使用系统" />
        </el-steps>
      </div>

      <!-- 步骤内容 -->
      <div class="step-content">
        <!-- 步骤1: 完善基本信息 -->
        <div v-show="currentStep === 0" class="step-panel">
          <h3 class="panel-title">基本信息</h3>
          <el-form
            ref="profileFormRef"
            :model="profileForm"
            :rules="profileRules"
            label-width="120px"
            class="profile-form"
          >
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="profileForm.realName" placeholder="请输入真实姓名" />
            </el-form-item>
            <el-form-item label="手机号" prop="mobile">
              <el-input v-model="profileForm.mobile" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profileForm.email" placeholder="请输入邮箱(可选)" />
            </el-form-item>
            <el-form-item label="性别">
              <el-radio-group v-model="profileForm.sex">
                <el-radio :value="1">男</el-radio>
                <el-radio :value="2">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
          <div class="step-actions">
            <el-button type="primary" @click="handleNextStep" :loading="loading">
              下一步
            </el-button>
          </div>
        </div>

        <!-- 步骤2: 修改密码 -->
        <div v-show="currentStep === 1" class="step-panel">
          <h3 class="panel-title">修改密码</h3>
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="120px"
            class="password-form"
          >
            <el-form-item label="原密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                placeholder="请输入原密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="请输入新密码(6-20位)"
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
          <div class="step-actions">
            <el-button @click="handlePrevStep">上一步</el-button>
            <el-button type="primary" @click="handleComplete" :loading="loading">
              完成
            </el-button>
          </div>
        </div>

        <!-- 步骤3: 完成 -->
        <div v-show="currentStep === 2" class="step-panel success-panel">
          <el-result icon="success" title="账户信息完善成功" sub-title="您现在可以正常使用系统了">
            <template #extra>
              <el-button type="primary" @click="handleGoHome">
                进入系统
              </el-button>
            </template>
          </el-result>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import { getUserProfile, updateUserProfile, updateUserPassword } from '@/api/system/user/profile'
import { useUserStore } from '@/store/modules/user'

defineOptions({ name: 'CompleteProfile' })

const router = useRouter()
const userStore = useUserStore()

const currentStep = ref(0)
const loading = ref(false)

// 基本信息表单
const profileFormRef = ref<FormInstance>()
const profileForm = reactive({
  realName: '',
  mobile: '',
  email: '',
  sex: 1
})

// 密码表单
const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 基本信息校验规则
const profileRules = reactive<FormRules>({
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  mobile: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
})

// 密码校验规则
const equalToPassword = (_rule, value, callback) => {
  if (passwordForm.newPassword !== value) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = reactive<FormRules>({
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { required: true, validator: equalToPassword, trigger: 'blur' }
  ]
})

// 加载用户信息
const loadProfile = async () => {
  try {
    const profile = await getUserProfile()
    profileForm.realName = profile.realName || ''
    profileForm.mobile = profile.mobile || ''
    profileForm.email = profile.email || ''
    profileForm.sex = profile.sex || 1
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
}

// 下一步
const handleNextStep = async () => {
  if (!profileFormRef.value) return

  await profileFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 保存基本信息
        await updateUserProfile({
          realName: profileForm.realName,
          mobile: profileForm.mobile,
          email: profileForm.email,
          sex: profileForm.sex
        })
        ElMessage.success('基本信息保存成功')
        currentStep.value = 1
      } catch (error) {
        ElMessage.error('保存失败,请重试')
      } finally {
        loading.value = false
      }
    }
  })
}

// 上一步
const handlePrevStep = () => {
  currentStep.value = 0
}

// 完成
const handleComplete = async () => {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 修改密码
        await updateUserPassword(passwordForm.oldPassword, passwordForm.newPassword)
        ElMessage.success('密码修改成功')

        // 刷新用户信息
        await userStore.setUserInfoAction()

        currentStep.value = 2
      } catch (error) {
        ElMessage.error('密码修改失败,请检查原密码是否正确')
      } finally {
        loading.value = false
      }
    }
  })
}

// 进入系统
const handleGoHome = () => {
  router.replace('/')
}

// 初始化
onMounted(() => {
  loadProfile()
})
</script>

<style scoped lang="scss">
.complete-profile-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.complete-profile-card {
  width: 100%;
  max-width: 800px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;

  .alert-icon {
    font-size: 48px;
    flex-shrink: 0;
  }

  .alert-content {
    flex: 1;

    .alert-title {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
    }

    .alert-desc {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
      line-height: 1.6;
    }
  }
}

.steps-container {
  padding: 32px 32px 16px;
  background: #f8f9fa;
}

.step-content {
  padding: 32px;
  min-height: 400px;
}

.step-panel {
  .panel-title {
    margin: 0 0 24px 0;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    border-left: 4px solid #667eea;
    padding-left: 12px;
  }
}

.profile-form,
.password-form {
  max-width: 500px;
  margin: 0 auto;
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}

.success-panel {
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .complete-profile-card {
    margin: 0;
    border-radius: 0;
  }

  .alert-header {
    flex-direction: column;
    text-align: center;

    .alert-icon {
      font-size: 36px;
    }

    .alert-title {
      font-size: 20px;
    }
  }

  .step-content {
    padding: 20px;
  }
}
</style>
