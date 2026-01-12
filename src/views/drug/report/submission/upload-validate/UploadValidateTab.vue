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
        <!-- 拖拽上传区域（上传中或不允许操作时置灰） -->
        <el-tooltip 
          :content="operationDisabledReason" 
          placement="top" 
          :disabled="canUploadAndQC"
        >
          <el-upload
            ref="uploadRef"
            class="upload-dragger"
            :class="{ 'upload-disabled': isUploading || !canUploadAndQC }"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            accept=".zip,.xlsx"
            multiple
            :disabled="isUploading || uploadingFiles.length > 0 || !canUploadAndQC"
            :show-file-list="false"
          >
          <el-icon class="el-icon--upload">
            <UploadFilled />
          </el-icon>
          <div class="el-upload__text">
            拖拽ZIP压缩包或多个Excel文件到此处，或<em>点击上传</em>
          </div>
          </el-upload>
        </el-tooltip>

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
              <!-- 有实时进度数据时显示（优先级最高） -->
              <template v-if="uploadProgress[row.fileType]">
                <el-progress
                  :percentage="uploadProgress[row.fileType]?.progress || 0"
                  :status="getProgressStatus(uploadProgress[row.fileType]?.status)"
                />
                <div class="progress-message" :class="{ 'is-processing': isFileProcessing(row.fileType) }">
                  {{ uploadProgress[row.fileType]?.currentStep || '处理中...' }}
                </div>
              </template>
              <!-- 无实时进度：优先使用数据库中保存的进度信息 -->
              <template v-else-if="row.uploadProgress !== undefined && row.uploadProgress !== null">
                <el-progress
                  :percentage="row.uploadProgress >= 0 ? row.uploadProgress : 100"
                  :status="row.uploadStatus === 2 ? 'success' : (row.uploadStatus === 3 || row.uploadProgress < 0 ? 'exception' : undefined)"
                />
                <div class="progress-message">
                  {{ row.uploadPhase || (row.uploadStatus === 2 ? '已完成' : (row.uploadStatus === 3 ? '上传失败' : '等待上传')) }}
                </div>
              </template>
              <!-- 兜底：根据上传状态显示 -->
              <template v-else>
                <el-progress
                  :percentage="row.uploadStatus === 2 ? 100 : (row.uploadStatus === 3 ? 100 : 0)"
                  :status="row.uploadStatus === 2 ? 'success' : (row.uploadStatus === 3 ? 'exception' : undefined)"
                />
                <div class="progress-message">
                  {{ row.uploadStatus === 2 ? '已完成' : (row.uploadStatus === 3 ? '上传失败' : '等待上传') }}
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
        <el-table-column prop="validationErrorCount" label="校验错误" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.validationErrorCount > 0" type="danger" size="small">
              {{ row.validationErrorCount }}行有误
            </el-tag>
            <el-tag v-else type="success" size="small">无错误</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="250" align="center">
          <template #default="{ row }">
            <!-- 查看数据详情按钮 - 已上传状态且无校验错误 -->
            <el-button
              v-if="row.uploadStatus === 2 && row.validationErrorCount === 0"
              type="primary"
              size="small"
              @click="$emit('view-file-data', row)"
            >
              <el-icon class="mr-5px"><Document /></el-icon>
              查看数据
            </el-button>

            <!-- 查看错误详情按钮 - 上传失败(3)或有校验错误时 -->
            <el-button
              v-if="row.uploadStatus === 3 || (row.uploadStatus === 2 && row.validationErrorCount > 0)"
              type="danger"
              size="small"
              @click="$emit('view-error-detail', row)"
            >
              <el-icon class="mr-5px"><WarningFilled /></el-icon>
              {{ row.uploadStatus === 3 ? '查看失败原因' : '查看错误' }}
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
          :content="getQCButtonTooltip"
          placement="top"
          :disabled="canStartQC"
        >
          <span>
            <el-button
              type="primary"
              @click="$emit('start-pre-qc')"
              :disabled="!canStartQC"
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
      :validating="headerValidationDialog.validating"
      :downloading-template="props.downloadingTemplate"
      @download-template="downloadTemplate"
      @continue-upload="handleContinueUpload"
      @cancel="handleValidationCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
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
import { ReportStepSummaryApi } from '@/api/drug/reportstepsummary'
import { DICT_TYPE } from '@/utils/dict'
import { getProgressColor } from '@/utils/progressColor'
import download from '@/utils/download'

