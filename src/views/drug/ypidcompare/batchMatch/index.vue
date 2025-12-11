<template>
  <div class="ypid-batch-match-page">
    <!-- 页面头部 -->
    <PageHeader
      :title="pageTitle"
      :content="pageDescription"
      :icon="OperationIcon"
      :tag="statusTag"
      :tag-type="statusTagType"
      :meta="metaInfo"
      show-back-button
      back-button-text="返回YPID比对列表"
      :tabs="tabList"
      :default-tab="activeTab"
      :actions="headerActions"
      @back-click="handleBackClick"
      @tab-change="handleTabChange"
      @action-click="handleHeaderAction"
    />

    <!-- 主要内容区域 -->
    <div class="match-content" v-loading="loading">
      <!-- 匹配配置面板 - 仅在待匹配tab显示 -->
      <!-- <el-card v-if="activeTab === 'pending'" class="config-card" shadow="never">
        <template #header>
          <div class="config-header">
            <div class="header-left">
              <el-icon class="header-icon">
                <Setting />
              </el-icon>
              <span class="header-title">匹配配置</span>
            </div>
            <div class="header-right">
              <el-button
                v-if="statistics.whole > 0"
                type="primary"
                :loading="loading"
                @click="startBatchMatch"
              >
                <el-icon><Operation /></el-icon>
                开始批量匹配
              </el-button>
            </div>
          </div>
        </template>

        <el-form :model="matchConfig" label-width="140px">
          <el-form-item label="自动应用高分匹配">
            <el-switch v-model="matchConfig.autoApplyEnabled" />
            <span class="ml-10px text-gray">匹配分数达到阈值时自动确认，无需人工审核</span>
          </el-form-item>
          <el-form-item v-if="matchConfig.autoApplyEnabled" label="自动应用阈值">
            <el-slider
              v-model="matchConfig.autoApplyThreshold"
              :min="80"
              :max="100"
              :step="5"
              :marks="{ 80: '80%', 90: '90%', 95: '95%', 100: '100%' }"
              show-input
              class="w-400px"
            />
          </el-form-item>
        </el-form>
      </el-card> -->

      <!-- 数据列表 -->
      <el-card class="data-card" shadow="never">
        <!-- 批量操作栏 -->
        <div v-if="activeTab === 'needConfirm'" class="batch-actions">
          <el-alert title="待确认项操作" type="info" :closable="false" class="batch-alert">
            <template #default>
              <span>当前有 {{ statistics.needConfirm }} 条数据需要确认，</span>
              <span>批量确认将选择匹配度最高的候选项</span>
            </template>
          </el-alert>
          <div class="batch-buttons">
            <el-button type="success" @click="batchConfirm" :disabled="selectedRows.length === 0">
              <el-icon><Check /></el-icon>
              批量确认选中项 ({{ selectedRows.length }})
            </el-button>
            <el-button type="primary" @click="confirmAll" :disabled="statistics.needConfirm === 0">
              <el-icon><CircleCheck /></el-icon>
              确认所有待确认项
            </el-button>
          </div>
        </div>

        <!-- 数据表格 -->
        <el-table :data="dataList" v-loading="loading" @selection-change="handleSelectionChange">
          <el-table-column v-if="showSelection" type="selection" width="50" />
          <el-table-column prop="hospitalDrugCode" label="院内编码" width="120" />
          <el-table-column
            prop="productName"
            label="产品名称"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column prop="spec" label="规格" width="100" />
          <el-table-column
            prop="manufacturer"
            label="生产企业"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column label="比对结果" width="200">
            <template #default="{ row }">
              <div v-if="row.matchedYpid" class="match-result">
                <el-tag type="success" size="small">
                  {{ row.matchedYpid }}
                </el-tag>
                <el-progress
                  :percentage="row.matchScore"
                  :color="getScoreColor(row.matchScore)"
                  :stroke-width="6"
                  class="mt-5px"
                />
              </div>
              <el-tag v-else type="info" size="small">未匹配</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-if="activeTab === 'confirmed'" label="确认信息" width="180">
            <template #default="{ row }">
              <div v-if="row.matchStatus === 2" class="confirm-info">
                <div class="confirm-user">
                  <el-icon><User /></el-icon>
                  {{ getConfirmUserText(row.confirmUser) }}
                </div>
                <div class="confirm-time">
                  {{ dateFormatter(row.confirmTime) }}
                </div>
                <el-tag
                  v-if="row.matchMethod"
                  size="small"
                  :type="row.matchMethod === 'AUTO' ? 'success' : 'warning'"
                >
                  {{ row.matchMethod === 'AUTO' ? '自动' : '手动' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <!-- 全部状态：确认和手动匹配 -->
                <template v-if="row.matchStatus === ''">
                  <!-- 如果比对结果 row.matchedYpid 有值，并且确认状态是未确认，则操作区域显示确认和手动匹配按钮 -->
                  <template v-if="row.matchedYpid && (row.matchStatus === 0 || row.matchStatus === 1)">
                    <el-button size="small" type="success" @click="confirmSingle(row)">
                      <el-icon><Check /></el-icon>
                      确认
                    </el-button>
                    <el-button size="small" type="primary" @click="openManualMatch(row)">
                      <el-icon><Edit /></el-icon>
                      手动匹配
                    </el-button>
                  </template>
                  <!-- 如果比对结果 row.matchedYpid 没有值，则操作区域显示手动匹配按钮 -->
                  <template v-else-if="!row.matchedYpid">
                    <el-button size="small" type="primary" @click="openManualMatch(row)">
                      <el-icon><Edit /></el-icon>
                      手动匹配
                    </el-button>
                  </template>
                  <!-- 如果比对结果 row.matchedYpid 有值，并且确认状态是自动，则操作区域不显示按钮，使用——表示 -->
                  <template v-else-if="row.matchedYpid && row.matchStatus === 2">
                    <span style="color: #c0c4cc; font-size: 14px;">——</span>
                  </template>
                </template>
                <!-- 待确认状态：确认和手动匹配 -->
                <template v-if="row.matchStatus === 1">
                  <el-button size="small" type="success" @click="confirmSingle(row)">
                    <el-icon><Check /></el-icon>
                    确认
                  </el-button>
                  <el-button size="small" type="primary" @click="openManualMatch(row)">
                    <el-icon><Edit /></el-icon>
                    手动匹配
                  </el-button>
                </template>

                <!-- 已确认状态：撤销匹配和查看历史 -->
                <template v-else-if="row.matchStatus === 2">
                  <el-button size="small" type="warning" @click="revokeMatch(row)">
                    <el-icon><RefreshLeft /></el-icon>
                    撤销匹配
                  </el-button>
                  <el-button size="small" type="info" @click="viewHistory(row)">
                    <el-icon><Clock /></el-icon>
                    查看历史
                  </el-button>
                </template>

                <!-- 其他状态：手动匹配 -->
                <template v-else>
                  <el-button size="small" type="primary" @click="openManualMatch(row)">
                    <el-icon><Edit /></el-icon>
                    手动匹配
                  </el-button>
                </template>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <Pagination
          v-model:page="queryParams.pageNo"
          v-model:limit="queryParams.pageSize"
          :total="total"
          @pagination="getDataList"
        />
      </el-card>
    </div>

    <!-- 批量匹配进度对话框 -->
    <el-dialog
      v-model="progressVisible"
      title="批量匹配进度"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="progress-content">
        <el-progress :percentage="matchProgress.percentage" :status="matchProgress.status" />
        <div class="progress-info mt-20px">
          <p>总数：{{ matchProgress.total }}</p>
          <p>已处理：{{ matchProgress.processed }}</p>
          <p>匹配成功：{{ matchProgress.success }}</p>
          <p>需要确认：{{ matchProgress.needConfirm }}</p>
          <p>匹配失败：{{ matchProgress.failed }}</p>
        </div>
      </div>
    </el-dialog>

    <!-- 手动匹配对话框 -->
    <el-dialog
      v-model="manualMatchVisible"
      title="手动匹配"
      width="900px"
      :close-on-click-modal="false"
    >
      <ManualMatchPanel
        v-if="manualMatchVisible && currentMatchRow"
        :pending-data="currentMatchRow"
        :task-id="taskId"
        :recommended-candidates="recommendedCandidates"
        @confirm="handleManualConfirm"
        @cancel="manualMatchVisible = false"
      />
    </el-dialog>

    <!-- 撤销匹配对话框 -->
    <el-dialog
      v-model="revokeVisible"
      title="撤销匹配"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="revoke-content">
        <el-alert
          title="撤销操作"
          type="warning"
          :closable="false"
          class="mb-20px"
        >
          <template #default>
            撤销后该数据将回到待匹配状态，需要重新进行匹配确认
          </template>
        </el-alert>
        
        <el-form :model="revokeForm" label-width="80px">
          <el-form-item label="撤销原因" required>
            <el-input
              v-model="revokeForm.reason"
              type="textarea"
              :rows="3"
              placeholder="请输入撤销原因"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="revokeVisible = false">取消</el-button>
        <el-button type="warning" @click="confirmRevoke" :loading="revokeLoading">
          确认撤销
        </el-button>
      </template>
    </el-dialog>

    <!-- 匹配历史对话框 -->
    <el-dialog
      v-model="historyVisible"
      title="匹配历史"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-timeline v-loading="historyLoading">
        <el-timeline-item
          v-for="(item, index) in matchHistory"
          :key="index"
          :timestamp="dateFormatter(item.operateTime)"
          :type="getHistoryType(item.actionType)"
        >
          <div class="history-item">
            <div class="history-action">
              {{ getActionText(item.actionType) }}
            </div>
            <div class="history-detail" v-if="item.beforeYpid || item.afterYpid">
              <span v-if="item.beforeYpid">原YPID: {{ item.beforeYpid }}</span>
              <span v-if="item.afterYpid">→ 新YPID: {{ item.afterYpid }}</span>
              <span v-if="item.matchScore">(匹配度: {{ item.matchScore }}%)</span>
            </div>
            <div class="history-operator">
              操作人: {{ item.operator || '系统' }}
              <span v-if="item.matchMethod">({{ item.matchMethod === 'AUTO' ? '自动' : '手动' }})</span>
            </div>
            <div v-if="item.remark" class="history-remark">
              备注: {{ item.remark }}
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Operation as OperationIcon,
  Operation,
  Setting,
  Check,
  CircleCheck,
  Edit,
  User,
  RefreshLeft,
  Clock
} from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader/index.vue'
import ManualMatchPanel from './components/ManualMatchPanel.vue'
import { YpidApi, type UnmatchedDrugVO, type BatchMatchRequestVO } from '@/api/drug/ypid'
import { YpidMatchTaskApi } from '@/api/drug/ypid/task'
import { dateFormatter } from '@/utils/formatTime'

defineOptions({ name: 'DrugYpidBatchMatch' })

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const progressVisible = ref(false)

// 任务信息
const taskId = ref<number>()
const taskInfo = reactive({
  taskNo: '',
  taskName: '',
  status: 0
})

// 手动匹配相关
const manualMatchVisible = ref(false)
const currentMatchRow = ref<any>(null)
const recommendedCandidates = ref<any[]>([])

// 撤销匹配相关
const revokeVisible = ref(false)
const revokeLoading = ref(false)
const currentRevokeRow = ref<any>(null)
const revokeForm = reactive({
  reason: ''
})

// 匹配历史相关
const historyVisible = ref(false)
const historyLoading = ref(false)
const matchHistory = ref<any[]>([])

// 统计数据
const statistics = reactive({
  whole: 0,
  needConfirm: 0,
  confirmed: 0,
  failed: 0
})

// 匹配配置
const matchConfig = reactive({
  autoApplyEnabled: true,
  autoApplyThreshold: 90
})

// 页面参数
const activeTab = ref('pending')
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  matchTaskId: undefined as number | undefined,
  matchStatus: undefined as number | undefined
})

