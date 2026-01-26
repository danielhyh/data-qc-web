<!--数据上报流程-->
<template>
  <!-- 上报进度步骤条卡片（含返回按钮） -->
  <ContentWrap class="progress-card">
      <div class="progress-card-header">
        <div class="header-left">
          <el-button class="back-button" @click="handleBackToList" text>
            <el-icon class="back-icon">
              <ArrowLeft />
            </el-icon>
            <span>返回列表</span>
          </el-button>
          <div class="header-divider"></div>
          <h2 class="page-title">数据上报流程</h2>
          <ElTooltip content="点击已完成的步骤可快速跳转" placement="top">
            <el-icon class="step-tip-icon"><QuestionFilled /></el-icon>
          </ElTooltip>
        </div>
        <div class="step-info">
          <span class="step-label">第 {{ currentStep + 1 }} 步</span>
          <span class="step-divider">/</span>
          <span class="step-total">共 5 步</span>
        </div>
      </div>
      
      <el-steps :active="currentStep" align-center :process-status="getProcessStatus()">
        <el-step 
          title="准备" 
          @click="changeSteps(0)"
          :class="{ 'step-clickable': 0 <= currentTask.maxCurrentStep }"
        >
          <template #icon>
            <el-tooltip :content="getStepTooltip(0, '准备阶段', '准备上报文件')" placement="top">
              <el-icon>
                <Document />
              </el-icon>
            </el-tooltip>
          </template>
        </el-step>
        <el-step
          title="上传与校验"
          @click="changeSteps(1)"
          :class="{ 'step-clickable': 1 <= currentTask.maxCurrentStep }"
        >
          <template #icon>
            <el-tooltip :content="getStepTooltip(1, '上传与校验阶段', '上传数据文件并进行基础校验')" placement="top">
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
            <el-tooltip :content="getStepTooltip(2, '前置质控阶段', '数据格式验证')" placement="top">
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
            <el-tooltip :content="getStepTooltip(3, '提交上报阶段', '提交至管理端审核')" placement="top">
              <el-icon>
                <Promotion />
              </el-icon>
            </el-tooltip>
          </template>
        </el-step>
        <el-step
          title="提交国家平台"
          @click="changeSteps(4)"
          :class="{ 'step-clickable': 4 <= currentTask.maxCurrentStep }"
        >
          <template #icon>
            <el-tooltip :content="getStepTooltip(4, '提交国家平台阶段', '提交至国家平台')" placement="top">
              <el-icon>
                <Promotion />
              </el-icon>
            </el-tooltip>
          </template>
        </el-step>
      </el-steps>
    </ContentWrap>

    <!-- 主要内容区域 -->
    <div class="content-card" v-loading="loading && currentStep !== 2">
      <!-- 步骤0: 准备阶段（使用独立组件） -->
      <div v-if="currentStep === 0" class="step-content">
        <PrepareTab
          :table-definitions="tableDefinitions"
          :downloading-template="downloadingTemplate"
          @preview-template="previewTemplate"
          @download-template="downloadTemplate"
          @start-upload="startUpload"
        />
      </div>

      <!-- 步骤1: 上传与校验（使用独立组件） -->
      <div v-if="currentStep === 1" class="step-content">
        <UploadValidateTab
          :task-id="currentTask.taskId"
          :file-list="fileList"
          :step-summary-key="stepSummaryKey"
          :refreshing-file-list="refreshingFileList"
          :can-upload-and-q-c="canUploadAndQC"
          :operation-disabled-reason="operationDisabledReason"
          :downloading-template="downloadingTemplate"
          @refresh-summary="loadStepSummary"
          @summary-close="handleSummaryClose"
          @refresh-file-list="refreshFileList"
          @download-error-summary="downloadErrorSummary"
          @view-file-data="viewFileData"
          @view-error-detail="viewErrorDetail"
          @back-to-prepare="currentStep = 0"
          @start-pre-qc="startPreQC"
          @download-template="downloadTemplate"
          @file-uploaded="handleFileUploaded"
        />
      </div>

      <!-- 步骤2: 前置质控（使用独立组件） -->
      <div v-if="currentStep === 2" class="step-content">
        <PreQcTab
          :task-id="currentTask.taskId"
          :step-summary-key="stepSummaryKey"
          :is-q-c-processing="isQCProcessing"
          :qc-progress="qcProgress"
          :qc-current-phase="qcCurrentPhase"
          :qc-file-progress="qcFileProgress"
          :pre-q-c-result="preQCResult"
          @refresh-summary="loadStepSummary"
          @refresh-file-list="refreshQCFileList"
          @summary-close="handleSummaryClose"
          @view-file-data="viewFileData"
          @view-qc-errors="viewQCErrors"
          @fix-and-reupload="fixAndReupload"
          @back-to-upload="backToUpload"
          @start-submit-report="startSubmitReport"
          @view-report="openQcReportDialog"
        />
      </div>

      <!-- 步骤3: 提交上报（使用独立组件） -->
      <div v-if="currentStep === 3" class="step-content">
        <SubmitReportTab
          :task-id="currentTask.taskId"
          :step-summary-key="stepSummaryKey"
          :review-status="reviewStatus"
          :review-info="reviewInfo"
          :submit-info="submitInfo"
          :pre-q-c-result="preQCResult"
          :refreshing-review="refreshingReview"
          @refresh-summary="loadStepSummary"
          @summary-close="handleSummaryClose"
          @refresh-review-status="refreshReviewStatus"
          @go-to-national-submit="goToNationalSubmit"
          @back-to-upload-for-resubmit="backToUploadForResubmit"
          @view-file-data="viewFileData"
          @back-to-pre-qc="currentStep = 2"
          @submit-report="submitReport"
          @view-post-qc-errors="handleViewPostQcErrors"
        />
      </div>

      <!-- 步骤4: 提交国家平台（使用独立组件） -->
      <div v-if="currentStep === 4" class="step-content">
        <NationalSubmitTab
          :current-task="currentTask"
          :file-count="fileList.length"
          @back-to-submit-report="currentStep = 3"
          @submit-to-national-platform="submitToNationalPlatform"
        />
      </div>
    </div>

  <!-- 错误/警告详情对话框 - 分页表格展示 -->
  <Dialog 
    v-model="errorDialog.visible" 
    :title="errorDialog.isWarning ? '质检警告详情' : '质检错误详情'" 
    width="900px" 
    top="5vh"
  >
    <div class="qc-error-details">
      <!-- 头部统计信息 -->
      <div class="error-header">
        <div class="header-info">
          <el-icon :class="['header-icon', errorDialog.isWarning ? 'warning' : 'error']">
            <WarningFilled />
          </el-icon>
          <div class="header-content">
            <h3 class="header-title">{{ errorDialog.fileName }}</h3>
            <p class="header-subtitle">
              共检测到 <span :class="errorDialog.isWarning ? 'warning-count-text' : 'error-count-text'">{{ errorDialog.totalErrors }}</span> 个{{ errorDialog.isWarning ? '警告' : '错误' }}
              <span class="page-info">（当前显示第 {{ (errorDialog.currentPage - 1) * errorDialog.pageSize + 1 }}-{{ Math.min(errorDialog.currentPage * errorDialog.pageSize, errorDialog.totalErrors) }} 条）</span>
            </p>
          </div>
        </div>
        <el-button type="primary" @click="exportQCErrors" :icon="Download" size="default">
          导出全部
        </el-button>
      </div>

      <!-- 错误列表表格 - 只渲染当前页数据 -->
      <div class="error-table-wrapper">
        <el-table
          :data="paginatedErrors"
          border
          max-height="450"
          table-layout="auto"
          class="qc-error-table"
        >
          <el-table-column label="序号" width="70" align="center">
            <template #default="{ $index }">
              {{ (errorDialog.currentPage - 1) * errorDialog.pageSize + $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="row" label="行号" width="90" align="center">
            <template #default="{ row }">
              <el-tag type="danger" size="small">第 {{ row.row }} 行</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="错误详情">
            <template #default="{ row }">
              <div class="error-message-cell">
                <el-icon class="cell-icon"><Warning /></el-icon>
                <div class="error-message-content">
                  <span class="error-main-message">{{ getMainMessage(row.message) }}</span>
                  <span v-if="getCalculationDetails(row.message)" class="error-calculation-details">
                    {{ getCalculationDetails(row.message) }}
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页器 -->
        <div class="error-pagination">
          <el-pagination
            v-model:current-page="errorDialog.currentPage"
            v-model:page-size="errorDialog.pageSize"
            :page-sizes="[20, 50, 100, 200]"
            :total="errorDialog.totalErrors"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @current-change="handleErrorPageChange"
            @size-change="handleErrorSizeChange"
          />
        </div>
      </div>

      <!-- 提示信息 -->
      <div class="error-tips">
        <el-alert
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <div>💡 数据较多时建议导出Excel文件查看。支持切换每页显示数量，可快速跳转到指定页。</div>
          </template>
        </el-alert>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="errorDialog.visible = false">关闭</el-button>
        <el-button type="primary" @click="exportQCErrors" :icon="Download">
          导出全部{{ errorDialog.isWarning ? '警告' : '错误' }} ({{ errorDialog.totalErrors }}条)
        </el-button>
      </div>
    </template>
  </Dialog>

  <!-- 数据查看对话框 -->
  <Dialog
    v-model="dataViewDialog.visible"
    :title="`查看数据 - ${dataViewDialog.fileName}`"
    width="80%"
    top="5vh"
    :scroll="true"
    maxHeight="70vh"
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

  <!-- 上传校验错误详情弹窗（分页表格形式） -->
  <Dialog
    v-model="errorDetailDialog.visible"
    :title="`${errorDetailDialog.fileName} - 校验错误详情`"
    width="950px"
    top="5vh"
    class="validation-error-dialog"
  >
    <div class="validation-error-details">
      <!-- 头部统计信息 -->
      <div class="validation-error-header">
        <div class="header-info">
          <el-icon class="header-icon error">
            <CircleCloseFilled />
          </el-icon>
          <div class="header-content">
            <h3 class="header-title">{{ errorDetailDialog.fileName }}</h3>
            <p class="header-subtitle">
              共 <span class="total-rows">{{ errorDetailDialog.totalRows }}</span> 行数据，
              发现 <span class="error-count-text">{{ errorDetailDialog.errorCount }}</span> 处错误
              （影响 <span class="error-rows-text">{{ errorDetailDialog.errorRows }}</span> 行）
            </p>
          </div>
        </div>
        <div class="header-stats">
          <div class="pass-rate-badge" :class="errorDetailDialog.passRate >= 80 ? 'good' : errorDetailDialog.passRate >= 50 ? 'warning' : 'bad'">
            <span class="rate-value">{{ errorDetailDialog.passRate.toFixed(2) }}%</span>
            <span class="rate-label">通过率</span>
          </div>
        </div>
      </div>

      <!-- 错误列表表格 - 分页展示 -->
      <div class="validation-error-table-wrapper">
        <el-table
          :data="paginatedValidationErrors"
          border
          max-height="400"
          table-layout="auto"
          class="validation-error-table"
          :row-class-name="getValidationErrorRowClass"
        >
          <el-table-column label="序号" width="70" align="center">
            <template #default="{ $index }">
              {{ (errorDetailDialog.currentPage - 1) * errorDetailDialog.pageSize + $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="rowIndex" label="Excel行号" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="danger" size="small">第 {{ row.rowIndex }} 行</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="fieldName" label="字段名" width="150">
            <template #default="{ row }">
              <span class="field-name">{{ row.fieldName }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="currentValue" label="当前值" width="150">
            <template #default="{ row }">
              <span v-if="!row.currentValue || row.currentValue === ''" class="empty-value">(空)</span>
              <span v-else class="invalid-value">{{ row.currentValue }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="errorMessage" label="错误说明" min-width="280">
            <template #default="{ row }">
              <div class="error-message-cell">
                <el-icon class="cell-icon"><Warning /></el-icon>
                <span class="error-message-text">{{ row.errorMessage }}</span>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页器 -->
        <div class="validation-error-pagination">
          <el-pagination
            v-model:current-page="errorDetailDialog.currentPage"
            v-model:page-size="errorDetailDialog.pageSize"
            :page-sizes="[20, 50, 100, 200]"
            :total="filteredValidationErrorsCount"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @current-change="handleValidationErrorPageChange"
            @size-change="handleValidationErrorSizeChange"
          />
        </div>
      </div>

      <!-- 提示信息 -->
      <div class="validation-error-tips">
        <el-alert type="info" :closable="false" show-icon>
          <template #default>
            <div>💡 请根据错误提示修改Excel文件后重新上传。数据较多时建议导出错误清单进行批量修改。</div>
          </template>
        </el-alert>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="errorDetailDialog.visible = false">关闭</el-button>
        <el-button type="warning" @click="exportValidationErrors" :icon="Download">
          导出错误清单 ({{ errorDetailDialog.errorCount }}条)
        </el-button>
        <el-button type="primary" @click="retryUploadFile(errorDetailDialog.fileType)">
          <el-icon><RefreshRight /></el-icon>
          修复重传
        </el-button>
      </div>
    </template>
  </Dialog>

  <!-- Excel预览弹窗 -->
  <ExcelPreviewDialog ref="excelPreviewRef" />

  <!-- 质控报告对话框 -->
  <QcReportDialog
    v-model="qcReportDialogVisible"
    :task-id="currentTask.taskId"
    @view-errors="handleViewErrorsFromReport"
  />

  <!-- 质控错误分组弹框 -->
  <QcErrorGroupedDialog
    v-model="qcErrorGroupedDialog.visible"
    :task-id="qcErrorGroupedDialog.taskId"
    :table-type="qcErrorGroupedDialog.tableType"
    :file-name="qcErrorGroupedDialog.fileName"
    :error-type="qcErrorGroupedDialog.errorType"
  />

  <!-- 后置质控错误详情弹窗（机构端） -->
  <PostQcErrorDetailDialog
    v-model="postQcErrorDialog.visible"
    :task-id="postQcErrorDialog.taskId"
  />
</template>

<script setup lang="ts">
import request from '@/config/axios'
import { ref, computed, onMounted, onActivated, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from '@/hooks/web/useMessage'
import {
  Download,
  Upload,
  CircleCheck,
  Warning,
  Document,
  Promotion,
  ArrowLeft,
  WarningFilled,
  CircleCloseFilled,
  RefreshRight,
  InfoFilled,
  QuestionFilled
} from '@element-plus/icons-vue'
import { ContentWrap } from '@/components/ContentWrap'
import ExcelPreviewDialog from '@/views/drug/import/batch/components/ExcelPreviewDialog.vue'
import QcReportDialog from './components/QcReportDialog.vue'
import QcErrorGroupedDialog from './components/QcErrorGroupedDialog.vue'
import PostQcErrorDetailDialog from './components/PostQcErrorDetailDialog.vue'
import { UploadValidateTab } from './upload-validate'
import { PrepareTab } from './prepare'
import { PreQcTab } from './pre-qc'
import { SubmitReportTab } from './submit-report'
import { NationalSubmitTab } from './national-submit'
import {
  ReportDataApi
} from '@/api/drug/reportdata'
import { ImportTemplateApi } from '@/api/drug/task/template'
import { TemplateFieldApi } from '@/api/drug/task/template'
import { ReportStepSummaryApi } from '@/api/drug/reportstepsummary'
import download from '@/utils/download'
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
// 改为 ref 以便动态设置步骤
const currentStep = ref(0)
const loading = ref(false)
const downloadingTemplate = ref(false)
const refreshingFileList = ref(false)
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
  reportStatus: 0,
  currentStep: 0,
  maxCurrentStep: 0
})

// 文件列表完全从后端获取
const fileList = ref<any[]>([])

const selectedFileIds = ref<number[]>([])

const preQCResult = ref<{
  passed: boolean
  details: any[]
}>({
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
  data: [],
  errorRows: new Set() // 存储有错误的行号
})
const activeFile = ref()

const errorDialog = ref<{
  visible: boolean
  fileName: string
  errors: any[]
  totalErrors: number
  currentPage: number
  pageSize: number
  isWarning: boolean  // 是否为警告模式（区分错误和警告）
}>({
  visible: false,
  fileName: '',
  errors: [],
  totalErrors: 0,
  currentPage: 1,
  pageSize: 50,
  isWarning: false
})

// 质控报告对话框
const qcReportDialogVisible = ref(false)

// 质控错误分组弹框
const qcErrorGroupedDialog = ref({
  visible: false,
  taskId: 0,
  tableType: '',
  fileName: '',
  errorType: 1 // 1=错误，2=警告
})

// 后置质控错误详情弹窗（机构端）
const postQcErrorDialog = ref({
  visible: false,
  taskId: 0
})

// ==================== 上传进度跟踪 ====================
const isUploading = ref(false)
const uploadingFiles = ref<string[]>([])
const uploadProgress = ref<Record<string, any>>({})

// 上传结果
const uploadResult = ref<any>(null)

// 总进度信息（从后端获取）
const overallProgressData = ref<any>(null)

// 错误详情弹窗数据（分页表格形式）
const errorDetailDialog = ref({
  visible: false,
  fileName: '',
  fileType: '',
  totalRows: 0,
  errorRows: 0,      // 错误行数（去重后）
  errorCount: 0,     // 错误字段总数
  passRate: 0,
  requiredErrors: [] as any[],
  typeErrors: [] as any[],
  allErrors: [] as any[],  // 合并后的所有错误（用于分页）
  activeTab: 'all' as 'all' | 'required' | 'type',  // 当前筛选标签
  currentPage: 1,    // 当前页码
  pageSize: 50,      // 每页条数
  expandedGroups: ['required', 'type'], // 默认展开的错误组（兼容旧逻辑）
  expandedTypes: [] as string[] // 控制是否展开全部（兼容旧逻辑）
})

// 质控进度相关数据
const isQCProcessing = ref(false)
const qcProgress = ref(0)
const qcCurrentPhase = ref('准备开始质控...')
const qcFileProgress = ref<Array<{
  name: string
  progress: number
  status: 'pending' | 'processing' | 'success'
}>>([])

// 表类型映射为中文名称
const tableTypeNameMap: Record<string, string> = {
  'hospital': '医疗机构信息',
  'catalog': '药品目录',
  'inbound': '入库数据',
  'outbound': '出库数据',
  'usage': '使用数据'
}

// 审核状态相关数据
// 0=待审核, 1=审核通过, 2=审核驳回
const reviewStatus = ref<number | null>(null)
const reviewInfo = ref<any>(null)
const refreshingReview = ref(false)
let reviewPollingInterval: ReturnType<typeof setInterval> | null = null

// ==================== 计算属性 ====================

/**
 * 是否允许上传和质控操作
 * 只有以下状态允许操作：
 * - 0: 未上报
 * - 2: 已退回（需要修改后重新提交）
 */
const canUploadAndQC = computed(() => {
  const status = currentTask.value.reportStatus
  // 未上报(0) 或 已退回(2) 时允许操作
  return status === 0 || status === 2 || status === null || status === undefined
})

/**
 * 获取不允许操作时的提示信息
 */
const operationDisabledReason = computed(() => {
  const status = currentTask.value.reportStatus
  if (status === 1 || status === 5) {
    return '当前数据正在审核中，不允许上传或执行质控'
  } else if (status === 3) {
    return '审核已通过，不允许修改数据'
  } else if (status === 4) {
    return '数据已提交至国家平台，不允许修改'
  }
  return ''
})
const excelDetailTarget = computed(() => {
  if (!activeFile.value) return null
  const typeMap = {
    hospital: hospitalDetails,
    catalog: catalogDetails,
    inbound: inboundDetails,
    outbound: outboundDetails,
    usage: usageDetails
  }
  return typeMap[activeFile.value.fileType] || null
})

const handleBackToList = () => {
  // 返回列表页，不修改任何状态，保持数据库中的值
  router.push({ name: 'DrugReportSubmission' })
}

// 显示的必填错误（默认显示前5条）
const displayedRequiredErrors = computed(() => {
  return errorDetailDialog.value.expandedTypes.includes('required')
    ? errorDetailDialog.value.requiredErrors
    : errorDetailDialog.value.requiredErrors.slice(0, 5)
})

// 显示的类型错误（默认显示前5条）
const displayedTypeErrors = computed(() => {
  return errorDetailDialog.value.expandedTypes.includes('type')
    ? errorDetailDialog.value.typeErrors
    : errorDetailDialog.value.typeErrors.slice(0, 5)
})

// 分页后的错误数据（性能优化：只渲染当前页）
const paginatedErrors = computed(() => {
  const start = (errorDialog.value.currentPage - 1) * errorDialog.value.pageSize
  const end = start + errorDialog.value.pageSize
  return errorDialog.value.errors.slice(start, end)
})

// 根据筛选条件过滤后的校验错误列表
const filteredValidationErrors = computed(() => {
  const tab = errorDetailDialog.value.activeTab
  if (tab === 'required') {
    return errorDetailDialog.value.requiredErrors
  } else if (tab === 'type') {
    return errorDetailDialog.value.typeErrors
  }
  return errorDetailDialog.value.allErrors
})

// 过滤后的错误总数
const filteredValidationErrorsCount = computed(() => {
  return filteredValidationErrors.value.length
})

// 分页后的校验错误数据
const paginatedValidationErrors = computed(() => {
  const start = (errorDetailDialog.value.currentPage - 1) * errorDetailDialog.value.pageSize
  const end = start + errorDetailDialog.value.pageSize
  return filteredValidationErrors.value.slice(start, end)
})

// ==================== 方法定义 ====================
function changeSteps(step: number) {
  if (step <= currentTask.value.maxCurrentStep) {
    currentStep.value = step
    currentTask.value.currentStep = step
  }
}

// 获取步骤提示文字
function getStepTooltip(targetStep: number, stageName: string, description: string): string {
  const current = currentStep.value
  const maxStep = currentTask.value.maxCurrentStep || 0

  // 如果步骤不可点击
  if (targetStep > maxStep) {
    return description
  }

  // 如果是当前步骤
  if (targetStep === current) {
    return `当前所在：${stageName}`
  }

  // 如果目标步骤在当前步骤之前
  if (targetStep < current) {
    return `点击返回${stageName}`
  }

  // 如果目标步骤在当前步骤之后
  return `点击前往${stageName}`
}

const getProcessStatus = () => {
  if (currentTask.value.currentStep === 3) return 'success'
  return 'process'
}

// ==================== 错误详情弹窗相关方法 ====================

/** 打开错误详情弹窗 */
const viewErrorDetail = async (row: any) => {
  try {
    // 从后端获取错误详情
    const result = await ReportDataApi.getFileValidationErrors(currentTask.value.taskId, row.fileType)

    // 错误行数（去重后），用于计算通过率
    const errorRows = result.errorRows || 0
    // 错误字段总数（用于显示详情）
    const errorFieldCount = result.errorCount || 0
    
    // 处理必填错误，添加errorType标识
    const requiredErrors = (result.requiredErrors || []).map((err: any) => ({
      ...err,
      errorType: 'required',
      currentValue: null
    }))
    
    // 处理类型错误，添加errorType标识
    const typeErrors = (result.typeErrors || []).map((err: any) => ({
      ...err,
      errorType: 'type'
    }))
    
    // 处理组织机构代码错误，添加errorType标识
    const orgCodeErrors = (result.orgCodeErrors || []).map((err: any) => ({
      ...err,
      errorType: 'org_code'
    }))
    
    // 处理基础错误（文件级别错误），转换为统一格式
    const basicErrors = (result.basicErrors || []).map((err: any) => ({
      rowIndex: 0,  // 文件级错误没有行号
      fieldName: '文件处理',
      errorMessage: err.message || '文件处理失败',
      errorType: 'basic',
      currentValue: err.fileName || ''
    }))
    
    // 如果有通用错误信息但没有其他错误，创建一个通用错误条目
    let generalErrors: any[] = []
    if (result.generalErrorMessage && 
        requiredErrors.length === 0 && 
        typeErrors.length === 0 && 
        orgCodeErrors.length === 0 &&
        basicErrors.length === 0) {
      generalErrors = [{
        rowIndex: 0,
        fieldName: '处理错误',
        errorMessage: result.generalErrorMessage,
        errorType: 'general',
        currentValue: ''
      }]
    }
    
    // 合并所有错误并按行号排序
    const allErrors = [...requiredErrors, ...typeErrors, ...orgCodeErrors, ...basicErrors, ...generalErrors]
        .sort((a, b) => (a.rowIndex || 0) - (b.rowIndex || 0))
    
    // 重新计算错误行数（去重，排除文件级错误）
    const errorRowSet = new Set<number>()
    allErrors.forEach(err => {
      if (err.rowIndex && err.rowIndex > 0) errorRowSet.add(err.rowIndex)
    })
    const actualErrorRows = errorRowSet.size
    const actualErrorCount = allErrors.length
    
    // 计算通过率：保留两位小数
    let passRate = 0
    if (result.totalRows > 0) {
      const rawRate = ((result.totalRows - actualErrorRows) / result.totalRows) * 100
      passRate = Math.round(rawRate * 100) / 100  // 保留两位小数
    }
    
    errorDetailDialog.value = {
      visible: true,
      fileName: row.standardFileName || row.originalFileName,
      fileType: row.fileType,
      totalRows: result.totalRows || 0,
      errorRows: actualErrorRows,
      errorCount: actualErrorCount,
      passRate: passRate,
      requiredErrors: requiredErrors,
      typeErrors: typeErrors,
      allErrors: allErrors,
      activeTab: 'all',
      currentPage: 1,
      pageSize: 50,
      expandedGroups: ['required', 'type'],
      expandedTypes: []
    }
  } catch (error) {
    console.error('获取错误详情失败:', error)
    message.error('获取错误详情失败')
  }
}

/** 切换错误组展开/折叠 */
const toggleErrorGroup = (type: string) => {
  const index = errorDetailDialog.value.expandedGroups.indexOf(type)
  if (index > -1) {
    errorDetailDialog.value.expandedGroups.splice(index, 1)
  } else {
    errorDetailDialog.value.expandedGroups.push(type)
  }
}

/** 切换显示全部/部分 */
const toggleExpandType = (type: string) => {
  const index = errorDetailDialog.value.expandedTypes.indexOf(type)
  if (index > -1) {
    errorDetailDialog.value.expandedTypes.splice(index, 1)
  } else {
    errorDetailDialog.value.expandedTypes.push(type)
  }
}

/** 下载错误Excel */
const downloadErrorExcel = async (fileType: string) => {
  try {
    await download.excel(
      await ReportDataApi.downloadErrorExcel(currentTask.value.taskId, fileType),
      `${errorDetailDialog.value.fileName}_错误清单.xlsx`
    )
    message.success('下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    message.error('下载失败')
  }
}

/** 校验错误分页 - 页码变化 */
const handleValidationErrorPageChange = (page: number) => {
  errorDetailDialog.value.currentPage = page
}

/** 校验错误分页 - 每页条数变化 */
const handleValidationErrorSizeChange = (size: number) => {
  errorDetailDialog.value.pageSize = size
  errorDetailDialog.value.currentPage = 1
}

/** 获取校验错误行样式 */
const getValidationErrorRowClass = ({ row }: { row: any }) => {
  if (row.errorType === 'required') return 'required-error-row'
  if (row.errorType === 'org_code') return 'org-code-error-row'
  if (row.errorType === 'basic') return 'basic-error-row'
  if (row.errorType === 'general') return 'general-error-row'
  return 'type-error-row'
}

/** 导出校验错误列表 */
const exportValidationErrors = () => {
  const errors = errorDetailDialog.value.allErrors
  if (!Array.isArray(errors) || errors.length === 0) {
    message.warning('暂无错误数据可导出')
    return
  }

  try {
    const fileName = errorDetailDialog.value.fileName || '校验错误'
    const timestamp = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\//g, '-').replace(/:/g, '-')

    // CSV表头
    let csvContent = '\uFEFF' // UTF-8 BOM
    csvContent += '序号,行号,错误类型,字段名,当前值,错误说明\n'

    // CSV数据行
    errors.forEach((error, index) => {
      const row = error.rowIndex || '-'
      let errorType = '类型错误'
      if (error.errorType === 'required') errorType = '必填为空'
      else if (error.errorType === 'org_code') errorType = '机构代码不匹配'
      const fieldName = (error.fieldName || '').replace(/"/g, '""')
      const currentValue = error.errorType === 'required' ? '(空)' : (error.currentValue || '-').toString().replace(/"/g, '""')
      const errorMessage = (error.errorMessage || '').replace(/"/g, '""')
      csvContent += `${index + 1},"第${row}行","${errorType}","${fieldName}","${currentValue}","${errorMessage}"\n`
    })

    // 创建Blob并下载
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `${fileName}_校验错误清单_${timestamp}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)

    message.success('错误清单导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败，请重试')
  }
}

/** 修复重传 */
const retryUploadFile = (fileType: string) => {
  errorDetailDialog.value.visible = false
  // 触发文件上传
  const file = fileList.value.find(f => f.fileType === fileType)
  if (file) {
    // 这里可以触发单个文件重新上传的逻辑
    message.info('请重新选择文件上传')
  }
}

/** 下载错误汇总 */
const downloadErrorSummary = async () => {
  try {
    await download.excel(
      await ReportDataApi.downloadErrorSummary(currentTask.value.taskId),
      `错误汇总_${currentTask.value.taskName}.xlsx`
    )
    message.success('下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    message.error('下载失败')
  }
}

const downloadTemplate = async () => {
  downloadingTemplate.value = true
  try {
    const data = await ImportTemplateApi.downloadStandardTemplatesZip()
    download.zip(data, '标准导入模板.zip')
    message.success('标准模板压缩包下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    message.error('下载失败，请重试')
  } finally {
    downloadingTemplate.value = false
  }
}

const previewTemplate = (templateId: number) => {
  // 预览模板应该在任何阶段都可用，不需要限制
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
    message.error('加载模板信息失败，将使用默认配置')
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
    await updateCurrentStep(1)
    currentStep.value = 1  // 更新页面显示步骤
    currentTask.value.currentStep = 1
    currentTask.value.maxCurrentStep = 1
  } finally {
    loading.value = false
  }
}

// ==================== 上传进度轮询 ====================
let uploadProgressPollingInterval: ReturnType<typeof setInterval> | null = null

/**
 * 开始轮询上传进度
 */
const startUploadProgressPolling = () => {
  // 清除已有轮询
  stopUploadProgressPolling()
  
  uploadProgressPollingInterval = setInterval(async () => {
    try {
      // 调用后端进度接口
      const progressData = await ReportDataApi.getUploadProgress(currentTask.value.taskId)
      
      if (!progressData || Object.keys(progressData).length === 0) {
        return
      }
      
      // 更新各文件进度
      uploadProgress.value = progressData
      
      // 计算总体进度
      const fileProgresses = Object.values(progressData)
      if (fileProgresses.length > 0) {
        const totalProgress = fileProgresses.reduce((sum: number, p: any) => sum + (p.progress || 0), 0)
        const avgProgress = Math.round(totalProgress / fileProgresses.length)
        overallProgressData.value = { overallProgress: avgProgress }
        
        // 检查是否所有文件都已完成（成功或失败）
        const allCompleted = fileProgresses.every((p: any) => 
          p.status === 'success' || p.status === 'error'
        )
        
        if (allCompleted) {
          // 所有文件处理完成，停止轮询
          stopUploadProgressPolling()
          isUploading.value = false
          
          // 刷新文件列表
          await refreshFileList()
          
          message.success('文件处理完成')
        }
      }
    } catch (error) {
      console.error('轮询上传进度失败:', error)
    }
  }, 1000) // 每1秒轮询一次
}

/**
 * 停止轮询上传进度
 */
const stopUploadProgressPolling = () => {
  if (uploadProgressPollingInterval) {
    clearInterval(uploadProgressPollingInterval)
    uploadProgressPollingInterval = null
  }
}

/**
 * 获取进度条状态
 */
const getProgressStatus = (status: string) => {
  if (status === 'success') return 'success'
  if (status === 'error') return 'exception'
  return undefined // 处理中
}

/**
 * 获取进度标签类型
 */
const getProgressTagType = (status: string) => {
  if (status === 'success') return 'success'
  if (status === 'error') return 'danger'
  if (status === 'validating') return 'warning'
  if (status === 'importing') return 'primary'
  return 'info'
}

/**
 * 拖拽上传文件（使用真实后端进度）
 */
const handleFileChange = async (uploadFile: any) => {
  const file = uploadFile.raw
  if (!file) return

  try {
    isUploading.value = true
    const fileName = file.name

    // 初始化进度
    uploadProgress.value = {}
    overallProgressData.value = { overallProgress: 0 }

    // 调用后端异步上传接口
    const formData = new FormData()
    formData.append('file', file)
    formData.append('taskId', String(currentTask.value.taskId))
    formData.append('originalFileName', file.name)

    // 发起上传请求（异步处理）
    const result = await request.post({
      url: '/drug/report-data/validate-and-parse',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 600000 // 10分钟超时
    })

    // 上传请求已发送，开始轮询进度
    message.info('文件已提交，正在处理...')
    startUploadProgressPolling()

  } catch (error) {
    console.error('文件上传失败:', error)
    message.error('文件上传失败，请重试')
    isUploading.value = false
    uploadProgress.value = {}
    overallProgressData.value = null
    stopUploadProgressPolling()
  }
}

/**
 * 操作列单文件上传（使用真实后端进度）
 */
const handleSingleFileUpload = async (uploadFile: any, row: any) => {
  const file = uploadFile.raw
  if (!file) return

  const fileType = row.fileType
  const displayName = row.standardFileName || row.fileName

  try {
    // 添加到上传中列表
    if (!uploadingFiles.value.includes(fileType)) {
      uploadingFiles.value.push(fileType)
    }

    // 初始化进度
    uploadProgress.value[fileType] = { progress: 0, status: 'uploading' }

    // 调用后端异步上传接口
    const formData = new FormData()
    formData.append('file', file)
    formData.append('taskId', String(currentTask.value.taskId))
    formData.append('originalFileName', file.name)

    const result = await request.post({
      url: '/drug/report-data/validate-and-parse',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 600000 // 10分钟超时
    })

    message.info(`${displayName}已提交，正在处理...`)
    
    // 开始轮询进度（如果还没有轮询）
    if (!uploadProgressPollingInterval) {
      startUploadProgressPolling()
    }

  } catch (error) {
    console.error('文件上传失败:', error)
    message.error(`${displayName}上传失败，请重试`)

    // 从上传中列表移除
    const index = uploadingFiles.value.indexOf(fileType)
    if (index > -1) {
      uploadingFiles.value.splice(index, 1)
    }

    // 标记为失败
    uploadProgress.value[fileType] = { progress: 0, status: 'error' }
    setTimeout(() => {
      delete uploadProgress.value[fileType]
    }, 2000)
  }
}

const viewFileData = async (file: any) => {
  excelDetailTotal.value = 0
  queryParams.value.pageNo = 1
  activeFile.value = file

  // 获取错误信息
  try {
    const errorInfo = await ReportDataApi.getFileValidationErrors(file.taskId, file.fileType)
    const errorRowsSet = new Set()

    // 收集所有错误行号
    if (errorInfo.requiredErrors) {
      errorInfo.requiredErrors.forEach(err => errorRowsSet.add(err.rowIndex))
    }
    if (errorInfo.typeErrors) {
      errorInfo.typeErrors.forEach(err => errorRowsSet.add(err.rowIndex))
    }

    dataViewDialog.value.errorRows = errorRowsSet
  } catch (error) {
    console.warn('获取错误信息失败:', error)
    dataViewDialog.value.errorRows = new Set()
  }

  getExcelDetailData()
}

const getExcelDetailData = async () => {
  const file = activeFile.value
  dataViewDialog.value.loading = true
  dataViewDialog.value.fileName = file.originalFileName || file.standardFileName || file.fileName
  dataViewDialog.value.visible = true
  try {
    const result = await ReportDataApi.getFileData(
      file.fileType,
      file.taskId,
      file.id,
      queryParams.value.pageNo,
      queryParams.value.pageSize
    )
    if (result?.total) {
      excelDetailTotal.value = result.total
      const list = result.list
      list.forEach((item, index) => {
        const rowNum = (queryParams.value.pageNo - 1) * queryParams.value.pageSize + index + 1
        item.orderNo = rowNum
        // 标记是否有错误
        item.hasError = dataViewDialog.value.errorRows.has(rowNum)
      })
      dataViewDialog.value.data = list
    } else {
      dataViewDialog.value.data = []
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    message.error('加载数据失败')
  } finally {
    dataViewDialog.value.loading = false
  }
}

const removeFile = (file: any) => {
  message.confirm(`确定删除文件 ${file.name}？`).then(async () => {
    try {
      await ReportDataApi.deleteFile(file.id)
      message.success('文件已删除')
      file.status = 0
      file.size = 0
      file.recordCount = 0
    } catch (error) {
      console.error('删除文件失败:', error)
      message.error('删除文件失败')
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

const updateCurrentStep = async (step: number) => {
  if (!currentTask.value.taskId) {
    console.warn('任务ID不存在，无法更新当前步骤')
    return
  }
  try {
    await ReportDataApi.updateCurrentStep(currentTask.value.taskId, step)
  } catch (error) {
    console.error('更新当前步骤失败:', error)
  }
}

const startPreQC = async () => {
  if (currentTask.value.maxCurrentStep === 1) {
    try {
      // 1. 立即切换到步骤2并更新后端
      await updateCurrentStep(2)
      currentStep.value = 2
      currentTask.value.currentStep = 2
      currentTask.value.maxCurrentStep = 2

      // 2. 显示质控进度
      isQCProcessing.value = true
      qcProgress.value = 0
      qcCurrentPhase.value = '准备开始质控...'

      // 3. 调用后端质控接口（异步执行）
      const qcPromise = operateQCResults(currentTask.value.taskId)

      // 4. 开始轮询后端进度
      await pollQcProgress(currentTask.value.taskId)

      // 5. 等待质控完成
      await qcPromise

      // 6. 加载质控结果
      await loadQCResults(currentTask.value.taskId)

      message.success('前置质控完成')
    } catch (error) {
      console.error('前置质控失败:', error)
      message.error('前置质控失败，请重试')
    } finally {
      // 延迟隐藏进度条
      setTimeout(() => {
        isQCProcessing.value = false
      }, 1000)
    }
  } else {
    try {
      // 重新质控：先切换步骤，再显示进度
      currentStep.value = 2
      currentTask.value.currentStep = 2

      isQCProcessing.value = true
      qcProgress.value = 0
      qcCurrentPhase.value = '正在重新进行前置质控...'

      // 调用后端质控接口（异步执行）
      const qcPromise = operateQCResults(currentTask.value.taskId)

      // 开始轮询后端进度
      await pollQcProgress(currentTask.value.taskId)

      // 等待质控完成
      await qcPromise

      await loadQCResults(currentTask.value.taskId)

      message.success('前置质控完成')
    } catch (error) {
      console.error('前置质控失败:', error)
      message.error('前置质控失败，请重试')
    } finally {
      setTimeout(() => {
        isQCProcessing.value = false
      }, 1000)
    }
  }
}

// 轮询后端质控进度
const pollQcProgress = async (taskId: number) => {
  return new Promise<void>((resolve, reject) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await ReportDataApi.getQcTaskProgress(taskId)
        
        console.log('[质控进度] 轮询响应:', response)
        
        // 处理响应数据：response 可能直接是 data，也可能包含 data 字段
        const progressData = response.data || response
        
        if (progressData) {
          const { progress, message: msg, currentStage } = progressData
          
          // 转换进度为数字（处理 BigDecimal 或字符串类型）
          const progressNum = Number(progress) || 0
          
          console.log('[质控进度] 进度值:', progressNum, '阶段:', currentStage, '消息:', msg)
          
          // 更新进度
          qcProgress.value = Math.round(progressNum)
          qcCurrentPhase.value = msg || '正在执行质控...'
          
          // 检查是否完成或失败
          if (progressNum >= 100 || currentStage === 'PRE_QC_COMPLETED') {
            console.log('[质控进度] 质控完成，停止轮询')
            clearInterval(pollInterval)
            qcProgress.value = 100
            qcCurrentPhase.value = '前置质控完成'
            resolve()
          } else if (currentStage === 'PRE_QC_FAILED') {
            console.log('[质控进度] 质控失败，停止轮询')
            clearInterval(pollInterval)
            reject(new Error(msg || '前置质控失败'))
          }
        }
      } catch (error) {
        console.error('[质控进度] 获取质控进度失败:', error)
        // 不中断轮询，继续尝试
      }
    }, 1000) // 每1秒轮询一次

    // 设置超时（10分钟）
    setTimeout(() => {
      console.log('[质控进度] 轮询超时')
      clearInterval(pollInterval)
      reject(new Error('质控超时'))
    }, 600000)
  })
}

const viewQCErrors = async (row: any) => {
  // 支持查看错误(qcStatus=4)和警告(qcStatus=3)
  if (row.qcStatus !== 4 && row.qcStatus !== 3) {
    return
  }
  
  // 根据qcStatus确定errorType: qcStatus=4是错误(errorType=1), qcStatus=3是警告(errorType=2)
  const errorType = row.qcStatus === 3 ? 2 : 1
  
  // 使用新的分组弹框
  qcErrorGroupedDialog.value = {
    visible: true,
    taskId: currentTask.value.taskId,
    tableType: row.fileType,
    fileName: row.originalFileName || row.standardFileName || row.fileName,
    errorType: errorType
  }
}

const fixAndReupload = (row: any) => {
  message.info(`请修正 ${row.originalFileName || row.standardFileName || row.fileName} 的错误后重新上传`)
  currentStep.value = 1
  currentTask.value.currentStep = 1
}

// 打开质控报告对话框
const openQcReportDialog = () => {
  qcReportDialogVisible.value = true
}

// 从质控报告中查看错误详情
const handleViewErrorsFromReport = (tableType: string, errorType: number = 1) => {
  // errorType: 1=错误, 2=警告
  // 找到对应的文件
  const file = fileList.value.find(f => f.fileType === tableType)
  if (file) {
    // 使用分组弹框显示错误/警告
    qcErrorGroupedDialog.value = {
      visible: true,
      taskId: currentTask.value.taskId,
      tableType: tableType,
      fileName: file.originalFileName || file.standardFileName || file.fileName,
      errorType: errorType
    }
  } else {
    message.warning('未找到对应的文件')
  }
}

// 处理错误列表分页变化
const handleErrorPageChange = (page: number) => {
  errorDialog.value.currentPage = page
}

// 处理错误列表每页大小变化
const handleErrorSizeChange = (size: number) => {
  errorDialog.value.pageSize = size
  errorDialog.value.currentPage = 1 // 切换每页大小时重置到第一页
}

// 导出质控错误列表
const exportQCErrors = () => {
  if (!Array.isArray(errorDialog.value.errors) || errorDialog.value.errors.length === 0) {
    message.warning('暂无错误数据可导出')
    return
  }

  try {
    // 生成CSV格式数据
    const fileName = errorDialog.value.fileName || '质检错误'
    const timestamp = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\//g, '-').replace(/:/g, '-')

    // CSV表头
    let csvContent = '\uFEFF' // UTF-8 BOM，确保Excel正确识别中文
    csvContent += '序号,行号,错误详情\n'

    // CSV数据行
    errorDialog.value.errors.forEach((error, index) => {
      const row = error.row || '-'
      const message = (error.message || '').replace(/"/g, '""') // 转义双引号
      csvContent += `${index + 1},"第${row}行","${message}"\n`
    })

    // 创建Blob并下载
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `${fileName}_质检错误列表_${timestamp}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)

    message.success('错误列表导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败，请重试')
  }
}

/**
 * 从错误消息中提取主消息（不含计算详情）
 * 计算详情通常以换行符分隔，或以"详情："开头
 */
const getMainMessage = (message: string): string => {
  if (!message) return ''
  
  // 如果消息包含换行符，取第一行作为主消息
  const lines = message.split('\n')
  if (lines.length > 1) {
    return lines[0].trim()
  }
  
  // 如果消息包含"详情："，取详情前的部分
  const detailIndex = message.indexOf('详情：')
  if (detailIndex > 0) {
    return message.substring(0, detailIndex).trim()
  }
  
  return message
}

/**
 * 从错误消息中提取计算详情
 */
const getCalculationDetails = (message: string): string => {
  if (!message) return ''
  
  // 如果消息包含换行符，取第二行及之后作为计算详情
  const lines = message.split('\n')
  if (lines.length > 1) {
    return lines.slice(1).join('\n').trim()
  }
  
  // 如果消息包含"详情："，取详情后的部分
  const detailIndex = message.indexOf('详情：')
  if (detailIndex > 0) {
    return message.substring(detailIndex).trim()
  }
  
  return ''
}

const backToUpload = async () => {
  currentStep.value = 1
  currentTask.value.currentStep = 1
}

const startSubmitReport = async () => {
  currentStep.value = 3
  currentTask.value.currentStep = 3
  currentTask.value.maxCurrentStep = 3
  await updateCurrentStep(3)

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
    message.success('数据已成功提交上报，等待后台审核...')

    // 重新加载任务信息，获取最新的 reportStatus
    await loadCurrentTask()

    // 显示审核状态
    reviewStatus.value = 0 // 待审核
    reviewInfo.value = {
      submitTime: new Date(),
      reviewTime: null,
      reviewer: null,
      reviewComment: null,
      rejectReason: null
    }

    // 开始轮询审核状态
    startReviewPolling()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('提交上报失败:', error)
      message.error('提交上报失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

// 查看后置质控错误详情
const handleViewPostQcErrors = () => {
  postQcErrorDialog.value.visible = true
  postQcErrorDialog.value.taskId = currentTask.value.taskId
}

// 审核状态相关方法

/** 获取审核状态样式类 */
const getReviewStatusClass = () => {
  if (reviewStatus.value === 0) return 'status-pending'
  if (reviewStatus.value === 1) return 'status-approved'
  if (reviewStatus.value === 2) return 'status-rejected'
  return ''
}

/** 获取审核状态文本 */
const getReviewStatusText = () => {
  if (reviewStatus.value === 0) return '等待审核'
  if (reviewStatus.value === 1) return '审核通过'
  if (reviewStatus.value === 2) return '审核驳回'
  return ''
}

/** 获取审核状态描述 */
const getReviewStatusDesc = () => {
  if (reviewStatus.value === 0) return '您的上报数据已提交，管理员正在审核中，请耐心等待...'
  if (reviewStatus.value === 1) return '恭喜！您的上报数据已通过审核，可以提交到国家平台了'
  if (reviewStatus.value === 2) return '很抱歉，您的上报数据未通过审核，请根据驳回原因修改后重新提交'
  return ''
}

/** 获取审核标签类型 */
const getReviewTagType = () => {
  if (reviewStatus.value === 0) return 'warning'
  if (reviewStatus.value === 1) return 'success'
  if (reviewStatus.value === 2) return 'danger'
  return 'info'
}

/** 刷新审核状态 */
const refreshReviewStatus = async () => {
  refreshingReview.value = true
  try {
    // 调用后端接口获取审核状态
    const task = await ReportDataApi.getCurrentActiveTask(currentTask.value.taskId)

    // 保存旧状态，避免不必要的更新
    const oldReportStatus = currentTask.value.reportStatus
    const oldReviewStatus = reviewStatus.value

    // 根据 reportStatus 判断审核状态
    // reportStatus: 1/5=审核中, 2=驳回, 3=通过
    if (task.reportStatus === 3) {
      // 审核通过
      if (oldReportStatus !== 3) {
        currentTask.value.reportStatus = task.reportStatus
        reviewStatus.value = 1
        message.success('审核已通过！')
        stopReviewPolling()
      } else if (oldReviewStatus !== 1) {
        reviewStatus.value = 1
      }
    } else if (task.reportStatus === 2) {
      // 审核驳回
      if (oldReportStatus !== 2) {
        currentTask.value.reportStatus = task.reportStatus
        reviewStatus.value = 2
        message.warning('审核已驳回')
        stopReviewPolling()
      } else if (oldReviewStatus !== 2) {
        reviewStatus.value = 2
      }
    } else if (task.reportStatus === 1 || task.reportStatus === 5) {
      // 审核中
      if (oldReviewStatus !== 0) {
        reviewStatus.value = 0
        message.info('仍在审核中...')
      }
    }

    // 更新审核信息（只在有新信息时更新）
    if (task.reviewTime || task.reviewer || task.reviewComment || task.rejectReason) {
      reviewInfo.value = {
        submitTime: reviewInfo.value?.submitTime || task.submitTime || task.reportTime,
        reviewTime: task.reviewTime,
        reviewer: task.reviewer,
        reviewComment: task.reviewComment,
        rejectReason: task.rejectReason
      }
    }
  } catch (error) {
    console.error('刷新审核状态失败:', error)
    message.error('刷新失败，请重试')
  } finally {
    refreshingReview.value = false
  }
}

/** 开始轮询审核状态 */
const startReviewPolling = () => {
  // 清除已有轮询
  stopReviewPolling()

  reviewPollingInterval = setInterval(async () => {
    try {
      const task = await ReportDataApi.getCurrentActiveTask(currentTask.value.taskId)

      // 只在状态发生变化时才更新，避免不必要的页面刷新
      const oldReportStatus = currentTask.value.reportStatus

      // 根据 reportStatus 判断审核状态
      // reportStatus: 1/5=审核中, 2=驳回, 3=通过
      if (task.reportStatus === 3 && oldReportStatus !== 3) {
        // 审核通过
        currentTask.value.reportStatus = task.reportStatus
        reviewStatus.value = 1
        reviewInfo.value = {
          submitTime: reviewInfo.value?.submitTime || task.submitTime || task.reportTime,
          reviewTime: task.reviewTime,
          reviewer: task.reviewer,
          reviewComment: task.reviewComment,
          rejectReason: task.rejectReason
        }
        stopReviewPolling()
        message.success('审核已通过！可以提交到国家平台了')
      } else if (task.reportStatus === 2 && oldReportStatus !== 2) {
        // 审核驳回
        currentTask.value.reportStatus = task.reportStatus
        reviewStatus.value = 2
        reviewInfo.value = {
          submitTime: reviewInfo.value?.submitTime || task.submitTime || task.reportTime,
          reviewTime: task.reviewTime,
          reviewer: task.reviewer,
          reviewComment: task.reviewComment,
          rejectReason: task.rejectReason
        }
        stopReviewPolling()
        message.warning('审核已驳回，请查看驳回原因')
      }
      // 审核中状态不更新任何数据，避免页面刷新
    } catch (error) {
      console.error('轮询审核状态失败:', error)
    }
  }, 5000) // 每5秒轮询一次
}

/** 停止轮询审核状态 */
const stopReviewPolling = () => {
  if (reviewPollingInterval) {
    clearInterval(reviewPollingInterval)
    reviewPollingInterval = null
  }
}

/** 进入国家平台提交 */
const goToNationalSubmit = async () => {
  try {
    // 直接跳转到步骤4
    currentStep.value = 4
    currentTask.value.currentStep = 4
    currentTask.value.maxCurrentStep = 4
    await updateCurrentStep(4)

    // 清除审核状态显示
    reviewStatus.value = null
    reviewInfo.value = null

    message.success('已进入国家平台提交步骤')
  } catch (error) {
    console.error('进入国家平台提交失败:', error)
    message.error('操作失败，请重试')
  }
}

/** 驳回后返回重新上传 */
const backToUploadForResubmit = async () => {
  try {
    await message.confirm('返回后需要重新上传文件并提交，确认继续？')

    // 重置步骤到上传阶段
    currentStep.value = 1
    currentTask.value.currentStep = 1
    currentTask.value.maxCurrentStep = 1
    await updateCurrentStep(1)

    // 清空审核状态
    reviewStatus.value = null
    reviewInfo.value = null

    message.info('请重新上传文件')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('返回失败:', error)
      message.error('操作失败，请重试')
    }
  }
}

/** 提交到国家平台 */
const submitToNationalPlatform = async () => {
  try {
    await message.confirm('确认提交数据到国家平台？提交后将无法撤回')

    loading.value = true

    // 模拟提交过程
    message.info('正在提交到国家平台...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 调用后端接口
    // await ReportDataApi.submitNationalPlatform(currentTask.value.taskId)

    message.success('数据已成功提交到国家平台！')

    // 提交成功后返回列表
    setTimeout(() => {
      router.push({
        name: 'DrugReportSubmission',
        params: { refresh: Date.now() }
      })
    }, 1500)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('提交国家平台失败:', error)
      message.error('提交失败，请重试')
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

onActivated(() => {
  // 当页面从 keep-alive 缓存中激活时重新加载任务数据
  // 这样从列表页返回再进入时会刷新数据
  loadCurrentTask()
})

onUnmounted(() => {
  // 清理审核状态轮询
  stopReviewPolling()
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
      // 确保 maxCurrentStep 和 currentStep 都有值
      task.maxCurrentStep = task.maxCurrentStep ?? task.currentStep ?? 0
      task.currentStep = task.currentStep ?? 0
      currentTask.value = task

      // 根据 reportStatus 决定显示哪个步骤
      // 0: 未上报 -> 正常流程（步骤0-3）
      // 1/5: 已上报/审核中 -> 显示审核状态页（步骤3）
      // 2: 已退回 -> 跳回步骤1重新上报
      // 3: 已通过 -> 显示提交国家平台页（步骤4）
      // 4: 已提交 -> 完成
      if (task.reportStatus === 1 || task.reportStatus === 5) {
        // 已上报/审核中 -> 显示审核状态页
        currentStep.value = 3
        currentTask.value.maxCurrentStep = Math.max(currentTask.value.maxCurrentStep || 0, 3)
      } else if (task.reportStatus === 2) {
        // 已退回 -> 跳回步骤1
        currentStep.value = 1
        currentTask.value.maxCurrentStep = Math.max(currentTask.value.maxCurrentStep || 0, 1)
      } else if (task.reportStatus === 3) {
        // 已通过 -> 显示提交国家平台页
        currentStep.value = 4
        currentTask.value.maxCurrentStep = Math.max(currentTask.value.maxCurrentStep || 0, 4)
      } else if (task.reportStatus === 4) {
        // 已提交 -> 显示完成页
        currentStep.value = 4
        currentTask.value.maxCurrentStep = 4
      } else {
        // 未上报 -> 使用任务记录的当前步骤
        currentStep.value = task.currentStep ?? 0
      }

      if (task.taskId || currentTask.value.taskId) {
        const taskId = task.taskId || currentTask.value.taskId
        // 始终加载文件列表
        await loadFileList(taskId)
        if (currentStep.value >= 2) {
          await loadQCResults(taskId)
        }
        if (currentStep.value >= 3) {
          submitInfo.value = {
            taskName: task.taskName,
            startDate: task.startDate,
            endDate: task.endDate,
            reportTime: task.reportTime ? String(task.reportTime) : ''
          }
        }

        // 如果 reportStatus 为 1/5（审核中），显示审核状态
        if (task.reportStatus === 1 || task.reportStatus === 5) {
          reviewStatus.value = 0 // 待审核
          reviewInfo.value = {
            submitTime: task.submitTime || task.reportTime || new Date(),
            reviewTime: null,
            reviewer: null,
            reviewComment: null,
            rejectReason: null
          }
          // 开始轮询审核状态
          startReviewPolling()
        }
      }
    } else {
      message.warning('当前没有激活的上报任务，请联系管理员')
    }
  } catch (error) {
    console.error('加载任务信息失败:', error)
    message.error('加载任务信息失败，请刷新重试')
  } finally {
    loading.value = false
  }
}

const loadFileList = async (taskId: number) => {
  try {
    const files = await ReportDataApi.getFileList(taskId)
    // 完全使用后端返回的数据
    fileList.value = files.map((file: any) => ({
      id: file.id,
      taskId: taskId,
      fileName: file.fileName,
      standardFileName: file.standardFileName,
      originalFileName: file.originalFileName,
      fileType: file.fileType,
      uploadStatus: file.uploadStatus,
      qcStatus: file.qcStatus,
      fileSize: file.fileSize,
      fileFormat: file.fileFormat,
      recordCount: file.recordCount,
      // 新增：分开返回两种错误数
      validationErrorCount: file.validationErrorCount || 0,  // 上传校验错误
      qcErrorCount: file.qcErrorCount || 0,                  // 质控错误
      errorCount: file.errorCount,                           // 兼容旧字段
      warningCount: file.warningCount,
      // 上传进度字段
      uploadProgress: file.uploadProgress || 0,
      uploadPhase: file.uploadPhase || '等待文件上传'
    }))
  } catch (error) {
    console.error('加载文件列表失败:', error)
  }
}

/**
 * 处理文件上传成功后的逻辑
 * 方案2：如果已经进行过质控，重新上传文件后需要重置质控状态
 */
const handleFileUploaded = async () => {
  // 1. 先刷新文件列表
  await loadFileList(currentTask.value.taskId)
  
  // 2. 检测是否已经进入过质控阶段（maxCurrentStep >= 2）
  if (currentTask.value.maxCurrentStep >= 2) {
    message.warning('检测到文件变更，需要重新进行前置质控')
    
    // 3. 重置质控相关状态
    // 重置步骤进度（只能到上传阶段）
    currentTask.value.maxCurrentStep = 1
    await updateCurrentStep(1)
    
    // 清空质控结果
    preQCResult.value = {
      passed: false,
      details: []
    }
    
    // 重置质控进度
    isQCProcessing.value = false
    qcProgress.value = 0
    qcCurrentPhase.value = '准备开始质控...'
    qcFileProgress.value = []
    
    // 4. 调用后端API重置文件的质控状态（可选，取决于后端是否需要）
    try {
      await ReportDataApi.resetQcStatus(currentTask.value.taskId)
    } catch (error) {
      console.warn('重置质控状态失败（后端可能未实现此接口）:', error)
    }
  }
}

// 刷新文件列表
const refreshFileList = async () => {
  if (!currentTask.value.taskId) {
    message.warning('任务ID不存在')
    return
  }
  try {
    refreshingFileList.value = true
    await loadFileList(currentTask.value.taskId)
    // message.success('文件列表已刷新')
  } catch (error) {
    console.error('刷新文件列表失败:', error)
    message.error('刷新文件列表失败')
  } finally {
    refreshingFileList.value = false
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
      preQCResult.value.passed = !files.find((item) => [0, 1, 4, null].includes(item.qcStatus ?? null))
      // 完全使用后端返回的数据
      preQCResult.value.details = files.map((file: any) => ({
        id: file.id,
        taskId: taskId,
        fileName: file.fileName,
        standardFileName: file.standardFileName,
        originalFileName: file.originalFileName,
        fileType: file.fileType,
        uploadStatus: file.uploadStatus,
        qcStatus: file.qcStatus,
        fileSize: file.fileSize,
        fileFormat: file.fileFormat,
        recordCount: file.recordCount,
        qcErrorCount: file.qcErrorCount,  // 行级质控错误数
        statErrorCount: file.statErrorCount,  // 统计级错误数（整体检查）
        validationErrorCount: file.validationErrorCount,  // 上传校验错误数
        errorCount: file.errorCount,
        warningCount: file.warningCount,  // 行级警告数
        statWarningCount: file.statWarningCount  // 统计级警告数
      }))
    }
  } catch (error) {
    console.error('加载质控结果失败:', error)
  }
}

/**
 * 刷新质控文件列表（供PreQcTab调用）
 */
const refreshQCFileList = async () => {
  await loadQCResults(currentTask.value.taskId)
}

// ==================== 步骤总览相关方法 ====================

const stepSummaryKey = ref(0)

const loadStepSummary = async () => {
  // 通过改变key强制刷新组件
  stepSummaryKey.value++
}

const handleSummaryClose = async () => {
  try {
    await ReportStepSummaryApi.closeStepSummary(
      currentTask.value.taskId,
      currentTask.value.currentStep
    )
    message.success('总览已关闭')
    stepSummaryKey.value++ // 刷新组件以隐藏总览
  } catch (error) {
    console.error('关闭总览失败:', error)
    message.error('关闭总览失败')
  }
}
</script>

<style scoped>
/* 步骤条卡片样式优化 */
.progress-card {
  margin-bottom: 24px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 0;
  overflow: hidden;
  position: sticky;
  top: 20px;
  z-index: 10; /* 降低 z-index，避免与 Dialog 遮罩层冲突 */
  transition: all 0.3s ease;
  /* backdrop-filter 会创建新的层叠上下文，移除以避免覆盖抽屉 */
}

/* 增加滚动时的阴影效果 */
.progress-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.progress-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.back-button {
  color: #4b5563;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 6px;
}

.back-button:hover {
  color: #667eea;
  background: #f3f4f6;
  border-color: #667eea;
  transform: translateX(-4px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.back-icon {
  font-size: 16px;
  transition: transform 0.3s ease;
}

.back-button:hover .back-icon {
  transform: translateX(-2px);
}

.header-divider {
  width: 1px;
  height: 24px;
  background: linear-gradient(to bottom, transparent, #d1d5db, transparent);
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
  line-height: 1;
}

.step-tip-icon {
  font-size: 16px;
  color: #909399;
  margin-left: 8px;
  cursor: help;
  
  &:hover {
    color: #409eff;
  }
}

.step-info {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid #e5e7eb;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.step-label {
  font-size: 15px;
  font-weight: 700;
  color: #667eea;
}

.step-divider {
  font-size: 14px;
  color: #d1d5db;
  font-weight: 400;
}

.step-total {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

:deep(.progress-card .el-card__body) {
  padding: 32px 24px;
}

/* 步骤条图标和文本样式优化 */
:deep(.el-step__icon) {
  border-radius: 50% !important;
  width: 48px;
  height: 48px;
  font-size: 18px;
  border-width: 3px;
}

:deep(.el-step__title) {
  font-size: 15px;
  font-weight: 600;
}

:deep(.el-step__line) {
  background: #e5e7eb;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border-color: #667eea !important;
  border-radius: 50% !important;
  animation: pulse 0.6s ease-in-out;
}

:deep(.step-clickable.is-finish:hover .el-step__icon .el-icon) {
  color: #ffffff !important;
  transform: scale(1.1);
}

/* 已完成步骤的默认样式 */
:deep(.el-step.is-finish .el-step__icon) {
  background: #10b981;
  border-color: #10b981;
}

:deep(.el-step.is-finish .el-step__icon .el-icon) {
  color: #ffffff !important;
}

:deep(.el-step.is-finish .el-step__title) {
  color: #047857;
}

:deep(.el-step.is-finish .el-step__line) {
  background: #10b981;
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
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50% !important;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
  animation: breathe 2s ease-in-out infinite;
}

:deep(.el-step.is-process .el-step__icon .el-icon) {
  color: #ffffff !important;
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
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  margin-bottom: 32px;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.step-content {
  padding: 20px 0;
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
  flex-shrink: 0;
  position: relative;
  padding-left: 16px;
}

.step-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.upload-progress-inline {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 550px;
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

.prepare-actions .el-button {
  padding: 12px 32px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.prepare-actions .el-button:not(.el-button--primary) {
  border: 2px solid #e4e7ed;
  background: #ffffff;
}

.prepare-actions .el-button:not(.el-button--primary):hover {
  border-color: #667eea;
  color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.prepare-actions .el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.prepare-actions .el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
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
  text-align: center;
}

.requirements-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 12px 0;
}

.requirements-subtitle {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
  margin-top: 8px;
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
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 24px;
  width: 240px;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.file-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--file-color, #409eff) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.file-card:hover::before {
  opacity: 1;
}

.file-card:hover {
  border-color: var(--file-color, #409eff);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
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
  margin-top: 32px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #4b5563;
  padding: 12px 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.tip-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transform: translateX(4px);
}

.tip-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.tip-icon.success {
  color: #10b981;
}

.tip-icon.warning {
  color: #f59e0b;
}

.tip-icon.info {
  color: #667eea;
}

/* 上传区域样式 */
.upload-section {
  max-width: 100%;
}

/* 表格标题栏样式 */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin: 20px 0 16px 0;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-upload-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  flex: 1;
  max-width: 500px;
}

.header-upload-stats .stats-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  white-space: nowrap;
}

.header-upload-stats .stats-progress {
  flex: 1;
  min-width: 200px;
}

.header-upload-stats .stats-count {
  font-size: 16px;
  color: #667eea;
  font-weight: 700;
  min-width: 50px;
  text-align: center;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.header-upload-stats .stats-count.uploading {
  color: #f59e0b;
  animation: pulse-count 1.5s ease-in-out infinite;
}

@keyframes pulse-count {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.batch-upload {
  margin-bottom: 24px;
}

:deep(.upload-dragger) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  padding: 48px;
  border-radius: 16px;
  border: 3px dashed #d1d5db;
  background: linear-gradient(135deg, #fafbfc 0%, #f3f4f6 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-upload-dragger:hover) {
  border-color: #667eea;
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.12);
  transform: translateY(-2px);
}

:deep(.el-icon--upload) {
  font-size: 56px;
  color: #667eea;
  margin-bottom: 20px;
  transition: transform 0.3s ease;
}

:deep(.el-upload-dragger:hover .el-icon--upload) {
  transform: scale(1.1);
}

:deep(.el-upload__text) {
  font-size: 16px;
  color: #4b5563;
  font-weight: 500;
}

:deep(.el-upload__text em) {
  color: #667eea;
  font-weight: 600;
  font-style: normal;
}

.upload-actions {
  margin-top: 20px;
  text-align: center;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.upload-actions .el-button,
.qc-actions .el-button {
  padding: 12px 32px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.upload-actions .el-button:not(.el-button--primary),
.qc-actions .el-button:not(.el-button--primary):not(.el-button--success) {
  border: 2px solid #e4e7ed;
  background: #ffffff;
}

.upload-actions .el-button:not(.el-button--primary):hover,
.qc-actions .el-button:not(.el-button--primary):not(.el-button--success):hover {
  border-color: #667eea;
  color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.upload-actions .el-button--primary,
.qc-actions .el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.upload-actions .el-button--primary:hover,
.qc-actions .el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.qc-actions .el-button--success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.qc-actions .el-button--success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.record-count {
  font-weight: 700;
  color: #667eea;
  background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 13px;
}

.error-count {
  color: #dc2626;
  font-weight: 700;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 13px;
}

.text-info {
  color: #6b7280;
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
  gap: 20px;
  padding: 24px 32px;
  border-radius: 16px;
  border: 2px solid;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  z-index: 0;
}

.summary-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%);
  z-index: 0;
}

.summary-card > * {
  position: relative;
  z-index: 1;
}

.summary-card.success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-color: #10b981;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.15);
}

.summary-card.warning {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #f59e0b;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.15);
}

.summary-icon {
  font-size: 56px;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.summary-card.success .summary-icon {
  color: #10b981;
}

.summary-card.warning .summary-icon {
  color: #f59e0b;
}

.summary-content {
  flex: 1;
}

.summary-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}

.summary-card.success .summary-title {
  color: #047857;
}

.summary-card.warning .summary-title {
  color: #d97706;
}

.summary-desc {
  font-size: 15px;
  color: #4b5563;
  line-height: 1.6;
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

/* 质控错误详情对话框样式 */
.qc-error-details {
  padding: 4px 0;
}

.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 2px solid #fca5a5;
  border-radius: 12px;
  margin-bottom: 20px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.header-icon.error {
  font-size: 48px;
  color: #ef4444;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

.header-content {
  flex: 1;
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  color: #991b1b;
  margin: 0 0 8px 0;
}

.header-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.error-count-text {
  font-size: 18px;
  font-weight: 700;
  color: #ef4444;
  padding: 0 4px;
}

.header-icon.warning {
  font-size: 48px;
  color: #f59e0b;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}

.warning-count-text {
  font-size: 18px;
  font-weight: 700;
  color: #f59e0b;
  padding: 0 4px;
}

.error-table-wrapper {
  margin-bottom: 0;
}

.error-table-wrapper :deep(.el-table) {
  border-radius: 8px 8px 0 0;
}

.error-table-wrapper :deep(.el-table th) {
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%);
  color: #1a202c;
  font-weight: 700;
}

.error-table-wrapper :deep(.el-table .el-table__row:hover) {
  background: #fef2f2 !important;
}

/* 质控错误表格 - 确保内容完整显示 */
.qc-error-table :deep(.el-table__cell) {
  padding: 12px 8px;
}

/* 错误详情列内容不截断，完整显示 */
.qc-error-table .error-message-cell {
  white-space: normal;
  word-break: break-word;
}

/* 错误列表分页器样式 */
.error-pagination {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%);
  border: 1px solid #e4e7ed;
  border-top: none;
  border-radius: 0 0 8px 8px;
}

.error-pagination :deep(.el-pagination) {
  justify-content: center;
}

.error-pagination :deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.error-pagination :deep(.el-pagination.is-background .el-pager li:hover:not(.is-active)) {
  color: #667eea;
}

.page-info {
  font-size: 13px;
  color: #9ca3af;
  margin-left: 8px;
}

.error-message-cell {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.6;
}

.error-message-cell .cell-icon {
  font-size: 16px;
  color: #f59e0b;
  margin-top: 2px;
  flex-shrink: 0;
}

.error-tips {
  margin-top: 16px;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.dialog-footer .el-button {
  padding: 10px 24px;
  font-weight: 600;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

:deep(.el-table th.el-table__cell) {
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%);
  color: #1a202c;
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.el-table .el-table__row) {
  transition: all 0.3s ease;
}

:deep(.el-table .el-table__row:hover) {
  background: #f9fafb !important;
}

/* 错误行样式 - 覆盖全局hover样式 */
:deep(.el-table .el-table__row.error-row) {
  background: #fef0f0 !important;
}

:deep(.el-table .el-table__row.error-row:hover) {
  background: #fde2e2 !important;
}

:deep(.el-table .el-table__row.error-row > td) {
  background: #fef0f0 !important;
  color: #dc2626 !important;
  font-weight: 600 !important;
}

:deep(.el-table .el-table__row.error-row:hover > td) {
  background: #fde2e2 !important;
  color: #dc2626 !important;
}

:deep(.el-table .el-table__row.error-row td *) {
  color: #dc2626 !important;
}

:deep(.el-table .el-table__row.error-row .el-tag) {
  color: #dc2626 !important;
  background-color: #fee2e2 !important;
  border-color: #fca5a5 !important;
}

:deep(.el-table .el-button) {
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-table .el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

:deep(.el-table .el-button--primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

:deep(.el-table .el-button--danger) {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: none;
}

:deep(.el-table .el-button--danger:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

:deep(.el-table .el-button--warning) {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
}

:deep(.el-table .el-button--warning:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

/* Dialog 样式优化 */
:deep(.el-dialog) {
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px 16px 0 0;
  padding: 20px 24px;
}

:deep(.el-dialog__title) {
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
}

:deep(.el-dialog__headerbtn .el-dialog__close) {
  color: rgba(255, 255, 255, 0.8);
  font-size: 20px;
}

:deep(.el-dialog__headerbtn .el-dialog__close:hover) {
  color: #ffffff;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  padding: 16px 24px 24px;
  border-top: 1px solid #e5e7eb;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .progress-card {
    top: 16px;
  }

  .progress-card-header {
    padding: 16px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .header-left {
    width: 100%;
    gap: 12px;
  }

  .back-button {
    padding: 8px 12px;
    font-size: 13px;
  }

  .back-icon {
    font-size: 14px;
  }

  .header-divider {
    height: 20px;
  }

  .page-title {
    font-size: 16px;
  }

  .step-info {
    padding: 6px 12px;
    gap: 6px;
  }

  .step-label {
    font-size: 14px;
  }

  .step-divider {
    font-size: 13px;
  }

  .step-total {
    font-size: 13px;
  }

  :deep(.progress-card .el-card__body) {
    padding: 24px 16px;
  }

  .content-card {
    padding: 20px;
  }

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

  :deep(.el-descriptions .el-descriptions__body) {
    display: block;
  }

  :deep(.el-descriptions .el-descriptions__item) {
    display: block;
    width: 100% !important;
  }
}

@media (min-width: 1200px) {
  .file-card {
    width: 260px;
  }
}

/* 轻量级禁用状态增强 - 配合全局样式 */
:deep(.el-button.is-disabled),
:deep(.el-button:disabled) {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(50%);
}

/* 确保禁用按钮不响应 hover 动画 */
:deep(.el-button.is-disabled:hover),
:deep(.el-button:disabled:hover) {
  transform: none !important;
}

/* 表格中禁用按钮移除动画效果 */
:deep(.el-table .el-button.is-disabled:hover),
:deep(.el-table .el-button:disabled:hover) {
  box-shadow: none !important;
}

/* 确保 tooltip 包裹的 span 正确显示 */
.upload-actions .el-tooltip__trigger {
  display: inline-block;
}

/* 上传进度样式 */
.progress-wrapper {
  padding: 5px 0;
}

.progress-message {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
  text-align: center;
}

/* 行内上传组件样式 */
.inline-upload {
  display: inline-block;
}

:deep(.inline-upload .el-upload) {
  display: inline-block;
}

/* 拖拽区上传进度显示 */
.upload-progress-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 30px;
  background-color: #fafafa;
}

.upload-progress-area .progress-header {
  margin-bottom: 24px;
}

.upload-progress-area .progress-header h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.upload-progress-area .progress-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.upload-progress-area .file-progress-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.upload-progress-area .file-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.upload-progress-area .file-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #303133;
}

.upload-progress-area .file-errors {
  margin-top: 12px;
}

.upload-progress-area .error-list {
  margin-top: 8px;
  font-size: 12px;
}

.upload-progress-area .error-item {
  padding: 4px 0;
  color: #f56c6c;
}

.upload-progress-area .more-errors {
  padding: 4px 0;
  color: #909399;
  font-style: italic;
}

/* 拖拽区禁用提示 */
.upload-tip {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #e6a23c;
  font-size: 14px;
}

:deep(.upload-dragger.is-disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 拖拽区域内的进度显示样式 */
.upload-progress-inline-area {
  width: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.progress-header-inline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 8px;
}

.progress-header-inline .header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-header-inline .processing-icon {
  font-size: 24px;
  color: #667eea;
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.progress-header-inline h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.progress-header-inline .header-right .file-count {
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
  background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%);
  padding: 6px 16px;
  border-radius: 20px;
  border: 2px solid #667eea;
}

.progress-bar-wrapper {
  width: 100%;
  padding: 0 10px;
}

.progress-bar-wrapper :deep(.el-progress__text) {
  font-size: 16px !important;
  font-weight: 700;
  color: #667eea;
}

.current-processing-tips {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0 10px;
}

.latest-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 12px;
  border: 2px solid #d1d5db;
  min-width: 300px;
  max-width: 600px;
  transition: all 0.3s ease;
  animation: pulse-message 2s ease-in-out infinite;
}

@keyframes pulse-message {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
  }
}

.latest-message .message-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.latest-message .message-icon.info {
  color: #409eff;
}

.latest-message .message-icon.success {
  color: #67c23a;
}

.latest-message .message-icon.warning {
  color: #e6a23c;
}

.latest-message .message-icon.error {
  color: #f56c6c;
}

.latest-message .message-text {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  flex: 1;
}

/* 上传中时拖拽区域的背景样式 */
.upload-disabled :deep(.el-upload-dragger) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-color: #adb5bd;
  cursor: not-allowed;
}

/* 拖拽区上传中提示 */
.upload-processing-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px;
}

.upload-processing-hint .processing-icon-large {
  font-size: 64px;
  color: #909399;
  animation: spin 2s linear infinite;
}

.upload-processing-hint .processing-text {
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 上传进度详情区域（拖拽区下方） */
.upload-progress-detail {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 20px;
  margin-top: 16px;
  position: relative;
  z-index: 0;
}

.upload-progress-detail .progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(14, 165, 233, 0.2);
}

.upload-progress-detail .header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-progress-detail .processing-icon {
  font-size: 20px;
  color: #0ea5e9;
  animation: spin 2s linear infinite;
}

.upload-progress-detail .phase-text {
  font-size: 16px;
  color: #0c4a6e;
  font-weight: 600;
}

.upload-progress-detail .header-right {
  display: flex;
  align-items: center;
}

.upload-progress-detail .file-count-text {
  font-size: 14px;
  color: #0284c7;
  font-weight: 600;
  background: rgba(14, 165, 233, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
}

/* 文件进度列表 */
.files-progress-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-progress-item {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e0f2fe;
  transition: all 0.3s ease;
}

.file-progress-item:hover {
  border-color: #7dd3fc;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);
}

.file-progress-item .file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.file-progress-item .file-name {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}

/* 过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 质控进度样式 */
.qc-progress-section {
  margin-bottom: 24px;
}

.qc-progress-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #7dd3fc;
  border-radius: 16px;
  padding: 24px;
  position: relative;
  z-index: 0;
}

.qc-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.qc-progress-header .header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qc-progress-header .processing-icon {
  font-size: 24px;
  color: #0ea5e9;
  animation: spin 2s linear infinite;
}

.qc-progress-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #0c4a6e;
}

.qc-progress-header .progress-percent {
  font-size: 24px;
  font-weight: 700;
  color: #0284c7;
  background: rgba(14, 165, 233, 0.1);
  padding: 8px 20px;
  border-radius: 20px;
  border: 2px solid #0ea5e9;
}

.qc-progress-card .main-progress {
  margin-bottom: 20px;
}

.qc-current-phase {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid #bae6fd;
  margin-bottom: 20px;
}

.qc-current-phase .phase-icon {
  font-size: 20px;
  color: #0ea5e9;
}

.qc-current-phase .phase-text {
  font-size: 15px;
  color: #0c4a6e;
  font-weight: 500;
}

.qc-files-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qc-file-item {
  background: rgba(255, 255, 255, 0.6);
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid #e0f2fe;
  transition: all 0.3s ease;
}

.qc-file-item:hover {
  border-color: #7dd3fc;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);
}

.qc-file-item .file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.qc-file-item .file-icon {
  font-size: 18px;
}

.qc-file-item .file-icon.pending {
  color: #94a3b8;
}

.qc-file-item .file-icon.processing {
  color: #0ea5e9;
  animation: spin 1.5s linear infinite;
}

.qc-file-item .file-icon.success {
  color: #10b981;
}

.qc-file-item .file-name {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}

.qc-file-item .file-progress {
  margin: 0;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 审核状态卡片样式 */
.review-status-section {
  margin-bottom: 24px;
}

.review-status-card {
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  z-index: 0;
}

.review-status-card.status-pending {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
}

.review-status-card.status-approved {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 2px solid #10b981;
}

.review-status-card.status-rejected {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 2px solid #ef4444;
}

.review-status-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.status-icon-wrapper {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.status-icon {
  font-size: 48px;
}

.status-icon.status-pending {
  color: #f59e0b;
  animation: pulse 2s ease-in-out infinite;
}

.status-icon.status-approved {
  color: #10b981;
}

.status-icon.status-rejected {
  color: #ef4444;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.status-content {
  flex: 1;
}

.status-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.review-status-card.status-pending .status-title {
  color: #d97706;
}

.review-status-card.status-approved .status-title {
  color: #047857;
}

.review-status-card.status-rejected .status-title {
  color: #dc2626;
}

.status-desc {
  font-size: 15px;
  color: #4b5563;
  margin: 0;
  line-height: 1.6;
}

.review-info {
  padding: 24px;
  background: rgba(255, 255, 255, 0.6);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.review-comment,
.reject-reason {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  line-height: 1.6;
}

.reject-reason {
  color: #dc2626;
  font-weight: 500;
  border-left: 4px solid #ef4444;
}

.review-actions {
  padding: 20px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  background: rgba(255, 255, 255, 0.3);
}

.review-actions .el-button {
  padding: 12px 32px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.review-actions .el-button--success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* 错误消息单元格样式 */
.error-message-cell {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.error-message-cell .cell-icon {
  color: #f56c6c;
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.error-message-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.error-main-message {
  color: #303133;
  font-size: 14px;
  line-height: 1.5;
}

.error-calculation-details {
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
  padding: 6px 10px;
  background: #f5f7fa;
  border-radius: 4px;
  border-left: 3px solid #e6a23c;
  margin-top: 4px;
  white-space: pre-wrap;
  word-break: break-all;
}

.review-actions .el-button--success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.review-actions .el-button--warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.review-actions .el-button--warning:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

/* 国家平台提交样式 */
.national-submit-section {
  padding: 40px 0;
}

.submit-info-card {
  width: 100%;
  max-width: 800px;
}

:deep(.el-result__title) {
  font-size: 24px;
  font-weight: 700;
  color: #047857;
}

:deep(.el-result__subtitle) {
  font-size: 16px;
  color: #6b7280;
  margin-top: 12px;
}

:deep(.el-result__icon svg) {
  width: 80px;
  height: 80px;
}

.national-submit-section .el-alert {
  max-width: 800px;
}

/* ==================== 上传校验错误详情弹框样式 ==================== */
.validation-error-details {
  padding: 4px 0;
}

.validation-error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 2px solid #fca5a5;
  border-radius: 12px;
  margin-bottom: 20px;
}

.validation-error-header .header-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.validation-error-header .header-icon.error {
  font-size: 48px;
  color: #ef4444;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

.validation-error-header .header-content {
  flex: 1;
}

.validation-error-header .header-title {
  font-size: 18px;
  font-weight: 700;
  color: #991b1b;
  margin: 0 0 8px 0;
}

.validation-error-header .header-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.validation-error-header .total-rows {
  font-weight: 600;
  color: #374151;
}

.validation-error-header .error-count-text {
  font-size: 16px;
  font-weight: 700;
  color: #ef4444;
}

.validation-error-header .error-rows-text {
  font-weight: 600;
  color: #dc2626;
}

.validation-error-header .header-stats {
  display: flex;
  align-items: center;
}

.pass-rate-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  border-radius: 12px;
  min-width: 80px;
}

.pass-rate-badge.good {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 2px solid #10b981;
}

.pass-rate-badge.warning {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
}

.pass-rate-badge.bad {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 2px solid #ef4444;
}

.pass-rate-badge .rate-value {
  font-size: 24px;
  font-weight: 700;
}

.pass-rate-badge.good .rate-value { color: #047857; }
.pass-rate-badge.warning .rate-value { color: #d97706; }
.pass-rate-badge.bad .rate-value { color: #dc2626; }

.pass-rate-badge .rate-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

/* 错误类型筛选标签 */
.error-type-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.error-type-filter :deep(.el-radio-button__inner) {
  display: flex;
  align-items: center;
  gap: 6px;
}

.error-type-filter .tab-icon {
  font-size: 14px;
}

/* 校验错误表格 */
.validation-error-table-wrapper {
  margin-bottom: 16px;
}

.validation-error-table-wrapper :deep(.el-table) {
  border-radius: 8px 8px 0 0;
}

.validation-error-table-wrapper :deep(.el-table th) {
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%);
  color: #1a202c;
  font-weight: 700;
}

.validation-error-table .field-name {
  font-weight: 600;
  color: #374151;
}

.validation-error-table .empty-value {
  color: #9ca3af;
  font-style: italic;
}

.validation-error-table .invalid-value {
  color: #dc2626;
  font-weight: 500;
  background: #fef2f2;
  padding: 2px 8px;
  border-radius: 4px;
}

.validation-error-table .error-message-cell {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.validation-error-table .error-message-cell .cell-icon {
  color: #f59e0b;
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.validation-error-table .error-message-text {
  color: #374151;
  font-size: 13px;
  line-height: 1.5;
}

/* 行样式 */
.validation-error-table :deep(.required-error-row) {
  background: #fef2f2 !important;
}

.validation-error-table :deep(.type-error-row) {
  background: #fffbeb !important;
}

.validation-error-table :deep(.org-code-error-row) {
  background: #fef3e2 !important;
}

/* 分页器 */
.validation-error-pagination {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%);
  border: 1px solid #e4e7ed;
  border-top: none;
  border-radius: 0 0 8px 8px;
}

.validation-error-pagination :deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 提示信息 */
.validation-error-tips {
  margin-top: 16px;
}
</style>
