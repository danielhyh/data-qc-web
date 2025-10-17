<!-- SSO测试页面 -->
<template>
  <div class="sso-test-page">
    <el-card>
      <template #header>
        <h3>SSO集成测试</h3>
      </template>

      <el-space direction="vertical" size="large" style="width: 100%">
        <!-- 配置检查 -->
        <el-card>
          <h4>🔧 配置检查</h4>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="SSO状态">
              <el-tag :type="ssoConfig.enabled ? 'success' : 'danger'">
                {{ ssoConfig.enabled ? '已启用' : '未启用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="服务器地址">
              {{ ssoConfig.baseUrl || '未配置' }}
            </el-descriptions-item>
            <el-descriptions-item label="客户端ID">
              {{ ssoConfig.clientId || '未配置' }}
            </el-descriptions-item>
            <el-descriptions-item label="回调地址">
              {{ ssoConfig.redirectUri || '未配置' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 功能测试 -->
        <el-card>
          <h4>🧪 功能测试</h4>
          <el-space wrap>
            <el-button type="primary" @click="testSsoLogin" :loading="testing">
              测试SSO登录URL
            </el-button>
            <el-button @click="clearToken">清除Token</el-button>
            <el-button @click="checkCurrentUser">检查当前用户</el-button>
            <el-button @click="testTokenTypes">测试Token类型</el-button>
          </el-space>
        </el-card>

        <!-- 测试结果 -->
        <el-card v-if="testResult">
          <h4>📋 测试结果</h4>
          <el-alert
            :type="testResult.success ? 'success' : 'error'"
            :title="testResult.title"
            :description="testResult.message"
            show-icon
          />
          <pre v-if="testResult.details" class="test-details">{{ testResult.details }}</pre>
        </el-card>
      </el-space>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAccessToken, removeToken, setAccessToken } from '@/utils/auth'
import { SsoAuth } from '@/utils/sso'
import * as SsoApi from '@/api/login/sso'

// 响应式数据
const ssoConfig = ref({
  enabled: false,
  baseUrl: '',
  clientId: '',
  redirectUri: ''
})

const testing = ref(false)
const testResult = ref<any>(null)

// 检查SSO配置
const checkSsoConfig = async () => {
  try {
    // 这里可以添加一个后端接口来获取SSO配置状态
    // 暂时使用硬编码展示
    ssoConfig.value = {
      enabled: true,
      baseUrl: 'http://172.29.75.191:8801',
      clientId: 'yaopin_client',
      redirectUri: 'http://localhost:48080/admin-api/system/auth/sso/callback'
    }
  } catch (error) {
    console.error('检查SSO配置失败:', error)
  }
}

// 测试SSO登录URL
const testSsoLogin = async () => {
  testing.value = true
  testResult.value = null

  try {
    const response = await SsoApi.getSsoLoginUrl()
    const loginUrl = response?.data || response

    if (loginUrl) {
      testResult.value = {
        success: true,
        title: '✅ SSO登录URL生成成功',
        message: '可以正常获取SSO登录地址',
        details: `登录URL: ${loginUrl}`
      }
    } else {
      throw new Error('未获取到登录URL')
    }
  } catch (error: any) {
    testResult.value = {
      success: false,
      title: '❌ SSO登录URL生成失败',
      message: error.message || '未知错误',
      details: JSON.stringify(error, null, 2)
    }
  } finally {
    testing.value = false
  }
}

// 清除Token
const clearToken = () => {
  removeToken()
  ElMessage.success('Token已清除')
}

// 检查当前用户
const checkCurrentUser = () => {
  const token = getAccessToken()
  if (token) {
    ElMessage.info(`当前Token: ${token.substring(0, 20)}...`)
  } else {
    ElMessage.warning('当前无Token')
  }
}

// 测试Token类型功能
const testTokenTypes = () => {
  try {
    // 测试设置简单的access token（SSO场景）
    const testToken = 'test-sso-token-' + Date.now()
    setAccessToken(testToken)

    // 验证设置是否成功
    const retrievedToken = getAccessToken()
    if (retrievedToken === testToken) {
      ElMessage.success('✅ Token类型测试通过：setAccessToken功能正常')
    } else {
      ElMessage.error('❌ Token类型测试失败：setAccessToken功能异常')
    }

    // 测试SSO工具类
    const needSso = SsoAuth.needSsoLogin()
    ElMessage.info(`SSO登录检查: ${needSso ? '需要SSO登录' : '无需SSO登录'}`)

  } catch (error: any) {
    ElMessage.error('Token类型测试失败: ' + error.message)
  }
}

onMounted(() => {
  checkSsoConfig()
})
</script>

<style scoped>
.sso-test-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-details {
  margin-top: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>