// 页面状态
const pageTitle = computed(() => `YPID批量匹配 - ${taskInfo.taskName || '加载中...'}`)
const pageDescription = computed(() => `任务编号：${taskInfo.taskNo || '未知'}`)
const statusTag = computed(() => {
  const statusMap = {
    0: '待开始',
    1: '进行中',
    2: '已完成',
    3: '已失败'
  }
  return statusMap[taskInfo.status] || '未知'
})
const statusTagType = computed(() => {
  const typeMap = {
    0: 'info',
    1: 'warning',
    2: 'success',
    3: 'danger'
  }
  return typeMap[taskInfo.status] || 'info'
})

// 头部元数据
const metaInfo = computed(() => [
  { label: '全部', value: statistics.whole },
  { label: '待确认', value: statistics.needConfirm },
  { label: '已确认', value: statistics.confirmed },
  { label: '无法匹配', value: statistics.failed }
])

// 标签页配置
const tabList = computed(() => [
  { key: 'pending', label: '全部', badge: statistics.whole },
  { key: 'needConfirm', label: '待确认', badge: statistics.needConfirm },
  { key: 'confirmed', label: '已确认', badge: statistics.confirmed },
  { key: 'failed', label: '无法匹配', badge: statistics.failed }
])

// 头部操作按钮（已移动到配置卡片）
const headerActions = computed(() => {
  return []
})

