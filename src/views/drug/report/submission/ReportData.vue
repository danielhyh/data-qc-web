<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <PageHeader
      :title="currentTask.taskName || '药品数据上报'"
      :dict-tag="{
        type: DICT_TYPE.REPORT_STATUS_TYPE,
        value: currentTask.status
      }"
      :content="currentTask.description"
      :meta="reportMeta"
      :show-back-button="true"
      back-button-text="返回列表"
      @back-click="handleBackToList"
    />

    <!-- 上报进度步骤条 -->
    <ContentWrap class="progress-card">
      <el-steps :active="currentStep" align-center :process-status="getProcessStatus()">
        <el-step 
          title="准备" 
          @click="changeSteps(0)"
          :class="{ 'step-clickable': 0 <= currentTask.maxCurrentStep }"
        >
          <template #icon>
            <el-tooltip :content="0 <= currentTask.maxCurrentStep ? '点击返回准备阶段' : '准备上报文件'" placement="top">
              <el-icon>
                <Document />
              </el-icon>
            </el-tooltip>
          </template>
        </el-step>
        <el-step 
          title="上传文件" 
          @click="changeSteps(1)"
          :class="{ 'step-clickable': 1 <= currentTask.maxCurrentStep }"
        >
          <template #icon>
            <el-tooltip :content="1 <= currentTask.maxCurrentStep ? '点击返回上传文件阶段' : '上传数据文件'" placement="top">
              <el-icon>
                <Upload />
              </el-icon>
            </el-tooltip>
          </template>
        </el-step>
        <el-step 
          title="前置质控" 
          @click="changeSteps(2)"
          :class="{ 'step-clickable': 2 <= currentTask.maxCurrentStep }"
        >
          <template #icon>
            <el-tooltip :content="2 <= currentTask.maxCurrentStep ? '点击返回前置质控阶段' : '数据格式验证'" placement="top">
              <el-icon>
                <CircleCheck />
              </el-icon>
            </el-tooltip>
          </template>
        </el-step>
        <el-step 
          title="提交上报" 
          @click="changeSteps(3)"
          :class="{ 'step-clickable': 3 <= currentTask.maxCurrentStep }"
        >
          <template #icon>
            <el-tooltip :content="3 <= currentTask.maxCurrentStep ? '点击返回提交上报阶段' : '提交至管理端'" placement="top">
              <el-icon>
                <Promotion />
              </el-icon>
            </el-tooltip>
          </template>
        </el-step>
      </el-steps>
    </ContentWrap>

    <!-- 主要内容区域 -->
    <div class="content-card" v-loading="loading">
      <!-- 步骤0: 准备阶段 -->
      <div v-if="currentStep === 0" class="step-content">
        <div class="requirements-section">
          <div class="requirements-content">
            <div class="requirements-header">
              <h3 class="requirements-title">压缩包必须包含以下5个Excel文件</h3>
              <p class="requirements-subtitle">请确保文件名称和内容格式完全符合要求</p>
            </div>
            <div class="file-list-container">
              <div class="file-grid">
                <div
                  v-for="(table, key) in tableDefinitions"
                  :key="key"
                  class="file-card"
                  @click="previewTemplate(table.id)"
                >
                  <div class="file-card-header">
                    <el-icon class="file-card-icon" :style="{ color: table.color }">
                      <Files />
                    </el-icon>
                    <div class="file-card-title">{{ table.fileName }}</div>
                  </div>
                  <div class="file-card-content">
                    <div class="file-card-name">
                      <dict-tag :type="DICT_TYPE.IMPORT_TABLE_TYPE" :value="table.type" />
                    </div>
                    <div class="file-card-stats">
                      <span class="field-count">{{ table.fieldCount }} 个字段</span>
                      <span class="required-fields">{{ table.requiredFieldsCount || 0 }} 个必填</span>
                      <span class="download-count">{{ table.downloadCount || 0 }} 次下载</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="requirements-tips">
              <div class="tip-item">
                <el-icon class="tip-icon success">
                  <CircleCheck />
                </el-icon>
                <span>文件格式：Excel (.xlsx) 文件，UTF-8编码</span>
              </div>
              <div class="tip-item">
                <el-icon class="tip-icon warning">
                  <Warning />
                </el-icon>
                <span>字段要求：必填字段不能为空，可选字段可为空</span>
              </div>
              <div class="tip-item">
                <el-icon class="tip-icon info">
                  <InfoFilled />
                </el-icon>
                <span>数据质量：建议数据完整性超过90%以获得最佳导入效果</span>
              </div>
            </div>

            <div class="prepare-actions">
              <el-button size="large" @click="downloadTemplate">
                <el-icon class="mr-5px">
                  <Download />
                </el-icon>
                下载标准模板压缩包
              </el-button>
              <el-button type="primary" size="large" @click="startUpload">
                <el-icon class="mr-5px">
                  <Upload />
                </el-icon>
                开始上传文件
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤1: 上传文件 -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="step-header-with-progress">
          <h3 class="step-title">文件上传</h3>
          <div class="upload-progress-inline">
            <div class="progress-info">
              <span class="progress-text">上传进度：{{ uploadedFileCount }}/{{ totalFileCount }} 个文件</span>
              <span class="progress-percent" :class="{ 'complete': overallUploadProgress === 100 }">
                {{ overallUploadProgress }}%
              </span>
            </div>
            <el-progress
              :percentage="overallUploadProgress"
              :color="getProgressColor(overallUploadProgress)"
              :stroke-width="8"
              :show-text="false"
              style="width: 300px;"
            />
          </div>
        </div>
        <div class="upload-section">

          <!-- 批量上传区域 -->
          <div class="batch-upload">
            <el-upload
              ref="uploadRef"
              class="upload-dragger"
              drag
              action="#"
              :auto-upload="false"
              :on-change="handleFileChange"
              accept=".zip,.rar,.xlsx"
              :disabled="currentStep < currentTask.maxCurrentStep"
              :show-file-list="false"
            >
              <el-icon class="el-icon--upload">
                <UploadFilled />
              </el-icon>
              <div class="el-upload__text">
                拖拽ZIP，RAR压缩包或所有Excel文件到此处，或<em>点击上传</em>
              </div>
            </el-upload>
          </div>

          <!-- 文件列表 -->
          <el-table
            :data="fileList"
            :show-overflow-tooltip="true"
          >
            <el-table-column label="序号" width="60" type="index" align="center" />
            <el-table-column prop="name" label="标准文件名称" min-width="180" align="center" />
            <el-table-column prop="type" label="数据类型" width="150" align="center">
              <template #default="{ row }">
                <dict-tag :type="DICT_TYPE.IMPORT_TABLE_TYPE" :value="row.type" />
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120" align="center">
              <template #default="{ row }">
                <dict-tag :type="DICT_TYPE.UPLOAD_STATUS" :value="row.status" />
              </template>
            </el-table-column>
            <el-table-column prop="size" label="文件大小" width="120" align="center">
              <template #default="{ row }">
                {{ formatFileSize(row.size) }}
              </template>
            </el-table-column>
            <el-table-column prop="recordCount" label="数据条数" width="120" align="center">
              <template #default="{ row }">
                <span class="record-count">{{ row.recordCount || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="240" align="center">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 2"
                  type="primary"
                  size="small"
                  :disabled="currentStep < currentTask.maxCurrentStep"
                  @click="viewFileData(row)"
                >
                  <Icon icon="ep:view" class="mr-5px" />
                  查看详情
                </el-button>

                <el-upload
                  v-if="[0, 2, 3].includes(row.status)"
                  action="#"
                  :auto-upload="false"
                  :on-change="handleFileChange"
                  accept=".xlsx"
                  :disabled="currentStep < currentTask.maxCurrentStep"
                  :show-file-list="false"
                  class="inline-upload"
                >
                  <el-button type="warning" size="small">
                    <Icon icon="ep:upload" class="mr-5px" />
                    上传
                  </el-button>
                </el-upload>

                <el-button
                  v-if="[2, 3].includes(row.status)"
                  type="danger"
                  size="small"
                  :disabled="currentStep < currentTask.maxCurrentStep"
                  @click="removeFile(row)"
                >
                  <Icon icon="ep:delete" class="mr-5px" />
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="upload-actions">
            <el-button @click="currentTask.currentStep = 0" :disabled="currentStep < currentTask.maxCurrentStep">
              <Icon icon="ep:back" class="mr-5px" />
              返回准备
            </el-button>
            <el-button
              type="primary"
              @click="startPreQC"
              :disabled="!allFilesUploaded || currentStep < currentTask.maxCurrentStep"
            >
              <Icon icon="ep:circle-check" class="mr-5px" />
              开始前置质控
            </el-button>
          </div>
        </div>
      </div>

      <!-- 步骤2: 前置质控 -->
      <div v-if="currentStep === 2" class="step-content">
        <h3 class="step-title">前置质控结果</h3>
        <div class="qc-section">
        <!-- 质控统计卡片 -->
        <div class="qc-summary">
          <div class="summary-card" :class="preQCResult.passed ? 'success' : 'warning'">
            <div class="summary-icon">
              <el-icon v-if="preQCResult.passed">
                <CircleCheck />
              </el-icon>
              <el-icon v-else>
                <Warning />
              </el-icon>
            </div>
            <div class="summary-content">
              <div class="summary-title">{{ preQCResult.passed ? '质控通过' : '质控未通过' }}</div>
              <div class="summary-desc">
                {{ preQCResult.passed ? '所有文件已通过前置质控，可以提交上报' : '部分文件存在问题，请修复后重新上传' }}
              </div>
            </div>
          </div>
        </div>

        <!-- 质控详情表格 -->
        <el-table
          :data="preQCResult.details"
          @selection-change="handleSelectionChange"
          :show-overflow-tooltip="true"
        >
          <el-table-column
            type="selection"
            width="55"
            align="center"
            :selectable="checkboxDisabled"
          />
          <el-table-column label="序号" width="60" type="index" align="center" />
          <el-table-column prop="name" label="标准文件名称" min-width="180" align="center" />
          <el-table-column prop="status" label="上传状态" width="120" align="center">
            <template #default="{ row }">
              <dict-tag :type="DICT_TYPE.UPLOAD_STATUS" :value="row.status" />
            </template>
          </el-table-column>
          <el-table-column prop="qcStatus" label="质检状态" width="120" align="center">
            <template #default="{ row }">
              <dict-tag :type="DICT_TYPE.QC_STATUS" :value="row.qcStatus" />
            </template>
          </el-table-column>
          <el-table-column prop="size" label="文件大小" width="120" align="center">
            <template #default="{ row }">
              {{ formatFileSize(row.size) }}
            </template>
          </el-table-column>
          <el-table-column prop="fileFormat" label="文件格式" width="120" align="center" />
          <el-table-column prop="errorCount" label="错误数" width="100" align="center">
            <template #default="{ row }">
                  <span :class="row.errorCount > 0 ? 'error-count' : ''">
                    {{ row.errorCount || 0 }}
                  </span>
            </template>
          </el-table-column>
          <el-table-column label="质控进度" width="180" align="center">
            <template #default="{ row }">
              <el-progress
                :percentage="getQCProgress(row.qcStatus)"
                :color="getQCProgressColor(row.qcStatus)"
                :stroke-width="8"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right" align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                :disabled="currentStep < currentTask.maxCurrentStep"
                @click="viewFileData(row)"
              >
                <Icon icon="ep:view" class="mr-5px" />
                查看详情
              </el-button>
              <el-button
                v-if="row.qcStatus === 4"
                type="danger"
                size="small"
                :disabled="currentStep < currentTask.maxCurrentStep"
                @click="viewQCErrors(row)"
              >
                <Icon icon="ep:warning" class="mr-5px" />
                查看错误
              </el-button>
              <el-button
                v-if="row.qcStatus === 4"
                type="warning"
                size="small"
                :disabled="currentStep < currentTask.maxCurrentStep"
                @click="fixAndReupload(row)"
              >
                <Icon icon="ep:refresh" class="mr-5px" />
                修复重传
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="qc-actions">
          <el-button @click="backToUpload" :disabled="currentStep < currentTask.maxCurrentStep">
            <Icon icon="ep:back" class="mr-5px" />
            返回上传
          </el-button>
          <el-button
            type="primary"
            :disabled="!preQCResult.passed || currentStep < currentTask.maxCurrentStep"
            @click="startSubmitReport"
          >
            <Icon icon="ep:promotion" class="mr-5px" />
            开始提交上报
          </el-button>
        </div>
        </div>
      </div>

      <!-- 步骤3: 提交上报 -->
      <div v-if="currentStep === 3" class="step-content">
        <h3 class="step-title">提交上报</h3>
        <div class="submit-section">
        <!-- 上报信息 -->
        <div class="submit-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="任务名称">
              {{ submitInfo.taskName }}
            </el-descriptions-item>
            <el-descriptions-item label="开始日期">
              {{ formatDateTime(submitInfo.startDate) }}
            </el-descriptions-item>
            <el-descriptions-item label="结束日期">
              {{ formatDateTime(submitInfo.endDate) }}
            </el-descriptions-item>
            <el-descriptions-item label="上报时间">
              {{ formatDateTime(submitInfo.reportTime) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 文件列表 -->
        <el-table
          :data="preQCResult.details"
          :show-overflow-tooltip="true"
        >
          <el-table-column label="序号" width="60" type="index" align="center" />
          <el-table-column prop="name" label="标准文件名称" min-width="180" align="center" />
          <el-table-column prop="status" label="上传状态" width="120" align="center">
            <template #default="{ row }">
              <dict-tag :type="DICT_TYPE.UPLOAD_STATUS" :value="row.status" />
            </template>
          </el-table-column>
          <el-table-column prop="qcStatus" label="质检状态" width="140" align="center">
            <template #default="{ row }">
              <dict-tag :type="DICT_TYPE.QC_STATUS" :value="row.qcStatus" />
            </template>
          </el-table-column>
          <el-table-column prop="size" label="文件大小" width="120" align="center">
            <template #default="{ row }">
              {{ formatFileSize(row.size) }}
            </template>
          </el-table-column>
          <el-table-column prop="fileFormat" label="文件格式" width="120" align="center" />
<!--          <el-table-column label="完成度" width="180" align="center">
            <template #default="{ row }">
              <el-progress
                :percentage="100"
                :color="getProgressColor(100)"
                :stroke-width="8"
              />
            </template>
          </el-table-column>-->
          <el-table-column label="操作" width="150" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewFileData(row)">
                <Icon icon="ep:view" class="mr-5px" />
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="qc-actions">
          <el-button @click="() => (currentTask.currentStep = 2)">
            <Icon icon="ep:back" class="mr-5px" />
            返回前置质控
          </el-button>
          <el-button
            type="success"
            size="large"
            :disabled="!preQCResult.passed"
            @click="submitReport"
          >
            <Icon icon="ep:promotion" class="mr-5px" />
            确认提交上报
          </el-button>
        </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 错误详情对话框 -->
  <Dialog v-model="errorDialog.visible" title="质检提示" width="600px">
    <div class="quality-details">
      <div class="detail-header">
        <el-icon class="detail-icon">
          <Warning />
        </el-icon>
        <h4>质检初审不通过</h4>
      </div>
      <div class="quality-details-content">
        <div class="detail-item">
          <span class="detail-label">文件名称:</span>
          <span>{{ errorDialog.fileName }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">未通过原因：</span>
          <div class="error-messages">{{ errorDialog.errors }}</div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="errorDialog.visible = false">关闭</el-button>
    </template>
  </Dialog>

  <!-- 数据查看对话框 -->
  <Dialog
    v-model="dataViewDialog.visible"
    :title="`查看数据 - ${dataViewDialog.fileName}`"
    width="80%"
    top="5vh"
  >
    <component :is="excelDetailTarget" :dataViewDialog="dataViewDialog" ref="excelDetail" />
    <div class="dialog-page">
      <Pagination
        :total="excelDetailTotal"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getExcelDetailData"
      />
    </div>
  </Dialog>

  <!-- Excel预览弹窗 -->
  <ExcelPreviewDialog ref="excelPreviewRef" />
</template>

<script setup lang="ts">
import request from '@/config/axios'
import { ref, reactive, computed, onMounted } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'
import {
  Download,
  Upload,
  UploadFilled,
  CircleCheck,
  Warning,
  InfoFilled,
  Document,
  Promotion,
  Calendar,
  Timer,
  OfficeBuilding as Hospital,
  Files
} from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader/index.vue'
import { ContentWrap } from '@/components/ContentWrap'
import DictTag from '@/components/DictTag/src/DictTag.vue'
import ExcelPreviewDialog from '@/views/drug/import/batch/components/ExcelPreviewDialog.vue'
import {
  ReportDataApi
} from '@/api/drug/reportdata'
import { ImportTemplateApi } from '@/api/drug/task/template'
import { TemplateFieldApi } from '@/api/drug/task/template'
import download from '@/utils/download'
import { DICT_TYPE } from '@/utils/dict'
import { getProgressColor } from '@/utils/progressColor'
import hospitalDetails from './excel-detail/hospital.vue'
import inboundDetails from './excel-detail/inbound.vue'
import outboundDetails from './excel-detail/outbound.vue'
import usageDetails from './excel-detail/usage.vue'
import catalogDetails from './excel-detail/catalog.vue'

defineOptions({ name: 'DrugReportData' })

const message = useMessage()

// ==================== 数据定义 ====================
const tableDefinitions = ref<any>({})
const loadingTemplates = ref(false)
const excelPreviewRef = ref()
const currentStep = computed(() => currentTask.value.currentStep || 0)
const loading = ref(false)
const route = useRoute()
const router = useRouter()
const queryData = route.query

const currentTask = ref<any>({
  id: null,
  taskName: '',
  status: 1,
  startDate: '',
  endDate: '',
  hospitalId: null,
  hospitalName: '',
  description: '',
  taskId: queryData.taskId ? Number(queryData.taskId) : null,
  reportStatus: 0
})

const fileList = ref([
  { id: 1, name: '医疗机构基本情况.xlsx', type: 'hospital', status: 0, size: 0, recordCount: 0 },
  { id: 2, name: '医疗机构药品目录.xlsx', type: 'catalog', status: 0, size: 0, recordCount: 0 },
  { id: 3, name: '医疗机构入库情况.xlsx', type: 'inbound', status: 0, size: 0, recordCount: 0 },
  { id: 4, name: '医疗机构出库情况.xlsx', type: 'outbound', status: 0, size: 0, recordCount: 0 },
  { id: 5, name: '医疗机构使用情况.xlsx', type: 'usage', status: 0, size: 0, recordCount: 0 }
])

const selectedFileIds = ref([])

const preQCResult = ref({
  passed: false,
  details: []
})

const submitInfo = ref({
  taskName: '',
  startDate: '',
  endDate: '',
  reportTime: ''
})

const excelDetailTotal = ref(0)
const queryParams = ref({
  pageNo: 1,
  pageSize: 100
})

const dataViewDialog = ref({
  visible: false,
  loading: false,
  fileName: '',
  data: []
})
const activeFile = ref()

const errorDialog = ref({
  visible: false,
  fileName: '',
  errors: []
})

// ==================== 计算属性 ====================
const excelDetailTarget = computed(() => {
  if (!activeFile.value) return null
  const typeMap = {
    hospital: hospitalDetails,
    catalog: catalogDetails,
    inbound: inboundDetails,
    outbound: outboundDetails,
    usage: usageDetails
  }
  return typeMap[activeFile.value.type] || null
})

const remainingDays = computed(() => {
  if (!currentTask.value.endDate) return 0
  const end = new Date(currentTask.value.endDate)
  const now = new Date()
  const diff = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
})

const reportMeta = computed(() => {
  const meta: any[] = []
  if (currentTask.value.startDate && currentTask.value.endDate) {
    meta.push({
      label: '上报期限',
      value: `${formatDate(currentTask.value.startDate)} 至 ${formatDate(currentTask.value.endDate)}`,
      icon: Calendar
    })
  }
  if (currentTask.value.endDate) {
    const days = remainingDays.value
    meta.push({
      label: days > 0 ? '剩余天数' : '逾期天数',
      value: Math.abs(days) + '天',
      icon: Timer
    })
  }
  if (currentTask.value.hospitalName) {
    meta.push({
      label: '机构',
      value: currentTask.value.hospitalName,
      icon: Hospital
    })
  }
  return meta
})

const handleBackToList = () => {
  currentTask.value.currentStep = currentTask.value.maxCurrentStep || 0
  router.push({ name: 'DrugReportSubmission' })
}

const allFilesUploaded = computed(() => {
  return fileList.value.every((file) => file.status === 2)
})

// 计算总文件数
const totalFileCount = computed(() => {
  return fileList.value.length
})

// 计算已上传文件数
const uploadedFileCount = computed(() => {
  return fileList.value.filter(file => file.status === 2).length
})

// 计算整体上传完成度
const overallUploadProgress = computed(() => {
  if (totalFileCount.value === 0) return 0
  return Math.round((uploadedFileCount.value / totalFileCount.value) * 100)
})

// ==================== 方法定义 ====================
function checkboxDisabled(row) {
  return [2, 3].includes(row.qcStatus)
}

function handleSelectionChange(val) {
  selectedFileIds.value = val.map((item) => item.id)
}

function changeSteps(step: number) {
  if (step <= currentTask.value.maxCurrentStep) {
    currentTask.value.currentStep = step
  }
}

const getProcessStatus = () => {
  if (currentTask.value.currentStep === 3) return 'success'
  return 'process'
}

// 获取质控进度
const getQCProgress = (qcStatus: number) => {
  const progressMap = {
    0: 0,
    1: 50,
    2: 100,
    3: 100,
    4: 100
  }
  return progressMap[qcStatus] || 0
}

// 获取质控进度颜色
const getQCProgressColor = (qcStatus: number) => {
  const colorMap = {
    0: '#909399',
    1: '#409eff',
    2: '#67c23a',
    3: '#e6a23c',
    4: '#f56c6c'
  }
  return colorMap[qcStatus] || '#909399'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatDateTime = (date: Date | string) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  if (!bytes) return '-'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const downloadTemplate = async () => {
  try {
    message.notify('正在生成标准模板压缩包...')
    const data = await ImportTemplateApi.downloadStandardTemplatesZip()
    download.zip(data, '标准导入模板.zip')
    message.notifySuccess('标准模板压缩包下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    message.notifyError('下载失败，请重试')
  }
}

const previewTemplate = (templateId: number) => {
  if (currentTask.value.currentStep < currentTask.value.maxCurrentStep) return
  excelPreviewRef.value?.open(templateId)
}

const loadTemplateDefinitions = async () => {
  try {
    loadingTemplates.value = true
    const templates = await ImportTemplateApi.getImportTemplateListByTableType()
    const templatePromises = templates.map(async (template: any) => {
      try {
        const fields = await TemplateFieldApi.getTemplateFieldListByTemplateId(template.id)
        const requiredFields = fields.filter((field: any) => field.isRequired)
        return {
          id: template.id,
          fileName: template.templateName + '.xlsx',
          type: template.tableType,
          fieldCount: template.fieldCount || fields.length,
          downloadCount: template.downloadCount || 0,
          requiredFieldsCount: requiredFields.length,
          requiredFields: requiredFields.map((field: any) => field.fieldName),
          color: getTemplateColor(template.tableType)
        }
      } catch (error) {
        console.warn(`获取模板 ${template.id} 字段信息失败:`, error)
        return {
          id: template.id,
          name: template.templateName,
          fileName: template.templateCode + '.xlsx',
          description: template.titleText || '数据导入模板',
          fieldCount: template.fieldCount || 0,
          downloadCount: template.downloadCount || 0,
          requiredFieldsCount: 0,
          requiredFields: [],
          color: getTemplateColor(template.tableType)
        }
      }
    })
    const templateData = await Promise.all(templatePromises)
    const definitions: any = {}
    templateData.forEach((template) => {
      definitions[template.id] = template
    })
    tableDefinitions.value = definitions
  } catch (error) {
    console.error('加载模板定义失败:', error)
    message.notifyError('加载模板信息失败，将使用默认配置')
  } finally {
    loadingTemplates.value = false
  }
}

const getTemplateColor = (tableType: string): string => {
  const colorMap: Record<string, string> = {
    hospital: '#409eff',
    catalog: '#67c23a',
    inbound: '#e6a23c',
    outbound: '#f56c6c',
    usage: '#909399'
  }
  return colorMap[tableType] || '#409eff'
}

const startUpload = async () => {
  try {
    loading.value = true
    await updateReportProgress(1)
    currentTask.value.currentStep = 1
    currentTask.value.maxCurrentStep = 1
  } finally {
    loading.value = false
  }
}

const handleFileChange = async (uploadFile: any) => {
  const file = uploadFile.raw
  if (!file) return
  try {
    loading.value = true
    message.notify('正在上传文件...')
    const isZip = file.name.toLowerCase().endsWith('.zip')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('taskId', currentTask.value.taskId)
    await request.post({
      url: '/drug/report-data/validate-and-parse',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    message.notifySuccess(isZip ? '压缩包上传成功，正在解析文件...' : '文件上传成功')
    await loadFileList(currentTask.value.taskId)
  } catch (error) {
    console.error('文件上传失败:', error)
    message.notifyError('文件上传失败，请重试')
  } finally {
    loading.value = false
  }
}

const viewFileData = async (file: any) => {
  excelDetailTotal.value = 0
  queryParams.value.pageNo = 1
  activeFile.value = file
  getExcelDetailData()
}

const getExcelDetailData = async () => {
  const file = activeFile.value
  dataViewDialog.value.loading = true
  dataViewDialog.value.fileName = file.name
  dataViewDialog.value.visible = true
  try {
    const result = await ReportDataApi.getFileData(
      file.type,
      file.taskId,
      file.id,
      queryParams.value.pageNo,
      queryParams.value.pageSize
    )
    if (result?.total) {
      excelDetailTotal.value = result.total
      const list = result.list
      list.forEach((item, index) => {
        item.orderNo = (queryParams.value.pageNo - 1) * queryParams.value.pageSize + index + 1
      })
      dataViewDialog.value.data = list
    } else {
      dataViewDialog.value.data = []
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    message.notifyError('加载数据失败')
  } finally {
    dataViewDialog.value.loading = false
  }
}

const removeFile = (file: any) => {
  message.confirm(`确定删除文件 ${file.name}？`).then(async () => {
    try {
      await ReportDataApi.deleteFile(file.id)
      message.notifySuccess('文件已删除')
      file.status = 0
      file.size = 0
      file.recordCount = 0
    } catch (error) {
      console.error('删除文件失败:', error)
      message.notifyError('删除文件失败')
    }
  })
}

const updateReportProgress = async (progress: number) => {
  if (!currentTask.value.taskId) {
    console.warn('任务ID不存在，无法更新上报进度')
    return
  }
  try {
    await ReportDataApi.updateReportProgress(currentTask.value.taskId, progress)
  } catch (error) {
    console.error('更新上报进度失败:', error)
  }
}

const startPreQC = async () => {
  message.notify('正在进行前置质控...')
  if (currentTask.value.maxCurrentStep === 1) {
    loading.value = true
    try {
      await updateReportProgress(2)
      currentTask.value.currentStep = 2
      currentTask.value.maxCurrentStep = 2
      await operateQCResults(currentTask.value.taskId)
      await loadQCResults(currentTask.value.taskId)
    } catch (error) {
      console.error('前置质控失败:', error)
      message.notifyError('前置质控失败，请重试')
    } finally {
      loading.value = false
    }
  } else {
    loading.value = true
    try {
      await operateQCResults(currentTask.value.taskId)
      currentTask.value.currentStep = 2
      await loadQCResults(currentTask.value.taskId)
    } catch (error) {
      console.error('前置质控失败:', error)
      message.notifyError('前置质控失败，请重试')
    } finally {
      loading.value = false
    }
  }
}

const viewQCErrors = async (row: any) => {
  if (row.qcStatus !== 4 || currentStep.value < currentTask.value.maxCurrentStep) {
    return
  }
  try {
    const data = await ReportDataApi.getQCErrors(currentTask.value.taskId, row.type)
    errorDialog.value.errors = data.errors
      ?.map((item) => `第${item.excelRowNum}行: ${item.errorMessage}`)
      ?.join('\n')
    errorDialog.value.fileName = row.name
    errorDialog.value.visible = true
  } catch (error) {
    console.error('获取错误详情失败:', error)
    message.notifyError('获取错误详情失败')
    errorDialog.value.errors = []
  }
}

const fixAndReupload = (row: any) => {
  message.notify(`请修正 ${row.name} 的错误后重新上传`)
  currentTask.value.currentStep = 1
}

const backToUpload = async () => {
  currentTask.value.currentStep = 1
}

const startSubmitReport = async () => {
  currentTask.value.currentStep = 3
  currentTask.value.maxCurrentStep = 3
  await updateReportProgress(3)

  // 填充提交信息
  submitInfo.value = {
    taskName: currentTask.value.taskName,
    startDate: currentTask.value.startDate,
    endDate: currentTask.value.endDate,
    reportTime: new Date().toISOString()
  }
}

const submitReport = async () => {
  let fileIds = selectedFileIds.value
  if (preQCResult.value.passed) {
    fileIds = preQCResult.value.details.map((item) => item.id)
  }
  if (!fileIds.length) {
    message.warning('请选择需要提交的文件')
    return
  }
  try {
    await message.confirm(
      '数据上报提交后将无法修改，请确认所有信息无误后再提交。提交后系统将自动进行最终审核！'
    )
    loading.value = true
    await ReportDataApi.submitReport(currentTask.value.taskId, fileIds)
    message.notifySuccess('数据已成功提交上报')
    // 提交成功后自动跳转到列表页并刷新
    setTimeout(() => {
      router.push({
        name: 'DrugReportSubmission',
        params: { refresh: Date.now() }
      })
    }, 1500)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('提交上报失败:', error)
      message.notifyError('提交上报失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

// ==================== 生命周期 ====================
onMounted(() => {
  loadTemplateDefinitions()
  loadCurrentTask()
})

// ==================== 数据加载方法 ====================
const loadCurrentTask = async () => {
  try {
    loading.value = true
    if (!currentTask.value.taskId) {
      message.warning('任务ID不存在')
      return
    }
    const task = await ReportDataApi.getCurrentActiveTask(currentTask.value.taskId)
    if (task) {
      task.maxCurrentStep = task.currentStep || 0
      task.currentStep = task.currentStep || 0
      currentTask.value = task
      if (task.taskId || currentTask.value.taskId) {
        const taskId = task.taskId || currentTask.value.taskId
        if (currentStep.value >= 1) {
          await loadFileList(taskId)
        }
        if (currentStep.value >= 2) {
          await loadQCResults(taskId)
        }
        if (currentStep.value >= 3) {
          submitInfo.value = {
            taskName: task.taskName,
            startDate: task.startDate,
            endDate: task.endDate,
            reportTime: task.reportTime
          }
        }
      }
    } else {
      message.warning('当前没有激活的上报任务，请联系管理员')
    }
  } catch (error) {
    console.error('加载任务信息失败:', error)
    message.notifyError('加载任务信息失败，请刷新重试')
  } finally {
    loading.value = false
  }
}

const loadFileList = async (taskId: number) => {
  try {
    const files = await ReportDataApi.getFileList(taskId)
    fileList.value = fileList.value.map((localFile) => {
      const serverFile = files.find((f: any) => f.fileType === localFile.type)
      if (serverFile) {
        return {
          ...localFile,
          taskId: currentTask.value.taskId,
          id: serverFile.id,
          status: serverFile.uploadStatus,
          size: serverFile.fileSize,
          recordCount: serverFile.recordCount
        }
      }
      return localFile
    })
  } catch (error) {
    console.error('加载文件列表失败:', error)
  }
}

async function operateQCResults(taskId: number) {
  try {
    await ReportDataApi.executePreQC(taskId)
  } catch (error) {
    console.error('执行前置质控失败:', error)
  }
}

const loadQCResults = async (taskId: number) => {
  try {
    if (currentStep.value >= 2) {
      const files = await ReportDataApi.getFileList(taskId)
      preQCResult.value.passed = !files.find((item) => [0, 1, 4, null].includes(item.qcStatus))
      preQCResult.value.details = fileList.value.map((localFile) => {
        const serverFile = files.find((f: any) => f.fileType === localFile.type)
        if (serverFile) {
          return {
            ...localFile,
            qcStatus: serverFile.qcStatus,
            fileFormat: serverFile.fileFormat,
            errorCount: serverFile.errorCount
          }
        }
        return localFile
      })
    }
  } catch (error) {
    console.error('加载质控结果失败:', error)
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}

/* 步骤条样式优化 */
.progress-card {
  margin-bottom: 20px;
}

/* 所有步骤图标改为圆形 */
:deep(.el-step__icon) {
  border-radius: 50% !important;
}

/* 可点击的步骤样式 */
:deep(.step-clickable) {
  cursor: pointer !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

:deep(.step-clickable .el-step__icon) {
  cursor: pointer !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50% !important;
}

:deep(.step-clickable .el-step__title) {
  cursor: pointer !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 可点击步骤的 hover 效果 - 增强版 */
:deep(.step-clickable:hover .el-step__icon) {
  transform: scale(1.2) translateY(-3px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4), 0 2px 6px rgba(64, 158, 255, 0.2);
  filter: brightness(1.1);
}

:deep(.step-clickable:hover .el-step__title) {
  color: #409eff !important;
  font-weight: 600;
  transform: translateY(-2px);
}

:deep(.step-clickable:hover .el-step__description) {
  color: #409eff !important;
}

/* 已完成的可点击步骤 hover 效果 - 增强版 */
:deep(.step-clickable.is-finish:hover .el-step__icon) {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%) !important;
  border-color: #409eff !important;
  border-radius: 50% !important;
  animation: pulse 0.6s ease-in-out;
}

:deep(.step-clickable.is-finish:hover .el-step__icon .el-icon) {
  color: #ffffff !important;
  transform: scale(1.1);
}

/* 可点击步骤在非hover状态下添加微妙提示 */
:deep(.step-clickable .el-step__icon) {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
  border-radius: 50% !important;
}

:deep(.step-clickable.is-finish .el-step__icon) {
  position: relative;
  border-radius: 50% !important;
}

:deep(.step-clickable.is-finish .el-step__icon::after) {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: #67c23a;
  border-radius: 50%;
  border: 2px solid #ffffff;
  animation: blink 2s ease-in-out infinite;
}

/* 当前激活的步骤样式增强 */
:deep(.el-step.is-process .el-step__icon) {
  border-color: #409eff;
  border-radius: 50% !important;
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
  animation: breathe 2s ease-in-out infinite;
}

/* 动画效果 */
@keyframes pulse {
  0%, 100% {
    transform: scale(1.2) translateY(-3px);
  }
  50% {
    transform: scale(1.25) translateY(-4px);
  }
}

@keyframes breathe {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(64, 158, 255, 0.15);
  }
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.content-card {
  min-height: 400px;
  background: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.step-content {
  padding: 20px 0;
}

.step-header-with-progress {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e4e7ed;
  gap: 20px;
}

.step-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  flex-shrink: 0;
}

.upload-progress-inline {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  max-width: 500px;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}

.progress-text {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.progress-percent {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
  min-width: 50px;
  text-align: right;
}

.progress-percent.complete {
  color: #67c23a;
}

/* 准备阶段样式 */
.prepare-section {
  max-width: 800px;
  margin: 0 auto;
}

.prepare-actions {
  margin-top: 32px;
  display: flex;
  gap: 16px;
  justify-content: center;
}

/* 文件要求区域优化样式 */
.requirements-section {
  width: 100%;
}

.requirements-content {
  text-align: center;
  padding: 20px;
  width: 100%;
  margin: 0 auto;
}

.requirements-header {
  margin-bottom: 32px;
}

.requirements-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.requirements-subtitle {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

.file-list-container {
  margin: 24px -20px;
  padding: 0 20px 8px 20px;
  overflow-x: auto;
  overflow-y: hidden;
}

.file-list-container::-webkit-scrollbar {
  height: 8px;
}

.file-list-container::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}

.file-grid {
  display: flex;
  gap: 16px;
  width: max-content;
  min-width: 100%;
  padding: 0 16px;
}

.file-card {
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  width: 240px;
  flex-shrink: 0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.file-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.file-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.file-card-icon {
  font-size: 24px;
  margin-right: 12px;
}

.file-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  text-align: left;
}

.file-card-content {
  text-align: left;
}

.file-card-name {
  font-size: 13px;
  font-weight: 500;
  color: #409eff;
  margin-bottom: 8px;
}

.file-card-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.field-count,
.required-fields,
.download-count {
  font-size: 11px;
  color: #666;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 12px;
}

.required-fields {
  background: #fef0f0;
  color: #f56c6c;
}

.download-count {
  background: #e6f7ff;
  color: #1890ff;
}

.requirements-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
  width: 100%;
  margin-top: 24px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.tip-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.tip-icon.success {
  color: #67c23a;
}

.tip-icon.warning {
  color: #e6a23c;
}

.tip-icon.info {
  color: #409eff;
}

/* 上传区域样式 */
.upload-section {
  max-width: 100%;
}

.batch-upload {
  margin-bottom: 24px;
}

:deep(.upload-dragger) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  padding: 40px;
  border-radius: 8px;
}

:deep(.el-icon--upload) {
  font-size: 48px;
  color: #909399;
  margin-bottom: 16px;
}

.upload-actions {
  margin-top: 20px;
  text-align: center;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.record-count {
  font-weight: 600;
  color: #409eff;
}

.error-count {
  color: #f56c6c;
  font-weight: 600;
}

.text-info {
  color: #909399;
}

.inline-upload {
  display: inline-block;
}

/* 质控区域样式 */
.qc-section {
  max-width: 100%;
}

.qc-summary {
  margin-bottom: 24px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 8px;
  border: 2px solid;
  transition: all 0.3s ease;
}

.summary-card.success {
  background: var(--el-color-success-light-9);
  border-color: var(--el-color-success);
}

.summary-card.warning {
  background: var(--el-color-warning-light-9);
  border-color: var(--el-color-warning);
}

.summary-icon {
  font-size: 48px;
  display: flex;
  align-items: center;
}

.summary-card.success .summary-icon {
  color: var(--el-color-success);
}

.summary-card.warning .summary-icon {
  color: var(--el-color-warning);
}

.summary-content {
  flex: 1;
}

.summary-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.summary-card.success .summary-title {
  color: var(--el-color-success);
}

.summary-card.warning .summary-title {
  color: var(--el-color-warning);
}

.summary-desc {
  font-size: 14px;
  color: #606266;
}

.qc-actions {
  margin-top: 20px;
  text-align: center;
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 提交区域样式 */
.submit-section {
  max-width: 100%;
  padding: 0;
}

.submit-info {
  margin: 20px 0;
}

.dialog-page {
  overflow: hidden;
  padding-top: 0;
}

/* 质检详情样式优化 */
.quality-details {
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 8px;
  padding: 20px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-icon {
  font-size: 32px;
  color: #f56c6c;
}

.detail-header h4 {
  color: #c53030;
  font-size: 16px;
  margin: 0;
  font-weight: 600;
}

.quality-details-content {
  color: #666;
  font-size: 14px;
  line-height: 1.8;
}

.detail-item {
  margin-bottom: 12px;
}

.detail-label {
  font-weight: 600;
  color: #333;
  display: inline-block;
  width: 100px;
}

.error-messages {
  display: inline-block;
  color: #f56c6c;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .step-header-with-progress {
    flex-direction: column;
    align-items: flex-start;
  }

  .upload-progress-inline {
    width: 100%;
    max-width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .progress-info {
    justify-content: space-between;
    width: 100%;
  }

  .upload-progress-inline .el-progress {
    width: 100% !important;
  }

  .prepare-actions,
  .upload-actions,
  .qc-actions {
    flex-direction: column;
  }

  .file-list-container {
    margin: 16px -16px;
    padding: 0 16px 8px 16px;
  }

  .file-grid {
    padding: 0;
  }

  .file-card {
    width: 220px;
  }

  :deep(.el-descriptions) {
    .el-descriptions__body {
      display: block;
    }
    .el-descriptions__item {
      display: block;
      width: 100% !important;
    }
  }
}

@media (min-width: 1200px) {
  .file-card {
    width: 260px;
  }
}
</style>