// Props定义
interface Props {
  taskId: number
  fileList: any[]
  stepSummaryKey: number
  refreshingFileList: boolean
  canUploadAndQC?: boolean  // 是否允许上传和质控操作
  operationDisabledReason?: string  // 不允许操作时的提示信息
  downloadingTemplate?: boolean  // 是否正在下载模板
}

const props = withDefaults(defineProps<Props>(), {
  canUploadAndQC: true,
  operationDisabledReason: '',
  downloadingTemplate: false
})

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
const uploadRef = ref<InstanceType<typeof import('element-plus')['ElUpload']>>()
const isUploading = ref(false)
const uploadingFiles = ref<string[]>([])
const uploadProgress = ref<Record<string, any>>({})
const uploadResult = ref<any>(null)
const overallProgressData = ref<any>(null)
const currentBatchPhase = ref('正在处理文件...')
// 本次上传批次的文件统计（来自后端进度接口）
const batchTotalFiles = ref(0)      // 本次上传的总文件数
const batchCompletedFiles = ref(0)  // 本次上传已完成的文件数

// 进度轮询定时器
let progressPollingInterval: ReturnType<typeof setInterval> | null = null

// 表头校验对话框状态
const headerValidationDialog = ref({
  visible: false,
  fileName: '',
  uploadFileType: '',
  result: null as any,
  validating: false  // 新增：是否正在校验中
})

// ==================== 计算属性 ====================
// 进度卡片中显示的总文件数（上传中显示本次批次数量，否则显示任务文件列表数量）
const totalFileCount = computed(() => {
  return isUploading.value && batchTotalFiles.value > 0 
    ? batchTotalFiles.value 
    : props.fileList.length
})

// 进度卡片中显示的已完成文件数（上传中显示本次批次已完成数，否则显示已上传状态的文件数）
const uploadedFileCount = computed(() => {
  return isUploading.value && batchTotalFiles.value > 0
    ? batchCompletedFiles.value
    : props.fileList.filter(file => file.uploadStatus === 2).length
})

const allFilesUploaded = computed(() => {
  return props.fileList.length > 0 && props.fileList.every((file) => file.uploadStatus === 2)
})

/**
 * 是否可以开始质控
 * 需要同时满足：1. 所有文件已上传 2. 当前状态允许操作
 */
const canStartQC = computed(() => {
  return allFilesUploaded.value && props.canUploadAndQC
})

/**
 * 获取质控按钮的提示信息
 */
