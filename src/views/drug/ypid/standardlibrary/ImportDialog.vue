<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
      <el-form-item label="导入方式">
        <el-radio-group v-model="importMode" @change="handleImportModeChange">
          <el-radio value="new">创建新版本</el-radio>
          <el-radio value="existing" :disabled="!hasExistingVersions">导入到现有版本</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 新版本创建 -->
      <template v-if="importMode === 'new'">
        <el-form-item label="版本编码" prop="versionCode">
          <el-input
            v-model="formData.versionCode"
            placeholder="如：v2024.1"
            :disabled="importing"
          />
        </el-form-item>
        <el-form-item label="版本名称" prop="versionName">
          <el-input
            v-model="formData.versionName"
            placeholder="请输入版本名称"
            :disabled="importing"
          />
        </el-form-item>
        <el-form-item label="版本描述">
          <el-input
            v-model="formData.versionDescription"
            type="textarea"
            rows="3"
            placeholder="请输入版本描述"
            :disabled="importing"
          />
        </el-form-item>
        <el-form-item label="导入类型" prop="importType">
          <el-radio-group v-model="formData.importType" :disabled="importing">
            <el-radio :value="1">全量导入</el-radio>
            <el-radio :value="2">增量导入</el-radio>
          </el-radio-group>
        </el-form-item>
      </template>

      <!-- 现有版本选择 -->
      <template v-else>
        <el-form-item label="选择版本" prop="selectedVersionId">
          <el-select
            v-model="formData.selectedVersionId"
            placeholder="请选择版本"
            :disabled="importing"
            class="w-full"
          >
            <el-option
              v-for="version in availableVersions"
              :key="version.id"
              :label="`${version.versionCode} - ${version.versionName}`"
              :value="version.id"
            />
          </el-select>
        </el-form-item>
      </template>

      <el-form-item label="选择文件" prop="file">
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="true"
          :limit="1"
          accept=".xlsx,.xls"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :disabled="importing"
        >
          <el-button :disabled="importing">
            <Icon icon="ep:upload" class="mr-5px" />
            选择Excel文件
          </el-button>
          <template #tip>
            <div class="el-upload__tip"> 只能上传xlsx/xls文件，且不超过200MB </div>
          </template>
        </el-upload>
      </el-form-item>

      <!-- 导入进度 -->
      <el-form-item v-if="importing">
        <div class="import-progress">
          <el-progress :percentage="importProgress" :status="importStatus" :stroke-width="8" />
          <div class="progress-text mt-2">{{ progressText }}</div>
        </div>
      </el-form-item>

      <!-- 导入结果 -->
      <el-form-item v-if="importResult">
        <el-alert
          :title="importResult.success ? '导入成功' : '导入失败'"
          :type="importResult.success ? 'success' : 'error'"
          :description="importResult.message"
          show-icon
          :closable="false"
        />
        <div v-if="importResult.success && importResult.data" class="import-statistics mt-3">
          <el-descriptions title="导入统计" :column="2" size="small">
            <el-descriptions-item label="总记录数">
              {{ importResult.data.totalRecords }}
            </el-descriptions-item>
            <el-descriptions-item label="新增记录">
              {{ importResult.data.newRecords }}
            </el-descriptions-item>
            <el-descriptions-item label="更新记录">
              {{ importResult.data.updatedRecords }}
            </el-descriptions-item>
            <el-descriptions-item label="失败记录">
              {{ importResult.data.failedRecords || 0 }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false" :disabled="importing">取 消</el-button>
      <el-button type="primary" @click="handleImport" :loading="importing" :disabled="!canImport">
        {{ importing ? '导入中...' : '开始导入' }}
      </el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { YpidVersionApi, YpidVersionVO } from '@/api/drug/ypid/version'

defineOptions({ name: 'ImportDialog' })

const message = useMessage()

// 状态管理
const dialogVisible = ref(false)
const dialogTitle = ref('导入标准库数据')
const importing = ref(false)
const importProgress = ref(0)
const importStatus = ref<'success' | 'warning' | 'danger'>('warning')
const progressText = ref('')

// 导入模式
const importMode = ref<'new' | 'existing'>('new')
const hasExistingVersions = ref(false)
const availableVersions = ref<YpidVersionVO[]>([])

// 表单数据
const formData = ref({
  versionCode: '',
  versionName: '',
  versionDescription: '',
  importType: 1,
  selectedVersionId: undefined,
  file: null as File | null
})

// 导入结果
const importResult = ref<{
  success: boolean
  message: string
  data?: any
} | null>(null)

// 表单验证
const formRules = {
  versionCode: [
    { required: true, message: '请输入版本编码', trigger: 'blur' },
    { pattern: /^v\d{4}\.\d+$/, message: '版本编码格式错误，如：v2024.1', trigger: 'blur' }
  ],
  versionName: [{ required: true, message: '请输入版本名称', trigger: 'blur' }],
  importType: [{ required: true, message: '请选择导入类型', trigger: 'change' }],
  selectedVersionId: [{ required: true, message: '请选择版本', trigger: 'change' }],
  file: [{ required: true, message: '请选择Excel文件', trigger: 'change' }]
}

const formRef = ref()
const uploadRef = ref()

// 计算属性
const canImport = computed(() => {
  if (importing.value) return false
  if (!formData.value.file) return false

  if (importMode.value === 'new') {
    return formData.value.versionCode && formData.value.versionName && formData.value.importType
  } else {
    return formData.value.selectedVersionId
  }
})

// 方法
const emit = defineEmits(['success'])

/** 打开对话框 */
const open = async () => {
  dialogVisible.value = true
  resetForm()
  await loadAvailableVersions()
}

/** 打开对话框并指定版本 */
const openForVersion = async (versionId: number) => {
  dialogVisible.value = true
  resetForm()
  importMode.value = 'existing'
  formData.value.selectedVersionId = versionId
  await loadAvailableVersions()
}

/** 加载可用版本 */
const loadAvailableVersions = async () => {
  try {
    const data = await YpidVersionApi.getYpidVersionList()
    // 只显示导入成功的版本
    availableVersions.value = data.filter((v) => v.status === 2)
    hasExistingVersions.value = availableVersions.value.length > 0
  } catch (error) {
    console.error('加载版本列表失败:', error)
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    versionCode: '',
    versionName: '',
    versionDescription: '',
    importType: 1,
    selectedVersionId: undefined,
    file: null
  }
  importMode.value = 'new'
  importing.value = false
  importProgress.value = 0
  importResult.value = null
  progressText.value = ''

  nextTick(() => {
    formRef.value?.resetFields()
    uploadRef.value?.clearFiles()
  })
}

/** 导入模式变化 */
const handleImportModeChange = () => {
  importResult.value = null
  formRef.value?.clearValidate()
}

/** 文件选择 */
const handleFileChange = (file: any) => {
  formData.value.file = file.raw
  formRef.value?.validateField('file')
}

/** 文件移除 */
const handleFileRemove = () => {
  formData.value.file = null
}

/** 开始导入 */
const handleImport = async () => {
  try {
    // 表单验证
    await formRef.value?.validate()

    importing.value = true
    importProgress.value = 0
    importResult.value = null
    progressText.value = '准备导入...'

    // 创建FormData
    const formDataToSend = new FormData()
    formDataToSend.append('file', formData.value.file!)

    let result

    if (importMode.value === 'new') {
      // 创建新版本并导入
      const versionData = {
        versionCode: formData.value.versionCode,
        versionName: formData.value.versionName,
        versionDescription: formData.value.versionDescription,
        importType: formData.value.importType,
        status: 1
      }
      formDataToSend.append(
        'data',
        new Blob([JSON.stringify(versionData)], { type: 'application/json' })
      )

      progressText.value = '创建版本并导入数据...'
      importProgress.value = 30

      result = await YpidVersionApi.createVersionAndImport(formDataToSend)
    } else {
      // 导入到现有版本
      progressText.value = '导入数据到指定版本...'
      importProgress.value = 30

      result = await YpidVersionApi.importDataToVersion(
        formData.value.selectedVersionId!,
        formData.value.file!
      )
    }

    // 模拟进度更新
    const progressInterval = setInterval(() => {
      if (importProgress.value < 90) {
        importProgress.value += 10
        progressText.value = '正在处理数据...'
      }
    }, 200)

    // 等待一段时间后完成
    setTimeout(() => {
      clearInterval(progressInterval)
      importProgress.value = 100
      importStatus.value = 'success'
      progressText.value = '导入完成'

      importResult.value = {
        success: true,
        message: '数据导入成功',
        data: result
      }

      importing.value = false

      // 通知父组件
      emit('success', result)

      message.success('数据导入成功')
    }, 1000)
  } catch (error: any) {
    importing.value = false
    importStatus.value = 'danger'
    progressText.value = '导入失败'

    importResult.value = {
      success: false,
      message: error.message || '导入过程中发生错误'
    }

    message.error('导入失败：' + (error.message || '未知错误'))
  }
}

defineExpose({ open, openForVersion })
</script>

<style scoped>
.import-progress {
  width: 100%;
}

.progress-text {
  text-align: center;
  color: #606266;
  font-size: 14px;
}

.import-statistics {
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style>
