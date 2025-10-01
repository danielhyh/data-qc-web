<template>
  <div class="ypid-report-detail-page">
    <!-- 页面头部 -->
    <PageHeader
      :title="pageTitle"
      :content="pageDescription"
      :icon="DocumentIcon"
      :tag="statusTag"
      :tag-type="statusTagType"
      :meta="metaInfo"
      show-back-button
      back-button-text="返回YPID比对列表"
      :actions="headerActions"
      @back-click="handleBackClick"
      @action-click="handleHeaderAction"
    />

    <!-- 主要内容区域 -->
    <div class="report-content" v-loading="loading">
      <!-- 匹配概览 -->
      <el-card class="overview-card" shadow="never">
        <template #header>
          <div class="card-header flex-start">
            <el-icon class="header-icon">
              <DataAnalysis />
            </el-icon>
            <span class="header-title ml5">匹配概览</span>
          </div>
        </template>

        <div class="overview-grid">
          <!-- 统计卡片 -->
          <div class="stat-cards">
            <el-card class="stat-card pending" shadow="never">
              <div class="stat-content">
                <div class="stat-number">{{ reportDetail.statistics.totalCount }}</div>
                <div class="stat-label">总数据量</div>
              </div>
            </el-card>
            <el-card class="stat-card success" shadow="never">
              <div class="stat-content">
                <div class="stat-number">{{ reportDetail.statistics.matchedCount }}</div>
                <div class="stat-label">匹配成功</div>
                <div class="stat-percent">{{ getMatchRate() }}%</div>
              </div>
            </el-card>
            <el-card class="stat-card warning" shadow="never">
              <div class="stat-content">
                <div class="stat-number">{{ reportDetail.statistics.failedCount }}</div>
                <div class="stat-label">匹配失败</div>
                <div class="stat-percent">{{ getFailRate() }}%</div>
              </div>
            </el-card>
            <el-card class="stat-card info" shadow="never">
              <div class="stat-content">
                <div class="stat-number">{{ reportDetail.statistics.duplicateCount }}</div>
                <div class="stat-label">重复数据</div>
              </div>
            </el-card>
          </div>

          <!-- 匹配分布图表 -->
          <div class="chart-container">
            <div class="chart-title">匹配分布</div>
            <div ref="chartRef" class="chart"></div>
          </div>
        </div>
      </el-card>

      <!-- 匹配详情 -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class=" flex-row-start">
              <el-icon class="header-icon">
                <List />
              </el-icon>
              <span class="header-title ml5">匹配详情</span>
            </span>
            <div class="header-actions">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索产品名称或YPID"
                clearable
                style="width: 250px"
                @input="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
        </template>

        <!-- 筛选器 -->
        <div class="filter-bar">
          <el-radio-group v-model="statusFilter" @change="handleFilterChange">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="1">匹配成功</el-radio-button>
            <el-radio-button label="0">匹配失败</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 数据表格 -->
        <el-table
          :data="matchDetailList"
          v-loading="tableLoading"
          :max-height="tableMaxHeight"
          :height="tableHeight"
          style="margin-top: 16px"
        >
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="hospitalDrugCode" label="院内编码" width="120" />
          <el-table-column
            prop="productName"
            label="产品名称"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column prop="genericName" label="通用名" width="120" show-overflow-tooltip />
          <el-table-column prop="spec" label="规格" width="100" />
          <el-table-column
            prop="manufacturer"
            label="生产企业"
            min-width="150"
            show-overflow-tooltip
          />
          <el-table-column label="匹配结果" width="200">
            <template #default="{ row }">
              <div v-if="row.matchedYpid" class="match-result">
                <el-tag type="success" size="small">{{ row.matchedYpid }}</el-tag>
                <el-progress
                  :percentage="row.matchScore"
                  :color="getScoreColor(row.matchScore)"
                  :stroke-width="6"
                  class="mt-5px"
                />
              </div>
              <el-tag v-else type="danger" size="small">未匹配</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="匹配方式" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.matchMethod === 'AUTO'" type="primary" size="small">自动</el-tag>
              <el-tag v-else-if="row.matchMethod === 'MANUAL'" type="warning" size="small"
                >手动</el-tag
              >
              <el-tag v-else type="info" size="small">未知</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="matchTime" label="匹配时间" width="160">
            <template #default="{ row }">
              {{ timestampFormatter2(row.matchTime) }}
            </template>
          </el-table-column>
        </el-table>

        <Pagination
          v-model:page="queryParams.pageNo"
          v-model:limit="queryParams.pageSize"
          :total="total"
          @pagination="getMatchDetails"
        />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Document as DocumentIcon,
  DataAnalysis,
  List,
  Search,
  Download
} from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader/index.vue'
import { YpidApi } from '@/api/drug/ypid'
import { timestampFormatter2, dateFormatter } from '@/utils/formatTime'
import * as echarts from 'echarts'