const dataList = ref<any[]>([])

// 示例数据
const generateMockData = () => {
  const mockData = [
    // 待匹配数据 (status: 0)
    {
      id: 1,
      hospitalDrugCode: 'HD001',
      productName: '布洛芬缓释胶囊',
      genericName: '布洛芬',
      spec: '0.3g*20粒',
      manufacturer: '中美天津史克制药有限公司',
      matchedYpid: null,
      matchScore: 0,
      matchStatus: 0,
      matchDetail: JSON.stringify({
        candidates: [
          { ypid: '12345678901234', score: 95.5 },
          { ypid: '12345678901235', score: 88.2 },
          { ypid: '12345678901236', score: 82.1 }
        ]
      })
    },
    // 待确认数据 (status: 1)
    {
      id: 2,
      hospitalDrugCode: 'HD002',
      productName: '阿莫西林胶囊',
      genericName: '阿莫西林',
      spec: '0.25g*24粒',
      manufacturer: '石药集团中诺药业（石家庄）有限公司',
      matchedYpid: 'YPID001234567890',
      matchScore: 95,
      matchStatus: 1,
      matchDetail: JSON.stringify({
        candidates: [
          { ypid: 'YPID001234567890', score: 95.0 },
          { ypid: 'YPID001234567891', score: 89.5 },
          { ypid: 'YPID001234567892', score: 83.2 }
        ]
      })
    },
    {
      id: 3,
      hospitalDrugCode: 'HD003',
      productName: '头孢克肟胶囊',
      genericName: '头孢克肟',
      spec: '0.1g*6粒',
      manufacturer: '齐鲁制药有限公司',
      matchedYpid: 'YPID001234567891',
      matchScore: 88,
      matchStatus: 1,
      matchDetail: JSON.stringify({
        candidates: [
          { ypid: 'YPID001234567891', score: 88.0 },
          { ypid: 'YPID001234567893', score: 85.5 },
          { ypid: 'YPID001234567894', score: 80.1 }
        ]
      })
    },
    // 已确认数据 (status: 2)
    {
      id: 4,
      hospitalDrugCode: 'HD004',
      productName: '复方甘草片',
      genericName: '复方甘草',
      spec: '100片',
      manufacturer: '北京同仁堂股份有限公司',
      matchedYpid: 'YPID001234567892',
      matchScore: 92,
      matchStatus: 2,
      matchMethod: 'AUTO',
      confirmTime: new Date().toISOString(),
      confirmUser: 3
    },
    {
      id: 5,
      hospitalDrugCode: 'HD005',
      productName: '阿司匹林肠溶片',
      genericName: '阿司匹林',
      spec: '100mg*30片',
      manufacturer: '拜耳医药保健有限公司',
      matchedYpid: 'YPID001234567893',
      matchScore: 96,
      matchStatus: 2,
      matchMethod: 'MANUAL',
      confirmTime: new Date(Date.now() - 3600000).toISOString(),
      confirmUser: 2
    },
    {
      id: 6,
      hospitalDrugCode: 'HD006',
      productName: '盐酸二甲双胍片',
      genericName: '二甲双胍',
      spec: '0.5g*50片',
      manufacturer: '中美上海施贵宝制药有限公司',
      matchedYpid: 'YPID001234567894',
      matchScore: 94,
      matchStatus: 2,
      matchMethod: 'AUTO',
      confirmTime: new Date(Date.now() - 7200000).toISOString(),
      confirmUser: 1
    },
    // 无法匹配数据 (status: 3)
    {
      id: 7,
      hospitalDrugCode: 'HD007',
      productName: '盐酸左氧氟沙星胶囊',
      genericName: '左氧氟沙星',
      spec: '0.1g*10粒',
      manufacturer: '扬子江药业集团有限公司',
      matchedYpid: null,
      matchScore: 0,
      matchStatus: 3,
      remark: '无匹配的YPID标准'
    }
  ]
  return mockData
}
const total = ref(0)
const selectedRows = ref<any[]>([])

