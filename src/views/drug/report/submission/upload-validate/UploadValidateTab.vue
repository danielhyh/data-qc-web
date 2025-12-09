<!--
  上传与校验Tab组件
  功能：文件上传、表头校验、文件列表展示、上传进度跟踪
-->
<template>
  <div class="upload-validate-tab">
    <h3 class="step-title">上传与校验</h3>

    <!-- 总览卡片（整合进度信息） -->
    <StepSummaryCard
      :key="`step1-${stepSummaryKey}`"
      :step-type="1"
      :task-id="taskId"
      :is-processing="isUploading"
      :current-phase="currentBatchPhase"
      :uploaded-count="uploadedFileCount"
      :total-count="totalFileCount"
      :overall-progress="overallProgress"
      @refresh="$emit('refresh-summary')"
      @close="$emit('summary-close')"
    />

    <div class="upload-section">
      <!-- 批量上传区域 -->
      <div class="batch-upload">
        <!-- 拖拽上传区域（上传中时置灰） -->
        <el-upload
          ref="uploadRef"
          class="upload-dragger"
          :class="{ 'upload-disabled': isUploading }"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          accept=".zip,.rar,.xlsx"
          :disabled="isUploading || uploadingFiles.length > 0"
          :show-file-list="false"
        >
          <el-icon class="el-icon--upload">
            <UploadFilled />
          </el-icon>
          <div class="el-upload__text">
            拖拽ZIP，RAR压缩包或所有Excel文件到此处，或<em>点击上传</em>
          </div>
        </el-upload>

        <!-- 上传结果总览（处理完成后显示） -->
        <transition name="fade-slide">
          <div v-if="uploadResult && !isUploading" class="upload-progress-section" style="position: relative; z-index: 0;">
            <el-alert
              :type="uploadResult.failedCount > 0 ? 'warning' : 'success'"
              :closable="true"
              @close="closeResultSummary"
            >
              <template #title>
                <div class="result-title">
                  <el-icon><SuccessFilled v-if="uploadResult.failedCount === 0" /><WarningFilled v-else /></el-icon>
                  <span>上传结果总览</span>
                </div>
              </template>

              <div class="result-content">
                <!-- 统计数据 -->
                <div class="result-stats">
                  <div class="stat-item">
                    <span class="stat-label">共处理</span>
                    <span class="stat-value total">{{ uploadResult.totalFiles }}</span>
                    <span class="stat-label">个文件</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-item success">
                    <el-icon><CircleCheckFilled /></el-icon>
                    <span class="stat-label">成功:</span>
                    <span class="stat-value">{{ uploadResult.successCount }}个</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-item failed" v-if="uploadResult.failedCount > 0">
                    <el-icon><CircleCloseFilled /></el-icon>
                    <span class="stat-label">失败:</span>
                    <span class="stat-value">{{ uploadResult.failedCount }}个</span>
                  </div>
                </div>

                <!-- 基础错误列表 -->
                <div v-if="uploadResult.basicErrors && uploadResult.basicErrors.length > 0" class="basic-errors">
                  <div class="error-title">
                    <el-icon><Warning /></el-icon>
                    <span>基础错误提示</span>
                  </div>
                  <ul class="error-list">
                    <li v-for="(error, index) in uploadResult.basicErrors" :key="index" class="error-item">
                      <el-icon :class="['error-icon', getErrorIconClass(error.errorType)]">
                        <component :is="getBasicErrorIcon(error.errorType)" />
                      </el-icon>
                      <span class="error-message">{{ error.message }}</span>
                    </li>
                  </ul>
                </div>

                <!-- 操作按钮 -->
                <div class="result-actions">
                  <el-button
                    size="small"
                    @click="$emit('download-error-summary')"
                    v-if="uploadResult.failedCount > 0"
                  >
                    <el-icon><Download /></el-icon>
                    下载错误汇总
                  </el-button>
                </div>
              </div>
            </el-alert>
          </div>
        </transition>
      </div>

      <!-- 文件列表（带上传统计和刷新按钮） -->
      <div class="table-header">
        <span class="table-title">文件列表</span>

        <!-- 上传统计（始终显示） -->
        <div class="header-upload-stats">
          <span class="stats-label">上传进度：</span>
          <el-progress
            :percentage="fileUploadPercentage"
            :color="getProgressColor(fileUploadPercentage)"
            :stroke-width="6"
            class="stats-progress"
          />
          <span class="stats-count" :class="{ 'uploading': isUploading }">
            {{ uploadedFileCount }}/{{ totalFileCount }}
          </span>
        </div>

        <el-button
          type="primary"
          size="small"
          :icon="RefreshRight"
          :loading="refreshingFileList"
          @click="$emit('refresh-file-list')"
          circle
        />
      </div>
      
      <el-table :data="fileList" :show-overflow-tooltip="true">
        <el-table-column label="序号" width="80" type="index" align="center" />
        <el-table-column prop="standardFileName" label="标准文件名称" min-width="180" align="center">
          <template #default="scope">
            <span class="font-bold">{{ scope.row.standardFileName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="originalFileName" label="实际文件名称" min-width="200" align="center">
          <template #default="scope">
            <span class="font-bold">{{ scope.row.originalFileName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="fileType" label="文件类型" width="150" align="center">
          <template #default="{ row }">
            <dict-tag :type="DICT_TYPE.IMPORT_TABLE_TYPE" :value="row.fileType" />
          </template>
        </el-table-column>
        <el-table-column prop="uploadStatus" label="状态" width="120" align="center">
          <template #default="{ row }">
            <dict-tag :type="DICT_TYPE.UPLOAD_STATUS" :value="row.uploadStatus" />
          </template>
        </el-table-column>
        <el-table-column label="上传进度" width="200" align="center">
          <template #default="{ row }">
            <div class="progress-wrapper">
              <!-- 正在上传：显示实时进度 -->
              <template v-if="uploadingFiles.includes(row.fileType) && uploadProgress[row.fileType]">
                <el-progress
                  :percentage="uploadProgress[row.fileType]?.progress || 0"
                  :status="getProgressStatus(uploadProgress[row.fileType]?.status)"
                />
                <div class="progress-message">
                  {{ uploadProgress[row.fileType]?.currentStep || uploadProgress[row.fileType]?.phase || '处理中...' }}
                </div>
              </template>
              <!-- 未上传或已完成：显示固定状态 -->
              <template v-else>
                <el-progress
                  :percentage="row.uploadStatus === 2 ? 100 : 0"
                  :status="row.uploadStatus === 2 ? 'success' : undefined"
                />
                <div class="progress-message">
                  {{ row.uploadStatus === 2 ? '已完成' : '等待上传' }}
                </div>
              </template>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="fileSize" label="文件大小" width="120" align="center">
          <template #default="{ row }">
            <span class="record-count">{{ formatFileSize(row.fileSize) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="fileFormat" label="文件格式" width="120" align="center">
          <template #default="{ row }">
            <span class="record-count">{{ row.fileFormat || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="recordCount" label="数据条数" width="120" align="center">
          <template #default="{ row }">
            <span class="record-count">{{ row.recordCount || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="errorCount" label="错误数" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.errorCount > 0" type="danger" size="small">
              {{ row.errorCount }}
            </el-tag>
            <span v-else class="text-success">0</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="250" align="center">
          <template #default="{ row }">
            <!-- 查看数据详情按钮 - 已上传状态 -->
            <el-button
              v-if="row.uploadStatus === 2 && row.errorCount === 0"
              type="primary"
              size="small"
              @click="$emit('view-file-data', row)"
            >
              <el-icon class="mr-5px"><Document /></el-icon>
              查看数据
            </el-button>

            <!-- 查看错误详情按钮 - 上传失败(3)或有错误时 -->
            <el-button
              v-if="row.uploadStatus === 3 || (row.uploadStatus === 2 && row.errorCount > 0)"
              type="danger"
              size="small"
              @click="$emit('view-error-detail', row)"
            >
              <el-icon class="mr-5px"><WarningFilled /></el-icon>
              {{ row.uploadStatus === 3 ? '查看失败原因' : '查看详情' }}
            </el-button>

            <!-- 上传/重新上传按钮 -->
            <el-upload
              v-if="[0, 1, 2, 3].includes(row.uploadStatus)"
              action="#"
              :auto-upload="false"
              :on-change="(file) => handleSingleFileUpload(file, row)"
              accept=".xlsx"
              :disabled="uploadingFiles.includes(row.fileType)"
              :show-file-list="false"
              class="inline-upload"
            >
              <el-button
                :type="row.uploadStatus === 0 ? 'primary' : 'warning'"
                size="small"
                :loading="uploadingFiles.includes(row.fileType)"
              >
                <el-icon class="mr-5px" v-if="!uploadingFiles.includes(row.fileType)"><Upload /></el-icon>
                {{ uploadingFiles.includes(row.fileType) ? '上传中...' : (row.uploadStatus === 0 ? '上传' : '修复重传') }}
              </el-button>
            </el-upload>
          </template>
        </el-table-column>
      </el-table>

      <div class="upload-actions">
        <el-button @click="$emit('back-to-prepare')">
          <el-icon class="mr-5px"><ArrowLeft /></el-icon>
          返回准备
        </el-button>
        <el-tooltip
          :content="!allFilesUploaded ? '请先完成所有文件的上传与基础校验' : '开始前置质控'"
          placement="top"
          :disabled="allFilesUploaded"
        >
          <span>
            <el-button
              type="primary"
              @click="$emit('start-pre-qc')"
              :disabled="!allFilesUploaded"
            >
              <el-icon class="mr-5px"><CircleCheck /></el-icon>
              开始前置质控
            </el-button>
          </span>
        </el-tooltip>
      </div>
    </div>

    <!-- 表头校验结果对话框 -->
    <HeaderValidationDialog
      v-model="headerValidationDialog.visible"
      :file-name="headerValidationDialog.fileName"
      :upload-file-type="headerValidationDialog.uploadFileType"
      :result="headerValidationDialog.result"
      @download-template="downloadTemplate"
      @continue-upload="handleContinueUpload"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import request from '@/config/axios'
import { useMessage } from '@/hooks/web/useMessage'
import {
  Download,
  Upload,
  UploadFilled,
  CircleCheck,
  Warning,
  Document,
  ArrowLeft,
  RefreshRight,
  SuccessFilled,
  WarningFilled,
  CircleCheckFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import DictTag from '@/components/DictTag/src/DictTag.vue'
import StepSummaryCard from '../components/StepSummaryCard.vue'
import HeaderValidationDialog from './HeaderValidationDialog.vue'
import { ReportDataApi } from '@/api/drug/reportdata'
import { ImportTemplateApi } from '@/api/drug/task/template'
import { DICT_TYPE } from '@/utils/dict'
import { getProgressColor } from '@/utils/progressColor'
import download from '@/utils/download'

// Props定义
interface Props {
  taskId: number
  fileList: any[]
  stepSummaryKey: number
  refreshingFileList: boolean
}

const props = defineProps<Props>()

// Emits定义
const emit = defineEmits<{
  (e: 'refresh-summary'): void
  (e: 'summary-close'): void
  (e: 'refresh-file-list'): void
  (e: 'download-error-summary'): void
  (e: 'view-file-data', row: any): void
  (e: 'view-error-detail', row: any): void
  (e: 'back-to-prepare'): void
  (e: 'start-pre-qc'): void
  (e: 'download-template'): void
  (e: 'file-uploaded'): void  // 文件上传完成后通知父组件刷新
}>()

const message = useMessage()

// ==================== 上传状态管理 ====================
const isUploading = ref(false)
const uploadingFiles = ref<string[]>([])
const uploadProgress = ref<Record<string, any>>({})
const uploadResult = ref<any>(null)
const overallProgressData = ref<any>(null)
const currentBatchPhase = ref('正在处理文件...')

// 表头校验对话框状态
const headerValidationDialog = ref({
  visible: false,
  fileName: '',
  uploadFileType: '',
  result: null as any
})

// ==================== 计算属性 ====================
const totalFileCount = computed(() => props.fileList.length)

const uploadedFileCount = computed(() => {
  return props.fileList.filter(file => file.uploadStatus === 2).length
})

const allFilesUploaded = computed(() => {
  return props.fileList.length > 0 && props.fileList.every((file) => file.uploadStatus === 2)
})

const fileUploadPercentage = computed(() => {
  if (totalFileCount.value === 0) return 0
  return Math.round((uploadedFileCount.value / totalFileCount.value) * 100)
})

const overallProgress = computed(() => {
  if (overallProgressData.value && overallProgressData.value.overallProgress !== undefined) {
    return overallProgressData.value.overallProgress
  }
  if (uploadingFiles.value.length === 0) {
    const total = totalFileCount.value
    return total > 0 ? Math.round((uploadedFileCount.value / total) * 100) : 0
  }
  let totalProgress = 0
  let count = 0
  props.fileList.forEach(file => {
    if (uploadProgress.value[file.fileType]) {
      totalProgress += uploadProgress.value[file.fileType].progress || 0
      count++
    } else if (file.uploadStatus === 2) {
      totalProgress += 100
      count++
    }
  })
  return count > 0 ? Math.round(totalProgress / count) : 0
})

// ==================== 方法 ====================

/**
 * 获取进度条状态
 */
const getProgressStatus = (status: string) => {
  if (status === 'success') return 'success'
  if (status === 'error') return 'exception'
  return undefined
}

/**
 * 获取基础错误图标
 */
const getBasicErrorIcon = (errorType: string) => {
  switch (errorType) {
    case 'error':
      return CircleCloseFilled
    case 'warning':
      return WarningFilled
    default:
      return Warning
  }
}

/**
 * 获取错误图标样式类
 */
const getErrorIconClass = (errorType: string) => {
  return errorType === 'error' ? 'error' : 'warning'
}

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

/**
 * 关闭上传结果总览
 */
const closeResultSummary = () => {
  uploadResult.value = null
}

/**
 * 下载标准模板压缩包
 */
const downloadTemplate = async () => {
  try {
    message.info('正在生成标准模板压缩包...')
    const data = await ImportTemplateApi.downloadStandardTemplatesZip()
    download.zip(data, '标准导入模板.zip')
    message.success('标准模板压缩包下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    message.error('下载失败，请重试')
  }
}

// 🔥 保存待上传的文件信息（用于校验通过后继续上传）
const pendingUploadFile = ref<File | null>(null)
const pendingUploadRow = ref<any>(null)  // 单文件上传时保存行信息

/**
 * 拖拽上传文件（新增表头校验）
 */
const handleFileChange = async (uploadFile: any) => {
  const file = uploadFile.raw
  if (!file) return

  try {
    const fileName = file.name
    
    // 🔥 Step 1: 先校验表头字段（ZIP和Excel都需要）
    message.info('正在校验文件字段...')
    
    try {
      const validationResult = await ReportDataApi.validateHeaders(file, undefined)
      
      // 🔥 无论通过与否，都显示弹框让用户确认
      headerValidationDialog.value.visible = true
      headerValidationDialog.value.fileName = fileName
      headerValidationDialog.value.uploadFileType = validationResult.uploadFileType
      headerValidationDialog.value.result = validationResult
      
      // 保存待上传的文件（校验通过时用户点击"继续导入"后使用）
      if (validationResult.allPassed) {
        pendingUploadFile.value = file
        pendingUploadRow.value = null  // 批量上传，无行信息
      } else {
        pendingUploadFile.value = null
        pendingUploadRow.value = null
      }
      
    } catch (error) {
      console.error('字段校验失败:', error)
      message.error('字段校验失败，请重试')
    }
    
  } catch (error) {
    console.error('文件处理失败:', error)
    message.error('文件处理失败，请重试')
  }
}

/**
 * 🔥 用户确认继续上传（校验通过后）
 */
const handleContinueUpload = async () => {
  const file = pendingUploadFile.value
  const row = pendingUploadRow.value
  
  if (!file) {
    message.error('没有待上传的文件')
    return
  }
  
  // 根据是否有row判断是单文件上传还是批量上传
  if (row) {
    await doSingleFileUpload(file, row)
  } else {
    await doBatchFileUpload(file)
  }
}

/**
 * 🔥 真正执行批量文件上传（用户确认后调用）
 */
const doBatchFileUpload = async (file: File) => {
  try {
    isUploading.value = true
    const isZip = file.name.toLowerCase().endsWith('.zip')
    
    message.success('开始上传文件...')
    
    // 上传流程
    uploadProgress.value = {}
    overallProgressData.value = { overallProgress: 0 }

    const simulateProgress = (start: number, end: number, duration: number) => {
      return new Promise(resolve => {
        const step = (end - start) / (duration / 100)
        let current = start
        const interval = setInterval(() => {
          current = Math.min(current + step, end)
          overallProgressData.value = { overallProgress: Math.round(current) }
          if (current >= end) {
            clearInterval(interval)
            resolve(true)
          }
        }, 100)
      })
    }

    message.info('正在上传文件...')
    await simulateProgress(0, 30, 1000)

    message.info('正在解析文件...')
    await simulateProgress(30, 60, 1500)

    message.info('正在验证数据...')
    await simulateProgress(60, 90, 1000)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('taskId', String(props.taskId))
    formData.append('originalFileName', file.name)

    await request.post({
      url: '/drug/report-data/validate-and-parse',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 600000
    })

    await simulateProgress(90, 100, 500)

    message.success(isZip ? '压缩包上传完成' : '文件上传完成')

    // 通知父组件刷新文件列表
    emit('file-uploaded')

    overallProgressData.value = { overallProgress: 100 }
    setTimeout(() => {
      isUploading.value = false
      uploadProgress.value = {}
      overallProgressData.value = null
      pendingUploadFile.value = null  // 清理待上传文件
    }, 500)
  } catch (error) {
    console.error('文件上传失败:', error)
    message.error('文件上传失败，请重试')
    isUploading.value = false
    uploadProgress.value = {}
    overallProgressData.value = null
    pendingUploadFile.value = null  // 清理待上传文件
  }
}

/**
 * 操作列单文件上传（新增表头校验）
 */
const handleSingleFileUpload = async (uploadFile: any, row: any) => {
  const file = uploadFile.raw
  if (!file) return

  const fileType = row.fileType
  const displayName = row.standardFileName || row.fileName

  try {
    // 🔥 先校验表头
    message.info(`正在校验${displayName}字段...`)
    
    try {
      const validationResult = await ReportDataApi.validateHeaders(file, fileType)
      
      // 🔥 无论通过与否，都显示弹框让用户确认
      headerValidationDialog.value.visible = true
      headerValidationDialog.value.fileName = displayName
      headerValidationDialog.value.uploadFileType = validationResult.uploadFileType
      headerValidationDialog.value.result = validationResult
      
      // 保存待上传的文件和行信息
      if (validationResult.allPassed) {
        pendingUploadFile.value = file
        pendingUploadRow.value = row  // 单文件上传，保存行信息
      } else {
        pendingUploadFile.value = null
        pendingUploadRow.value = null
      }
      
    } catch (error) {
      console.error('字段校验失败:', error)
      message.error(`${displayName}字段校验失败`)
    }
    
  } catch (error) {
    console.error('文件处理失败:', error)
    message.error('文件处理失败，请重试')
  }
}

/**
 * 🔥 真正执行单文件上传（用户确认后调用）
 */
const doSingleFileUpload = async (file: File, row: any) => {
  const fileType = row.fileType
  const displayName = row.standardFileName || row.fileName

  try {
    // 继续上传
    if (!uploadingFiles.value.includes(fileType)) {
      uploadingFiles.value.push(fileType)
    }

    uploadProgress.value[fileType] = { progress: 0, status: 'uploading' }

    const simulateSingleProgress = (start: number, end: number, duration: number) => {
      return new Promise(resolve => {
        const step = (end - start) / (duration / 100)
        let current = start
        const interval = setInterval(() => {
          current = Math.min(current + step, end)
          uploadProgress.value[fileType] = {
            progress: Math.round(current),
            status: current < end ? 'uploading' : 'success'
          }
          if (current >= end) {
            clearInterval(interval)
            resolve(true)
          }
        }, 100)
      })
    }

    message.info(`正在上传${displayName}...`)
    await simulateSingleProgress(0, 30, 800)

    message.info(`正在解析${displayName}...`)
    await simulateSingleProgress(30, 70, 1000)

    message.info(`正在验证${displayName}...`)
    await simulateSingleProgress(70, 90, 800)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('taskId', String(props.taskId))
    formData.append('fileType', fileType)  // 单文件上传传递明确的文件类型
    formData.append('originalFileName', file.name)

    await request.post({
      url: '/drug/report-data/validate-and-parse',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 600000
    })

    await simulateSingleProgress(90, 100, 300)
    message.success(`${displayName}上传完成`)

    // 通知父组件刷新文件列表
    emit('file-uploaded')

    const index = uploadingFiles.value.indexOf(fileType)
    if (index > -1) {
      uploadingFiles.value.splice(index, 1)
    }

    setTimeout(() => {
      delete uploadProgress.value[fileType]
      pendingUploadFile.value = null  // 清理待上传文件
      pendingUploadRow.value = null
    }, 500)
  } catch (error) {
    console.error('文件上传失败:', error)
    message.error(`${displayName}上传失败，请重试`)

    const index = uploadingFiles.value.indexOf(fileType)
    if (index > -1) {
      uploadingFiles.value.splice(index, 1)
    }

    uploadProgress.value[fileType] = { progress: 0, status: 'error' }
    setTimeout(() => {
      delete uploadProgress.value[fileType]
      pendingUploadFile.value = null  // 清理待上传文件
      pendingUploadRow.value = null
    }, 2000)
  }
}
</script>

<style scoped lang="scss">
.upload-validate-tab {
  .step-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #303133;
  }

  .upload-section {
    margin-top: 20px;
  }

  .batch-upload {
    margin-bottom: 24px;
  }

  .upload-dragger {
    width: 100%;
    
    :deep(.el-upload-dragger) {
      padding: 40px 20px;
      border: 2px dashed #dcdfe6;
      border-radius: 8px;
      transition: all 0.3s;
      
      &:hover {
        border-color: #409eff;
      }
    }
    
    &.upload-disabled {
      :deep(.el-upload-dragger) {
        background-color: #f5f7fa;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }
  }

  .upload-progress-section {
    margin-top: 16px;
  }

  .result-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }

  .result-content {
    margin-top: 12px;
  }

  .result-stats {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 0;
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
      
      &.success {
        color: #67c23a;
      }
      
      &.failed {
        color: #f56c6c;
      }
    }
    
    .stat-value {
      font-weight: 600;
      font-size: 16px;
      
      &.total {
        color: #409eff;
      }
    }
    
    .stat-divider {
      width: 1px;
      height: 20px;
      background: #dcdfe6;
    }
  }

  .basic-errors {
    margin-top: 12px;
    padding: 12px;
    background: #fef0f0;
    border-radius: 4px;
    
    .error-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: #f56c6c;
      margin-bottom: 8px;
    }
    
    .error-list {
      margin: 0;
      padding-left: 20px;
    }
    
    .error-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 4px 0;
      
      .error-icon {
        &.error { color: #f56c6c; }
        &.warning { color: #e6a23c; }
      }
    }
  }

  .result-actions {
    margin-top: 12px;
  }

  .table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #f5f7fa;
    border-radius: 4px;
    
    .table-title {
      font-weight: 600;
      font-size: 16px;
    }
    
    .header-upload-stats {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      max-width: 400px;
      margin: 0 20px;
      
      .stats-label {
        white-space: nowrap;
        color: #606266;
      }
      
      .stats-progress {
        flex: 1;
      }
      
      .stats-count {
        font-weight: 600;
        color: #409eff;
        
        &.uploading {
          animation: pulse 1.5s infinite;
        }
      }
    }
  }

  .progress-wrapper {
    .progress-message {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
    }
  }

  .record-count {
    color: #606266;
  }

  .text-success {
    color: #67c23a;
  }

  .inline-upload {
    display: inline-block;
    margin-left: 8px;
  }

  .upload-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #ebeef5;
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
