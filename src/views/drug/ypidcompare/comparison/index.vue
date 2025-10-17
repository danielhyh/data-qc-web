<template>
  <div class="ypid-task-container">
    <!-- 页面头部 -->
    <PageHeader
      title="YPID比对"
      content="管理YPID药品编码匹配任务，支持从质控结果创建和模板导入创建，实现药品编码的智能匹配"
      tagType="primary"
    />

    <!-- 统计概览 -->
    <div class="stats-overview">
      <el-row :gutter="16">
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <StatCard title="总任务数" :value="statistics.total" icon="Files" color="#409eff" />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <StatCard
            title="进行中"
            :value="statistics.processing"
            icon="Clock"
            color="#e6a23c"
            :description="`占比: ${calculateRate(statistics.processing, statistics.total)}%`"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <StatCard
            title="已完成"
            :value="statistics.completed"
            icon="CircleCheck"
            color="#67c23a"
            :description="`占比: ${calculateRate(statistics.completed, statistics.total)}%`"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <StatCard
            title="平均匹配率"
            :value="statistics.avgMatchRate"
            suffix="%"
            icon="DataLine"
            color="#909399"
            :trend="statistics.matchRateTrend"
          />
        </el-col>
      </el-row>
    </div>

    <!-- 操作区域 -->
    <el-card class="filter-card" shadow="never">
      <el-row :gutter="20">
        <el-col :span="16">
          <!-- 创建任务按钮组 -->
          <el-button type="primary" @click="createFromQc">
            <Icon icon="ep:circle-check" />
            从质控结果创建
          </el-button>
          <el-button type="success" @click="createFromTemplate">
            <Icon icon="ep:upload" />
            从模板导入创建
          </el-button>
          <el-button type="success" @click="createFromTemplate2">
            <Icon icon="ep:upload" />
            导入result
          </el-button>
          <el-button @click="createFromStandardLibrary">
            <Icon icon="ep:folder" />
            标准库
          </el-button>
          <el-button @click="downloadTemplate">
            <Icon icon="ep:download" />
            下载导入模板
          </el-button>
        </el-col>
        <el-col :span="8" class="flex-row-end">
          <!-- 查询条件 -->
          <!-- <el-input
            v-model="queryParams.keyword"
            placeholder="任务编号/名称"
            clearable
            class="w-200px"
            @keyup.enter="handleQuery"
          /> -->
          <el-form-item label="状态筛选" prop="status">
            <el-select
              v-model="queryParams.status"
              placeholder="请选择任务状态"
              clearable
              class="!w-200px"
            >
              <el-option label="待处理" :value="0" />
              <el-option label="处理中" :value="1" />
              <el-option label="已完成" :value="2" />
              <el-option label="已取消" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="handleQuery">
              <Icon icon="ep:search" class="mr-5px" />
              搜索
            </el-button>
            <el-button @click="resetQuery">
              <Icon icon="ep:refresh" class="mr-5px" />
              重置
            </el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-card>

    <!-- YPID比对任务列表 -->
    <el-card class="result-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">YPID比对任务列表</span>
          <span class="result-count">共 {{ total }} 个任务</span>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="list"
        :stripe="true"
        :show-overflow-tooltip="true"
        :max-height="tableMaxHeight"
        :height="tableHeight"
      >
        <el-table-column type="index" label="序号" width="60" :index="calculateIndex" />
        <el-table-column prop="taskNo" label="任务编号" width="200" />
        <el-table-column prop="status" label="状态" width="200">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="taskName" label="任务名称" min-width="200" />
        <el-table-column prop="taskType" label="来源类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.taskType === 1 ? 'warning' : 'success'">
              {{ row.taskType === 1 ? '质控导入' : '模板导入' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="createTime"
          label="创建时间"
          width="160"
          :formatter="dateFormatter"
        />
        <el-table-column label="比对阈值" width="120">
          <template #default="{ row }">
            <span>{{ row.autoApplyThreshold || 0 }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="比对进度" width="250">
          <template #default="{ row }">
            <div class="progress-wrapper">
              <el-progress
                :percentage="getMatchProgress(row)"
                :status="getProgressStatus(row.status)"
              />
              <span class="progress-text"> {{ row.confirmedCount }}/{{ row.totalCount }} </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="gotoBatchMatch(row)"> 批量匹配 </el-button>
<!--            <el-button link type="primary" @click="viewReport(row)"> 查看报告 </el-button>-->
            <el-button link type="success" @click="exportResult(row)"> 导出结果 </el-button>
          </template>
        </el-table-column>
      </el-table>

      <Pagination
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>

    <!-- 从质控结果创建对话框 -->
    <el-dialog v-model="qcCreateVisible" title="从质控结果创建YPID匹配任务" width="800px">
      <el-form :model="qcCreateForm" label-width="120px">
        <el-form-item label="选择质控任务">
          <el-select
            v-model="qcCreateForm.sourceId"
            placeholder="请选择质控任务"
            style="width: 100%"
          >
            <el-option
              v-for="task in qcTaskList"
              :key="task.id"
              :label="`${task.taskNo} - ${task.hospitalName}`"
              :value="task.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="任务名称">
          <el-input v-model="qcCreateForm.taskName" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="自动应用">
          <el-switch v-model="qcCreateForm.autoApplyEnabled" />
        </el-form-item>
        <el-form-item v-if="qcCreateForm.autoApplyEnabled" label="自动应用阈值">
          <el-slider
            v-model="qcCreateForm.autoApplyThreshold"
            :min="80"
            :max="100"
            :step="5"
            show-input
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="qcCreateVisible = false">取消</el-button>
        <el-button type="primary" @click="handleQcCreate" :loading="qcCreateLoading">
          创建任务
        </el-button>
      </template>
    </el-dialog>

    <!-- 从模板导入创建对话框 -->
    <el-dialog v-model="templateCreateVisible" title="从模板导入创建YPID匹配任务" width="600px">
      <el-form :model="templateCreateForm" label-width="120px">
        <el-form-item label="任务名称">
          <el-input v-model="templateCreateForm.taskName" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="上传文件">
          <el-upload
            ref="uploadRef"
            v-model:file-list="uploadedFile"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            action="none"
          >
            <el-button type="primary">
              <Icon icon="ep:upload" />
              选择Excel文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">只支持xlsx/xls格式文件</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="自动应用">
          <el-switch v-model="templateCreateForm.autoApplyEnabled" />
        </el-form-item>
        <el-form-item v-if="templateCreateForm.autoApplyEnabled" label="自动应用阈值">
          <el-slider
            v-model="templateCreateForm.autoApplyThreshold"
            :min="80"
            :max="100"
            :step="5"
            show-input
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="templateCreateVisible = false">取消</el-button>
        <el-button type="primary" @click="handleTemplateCreate" :loading="templateCreateLoading">
          创建任务
        </el-button>
      </template>
    </el-dialog>

    <!-- 从模板导入创建对话框 -->
    <el-dialog v-model="templateCreateVisible2" title="从模板导入创建YPID匹配任务" width="600px">
      <el-form :model="templateCreateForm" label-width="120px">
        <el-form-item label="任务名称">
          <el-input v-model="templateCreateForm.taskName" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="上传文件">
          <el-upload
            ref="uploadRef2"
            v-model:file-list="uploadedFile2"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            action="none"
          >
            <el-button type="primary">
              <Icon icon="ep:upload" />
              选择Excel文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">只支持xlsx/xls格式文件</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="templateCreateVisible2 = false">取消</el-button>
        <el-button type="primary" @click="handlerTemplateCreate2" :loading="templateCreateLoading2">
          创建任务
        </el-button>
      </template>
    </el-dialog>

    <TemplateDownloadDialog ref="downloadDialog"/>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { YpidMatchTaskApi, YpidMatchTaskVO } from '@/api/drug/ypid/task'
import { YpidApi } from '@/api/drug/ypid'
import { useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import type { UploadUserFile } from 'element-plus'


// 导入组件
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '@/components/StatCard/index.vue'
import TemplateDownloadDialog from '@/views/drug/import/template/components/TemplateDownloadDialog.vue'

defineOptions({ name: 'YpidComparisonIndex' })

const router = useRouter()
const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const list = ref<YpidMatchTaskVO[]>([])
const total = ref(0)
const exportLoading = ref(false)

// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: undefined as string | undefined,
  status: undefined as number | undefined
})

// 统计数据
const statistics = reactive({
  total: 0,
  processing: 0,
  completed: 0,
  avgMatchRate: 0,
  matchRateTrend: 0 // 新增趋势数据
})

// 从质控结果创建相关
const qcCreateVisible = ref(false)
const qcCreateLoading = ref(false)
const qcTaskList = ref<any[]>([])
const qcCreateForm = reactive({
  sourceId: undefined as number | undefined,
  taskName: '',
  autoApplyEnabled: true,
  autoApplyThreshold: 90
})

// 从模板导入创建相关
const templateCreateVisible = ref(false)
const templateCreateLoading = ref(false)
const templateCreateVisible2 = ref(false)
const templateCreateLoading2 = ref(false)
const uploadRef = ref()
const uploadRef2 = ref()
const uploadedFile = ref<UploadUserFile[]>([])
const uploadedFile2 = ref<UploadUserFile[]>([])
const templateCreateForm = reactive({
  taskName: '',
  autoApplyEnabled: true,
  autoApplyThreshold: 90,
  taskNo:'',

})

// ========================= 计算属性 =========================

// 动态计算表格高度，避免数据少时留白过多
const tableHeight = computed(() => {
  // 数据少的时候不设置固定高度，让表格自适应内容
  if (list.value.length <= 15) {
    return null
  }
  return undefined // 使用 max-height 来限制
})

// 根据每页显示条数动态设置最大高度
const tableMaxHeight = computed(() => {
  const pageSize = queryParams.pageSize
  const dataCount = list.value.length

  // 根据每页显示条数设置不同的最大高度
  switch (pageSize) {
    case 10:
      // 10条数据时不限制高度或设置较大值，避免留白
      return dataCount > 12 ? '600px' : null
    case 20:
      // 20条数据时设置适中高度
      return '600px'
    case 30:
      // 30条数据时设置适中高度
      return '550px'
    case 50:
      // 50条数据时设置较小高度，启用滚动
      return '500px'
    case 100:
      // 100条数据时设置更小高度，确保滚动体验
      return '400px'
    default:
      // 其他情况默认设置
      return '500px'
  }
})

// ========================= 方法 =========================

// 计算序号（支持分页）
const calculateIndex = (index: number) => {
  return (queryParams.pageNo - 1) * queryParams.pageSize + index + 1
}

// 获取状态文本
const getStatusText = (status: number) => {
  switch (status) {
    case 0:
      return '待处理'
    case 1:
      return '处理中'
    case 2:
      return '已完成'
    case 3:
      return '已取消'
    default:
      return '未知'
  }
}

// 获取状态标签类型
const getStatusType = (status: number) => {
  switch (status) {
    case 0:
      return 'info' // 待处理 - 灰色
    case 1:
      return 'warning' // 处理中 - 橙色
    case 2:
      return 'success' // 已完成 - 绿色
    case 3:
      return 'info' // 已取消 - 灰色
    default:
      return ''
  }
}

// 获取进度条状态
const getProgressStatus = (status: number) => {
  switch (status) {
    case 1:
      return '' // 未比对，不显示特殊状态
    case 2:
      return 'warning' // 比对中，显示警告状态
    case 3:
      return 'success' // 已完成，显示成功状态
    default:
      return ''
  }
}

// 查询列表
const getList = async () => {
  loading.value = true
  try {
    const data = await YpidMatchTaskApi.getYpidMatchTaskPage(queryParams)
    console.log('获取到的数据:', data)
    list.value = data.list
    total.value = data.total

    // 更新统计数据
    statistics.total = data.total
    statistics.processing = data.list.filter((item) => item.status === 1).length
    statistics.completed = data.list.filter((item) => item.status === 2).length
    statistics.avgMatchRate = Math.round(
      data.list.reduce((sum, item) => sum + getMatchProgress(item), 0) / (data.list.length || 1)
    )

    // 模拟趋势数据（实际项目中应该从API获取）
    statistics.matchRateTrend = Math.floor(Math.random() * 10) - 5 // -5到5的随机数
  } finally {
    loading.value = false
  }
}

// 搜索按钮操作
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

// 重置按钮操作
const resetQuery = () => {
  queryParams.keyword = undefined
  queryParams.status = undefined
  handleQuery()
}

// 计算比对进度
const getMatchProgress = (row: YpidMatchTaskVO) => {
  if (!row.totalCount || row.totalCount === 0) return 0
  const progress = Math.round((row.confirmedCount / row.totalCount) * 100)
  console.log('计算进度:', {
    taskNo: row.taskNo,
    confirmedCount: row.confirmedCount,
    totalCount: row.totalCount,
    progress: progress
  })
  return progress
}

// 计算比率
const calculateRate = (value: number, total: number) => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

// 跳转到批量匹配页面
const gotoBatchMatch = (row: YpidMatchTaskVO) => {
  router.push({
    path: '/drug/ypidcompare/batch-match',
    query: { taskId: row.id }
  })
}

// 查看报告
const viewReport = async (row: YpidMatchTaskVO) => {
  try {
    // 先获取任务的报告ID
    const reportResult = await YpidApi.getTaskReport(row.id)
    if (reportResult && reportResult.reportId) {
      // 跳转到报告详情页
      router.push({
        path: `/drug/ypidcompare/report-detail/${reportResult.reportId}`,
        query: { taskId: row.id }
      })
    } else {
      ElMessage.warning('该任务还没有生成匹配报告')
    }
  } catch (error) {
    console.error('获取报告信息失败:', error)
    ElMessage.error('获取报告信息失败')
  }
}

// 导出匹配结果
const exportResult = async (row: YpidMatchTaskVO) => {
  const loading = ElLoading.service({ text: '正在导出...' })
  try {
    const data = await YpidApi.exportMatchResult(row.id)
    download.excel(data, `${row.taskName}_匹配结果.xlsx`)
    ElMessage.success('导出成功')
  } finally {
    loading.close()
  }
}

// 从质控结果创建
const createFromQc = async () => {
  qcCreateVisible.value = true
  // 加载质控YPID比对任务列表
  qcTaskList.value = [
    { id: 1, taskNo: 'QC_20240101_001', hospitalName: '北京协和医院' },
    { id: 2, taskNo: 'QC_20240101_002', hospitalName: '上海瑞金医院' }
  ]
}

// 处理质控创建
const handleQcCreate = async () => {
  if (!qcCreateForm.sourceId || !qcCreateForm.taskName) {
    ElMessage.warning('请填写必要信息')
    return
  }

  qcCreateLoading.value = true
  try {
    await YpidMatchTaskApi.createYpidMatchTask({
      ...qcCreateForm,
      taskType: 1
    } as any)
    ElMessage.success('任务创建成功')
    qcCreateVisible.value = false
    getList()
  } finally {
    qcCreateLoading.value = false
  }
}

// 从模板导入创建
const createFromTemplate = () => {
  templateCreateVisible.value = true
}
const createFromTemplate2 = () => {
  templateCreateVisible2.value = true
}

// 标准库按钮跳转至标准库页面
const createFromStandardLibrary = () => {
  router.push('/drug/ypidcompare/standard-library')
}

// 处理文件选择
// const handleFileChange = (file: any) => {
//   uploadedFile.value.raw = file.raw
// }

const getCurrentDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要+1
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}
const handlerTemplateCreate2 = async () => {
  const form = new FormData()
  form.append('file', uploadedFile2.value[0].raw as Blob)
  await YpidMatchTaskApi.reVerify(form)
}
// 处理模板创建
const handleTemplateCreate = async () => {
  if (!templateCreateForm.taskName || !(uploadedFile.value.length > 0)) {
    ElMessage.warning('请填写任务名称并选择文件')
    return
  }
  templateCreateLoading.value = true
  try {
    const taskNo = 'YPID_' + getCurrentDateString() + '_' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const params = {
      ...templateCreateForm,
      taskType: 2,
      sourceFile: uploadedFile.value[0].name,
      status: 0,

    } as any
    params.taskNo = taskNo
    const form = new FormData()
    form.append('file', uploadedFile.value[0].raw as Blob)
    form.append('params', JSON.stringify(params))
    await YpidMatchTaskApi.importAndCreateYpidMatchTask(form)
    ElMessage.success('任务创建成功')
    templateCreateVisible.value = false
    getList()
  } finally {
    templateCreateLoading.value = false
  }
}

//定义下载模板模态框
const downloadDialog = ref()

// 下载导入模板
const downloadTemplate = () => {
  // const templateUrl = '/templates/ypid_import_template.xlsx'
  // const link = document.createElement('a')
  // link.href = templateUrl
  // link.download = 'YPID导入模板.xlsx'
  // link.click()
  downloadDialog.value.open(8)
}

// 初始化
onMounted(() => {
  getList()
})
</script>

<style scoped>
.ypid-task-container {
  min-height: calc(100vh - 50px);
  padding: 20px;
  background-color: #f5f5f5;
}

.stats-overview {
  margin-bottom: 20px;
}

.filter-card,
.result-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.result-count {
  font-size: 14px;
  color: #909399;
}

.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-text {
  min-width: 50px;
  font-size: 12px;
  color: #666;
}

.text-right {
  text-align: right;
}

.w-200px {
  width: 200px;
}

.mr-5px {
  margin-right: 5px;
}
.flex-row-end{
    display: flex;
    justify-content: flex-end;
}
</style>