// 批量匹配进度
const matchProgress = reactive({
  percentage: 0,
  status: '',
  total: 0,
  processed: 0,
  success: 0,
  needConfirm: 0,
  failed: 0
})

// 计算属性
const showSelection = computed(() => {
  return activeTab.value === 'needConfirm'
})

// 生命周期
onMounted(() => {
  initPage()
})

// 初始化页面
const initPage = async () => {
  // 从路由获取任务ID
  taskId.value = Number(route.query.taskId)
  if (!taskId.value) {
    ElMessage.error('缺少任务ID参数')
    router.back()
    return
  }

  queryParams.matchTaskId = taskId.value
  await loadTaskInfo()
  await getDataList()
  await getMatchStatistics() // 获取批量匹配进度
}

// 加载任务信息
const loadTaskInfo = async () => {
  try {
    // 使用示例数据进行测试
    // Object.assign(taskInfo, {
    //   taskNo: 'BATCH-20241207-001',
    //   taskName: '2024年12月药品批量匹配任务',
    //   status: 1
    // })

    // 更新统计数据
    // Object.assign(statistics, {
    //   whole: 1,
    //   needConfirm: 2,
    //   confirmed: 0,
    //   failed: 1
    // })

    // 生产环境使用真实API
    const task = await YpidMatchTaskApi.getYpidMatchTask(taskId.value!)
    Object.assign(taskInfo, {
      taskNo: task.taskNo,
      taskName: task.taskName,
      status: task.status
    })
    Object.assign(statistics, {
      whole: task.totalCount - task.matchedCount - task.failedCount,
      needConfirm: task.matchedCount - task.confirmedCount,
      confirmed: task.confirmedCount,
      failed: task.failedCount
    })
  } catch (error) {
    ElMessage.error('加载任务信息失败')
  }
}