const getQCButtonTooltip = computed(() => {
  if (!props.canUploadAndQC) {
    return props.operationDisabledReason
  }
  if (!allFilesUploaded.value) {
    return '请先完成所有文件的上传与基础校验'
  }
  return '开始前置质控'
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
 * 判断文件是否正在处理中
 */
const isFileProcessing = (fileType: string) => {
  const progress = uploadProgress.value[fileType]
  if (!progress) return false
  return progress.status !== 'success' && progress.status !== 'error'
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
const downloadTemplate = () => {
  emit('download-template')
}

// 保存待上传的文件信息（用于校验通过后继续上传）
const pendingUploadFile = ref<File | null>(null)
const pendingUploadRow = ref<any>(null)  // 单文件上传时保存行信息
const pendingUploadFiles = ref<File[]>([])  // 多文件上传时保存文件列表

// 防抖处理多文件上传
let fileChangeTimeout: ReturnType<typeof setTimeout> | null = null
let isProcessingFiles = false // 防止重复处理

/**
 * 拖拽上传文件（新增表头校验，支持多文件）
 * 使用防抖机制处理多文件同时添加的情况
 */
const handleFileChange = async (uploadFile: any, uploadFiles: any[]) => {
  const file = uploadFile.raw
  if (!file) return

  console.log(`[文件上传] 文件添加: ${uploadFile.name}, 当前总数: ${uploadFiles.length}`)
  
  // 如果正在处理文件，忽略新的文件添加事件
  if (isProcessingFiles) {
    console.log(`[文件上传] 正在处理文件中，忽略新添加的文件: ${uploadFile.name}`)
    return
  }
  
  // 清除之前的防抖定时器
  if (fileChangeTimeout) {
    clearTimeout(fileChangeTimeout)
  }
  
  // 使用防抖机制，等待500ms后处理（增加延迟确保所有文件都已添加）
  fileChangeTimeout = setTimeout(async () => {
    // 设置处理标志，防止重复处理
    if (isProcessingFiles) {
      console.log(`[文件上传] 已在处理中，跳过本次防抖触发`)
      return
    }
    
    isProcessingFiles = true
    console.log(`[文件上传] 防抖触发，开始处理 ${uploadFiles.length} 个文件`)
    
    try {
      const files = uploadFiles.map(f => f.raw).filter(Boolean)
      
      // 检查文件类型：如果包含ZIP，只能上传一个ZIP
      const zipFiles = files.filter(f => f.name.toLowerCase().endsWith('.zip'))
      const excelFiles = files.filter(f => f.name.toLowerCase().endsWith('.xlsx'))
      
      if (zipFiles.length > 0 && excelFiles.length > 0) {
        message.error('不能同时上传ZIP压缩包和Excel文件，请分开上传')
        clearUploadFileList()
        return
      }
      
      if (zipFiles.length > 1) {
        message.error('一次只能上传一个ZIP压缩包')
        clearUploadFileList()
        return
      }
      
      // 根据文件类型和数量决定处理方式
      if (zipFiles.length === 1 && excelFiles.length === 0) {
        // 单个ZIP文件
        await processSingleFile(zipFiles[0])
      } else if (excelFiles.length === 1 && zipFiles.length === 0) {
        // 单个Excel文件
        await processSingleFile(excelFiles[0])
      } else if (excelFiles.length > 1) {
        // 多个Excel文件，批量处理
        await processMultipleExcelFiles(excelFiles)
      } else {
        message.error('请选择有效的文件（ZIP或Excel）')
        clearUploadFileList()
      }
    } catch (error) {
      console.error('[文件上传] 处理文件时发生错误:', error)
      message.error('文件处理失败，请重试')
    } finally {
      // 重置处理标志
      isProcessingFiles = false
    }
  }, 500) // 增加到500ms防抖延迟
}

/**
 * 处理单个文件上传（ZIP或单个Excel）
 */
const processSingleFile = async (file: File) => {
  try {
    const fileName = file.name
    
    // Step 1: 先校验表头字段（ZIP和Excel都需要）
    message.info('正在校验文件字段...')
    
    try {
      const validationResult = await ReportDataApi.validateHeaders(file, undefined)
      
      // 无论通过与否，都显示弹框让用户确认
      headerValidationDialog.value.visible = true
      headerValidationDialog.value.fileName = fileName
      headerValidationDialog.value.uploadFileType = validationResult.uploadFileType
      headerValidationDialog.value.result = validationResult
      
      // 保存待上传的文件（校验通过时用户点击"继续导入"后使用）
      if (validationResult.allPassed) {
        pendingUploadFile.value = file
        pendingUploadRow.value = null  // 批量上传，无行信息
        pendingUploadFiles.value = []  // 清空多文件列表
      } else {
        pendingUploadFile.value = null
        pendingUploadRow.value = null
        pendingUploadFiles.value = []
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
 * 处理多个Excel文件上传
 * 优化：批量校验，一次接口调用
 */
const processMultipleExcelFiles = async (files: File[]) => {
  try {
    // 立即显示模态框，但设置为校验中状态
    headerValidationDialog.value.visible = true
    headerValidationDialog.value.validating = true
    headerValidationDialog.value.fileName = `正在校验 ${files.length} 个文件...`
    headerValidationDialog.value.uploadFileType = 'multiple'
    headerValidationDialog.value.result = {
      allPassed: false,
      message: '正在校验文件字段，请稍候...',
      fileCount: files.length,
      fileResults: []
    }
    
    message.info(`正在校验 ${files.length} 个文件的字段...`)
    
    // 批量校验所有文件（一次接口调用）
    let batchValidationResult: any = null
    let allPassed = true
    
    try {
      // 调用批量校验接口
      batchValidationResult = await ReportDataApi.validateHeadersBatch(files)
      
      console.log('[批量校验] 批量校验结果:', batchValidationResult)
      
      // 处理批量校验结果
      // 后端返回的 fileResults 数组中，每个元素直接是 HeaderValidationVO 对象
      // 包含 passed, fileName, fileType, matched, missingRequired, missingOptional, extra, message 字段
      if (batchValidationResult.fileResults && batchValidationResult.fileResults.length > 0) {
        allPassed = batchValidationResult.allPassed
      } else {
        console.warn('[批量校验] 返回格式异常，尝试兼容处理')
        allPassed = batchValidationResult.allPassed || false
      }
      
    } catch (error) {
      console.error('批量校验失败:', error)
      message.error('文件校验失败，请重试')
      headerValidationDialog.value.validating = false
      headerValidationDialog.value.visible = false
      return
    }
    
    // 所有文件校验完成，构建最终结果
    const fileNames = files.map(f => f.name).join('、')
    
    // 直接使用后端返回的 fileResults，每个元素已经是完整的 HeaderValidationVO
    const fileResults = (batchValidationResult.fileResults || []).map((r: any) => ({
      fileName: r.fileName,
      fileType: r.fileType || '',
      passed: r.passed,
      matched: r.matched || [],
      missingRequired: r.missingRequired || [],
      missingOptional: r.missingOptional || [],
      extra: r.extra || [],
      message: r.message || ''
    }))
    
    const failedCount = fileResults.filter((r: any) => !r.passed).length
    
    // 检测重复文件类型，标记采用/忽略状态
    const fileTypeCount: Record<string, number> = {}
    const fileTypeFirstIndex: Record<string, number> = {}
    let hasDuplicates = false
    
    fileResults.forEach((fr, index) => {
      const ft = fr.fileType
      if (ft) {
        if (fileTypeCount[ft] === undefined) {
          fileTypeCount[ft] = 0
          fileTypeFirstIndex[ft] = index
        }
        fileTypeCount[ft]++
        
        if (fileTypeFirstIndex[ft] === index) {
          fr.willBeUsed = true
          fr.duplicateStatus = null
        } else {
          fr.willBeUsed = false
          fr.duplicateStatus = 'duplicate'
          hasDuplicates = true
        }
      }
    })
    
    const usedCount = fileResults.filter(fr => fr.willBeUsed !== false).length
    const duplicateCount = fileResults.filter(fr => fr.duplicateStatus === 'duplicate').length
    
    // 构建提示消息
    let resultMessage = ''
    if (!allPassed) {
      resultMessage = `${failedCount} 个文件校验未通过，请修改后重新上传`
    } else if (hasDuplicates) {
      resultMessage = `校验通过，但存在 ${duplicateCount} 个重复类型文件将被忽略，实际将上传 ${usedCount} 个文件`
    } else {
      resultMessage = `全部 ${files.length} 个文件校验通过`
    }
    
    // 更新为最终结果，解除校验中状态
    headerValidationDialog.value.validating = false
    headerValidationDialog.value.fileName = `${files.length} 个文件: ${fileNames}`
    headerValidationDialog.value.result = {
      allPassed: allPassed,
      message: resultMessage,
      fileCount: files.length,
      usedCount: usedCount,
      duplicateCount: duplicateCount,
      hasDuplicates: hasDuplicates,
      failedCount: failedCount,
      fileResults: fileResults
    }
    
    // 只有全部通过才保存待上传的文件列表
    if (allPassed) {
      pendingUploadFile.value = null
      pendingUploadRow.value = null
      pendingUploadFiles.value = files
    } else {
      pendingUploadFile.value = null
      pendingUploadRow.value = null
      pendingUploadFiles.value = []
    }
    
  } catch (error) {
    console.error('多文件处理失败:', error)
    message.error('文件处理失败，请重试')
    headerValidationDialog.value.validating = false
    headerValidationDialog.value.visible = false
  }
}

/**
 * 用户确认继续上传（校验通过后）
 */
const handleContinueUpload = async () => {
  const file = pendingUploadFile.value
  const row = pendingUploadRow.value
  const files = pendingUploadFiles.value
  
  // 清除el-upload的文件缓存
  clearUploadFileList()
  
  // 多文件上传
  if (files && files.length > 0) {
    await doMultipleFilesUpload(files)
    return
  }
  
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
 * 清除el-upload组件的文件缓存
 */
const clearUploadFileList = () => {
  // 清除防抖定时器
  if (fileChangeTimeout) {
    clearTimeout(fileChangeTimeout)
    fileChangeTimeout = null
  }
  
  // 重置处理标志
  isProcessingFiles = false
  
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  pendingUploadFile.value = null
  pendingUploadRow.value = null
  pendingUploadFiles.value = []
}

/**
 * 校验对话框取消/关闭时的处理（清除文件缓存）
 */
const handleValidationCancel = () => {
  clearUploadFileList()
}

/**
 * 真正执行批量文件上传（用户确认后调用）
 */
const doBatchFileUpload = async (file: File) => {
  const uploadStartTime = Date.now()
  console.log(`[上传时间线] ${new Date().toLocaleTimeString()}.${Date.now() % 1000} - 开始上传文件: ${file.name}`)
  
  try {
    isUploading.value = true
    const isZip = file.name.toLowerCase().endsWith('.zip')
    
    message.success('开始上传文件...')
    
    // 初始化进度（文件数先设为0，等后端返回后再更新）
    uploadProgress.value = {}
    overallProgressData.value = { overallProgress: 0 }
    batchTotalFiles.value = 0
    batchCompletedFiles.value = 0

    // 发起异步上传请求
    const formData = new FormData()
    formData.append('file', file)
    formData.append('taskId', String(props.taskId))
    formData.append('originalFileName', file.name)

    console.log(`[上传时间线] ${new Date().toLocaleTimeString()}.${Date.now() % 1000} - 发送上传请求到后端`)
    
    // 发送上传请求（后端异步处理）
    await request.post({
      url: '/drug/report-data/validate-and-parse',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 10000  // 只等待10秒，确保请求发送成功即可
    })

    const uploadRequestTime = Date.now() - uploadStartTime
    console.log(`[上传时间线] ${new Date().toLocaleTimeString()}.${Date.now() % 1000} - 上传请求返回 (耗时: ${uploadRequestTime}ms)`)

    message.info('文件已提交，正在处理...')
    
    // 立即设置初始进度状态
    currentBatchPhase.value = '正在解析文件...'
    overallProgressData.value = { overallProgress: 5 }  // 显示初始进度
    
    console.log(`[上传时间线] ${new Date().toLocaleTimeString()}.${Date.now() % 1000} - 立即开始轮询进度`)
    
    // 立即开始轮询（不延迟），确保能捕获到处理过程
    startRealProgressPolling()

  } catch (error) {
    console.error('文件上传失败:', error)
    message.error('文件上传失败，请重试')
    stopRealProgressPolling()
    isUploading.value = false
    // 不清空进度信息，保留失败时的状态
    overallProgressData.value = null
    pendingUploadFile.value = null
    pendingUploadFiles.value = []
  }
}

/**
 * 真正执行多文件上传（用户确认后调用）
 * 优化：批量上传，一次接口调用
 */
const doMultipleFilesUpload = async (files: File[]) => {
  const uploadStartTime = Date.now()
  console.log(`[多文件上传] ${new Date().toLocaleTimeString()}.${Date.now() % 1000} - 开始批量上传 ${files.length} 个文件`)
  
  try {
    isUploading.value = true
    
    message.success(`开始上传 ${files.length} 个文件...`)
    
    // 初始化进度
    uploadProgress.value = {}
    overallProgressData.value = { overallProgress: 0 }
    batchTotalFiles.value = files.length
    batchCompletedFiles.value = 0
    currentBatchPhase.value = '正在提交文件...'

    console.log(`[多文件上传] ${new Date().toLocaleTimeString()}.${Date.now() % 1000} - 发送批量上传请求到后端`)
    
    // 调用批量上传接口（一次请求上传所有文件）
    await ReportDataApi.validateAndParseFilesBatch(files, props.taskId)

    const uploadRequestTime = Date.now() - uploadStartTime
    console.log(`[多文件上传] ${new Date().toLocaleTimeString()}.${Date.now() % 1000} - 批量上传请求返回 (耗时: ${uploadRequestTime}ms)`)

    message.info('所有文件已提交，正在处理...')
    
    // 立即设置初始进度状态
    currentBatchPhase.value = '正在解析文件...'
    overallProgressData.value = { overallProgress: 5 }  // 显示初始进度
    
    console.log(`[多文件上传] ${new Date().toLocaleTimeString()}.${Date.now() % 1000} - 开始轮询进度`)
    
    // 立即开始轮询（不延迟），确保能捕获到处理过程
    startRealProgressPolling()

  } catch (error) {
    console.error('多文件上传失败:', error)
    message.error('文件上传失败，请重试')
    stopRealProgressPolling()
    isUploading.value = false
    // 不清空进度信息，保留失败时的状态
    overallProgressData.value = null
    pendingUploadFile.value = null
    pendingUploadFiles.value = []
    currentBatchPhase.value = '正在处理文件...'
    // 重置本次批次的文件统计
    batchTotalFiles.value = 0
    batchCompletedFiles.value = 0
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
    // 先校验表头
    message.info(`正在校验${displayName}字段...`)
    
    try {
      const validationResult = await ReportDataApi.validateHeaders(file, fileType)
      
      // 无论通过与否，都显示弹框让用户确认
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
 * 真正执行单文件上传（用户确认后调用）
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

    message.info(`正在上传${displayName}...`)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('taskId', String(props.taskId))
    formData.append('fileType', fileType)  // 单文件上传传递明确的文件类型
    formData.append('originalFileName', file.name)

    // 发起上传请求（超时时间设为10秒，只确保请求发送成功）
    await request.post({
      url: '/drug/report-data/validate-and-parse',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 10000
    })

    // 上传请求发送成功后，开始轮询真实进度
    // 如果已经在轮询中（多文件上传场景），则不重复启动
    if (!progressPollingInterval) {
      // 立即设置初始进度
      uploadProgress.value[fileType] = { progress: 10, status: 'uploading', phase: '正在解析...' }
      startRealProgressPolling()
    }

    // 注意：不再在这里调用 emit('file-uploaded')
    // 而是在 startRealProgressPolling 中检测到所有文件完成后统一调用
  } catch (error) {
    console.error('文件上传失败:', error)
    message.error(`${displayName}上传失败，请重试`)

    const index = uploadingFiles.value.indexOf(fileType)
    if (index > -1) {
      uploadingFiles.value.splice(index, 1)
    }

    // 不要将进度重置为0，保持当前进度或设置为失败状态
    // 如果后端有返回进度，会在轮询中更新；如果没有，保持当前值
    if (!uploadProgress.value[fileType]) {
      uploadProgress.value[fileType] = { progress: 0, status: 'error' }
    } else {
      uploadProgress.value[fileType].status = 'error'
    }
    
    // 停止轮询（如果是单文件上传失败）
    stopRealProgressPolling()
    isUploading.value = false
    
    setTimeout(() => {
      // 不删除进度信息，让用户看到失败时的进度
      pendingUploadFile.value = null  // 清理待上传文件
      pendingUploadRow.value = null
    }, 2000)
  }
}

// ==================== 真实进度轮询 ====================

/**
 * 开始轮询真实上传进度
 */
const startRealProgressPolling = () => {
  // 清除已有轮询
  stopRealProgressPolling()
  
  console.log(`[进度轮询] 开始轮询，taskId: ${props.taskId}`)
  
  let pollCount = 0  // 轮询次数计数器
  let lastHadCleaningFile = false  // 跟踪上次是否有文件在清理中
  let hasReceivedValidProgress = false  // 标记是否收到过有效的进度数据（防止误判旧数据）
  
  // 立即执行第一次轮询
  pollProgress()
  
  // 启动定时轮询（每800ms一次）
  progressPollingInterval = setInterval(pollProgress, 800)
  
  // 轮询函数
  async function pollProgress() {
    try {
      pollCount++
      const pollStartTime = Date.now()
      
      console.log(`[进度轮询] ${new Date().toLocaleTimeString()}.${Date.now() % 1000} - 第${pollCount}次轮询开始`)
      
      // 调用后端进度接口V2（包含总览和文件进度）
      const progressResponse = await ReportDataApi.getUploadProgressV2(props.taskId)
      
      const pollDuration = Date.now() - pollStartTime
      console.log(`[进度轮询] ${new Date().toLocaleTimeString()}.${Date.now() % 1000} - 第${pollCount}次轮询返回 (耗时: ${pollDuration}ms)`)
      
      console.log(`[进度轮询] 第${pollCount}次轮询，收到进度数据:`, progressResponse)
      
      if (!progressResponse || !progressResponse.fileProgress) {
        console.log('[进度轮询] 进度数据为空，跳过本次更新')
        return
      }
      
      const { summary, fileProgress } = progressResponse
      
      // 如果文件进度为空，跳过
      if (!fileProgress || Object.keys(fileProgress).length === 0) {
        console.log('[进度轮询] 文件进度为空，跳过本次更新')
        return
      }
      
      // 更新各文件进度
      uploadProgress.value = fileProgress
      
      // 检查是否收到了有效的进度数据（至少有一个文件的进度不是100%或状态是processing）
      const fileProgresses = Object.values(fileProgress)
      const hasProcessingFile = fileProgresses.some((p: any) => 
        p.status === 'uploading' || p.status === 'parsing' || p.status === 'validating' || p.status === 'cleaning' || p.progress < 100
      )
      
      // 只有收到过有效的处理中进度，才允许后续判断完成
      // 排除 pending 状态（pending 表示刚清理完，还未真正开始处理）
      if (hasProcessingFile) {
        hasReceivedValidProgress = true
        console.log('[进度轮询] 检测到有效的处理中进度，标记为已开始处理')
      } else if (fileProgresses.every((p: any) => p.status === 'pending')) {
        // 如果所有文件都是 pending 状态，说明刚清理完，还未开始处理
        hasReceivedValidProgress = false
        console.log('[进度轮询] 所有文件都是pending状态，等待真正开始处理...')
      }
      
      // 检测是否有文件处于清理阶段，清理完成后刷新列表
      const hasCleaningFile = fileProgresses.some((p: any) => p.status === 'cleaning')
      const hasCleaningCompleted = fileProgresses.some((p: any) => 
        p.status !== 'cleaning' && p.currentStep && !p.currentStep.includes('清理')
      )
      
      // 如果有文件从清理状态变为其他状态，刷新文件列表
      if (!hasCleaningFile && hasCleaningCompleted && !lastHadCleaningFile) {
        console.log('[进度轮询] 检测到清理完成，刷新文件列表')
        emit('refresh-file-list')
      }
      lastHadCleaningFile = hasCleaningFile
      
      // 使用后端计算的总体进度（确保单调递增，避免进度倒退）
      if (summary) {
        const newProgress = summary.overallProgress || 0
        const currentProgress = overallProgressData.value?.overallProgress || 0
        
        // 更新本次批次的文件统计（来自后端）
        if (summary.totalFiles !== undefined) {
          batchTotalFiles.value = summary.totalFiles
        }
        if (summary.completedFiles !== undefined) {
          batchCompletedFiles.value = summary.completedFiles
        }
        
        // 只有新进度大于当前进度时才更新（避免进度倒退）
        if (newProgress >= currentProgress) {
          overallProgressData.value = { 
            overallProgress: newProgress
          }
          currentBatchPhase.value = summary.currentPhase || '正在处理文件...'
        } else {
          // 进度倒退时，保持当前进度，但更新阶段描述
          console.log('[进度轮询] 检测到进度倒退，保持当前进度:', currentProgress, '%, 忽略新进度:', newProgress, '%')
          currentBatchPhase.value = summary.currentPhase || '正在处理文件...'
        }
        
        console.log('[进度轮询] 总体进度:', overallProgressData.value.overallProgress, '%, 当前阶段:', currentBatchPhase.value, ', 文件:', batchCompletedFiles.value, '/', batchTotalFiles.value)
      }
      
      // 判断是否所有文件都已完成（复用上面已声明的 fileProgresses）
      if (fileProgresses.length > 0) {
        // 获取当前正在上传的文件列表
        const currentUploadingFileTypes = [...uploadingFiles.value]
        
        // 如果有明确的上传文件列表，只检查这些文件是否完成
        // 否则检查所有文件
        let filesToCheck: any[] = []
        if (currentUploadingFileTypes.length > 0) {
          // 单文件或指定文件上传：只检查当前上传的文件
          filesToCheck = currentUploadingFileTypes
            .map(ft => fileProgress[ft])
            .filter(Boolean)
        } else {
          // 批量上传：检查所有文件
          filesToCheck = fileProgresses
        }
        
        // 检查是否所有需要检查的文件都已完成（成功或失败）
        const allFilesCompleted = filesToCheck.length > 0 && filesToCheck.every((p: any) => 
          p.status === 'success' || p.status === 'error'
        )
        
        // 同时检查后端的 isProcessing 标志，确保后端也认为处理完成
        // 对于单文件上传，如果当前文件已完成，即使后端还在处理其他文件也可以结束轮询
        const backendCompleted = summary && summary.isProcessing === false
        
        // 判断是否完成：
        // 1. 如果是单文件上传（currentUploadingFileTypes.length > 0），只要当前文件完成即可
        // 2. 如果是批量上传，需要所有文件完成且后端确认
        // 3. 【关键】必须先收到过有效的处理中进度，才能判断完成（防止误判旧数据）
        const isSingleFileUpload = currentUploadingFileTypes.length > 0 && currentUploadingFileTypes.length < fileProgresses.length
        const allCompleted = hasReceivedValidProgress && (isSingleFileUpload ? allFilesCompleted : (allFilesCompleted && backendCompleted))
        
        console.log('[进度轮询] 当前上传文件:', currentUploadingFileTypes, ', 单文件模式?', isSingleFileUpload, ', 文件完成?', allFilesCompleted, ', 后端完成?', backendCompleted, ', 已收到有效进度?', hasReceivedValidProgress, ', 最终判断:', allCompleted)
        
        if (allCompleted) {
          // 所有文件处理完成，停止轮询
          console.log('[进度轮询] 所有文件已完成，停止轮询')
          stopRealProgressPolling()
          isUploading.value = false
          
          // 清理 uploadingFiles 中所有已完成的文件
          // 注意：需要清理的是当前正在上传的文件，而不是所有文件
          const currentUploadingFiles = [...uploadingFiles.value]  // 复制一份，避免遍历时修改
          currentUploadingFiles.forEach(fileType => {
            const progress = fileProgress[fileType]
            // 只有当文件状态为成功或失败时才从上传列表中移除
            if (progress && (progress.status === 'success' || progress.status === 'error')) {
              const index = uploadingFiles.value.indexOf(fileType)
              if (index > -1) {
                uploadingFiles.value.splice(index, 1)
              }
            }
          })
          
          // 如果还有残留的上传文件（可能是状态异常），也清理掉
          if (uploadingFiles.value.length > 0) {
            console.log('[进度轮询] 清理残留的上传文件:', uploadingFiles.value)
            uploadingFiles.value = []
          }
          
          // 通知父组件刷新文件列表
          emit('file-uploaded')
          
          // 检查是否有失败的文件 - 只统计本次上传的文件
          // 如果是单文件上传，只统计该文件；如果是批量上传，统计所有本次上传的文件
          const uploadedFileTypes = currentUploadingFiles.length > 0 ? currentUploadingFiles : Object.keys(fileProgress)
          const uploadedProgresses = uploadedFileTypes.map(ft => fileProgress[ft]).filter(Boolean)
          
          const hasError = uploadedProgresses.some((p: any) => p.status === 'error')
          const successCount = uploadedProgresses.filter((p: any) => p.status === 'success').length
          const errorCount = uploadedProgresses.filter((p: any) => p.status === 'error').length
          
          // 调用后端完成步骤总览（更新状态为已完成，以便显示总览卡片）
          try {
            await ReportStepSummaryApi.completeStepSummary(props.taskId, 1)
            console.log('[进度轮询] 已完成步骤总览更新')
            
            // 延迟触发总览卡片刷新，确保后端数据已更新
            setTimeout(() => {
              emit('refresh-summary')
            }, 500)
          } catch (error) {
            console.error('[进度轮询] 更新步骤总览失败:', error)
          }
          
          // 如果第一次轮询就完成了，说明处理很快
          if (pollCount === 1) {
            console.log('[进度轮询] 文件处理速度很快，第一次轮询即已完成')
            // 即使很快完成，也显示一个短暂的进度动画，让用户感知到处理过程
            message.info('文件处理完成')
          }
          
          // 根据上传文件数量显示不同的消息
          const totalUploaded = successCount + errorCount
          if (hasError) {
            if (totalUploaded === 1) {
              // 单文件上传失败
              message.error('文件处理失败，请检查错误信息')
            } else if (successCount > 0) {
              // 多文件上传，部分成功
              message.warning(`文件处理完成：${successCount}个成功，${errorCount}个失败`)
            } else {
              // 多文件上传，全部失败
              message.error('文件处理失败，请检查错误信息')
            }
          } else {
            if (pollCount > 1) {  // 只有不是第一次轮询才显示成功消息（避免重复）
              if (totalUploaded === 1) {
                message.success('文件上传成功')
              } else {
                message.success(`${totalUploaded}个文件处理完成`)
              }
            }
          }
          
          // 清理状态（延迟清理，保留进度信息以便用户查看）
          setTimeout(() => {
            // 不清空 uploadProgress，保留失败时的进度信息
            overallProgressData.value = null
            pendingUploadFile.value = null
            pendingUploadFiles.value = []
            // 重置本次批次的文件统计
            batchTotalFiles.value = 0
            batchCompletedFiles.value = 0
          }, 3000)
        }
      }
    } catch (error) {
      console.error('[进度轮询] 轮询上传进度失败:', error)
    }
  }
}

/**
 * 停止轮询上传进度
 */
const stopRealProgressPolling = () => {
  if (progressPollingInterval) {
    clearInterval(progressPollingInterval)
    progressPollingInterval = null
  }
}

// 组件卸载时清理轮询
onUnmounted(() => {
  stopRealProgressPolling()
  // 清理防抖定时器
  if (fileChangeTimeout) {
    clearTimeout(fileChangeTimeout)
  }
})
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
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #f5f7fa;
    border-radius: 4px;
    
    .table-title {
      font-weight: 600;
      font-size: 16px;
    }
    
    // 刷新按钮靠右
    > :last-child {
      margin-left: auto;
    }
    
    .header-upload-stats {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 280px;
      margin-left: 16px;
      
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
      
      &.is-processing {
        color: #667eea;
        font-weight: 500;
        animation: pulse 1.5s infinite;
      }
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
