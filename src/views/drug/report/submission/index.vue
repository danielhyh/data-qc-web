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
      :meta="[
        {
          label: '上报期限',
          value: `${formatDate(currentTask.startDate)} 至 ${formatDate(currentTask.endDate)}`,
          icon: Calendar
        },
        {
          label: remainingDays > 0 ? '剩余天数' : '逾期天数',
          value: Math.abs(remainingDays) + '天',
          icon: Timer
        },
        {
          label: '机构',
          value: currentTask.hospitalName || '-',
          icon: Hospital
        }
      ]"
      :show-back-button="false"
    />

    <!-- 上报进度步骤条 -->
    <ContentWrap class="progress-card">
      <el-steps :active="currentStep" align-center :process-status="getProcessStatus()" >
        <el-step title="准备" @click="changeSteps(0)">
          <template #icon>
            <el-tooltip content="准备上报文件" placement="top">
              <el-icon>
                <Document />
              </el-icon>
            </el-tooltip>
          </template>
        </el-step>
        <el-step title="上传文件" @click="changeSteps(1)">
          <template #icon>
            <el-tooltip content="上传数据文件" placement="top">
              <el-icon>
                <Upload />
              </el-icon>
            </el-tooltip>
          </template>
        </el-step>
        <el-step title="前置质控" @click="changeSteps(2)">
          <template #icon>
            <el-tooltip content="数据格式验证" placement="top">
              <el-icon>
                <CircleCheck />
              </el-icon>
            </el-tooltip>
          </template>
        </el-step>
        <el-step title="提交上报" @click="changeSteps(3)">
          <template #icon>
            <el-tooltip content="提交至管理端" placement="top">
              <el-icon>
                <Promotion />
              </el-icon>
            </el-tooltip>
          </template>
        </el-step>
      </el-steps>
    </ContentWrap>

    <!-- 主要内容区域 -->
    <ContentWrap class="content-card" v-loading="loading">
      <!-- 步骤0: 准备阶段 -->
      <div v-if="currentStep === 0" class="step-content">
        <!-- 文件要求说明 -->
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
                      <span class="required-fields"
                      >{{ table.requiredFieldsCount || 0 }} 个必填</span
                      >
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
              <el-button @click="downloadTemplate">
                <el-icon>
                  <Download />
                </el-icon>
                下载标准模板压缩包
              </el-button>
              <el-button type="primary" @click="startUpload">
                <el-icon>
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
              accept=".zip,.xlsx"
              :show-file-list="false"
            >
              <el-icon class="el-icon--upload">
                <UploadFilled />
              </el-icon>
              <div class="el-upload__text"> 拖拽ZIP压缩包到此处，或<em>点击上传</em> </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持上传包含所有Excel文件的ZIP压缩包，或分别上传单个Excel文件
                </div>
              </template>
            </el-upload>
          </div>

          <!-- 文件列表 -->
          <div class="file-list">
            <h4>文件上传状态</h4>
            <el-table :data="fileList" stripe>
              <el-table-column prop="name" label="标准文件名称" width="200" />
              <el-table-column prop="type" label="数据类型" width="150">
                <template #default="{ row }">
                  <el-tag size="small">{{ getFileTypeText(row.type) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="120">
                <template #default="{ row }">
                  <div class="file-status">
                    <el-icon v-if="row.status === 1"/>
                    <el-icon v-if="row.status === 2" class="status-icon success">
                      <CircleCheck />
                    </el-icon>
                    <el-icon v-else-if="row.status === 3" class="status-icon error">
                      <CircleClose />
                    </el-icon>
                    <el-icon v-else class="status-icon waiting">
                      <Clock />
                    </el-icon>
                    <span>{{ getFileStatusText(row.status) }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="size" label="文件大小" width="120">
                <template #default="{ row }">
                  {{ formatFileSize(row.size) }}
                </template>
              </el-table-column>
              <el-table-column prop="recordCount" label="数据条数" width="120">
                <template #default="{ row }">
                  {{ row.recordCount || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" fixed="right" width="200">
                <template #default="{ row }">
                  <el-button
                    v-if="row.status === 2"
                    link
                    type="primary"
                    size="small"
                    @click="viewFileData(row)"
                  >
                    查看详情
                  </el-button>
                  <div class="upload-button">
                    <el-upload
                    v-if="[0, 2, 3].includes(row.status)"
                    action="#"
                    :auto-upload="false"
                    :on-change="handleFileChange"
                    accept=".xlsx"
                    :show-file-list="false"
                  >
                    <el-button
                        link
                        type="warning"
                        size="small"
                      >
                      重新上传
                    </el-button>
                  </el-upload>
                  </div>
                  
                  <el-button v-if="[2,3].includes(row.status)" link type="danger" size="small" @click="removeFile(row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="upload-actions">
              <el-button @click="currentTask.currentStep = 0">返回准备</el-button>
              <el-button type="primary" @click="startPreQC" :disabled="!allFilesUploaded">
                开始前置质控
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤2: 前置质控 -->
      <div v-if="currentStep === 2" class="step-content">
        <div class="qc-section">
          <div class="qc-header">
            <h4>前置质控结果</h4>
            <el-tag :type="preQCResult.passed ? 'success' : 'danger'">
              {{ preQCResult.passed ? '质控通过' : '质控未通过' }}
            </el-tag>
          </div>

          <!-- 质控详情表格 -->
          <el-table :data="preQCResult.details" stripe>
            <el-table-column prop="name" label="标准文件名称" width="200" />
            <el-table-column prop="status" label="上传状态" width="120">
              <template #default="{ row }">
                <div class="file-status">
                  <el-icon v-if="row.status === 1"/>
                  <el-icon v-if="row.status === 2" class="status-icon success">
                    <CircleCheck />
                  </el-icon>
                  <el-icon v-else-if="row.status === 3" class="status-icon error">
                    <CircleClose />
                  </el-icon>
                  <el-icon v-else class="status-icon waiting">
                    <Clock />
                  </el-icon>
                  <span>{{ getFileStatusText(row.status) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="qcPreStatus" label="质检状态" width="120">
              <template #default="{ row }">
                <div class="file-status">
                  <el-button
                    link
                    type="primary"
                    size="small"
                    @click="viewQCErrors(row)"
                  >
                   <span>{{ getFileQcStatusText(row.qcPreStatus) }}</span>
                  </el-button>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="size" label="上报文件大小" width="120">
              <template #default="{ row }">
                {{ formatFileSize(row.size) }}
              </template>
            </el-table-column>
            <el-table-column prop="fileFormat" label="上报文件格式" width="150"/>
            <el-table-column prop="errorCount" label="错误数" width="100">
              <template #default="{ row }">
                <span :class="{ 'error-count': row.errorCount > 0 }">
                  {{ row.errorCount || 0 }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="viewFileData(row)"
                >
                  查看详情
                </el-button>
                <el-button
                  v-if="row.qcPreStatus === 4"
                  link
                  type="warning"
                  size="small"
                  @click="fixAndReupload(row)"
                >
                  修复重传
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="qc-actions">
            <el-button @click="backToUpload">返回上传</el-button>
            <el-button @click="downloadQCReport('pre')">
              <el-icon>
                <Download />
              </el-icon>
              下载质控报告
            </el-button>
            <el-button type="primary" @click="submitReport" :disabled="!preQCResult.passed">
              提交上报
            </el-button>
          </div>
        </div>
      </div>

      <!-- 步骤3: 提交上报 -->
      <div v-if="currentStep === 3" class="step-content">
        <div class="submit-section">
          <el-result icon="success" title="数据上报完成" sub-title="您的数据已成功提交并通过前置质控检查">
            <template #extra>
              <div class="submit-info">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="提交时间">
                    {{ formatDateTime(submitInfo.submitTime) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="提交人">
                    {{ submitInfo.submitter }}
                  </el-descriptions-item>
                  <el-descriptions-item label="数据条数">
                    {{ submitInfo.totalRecords }}
                  </el-descriptions-item>
                  <el-descriptions-item label="上报状态">
                    <el-tag type="success">已完成</el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
              <div class="submit-actions">
                <el-button type="primary" @click="downloadQCReport('pre')">
                  <el-icon>
                    <Download />
                  </el-icon>
                  下载质控报告
                </el-button>
                <el-button @click="downloadOriginalFiles">
                  <el-icon>
                    <Download />
                  </el-icon>
                  下载原始文件
                </el-button>
                <el-button @click="viewReportHistory"> 查看历史记录 </el-button>
              </div>
            </template>
          </el-result>
        </div>
      </div>
    </ContentWrap>

    <!-- 数据查看对话框 -->
    <el-dialog
      v-model="dataViewDialog.visible"
      :title="`查看数据 - ${dataViewDialog.fileName}`"
      width="80%"
      top="5vh"
    >
      <el-table
        :data="dataViewDialog.data"
        stripe
        max-height="500"
        v-loading="dataViewDialog.loading"
      >
        <el-table-column
            v-for="column in dataViewDialog.columns"
            :key="column.key"
            :prop="column.prop"
            :label="column.label"
            :width="column.width"
            show-overflow-tooltip
          />
        </el-table>
        <div class="dialog-page">
            <!-- 分页 -->
            <Pagination
              :total="excelDetailTotal"
              v-model:page="queryParams.pageNo"
              v-model:limit="queryParams.pageSize"
              @pagination="getExcelDetailData"
            />
          </div>
    </el-dialog>

    <!-- 错误详情对话框 -->
    <el-dialog
      v-model="errorDialog.visible"
      :title="`质控错误详情 - ${errorDialog.tableName}`"
      width="70%"
      top="10vh"
    >
      <el-table :data="errorDialog.errors" stripe max-height="400">
        <el-table-column prop="row" label="行号" width="80" />
        <el-table-column prop="column" label="列名" width="120" />
        <el-table-column prop="value" label="错误值" width="150" show-overflow-tooltip />
        <el-table-column prop="errorType" label="错误类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="danger">{{ row.errorType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="错误说明" min-width="200" show-overflow-tooltip />
        <el-table-column prop="suggestion" label="修复建议" min-width="200" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <el-button @click="errorDialog.visible = false">关闭</el-button>
        <el-button type="primary" @click="exportErrors">导出错误清单</el-button>
      </template>
    </el-dialog>

    <!-- Excel预览弹窗 -->
    <ExcelPreviewDialog ref="excelPreviewRef" />
  </div>
</template>

<script setup lang="ts">
import request from '@/config/axios'
import {ref, reactive, computed, onMounted, onUnmounted} from 'vue'
import {useMessage} from '@/hooks/web/useMessage'
import {
  Download,
  Upload,
  UploadFilled,
  CircleCheck,
  CircleClose,
  Clock,
  Refresh,
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
import {ContentWrap} from '@/components/ContentWrap'
import DictTag from '@/components/DictTag/src/DictTag.vue'
import ExcelPreviewDialog from '@/views/drug/import/batch/components/ExcelPreviewDialog.vue'
import {
  ReportDataApi,
  type ReportTaskVO,
  type ReportTaskCreateVO,
  type FileUploadVO,
  type QCResultVO
} from '@/api/drug/reportdata'
import {ImportTemplateApi} from '@/api/drug/task/template'
import {TemplateFieldApi} from '@/api/drug/task/template'
import download from '@/utils/download'
import {getDictLabel, DICT_TYPE, getDictOptions} from '@/utils/dict'
import { el } from 'element-plus/es/locale'

// 定义组件名称
defineOptions({name: 'DrugReportSubmission'})

// 消息弹窗
const message = useMessage()

// ==================== 数据定义 ====================

// 表定义数据
const tableDefinitions = ref<any>({})
const loadingTemplates = ref(false)

// 组件引用
const excelPreviewRef = ref()

// 计算属性：从 currentTask 获取当前步骤
const currentStep = computed(() => {
  return currentTask.value.currentStep || 0
})

const loading = ref(false)

// 当前任务信息
const currentTask = ref<any>({
  id: null,
  taskName: '',
  status: 1, // 1-未开始 2-进行中 3-已结束 4-已关闭
  startDate: '',
  endDate: '',
  hospitalId: null,
  hospitalName: '',
  description: '',
  taskId: null,
})

// 文件列表
const fileList = ref([
  {id: 1, name: '医疗机构基本情况.xlsx', type: 'hospital', status: 0, size: 0, recordCount: 0},
  {id: 2, name: '医疗机构药品目录.xlsx', type: 'catalog', status: 0, size: 0, recordCount: 0},
  {id: 3, name: '医疗机构入库情况.xlsx', type: 'inbound', status: 0, size: 0, recordCount: 0},
  {id: 4, name: '医疗机构出库情况.xlsx', type: 'outbound', status: 0, size: 0, recordCount: 0},
  {id: 5, name: '医疗机构使用情况.xlsx', type: 'usage', status: 0, size: 0, recordCount: 0}
])

// 前置质控结果
const preQCResult = ref({
  passed: false,
  details: []
})

// 提交信息
const submitInfo = ref({
  submitTime: new Date(),
  submitter: '张三',
  totalRecords: 12580
})

const excelDetailTotal = ref(0)
const queryParams = ref({
  pageNo: 1,
  pageSize: 100,
})

// 数据查看对话框
const dataViewDialog = reactive({
  visible: false,
  loading: false,
  fileName: '',
  data: [],
  columns: [],
  columnsMap: new Map([
    ['hospital',  // 医院信息
    [{ prop: 'orderNo', label: 'ID', width: '80' }, { prop: 'uploadDate', label: '数据上报日期' },
     { prop: 'domainCode', label: '省级行政区划代码' }, { prop: 'organizationCode', label: '组织机构代码' },
     { prop: 'hospitalCode', label: '医院机构代码' }, { prop: 'organizationName', label: '组织机构名称', width: '150'  },
     { prop: 'unitManager', label: '单位负责人' }, { prop: 'statisticsManager', label: '统计负责人' },
     { prop: '', label: '年度药瓶总收入（元）', width: '150'  }, { prop: 'bedCount', label: '实有床位数' }]],
    ['catalog', 
    [{ prop: 'orderNo', label: 'ID', width: '80' }, { prop: 'ypid', label: '国家药品编码（YPID）' },
     { prop: 'hospitalDrugId', label: '院内药品唯一码'}, { prop: 'provinceDrugId', label: '省级药品集中采购平台药瓶编码' },
     { prop: 'productName', label: '通用名' }, { prop: 'productName', label: '产品名称' }, { prop: 'productName', label: '商品名' }]], // 药品目录
    ['inbound',
    [{ prop: 'orderNo', label: 'ID', width: '80' }, { prop: 'ypid', label: '国家药品编码（YPID）' },
    { prop: 'productName', label: '产品名称' }, { prop: 'inboundTotalAmount', label: '入库总金额（元）' },
    { prop: 'inboundPackQuantity', label: '入库数量（最小销售包装单位）' }]], // 入库记录
    ['outbound', [{ prop: 'orderNo', label: 'ID', width: '80' },{ prop: 'ypid', label: '国家药品编码（YPID）' },
    { prop: 'productName', label: '产品名称' },{ prop: 'outboundPackQuantity', label: '出库数量（最小销售包装单位）' },
    { prop: 'outboundDosageQuantity', label: '出库数量（最小制剂单位）' }]], // 出库记录
    ['usage', [{ prop: 'orderNo', label: 'ID', width: '80' }, { prop: 'ypid', label: '国家药品编码（YPID）' },
    { prop: 'productName', label: '产品名称' }, { prop: 'usageTotalAmount', label: '销售总金额（元）' },
    { prop: 'usageDosageQuantity', label: '销售数量' }]] // 使用记录
  ])
})

// 错误详情对话框
const errorDialog = reactive({
  visible: false,
  tableName: '',
  errors: []
})

// ==================== 计算属性 ====================

// 计算剩余天数
const remainingDays = computed(() => {
  const end = new Date(currentTask.value.endDate)
  const now = new Date()
  const diff = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
})

// 所有文件是否已上传
const allFilesUploaded = computed(() => {
  return fileList.value.every(file => file.status === 2)
})

// ==================== 方法定义 ====================

function changeSteps (step: number) {
  if (step <= currentTask.value.maxCurrentStep) { // 超出当前步骤范围，不执行任何操作
    currentTask.value.currentStep = step
  }
}

// 获取步骤状态
const getProcessStatus = () => {
  if (currentTask.value.currentStep === 3) return 'success'
  return 'process'
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

// 格式化日期时间
const formatDateTime = (date: Date | string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取文件类型文本
const getFileTypeText = (type: string) => {
  const map: Record<string, string> = {
    hospital: '医院信息',
    catalog: '药品目录',
    inbound: '入库记录',
    outbound: '出库记录',
    usage: '使用记录'
  }
  return map[type] || type
}

// 获取文件状态文本
const getFileStatusText = (status: string) => {
  const map: Record<string, string> = {
    0: '待上传',
    1: '上传中',
    2: '已上传',
    3: '上传失败'
  }
  return map[status] || status
}

// 获取质检状态
const getFileQcStatusText =  (status: string) => {
  const map: Record<string, string> = {
    0: '未前置',
    1: '前置中',
    2: '前置通过',
    3: '前置警告',
    4: '前置未通过'
  }
  return map[status] || status
}

// 下载模板
const downloadTemplate = async () => {
  try {
    // 调用后端接口下载标准模板压缩包
    message.notify('正在生成标准模板压缩包...')
    const data = await ImportTemplateApi.downloadStandardTemplatesZip()

    // 使用download工具下载ZIP文件
    download.zip(data, '标准导入模板.zip')

    message.notifySuccess('标准模板压缩包下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    message.notifyError('下载失败，请重试')
  }
}

/** 预览模板 */
const previewTemplate = (templateId: number) => {
  excelPreviewRef.value?.open(templateId)
}

/** 加载模板定义数据 */
const loadTemplateDefinitions = async () => {
  try {
    loadingTemplates.value = true

    // 获取TABLE_TYPE=1（前置质控）的模板列表
    const templates = await ImportTemplateApi.getImportTemplateListByTableType()

    // 为每个模板获取字段统计信息
    const templatePromises = templates.map(async (template: any) => {
      try {
        // 获取模板字段信息来统计必填字段数量
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

    // 转换为原有的数据结构格式，使用模板ID作为key
    const definitions: any = {}
    templateData.forEach((template) => {
      definitions[template.id] = template
    })

    tableDefinitions.value = definitions
  } catch (error) {
    console.error('加载模板定义失败:', error)
    message.notifyError('加载模板信息失败，将使用默认配置')

    // 失败时使用默认配置
    tableDefinitions.value = {
      default: {
        id: 'default',
        name: '默认模板',
        fileName: '数据导入模板.xlsx',
        description: '默认数据导入模板',
        fieldCount: 10,
        downloadCount: 0,
        requiredFieldsCount: 5,
        requiredFields: ['必填字段1', '必填字段2', '必填字段3', '必填字段4', '必填字段5'],
        color: '#409eff'
      }
    }
  } finally {
    loadingTemplates.value = false
  }
}

/** 获取模板颜色 */
const getTemplateColor = (tableType: string): string => {
  const colorMap: Record<string, string> = {
    'hospital': '#409eff',
    'catalog': '#67c23a',
    'inbound': '#e6a23c',
    'outbound': '#f56c6c',
    'usage': '#909399'
  }
  return colorMap[tableType] || '#409eff'
}

// 开始上传
const startUpload = async () => {
  if (currentTask.value.taskId) { // 如果有任务id说明当前上报流程已经存在，不再重复创建任务
    return
  }
  try {
    loading.value = true
    
    message.notify('正在创建上报任务...')
    const res = await ReportDataApi.createReportTask({ reportTaskId: currentTask.value.id, currentStep: 1  })
    

    // 切换到上传文件步骤
    currentTask.value.currentStep = 1
    currentTask.value.maxCurrentStep = 1
    currentTask.value.taskId = res.data

    message.notifySuccess('上报任务创建成功，现在可以上传文件')

  } catch (error) {
    console.error('创建上报任务失败:', error)
    message.notifyError('创建上报任务失败，请重试')
  } finally {
    loading.value = false
  }
}

// 处理文件改变
const handleFileChange = async (uploadFile: any) => {
  const file = uploadFile.raw
  if (!file) return

  try {
    loading.value = true
    message.notify('正在上传文件...')

    // 判断是否为压缩包
    const isZip = file.name.toLowerCase().endsWith('.zip')

    // 调用后端验证和处理文件的接口
    const formData = new FormData()
    formData.append('file', file)

    // 创建上报任务参数
    formData.append('taskId', currentTask.value.taskId)

    // 调用新的验证和解析接口
    const response = await request.post({
      url: '/drug/report-data/validate-and-parse',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    message.notifySuccess(isZip ? '压缩包上传成功，正在解析文件...' : '文件上传成功')

    // 立即加载文件列表
    await loadFileList(currentTask.value.taskId)


  } catch (error) {
    console.error('文件上传失败:', error)
    message.notifyError('文件上传失败，请重试')
  } finally {
    loading.value = false
  }
}

// 查看文件数据
const viewFileData = async (file: any) => {
  excelDetailTotal.value = 0
  queryParams.value.pageNo = 1
  dataViewDialog.file = file // 存储文件对象
  getExcelDetailData()
}

// 分页查询文件数据
const getExcelDetailData = async () => {
  const file = dataViewDialog.file

  dataViewDialog.loading = true
  dataViewDialog.fileName = file.name
  dataViewDialog.visible = true
  try {
    const result = await ReportDataApi.getFileData(file.type, file.taskId, file.id, queryParams.value.pageNo, queryParams.value.pageSize)
    console.log('加载数据成功:', result)

    // 动态生成列
    if (result?.total) {
      excelDetailTotal.value = result.total
      const list = result.list
      const defaultColumns = dataViewDialog.columnsMap.get(file.type)
      defaultColumns.forEach(item => {
        item.key = `${file.type}-${item.prop}`
      })
      list.forEach((item, index) => {
        item.orderNo = (queryParams.value.pageNo - 1) * queryParams.value.pageSize + index + 1
      })
      dataViewDialog.columns = defaultColumns
      dataViewDialog.data = list
    } else {
      dataViewDialog.columns = []
      dataViewDialog.data = []
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    message.notifyError('加载数据失败')
  } finally {
    dataViewDialog.loading = false
  }
}


// 重新上传文件
const reuploadFile = (file: any) => {
  console.log('重新上传文件:', file)
  // message.notify(`重新上传 ${file.name}`)
}

// 删除文件
const removeFile = (file: any) => {
  message.confirm(`确定删除文件 ${file.name}？`).then(async () => {
    try {
      await ReportDataApi.deleteFile(file.id)
      message.notifySuccess('文件已删除')
      file.status = 'pending'
      file.size = 0
      file.recordCount = 0
    } catch (error) {
      console.error('文件已删除失败:', error)
      message.notifyError('文件已删除失败')
    }
  })
}

// 更新上报进度
const updateReportProgress = async (progress: number) => {
  if (!currentTask.value.taskId) {
    console.warn('任务ID不存在，无法更新上报进度')
    return
  }

  try {
    await ReportDataApi.updateReportProgress(currentTask.value.taskId, progress)
    console.log('上报进度更新成功:', progress)
  } catch (error) {
    console.error('更新上报进度失败:', error)
  }
}

// 开始前置质控
const startPreQC = async () => {
  message.notify('正在进行前置质控...')
  if (currentTask.value.maxCurrentStep === 1) { // 更新任务进度到2
    loading.value = true
    try {
      await updateReportProgress(2) // 更新上报进度为2-前置质控阶段
      currentTask.value.currentStep = 2
      currentTask.value.maxCurrentStep = 2
      await operateQCResults(currentTask.value.taskId) // 执行前置质控操作
      await loadQCResults(currentTask.value.taskId)
    } catch (error) {
      console.error('前置质控失败:', error)
      message.notifyError('前置质控失败，请重试')
    } finally {
      loading.value = false
    }
  } else { // 说明是 节点 3或者4 跳到节点1 或者 2，不需要改状态
    loading.value = true
    try {
      await operateQCResults(currentTask.value.taskId) // 执行前置质控操作
      currentTask.value.currentStep = 2
    } catch (error) {
      console.error('前置质控失败:', error)
      message.notifyError('前置质控失败，请重试')
    } finally {
      loading.value = false
    }
  }
}

// 查看质控错误
const viewQCErrors = async (row: any) => {
  errorDialog.tableName = row.name
  errorDialog.visible = true
  try {
    const errors = await ReportDataApi.getQCErrors(currentTask.value.taskId, row.type)
    errorDialog.errors = errors
  } catch (error) {
    console.error('获取错误详情失败:', error)
    message.notifyError('获取错误详情失败')
    errorDialog.errors = []
  }
}

// 修复并重新上传
const fixAndReupload = (row: any) => {
  message.notify(`请修正 ${row.name} 的错误后重新上传`)
  currentTask.value.currentStep = 1
}

// 返回上传
const backToUpload = async () => {
  currentTask.value.currentStep = 1

  // 更新上报进度为1-上传文件阶段
  // await updateReportProgress(1)
}

// 下载质控报告
const downloadQCReport = async (type: 'pre' | 'post') => {
  if (!currentTask.value.id) return

  try {
    await ReportDataApi.downloadQCReport(currentTask.value.id, type)
    message.notifySuccess(`${type === 'pre' ? '前置' : '后置'}质控报告下载成功`)
  } catch (error) {
    console.error('下载质控报告失败:', error)
    message.notifyError('下载质控报告失败')
  }
}

// 提交上报
const submitReport = async () => {
  if (!currentTask.value.id) return

  try {
    await message.confirm(
      '确认提交上报？提交后将完成上报流程'
    )

    loading.value = true
    // await ReportDataApi.submitReport(currentTask.value.id)
    currentTask.value.currentStep = 3
    currentTask.value.maxCurrentStep = 3

    // 更新上报进度为3-提交上报阶段
    // await updateReportProgress(3)

    message.notifySuccess('数据已成功提交上报')

  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('提交上报失败:', error)
      message.notifyError('提交上报失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

// 下载原始文件
const downloadOriginalFiles = async () => {
  if (!currentTask.value.id) return

  try {
    await ReportDataApi.downloadOriginalFiles(currentTask.value.id)
    message.notifySuccess('原始文件下载成功')
  } catch (error) {
    console.error('下载原始文件失败:', error)
    message.notifyError('下载原始文件失败')
  }
}

// 查看历史记录
const viewReportHistory = () => {
  message.notify('查看历史记录功能开发中')
}

// 导出错误清单
const exportErrors = async () => {
  if (!currentTask.value.id || !errorDialog.tableName) return

  try {
    await ReportDataApi.exportErrors(currentTask.value.id, errorDialog.tableName)
    message.notifySuccess('错误清单导出成功')
  } catch (error) {
    console.error('导出错误清单失败:', error)
    message.notifyError('导出错误清单失败')
  }
}

// ==================== 生命周期 ====================

onMounted(async () => {
  // 加载模板定义数据
  await loadTemplateDefinitions()

  // 加载当前任务信息
  await loadCurrentTask()
})

onUnmounted(() => {
  // 清理定时器（如果有的话）
})

// ==================== 数据加载方法 ====================

// 加载当前任务
const loadCurrentTask = async () => {
  try {
    loading.value = true
    // 使用 ReportDataController 的接口获取当前激活任务
    const task = await ReportDataApi.getCurrentActiveTask()

    if (task) {
      task.maxCurrentStep = task.currentStep // 保存原始步骤，用于后续判断是否可以向后点击下一步)

      currentTask.value = task
      console.log('加载的任务数据:', task) // 调试日志

      // currentStep 现在是计算属性，会自动从 task.currentStep 获取

      // 如果有任务ID，加载相关数据
      if (task.taskId) {
        // 加载文件列表
        if (currentStep.value >= 1) {
          await loadFileList(task.taskId)
        }

        // 加载质控结果
        if (currentStep.value >= 2) {
          await loadQCResults(task.taskId)
        }

        // 加载提交信息
        if (currentStep.value >= 3) {
          submitInfo.value = {
            submitTime: task.submitTime || new Date(),
            submitter: '当前用户',
            totalRecords: 0 // 从文件统计
          }
        }
      }
    } else {
      // 如果没有激活的任务，显示提示
      message.warning('当前没有激活的上报任务，请联系管理员')
    }
  } catch (error) {
    console.error('加载任务信息失败:', error)
    message.notifyError('加载任务信息失败，请刷新重试')
  } finally {
    loading.value = false
  }
}

// 加载文件列表
const loadFileList = async (taskId: number) => {
  try {
    // 使用旧API
    const files = await ReportDataApi.getFileList(taskId)
    // 更新本地文件列表状态
    fileList.value = fileList.value.map(localFile => {
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

// 执行前置质控
async function operateQCResults (taskId: number) {
  try {
    // 执行前置质控
    console.log('执行前置质控...', taskId)
    const preQC = await ReportDataApi.executePreQC(taskId)
  } catch (error) {
    console.error('执行前置质控失败:', error)
  }
}

// 加载质控结果
const loadQCResults = async (taskId: number) => {
  try {
    // 加载前置质控结果
    if (currentStep.value >= 2) {
      const files = await ReportDataApi.getFileList(taskId)
      preQCResult.value.passed = !files.find(item => item.qcPreStatus === 4)
      // 更新本地文件列表状态
      preQCResult.value.details = fileList.value.map(localFile => {
        const serverFile = files.find((f: any) => f.fileType === localFile.type)
        if (serverFile) {
          return {
            ...localFile,
            qcPreStatus: serverFile.qcPreStatus,
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

.content-card {
  min-height: 400px;
}

.step-content {
  padding: 20px 0;
}

/* 准备阶段样式 */
.prepare-section {
  max-width: 800px;
  margin: 0 auto;
}

.prepare-list {
  margin: 16px 0;
  padding-left: 20px;
}

.prepare-list li {
  margin: 8px 0;
  color: #606266;
}

.prepare-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* ============ 文件要求区域优化样式 ============ */
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
  margin: 24px -20px; /* 使用负边距让滚动区域延伸到父容器边缘 */
  padding: 0 20px 8px 20px; /* 内边距保持内容位置 */
  overflow-x: auto; /* 横向滚动 */
  overflow-y: hidden; /* 隐藏纵向滚动条 */
}

.file-list-container::-webkit-scrollbar {
  height: 8px;
}

.file-list-container::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}

.file-grid {
  display: flex; /* 改为flex布局以支持横向滚动 */
  gap: 16px;
  width: max-content; /* 让内容决定宽度 */
  min-width: 100%; /* 至少占满容器宽度 */
  padding: 0 16px; /* 左右留一点边距 */
}

.file-card {
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  width: 240px; /* 缩短卡片宽度 */
  flex-shrink: 0; /* 防止卡片被压缩 */
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

.file-card-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  margin-bottom: 12px;
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
  max-width: 1000px;
  margin: 0 auto;
}

.batch-upload {
  margin-bottom: 30px;
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

.file-list h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.file-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-icon {
  font-size: 16px;
}

.status-icon.success {
  color: #67c23a;
}

.status-icon.error {
  color: #f56c6c;
}

.status-icon.waiting {
  color: #909399;
}

.upload-actions {
  margin-top: 20px;
  text-align: center;
}

/* 质控区域样式 */
.qc-section {
  max-width: 1200px;
  margin: 0 auto;
}

.qc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.qc-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.error-count {
  color: #f56c6c;
  font-weight: 500;
}
.upload-button {
  display: inline-block;
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
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 0;
}

.submit-info {
  margin: 20px 0;
}

.submit-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.dialog-page {
  overflow: hidden;
  padding-top: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .prepare-actions,
  .submit-actions,
  .qc-actions {
    flex-direction: column;
  }

  .file-list-container {
    margin: 16px -16px; /* 负边距让滚动区域占满容器宽度 */
    padding: 0 16px 8px 16px;
  }

  .file-grid {
    padding: 0; /* 小屏幕下去掉额外的左右padding */
  }

  .file-card {
    width: 220px; /* 小屏幕下适当减小卡片宽度 */
  }

  .download-text h4,
  .download-text p {
    text-align: center;
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
    width: 260px; /* 大屏幕下增大卡片宽度 */
  }
}
</style>