defineOptions({ name: 'YpidReportDetail' })

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const tableLoading = ref(false)
const chartRef = ref<HTMLElement>()

// 报告信息
const reportId = ref<string>('')
const reportDetail = reactive({
  taskInfo: {
    taskNo: '',
    taskName: '',
    hospitalName: ''
  },
  statistics: {
    totalCount: 0,
    matchedCount: 0,
    failedCount: 0,
    duplicateCount: 0
  },
  generateTime: '',
  status: 1
})

// 搜索和筛选
const searchKeyword = ref('')
const statusFilter = ref('')

// 分页参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  reportId: '',
  keyword: '',
  matchStatus: undefined as number | undefined
})

const matchDetailList = ref<any[]>([])
const total = ref(0)

// ========================= 计算属性 =========================

// 动态计算表格高度，避免数据少时留白过多
const tableHeight = computed(() => {
  // 数据少的时候不设置固定高度，让表格自适应内容
  if (matchDetailList.value.length <= 15) {
    return null
  }
  return undefined // 使用 max-height 来限制
})

// 根据每页显示条数动态设置最大高度
const tableMaxHeight = computed(() => {
  const pageSize = queryParams.pageSize
  const dataCount = matchDetailList.value.length

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

// 页面状态
const pageTitle = computed(() => `YPID匹配报告 - ${reportDetail.taskInfo.taskName || '加载中...'}`)
const pageDescription = computed(() => {
  const info = []
  if (reportDetail.taskInfo.taskNo) info.push(`任务编号：${reportDetail.taskInfo.taskNo}`)
  if (reportDetail.taskInfo.hospitalName) info.push(`医院：${reportDetail.taskInfo.hospitalName}`)
  return info.join(' | ')
})

const statusTag = computed(() => {
  return reportDetail.status === 1 ? '已生成' : '生成中'
})

const statusTagType = computed(() => {
  return reportDetail.status === 1 ? 'success' : 'warning'
})

// 头部元数据
const metaInfo = computed(() => [
  { label: '总数据量', value: reportDetail.statistics.totalCount },
  { label: '匹配成功', value: reportDetail.statistics.matchedCount },
  { label: '匹配失败', value: reportDetail.statistics.failedCount },
  { label: '生成时间', value: dateFormatter(reportDetail.generateTime) }
])

// 头部操作按钮
const headerActions = computed(() => [
  {
    key: 'export-report',
    text: '导出报告',
    type: 'primary',
    icon: Download,
    handler: exportReport
  },
  {
    key: 'export-excel',
    text: '导出Excel',
    type: 'default',
    icon: Download,
    handler: exportExcel
  }
])

// 生命周期
onMounted(() => {
  initPage()
})

// 初始化页面
const initPage = async () => {
  reportId.value = route.params.reportId as string
  if (!reportId.value) {
    ElMessage.error('缺少报告ID参数')
    router.back()
    return
  }

  queryParams.reportId = reportId.value
  await loadReportDetail()
  await getMatchDetails()
  await nextTick()
  initChart()
}

// 加载报告详情
const loadReportDetail = async () => {
  loading.value = true
  try {
    const result = await YpidApi.getReportDetail(reportId.value)
    Object.assign(reportDetail, result)
  } catch (error) {
    ElMessage.error('加载报告详情失败')
  } finally {
    loading.value = false
  }
}

// 获取匹配详情
const getMatchDetails = async () => {
  tableLoading.value = true
  try {
    const { list, total: totalCount } = await YpidApi.getReportMatchDetails(queryParams)
    matchDetailList.value = list || []
    total.value = totalCount || 0
  } catch (error) {
    ElMessage.error('加载匹配详情失败')
  } finally {
    tableLoading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  queryParams.keyword = searchKeyword.value
  queryParams.pageNo = 1
  getMatchDetails()
}

// 筛选处理
const handleFilterChange = () => {
  queryParams.matchStatus = statusFilter.value ? Number(statusFilter.value) : undefined
  queryParams.pageNo = 1
  getMatchDetails()
}

// 返回按钮点击
const handleBackClick = () => {
  router.push('/monitoring-org/ypidcompare-comparison')
}

// 头部操作点击
const handleHeaderAction = (action: any) => {
  if (action.handler) {
    action.handler()
  }
}

// 导出报告
const exportReport = async () => {
  try {
    await YpidApi.exportReport(reportId.value)
    ElMessage.success('报告导出成功')
  } catch (error) {
    ElMessage.error('报告导出失败')
  }
}

// 导出Excel
const exportExcel = async () => {
  try {
    await YpidApi.exportReportExcel(reportId.value)
    ElMessage.success('Excel导出成功')
  } catch (error) {
    ElMessage.error('Excel导出失败')
  }
}

// 获取匹配率
const getMatchRate = () => {
  if (reportDetail.statistics.totalCount === 0) return 0
  return Math.round(
    (reportDetail.statistics.matchedCount / reportDetail.statistics.totalCount) * 100
  )
}

// 获取失败率
const getFailRate = () => {
  if (reportDetail.statistics.totalCount === 0) return 0
  return Math.round(
    (reportDetail.statistics.failedCount / reportDetail.statistics.totalCount) * 100
  )
}

// 获取分数颜色
const getScoreColor = (score: number) => {
  if (score >= 90) return '#67c23a'
  if (score >= 70) return '#e6a23c'
  return '#f56c6c'
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return

  const chart = echarts.init(chartRef.value)
  const option = {
    title: {
      text: '匹配结果分布',
      left: 'center',
      textStyle: {
        fontSize: 14,
        color: '#666'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: '0',
      data: ['匹配成功', '匹配失败', '重复数据']
    },
    series: [
      {
        name: '匹配结果',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        data: [
          {
            value: reportDetail.statistics.matchedCount,
            name: '匹配成功',
            itemStyle: { color: '#67c23a' }
          },
          {
            value: reportDetail.statistics.failedCount,
            name: '匹配失败',
            itemStyle: { color: '#f56c6c' }
          },
          {
            value: reportDetail.statistics.duplicateCount,
            name: '重复数据',
            itemStyle: { color: '#e6a23c' }
          }
        ]
      }
    ]
  }

  chart.setOption(option)

  // 响应式调整
  window.addEventListener('resize', () => {
    chart.resize()
  })
}
</script>

<style scoped>
.ypid-report-detail-page {
  padding: 20px;
}

.report-content {
  margin-top: 20px;
}

.overview-card,
.detail-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header .header-icon,
.card-header .header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 16px;
  color: #409eff;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

.overview-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  align-items: start;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-card {
  border-radius: 8px;
  overflow: hidden;
}

.stat-card.pending {
  border-left: 4px solid #909399;
}

.stat-card.success {
  border-left: 4px solid #67c23a;
}

.stat-card.warning {
  border-left: 4px solid #e6a23c;
}

.stat-card.info {
  border-left: 4px solid #409eff;
}

.stat-content {
  padding: 16px;
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 4px;
}

.stat-percent {
  font-size: 12px;
  color: #95a5a6;
}

.chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 16px;
}

.chart {
  width: 280px;
  height: 200px;
}

.filter-bar {
  margin-bottom: 16px;
}

.match-result {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mt-5px {
  margin-top: 5px;
}

.flex-start {
  justify-content: flex-start;
}
.flex-row-start {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
.ml5 {
  margin-left: 5px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .overview-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .chart {
    width: 100%;
    max-width: 400px;
  }
}

@media (max-width: 768px) {
  .stat-cards {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }
}
</style>