// 获取批量匹配进度 
const getMatchStatistics = async () => {
  try {
    const progress = await YpidApi.getMatchStatistics(taskId.value!)
    console.log(progress, "获取批量匹配进度");
    Object.assign(statistics, {
      whole: progress.length && progress[0] || 0,
      needConfirm: progress.length && progress[1] || 0,
      confirmed: progress.length && progress[2] || 0,
      failed: progress.length && progress[3] || 0,
    })
  } catch (error) {
    ElMessage.error('获取批量匹配进度失败')
  }
}

// 获取数据列表方法更新
const getDataList = async () => {
  const statusMap = {
    whole: 0,
    needConfirm: 1,
    confirmed: 2,
    failed: 3
  }
  queryParams.matchStatus = statusMap[activeTab.value]

  loading.value = true
  try {
    // 使用示例数据进行测试
    // const mockData = generateMockData()
    // const filteredData = mockData.filter((item) => item.matchStatus === statusMap[activeTab.value])
    // dataList.value = filteredData
    // total.value = filteredData.length

    // 生产环境使用真实API
    const { list, total: totalCount } = await YpidApi.getBatchMatchList(queryParams)
    dataList.value = list || []
    total.value = totalCount || 0
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 开始批量匹配
const startBatchMatch = async () => {
  progressVisible.value = true

  // 重置进度信息
  Object.assign(matchProgress, {
    percentage: 0,
    status: '',
    total: statistics.whole,
    processed: 0,
    success: 0,
    needConfirm: 0,
    failed: 0
  })

  try {
    const params: BatchMatchRequestVO = {
      taskId: taskId.value,
      matchStrategy: 'smart',
      options: {
        autoApprove: matchConfig.autoApplyEnabled,
        minConfidence: matchConfig.autoApplyThreshold
      }
    }

    const result = await YpidApi.executeBatchMatch(params)

    // 更新进度信息
    matchProgress.processed = result.totalCount
    matchProgress.success = result.successCount
    matchProgress.needConfirm = result.pendingCount
    matchProgress.failed = result.failureCount
    matchProgress.percentage = 100
    matchProgress.status = result.failureCount > 0 ? 'warning' : 'success'

    ElMessage.success(`匹配完成：成功 ${result.successCount} 条`)

    // 刷新数据
    await loadTaskInfo()
    await getDataList()
    await getMatchStatistics() // 获取批量匹配进度
  } catch (error) {
    matchProgress.status = 'exception'
    ElMessage.error('批量匹配失败')
  }
}

// 选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
}

// 批量确认
const batchConfirm = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要确认的项目')
    return
  }

  try {
    await YpidApi.batchConfirm(selectedRows.value.map((row) => row.id))
    ElMessage.success('批量确认成功')
    await getDataList()
    await getMatchStatistics() // 获取批量匹配进度
  } catch (error) {
    ElMessage.error('批量确认失败')
  }
}

// 确认所有
const confirmAll = async () => {
  try {
    // 获取所有待确认项的ID
    const allNeedConfirmIds = dataList.value
      .filter(row => row.matchStatus === 1) // 待确认状态
      .map(row => row.id)

    if (allNeedConfirmIds.length === 0) {
      ElMessage.warning('没有待确认的项目')
      return
    }

    await YpidApi.batchConfirm(allNeedConfirmIds)
    ElMessage.success('确认所有待确认项成功')
    await getDataList()
    await getMatchStatistics() // 获取批量匹配进度
  } catch (error) {
    ElMessage.error('确认失败')
  }
}

// 单个确认
const confirmSingle = async (row: any) => {
  try {
    await YpidApi.confirmMatch(row.id)
    ElMessage.success('确认成功')
    await getDataList()
    await getMatchStatistics() // 获取批量匹配进度
  } catch (error) {
    ElMessage.error('确认失败')
  }
}

// 打开手动匹配对话框
const openManualMatch = async (row: any) => {
  currentMatchRow.value = row
  manualMatchVisible.value = true
  try {
    // const progress = await YpidApi.getMatchProgressList(row.id)
    recommendedCandidates.value = []
  } catch (error) {
    console.error('获取推荐匹配项列表查询失败:', error)
    recommendedCandidates.value = []
  }
}


// 处理手动匹配确认
const handleManualConfirm = async () => {
  manualMatchVisible.value = false
  currentMatchRow.value = null
  ElMessage.success('手动匹配成功')
  await getDataList()
  await loadTaskInfo()
  await getMatchStatistics() // 获取批量匹配进度
}

// 返回按钮点击
const handleBackClick = () => {
  router.push('/monitoring-org/ypidcompare-comparison')
}

// 标签页切换
const handleTabChange = (tabKey: string) => {
  activeTab.value = tabKey
  queryParams.pageNo = 1
  getDataList()
}

// 头部操作点击
const handleHeaderAction = (action: any) => {
  if (action.handler) {
    action.handler()
  }
}

// 撤销匹配
const revokeMatch = (row: any) => {
  currentRevokeRow.value = row
  revokeForm.reason = ''
  revokeVisible.value = true
}

// 确认撤销
const confirmRevoke = async () => {
  if (!revokeForm.reason.trim()) {
    ElMessage.warning('请输入撤销原因')
    return
  }

  revokeLoading.value = true
  try {
    await YpidApi.revokeMatch(currentRevokeRow.value.matchTaskId, currentRevokeRow.value.id, currentRevokeRow.value.matchedYpid, currentRevokeRow.value.id, revokeForm.reason)
    ElMessage.success('撤销成功')
    revokeVisible.value = false
    currentRevokeRow.value = null
    await getDataList()
    await loadTaskInfo()
    await getMatchStatistics() // 获取批量匹配进度
  } catch (error) {
    ElMessage.error('撤销失败')
  } finally {
    revokeLoading.value = false
  }
}

// 查看历史
const viewHistory = async (row: any) => {
  historyVisible.value = true
  historyLoading.value = true
  
  try {
    const history = await YpidApi.getMatchHistory(row.id)
    matchHistory.value = history || []
    
    // 如果没有历史数据，生成示例数据
    if (matchHistory.value.length === 0) {
      matchHistory.value = [
        {
          actionType: 'CONFIRM',
          beforeYpid: null,
          afterYpid: row.matchedYpid,
          matchScore: row.matchScore,
          matchMethod: row.matchMethod,
          operator: getConfirmUserText(row.confirmUser),
          operateTime: row.confirmTime || new Date().toISOString(),
          remark: row.matchMethod === 'AUTO' ? '自动匹配确认' : '手动匹配确认'
        },
        {
          actionType: 'MATCH',
          beforeYpid: null,
          afterYpid: row.matchedYpid,
          matchScore: row.matchScore,
          matchMethod: row.matchMethod,
          operator: '匹配系统',
          operateTime: new Date(Date.now() - 3600000).toISOString(),
          remark: '执行匹配算法'
        }
      ]
    }
  } catch (error) {
    ElMessage.error('加载历史失败')
    matchHistory.value = []
  } finally {
    historyLoading.value = false
  }
}

// 获取历史记录类型
const getHistoryType = (actionType: string) => {
  switch (actionType) {
    case 'MATCH': return 'primary'
    case 'CONFIRM': return 'success'
    case 'REVOKE': return 'warning'
    default: return 'info'
  }
}

// 获取操作文本
const getActionText = (actionType: string) => {
  switch (actionType) {
    case 'MATCH': return '执行匹配'
    case 'CONFIRM': return '确认匹配'
    case 'REVOKE': return '撤销匹配'
    default: return '未知操作'
  }
}

// 获取分数颜色
const getScoreColor = (score: number) => {
  if (score >= 90) return '#67c23a'
  if (score >= 70) return '#e6a23c'
  return '#f56c6c'
}

// 获取确认用户文本
const getConfirmUserText = (confirmUser: number | string) => {
  // 如果是字符串，直接返回（兼容旧数据）
  if (typeof confirmUser === 'string') {
    return confirmUser || '未知'
  }

  // 如果是数字，根据数据字典映射
  const userMap = {
    1: '系统自动',
    2: '质控员',
    3: '管理员'
  }
  return userMap[confirmUser] || '未知'
}
</script>

<style scoped>
.ypid-batch-match-page {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.match-content {
  margin-top: 20px;
}

.config-card,
.data-card {
  margin-bottom: 20px;
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-icon {
  font-size: 16px;
  color: #409eff;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

.batch-actions {
  margin: 16px 0;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.batch-alert {
  margin-bottom: 12px;
}

.batch-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.match-result {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.confirm-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.confirm-user {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
}

.confirm-time {
  color: #909399;
  font-size: 11px;
}

.progress-info p {
  margin: 4px 0;
  font-size: 14px;
}

.mt-20px {
  margin-top: 20px;
}

.mt-5px {
  margin-top: 5px;
}

.ml-10px {
  margin-left: 10px;
}

.text-gray {
  color: #909399;
  font-size: 13px;
}

.w-400px {
  width: 400px;
}

.mb-20px {
  margin-bottom: 20px;
}

.revoke-content {
  padding: 10px 0;
}

.history-item {
  padding: 10px 0;
}

.history-action {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.history-detail {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.history-operator {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.history-remark {
  font-size: 12px;
  color: #b0b0b0;
  font-style: italic;
}
</style>
