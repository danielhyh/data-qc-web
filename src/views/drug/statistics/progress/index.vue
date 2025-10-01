<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { ElCard, ElRow, ElCol, ElStatistic, ElButton, ElTooltip, ElDivider, ElIcon } from 'element-plus'
import PageHeader from '@/components/PageHeader/index.vue'
import { Calendar, DataAnalysis, TrendCharts, Warning, QuestionFilled, Download, Refresh, View } from '@element-plus/icons-vue'
import type { ECharts } from 'echarts'
import { getInstitutionReportStats, exportInstitutionReport, type InstitutionReportStatsVO } from '@/api/drug/statistics'
import { formatDate } from '@/utils/formatTime'
import InstitutionReportDialog from '../components/InstitutionReportDialog.vue'

// 数据
const reportStats = ref<InstitutionReportStatsVO | null>(null)
const loading = ref(false)
const currentYear = ref(new Date().getFullYear().toString())
const selectedArea = ref<string>('')  // 选中的区域
const institutionDialogRef = ref() // 机构详情弹框引用
const currentReportId = ref<number>(1) // 当前报告ID，实际使用时应从外部传入或选择

// 图表实例
const progressChart = ref<HTMLElement | null>(null)
const provinceChart = ref<HTMLElement | null>(null)
const cityDetailChart = ref<HTMLElement | null>(null)
let progressEchart: ECharts | null = null
let provinceEchart: ECharts | null = null
let cityDetailEchart: ECharts | null = null

// 计算属性
const basicStats = computed(() => reportStats.value?.basicStats || {
  totalInstitutions: 0,
  reportedInstitutions: 0,
  unreportedInstitutions: 0,
  unregisteredInstitutions: 0,
  reportRate: 0,
  currentYear: currentYear.value,
  reportStatus: 'pending' as const,
  openTime: undefined,
  deadlineTime: undefined
})

// 上报状态文本和样式
const reportStatusInfo = computed(() => {
  const status = basicStats.value.reportStatus
  switch (status) {
    case 'open':
      return { text: '上报进行中', type: 'success' }
    case 'closed':
      return { text: '上报已结束', type: 'info' }
    default:
      return { text: '待开放', type: 'warning' }
  }
})

const levelStats = computed(() => reportStats.value?.levelStats || {
  level3: { total: 0, reported: 0, preReported: 0, postReported: 0, rate: 0 },
  level2: { total: 0, reported: 0, preReported: 0, postReported: 0, rate: 0 },
  baseLevel: { total: 0, reported: 0, preReported: 0, postReported: 0, rate: 0 }
})

const areaStats = computed(() => reportStats.value?.areaStats || [])

// 获取城市级别数据
const cityStats = computed(() => {
  return areaStats.value.filter(area => area.areaLevel === 'city')
})

// 任务统计
const taskStats = computed(() => reportStats.value?.taskStats || {
  totalTasks: 0,
  successTasks: 0,
  failedTasks: 0,
  partialSuccessTasks: 0,
  cancelledTasks: 0,
  preOnlyTasks: 0,
  postOnlyTasks: 0,
  fullTasks: 0
})

// 选中区域的详细数据
const selectedAreaDetail = computed(() => {
  if (!selectedArea.value) return null
  return areaStats.value.find(area => area.areaCode === selectedArea.value)
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      year: currentYear.value,
      areaCode: selectedArea.value || undefined
    }
    const result = await getInstitutionReportStats(params)
    reportStats.value = result
  } catch (error) {
    console.error('获取机构填报统计失败:', error)
  } finally {
    loading.value = false
  }
}

// 监听年份和区域变化
watch([currentYear, selectedArea], () => {
  fetchData()
})

// 初始化进度圆环图表
const initProgressCharts = () => {
  if (!progressChart.value) return
  
  progressEchart = echarts.init(progressChart.value)
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const level = params.seriesName
        const stats = level === '三级' ? levelStats.value.level3 :
                     level === '二级' ? levelStats.value.level2 : 
                     levelStats.value.baseLevel
        return `${level}医院<br/>
                总数: ${stats.total}家<br/>
                已上报: ${stats.reported}家<br/>
                前置: ${stats.preReported}家<br/>
                后置: ${stats.postReported}家<br/>
                上报率: ${stats.rate.toFixed(1)}%`
      }
    },
    series: [
      {
        name: '三级',
        type: 'pie',
        radius: ['40%', '55%'],
        center: ['25%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          {
            value: levelStats.value.level3.rate,
            name: '已完成',
            itemStyle: { color: '#4A90E2' }
          },
          {
            value: 100 - levelStats.value.level3.rate,
            name: '未完成',
            itemStyle: { color: '#E5E5E5' }
          }
        ]
      },
      {
        name: '二级',
        type: 'pie',
        radius: ['40%', '55%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          {
            value: levelStats.value.level2.rate,
            name: '已完成',
            itemStyle: { color: '#7ED321' }
          },
          {
            value: 100 - levelStats.value.level2.rate,
            name: '未完成',
            itemStyle: { color: '#E5E5E5' }
          }
        ]
      },
      {
        name: '基层',
        type: 'pie',
        radius: ['40%', '55%'],
        center: ['75%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          {
            value: levelStats.value.baseLevel.rate,
            name: '已完成',
            itemStyle: { color: '#F5A623' }
          },
          {
            value: 100 - levelStats.value.baseLevel.rate,
            name: '未完成',
            itemStyle: { color: '#E5E5E5' }
          }
        ]
      }
    ]
  }
  
  progressEchart.setOption(option)
}

// 初始化区域概览柱状图
const initProvinceChart = () => {
  if (!provinceChart.value) return
  
  provinceEchart = echarts.init(provinceChart.value)
  
  const chartData = cityStats.value.sort((a, b) => b.reportRate - a.reportRate)
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params: any) {
        const item = params[0]
        const cityData = cityStats.value.find(city => city.areaName === item.name)
        if (!cityData) return ''
        return `
          ${item.name}<br/>
          <span style="color:#4A90E2;">上报率: ${item.value.toFixed(1)}%</span><br/>
          总机构: ${cityData.totalInstitutions}家<br/>
          已上报: ${cityData.reportedCount}家<br/>
          三级: ${cityData.levelBreakdown.level3.reported}/${cityData.levelBreakdown.level3.total}<br/>
          二级: ${cityData.levelBreakdown.level2.reported}/${cityData.levelBreakdown.level2.total}<br/>
          基层: ${cityData.levelBreakdown.baseLevel.reported}/${cityData.levelBreakdown.baseLevel.total}
        `
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.map(item => item.areaName),
      axisLabel: {
        interval: 0,
        rotate: 45,
        fontSize: 11,
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      name: '上报率(%)',
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        color: '#666'
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    series: [
      {
        type: 'bar',
        data: chartData.map(item => ({
          value: item.reportRate,
          itemStyle: {
            color: item.reportRate >= 80 ? '#52c41a' : 
                   item.reportRate >= 60 ? '#faad14' : '#ff4d4f'
          }
        })),
        barWidth: '60%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }
  
  provinceEchart.setOption(option)
}

// 初始化趋势图表
const initCityDetailChart = () => {
  if (!cityDetailChart.value) return
  
  cityDetailEchart = echarts.init(cityDetailChart.value)
  
  const trendData = reportStats.value?.trendData || []
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const item = params[0]
        return `${item.name}<br/>
                上报数: ${item.value}家<br/>
                上报率: ${item.data?.rate?.toFixed(1) || 0}%`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: trendData.map(item => item.date),
      axisLabel: {
        color: '#666',
        rotate: 45
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '上报机构数',
        axisLabel: {
          color: '#666'
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0'
          }
        }
      },
      {
        type: 'value',
        name: '上报率(%)',
        max: 100,
        axisLabel: {
          color: '#666',
          formatter: '{value}%'
        }
      }
    ],
    series: [
      {
        name: '当日上报',
        type: 'bar',
        data: trendData.map(item => item.reportedCount),
        itemStyle: {
          color: '#4A90E2'
        }
      },
      {
        name: '累计上报率',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: trendData.map(item => ({ value: item.reportRate, rate: item.reportRate })),
        itemStyle: {
          color: '#52c41a'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
              { offset: 1, color: 'rgba(82, 196, 26, 0.05)' }
            ]
          }
        }
      }
    ]
  }
  
  cityDetailEchart.setOption(option)
}

// 生命周期
onMounted(async () => {
  await fetchData()
  setTimeout(() => {
    initProgressCharts()
    initProvinceChart()
    initCityDetailChart()
  }, 100)
  
  // 添加窗口大小监听
  window.addEventListener('resize', handleResize)
})

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 处理区域点击
const handleAreaClick = (areaCode: string) => {
  selectedArea.value = areaCode
}

// 返回上级
const handleBack = () => {
  selectedArea.value = ''
}

// 窗口大小变化时重绘图表
const handleResize = () => {
  progressEchart?.resize()
  provinceEchart?.resize()
  cityDetailEchart?.resize()
}

// 导出报告
const exportReport = async () => {
  try {
    await exportInstitutionReport({ year: currentYear.value, format: 'excel' })
  } catch (error) {
    console.error('导出失败:', error)
  }
}

// 打开机构详情弹框
const openInstitutionDialog = () => {
  institutionDialogRef.value?.open(currentReportId.value)
}
</script>

<template>
  <div class="institution-progress-container" v-loading="loading">
    <!-- 使用 PageHeader 组件 -->
    <PageHeader
      :title="`${currentYear}年机构上报统计`"
      :content="`全省医疗机构药品数据上报情况统计分析`"
      :icon="DataAnalysis"
      :tag="reportStatusInfo.text"
      :tag-type="reportStatusInfo.type"
      :meta="[
        { label: '应监测机构', value: `${basicStats.totalInstitutions}家` },
        { label: '总体上报率', value: `${basicStats.reportRate.toFixed(1)}%` },
        { label: '开放时间', value: basicStats.openTime ? formatDate(basicStats.openTime) : '--' },
        { label: '截止时间', value: basicStats.deadlineTime ? formatDate(basicStats.deadlineTime) : '--' }
      ]"
      :actions="[
        { key: 'institutions', text: '查看机构详情', type: 'default', icon: 'View', handler: openInstitutionDialog },
        { key: 'export', text: '导出报告', type: 'primary', icon: 'Download', handler: exportReport },
        { key: 'refresh', text: '刷新', icon: 'Refresh', handler: fetchData }
      ]"
      :show-back-button="!!selectedArea"
      back-button-text="返回全省"
      @back-click="handleBack"
    />

    <!-- 统计内容区域 -->
    <div class="content-section">
      <el-row :gutter="24">
        <!-- 左侧内容 -->
        <el-col :span="16">
          <!-- 进度环形图 -->
          <el-card class="progress-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-title">
                  <el-icon><TrendCharts /></el-icon>
                  各级别医院上报进度
                </span>
              </div>
            </template>
            <div class="progress-section">
              <div class="progress-charts" ref="progressChart"></div>
              <div class="progress-labels">
                <div class="progress-item">
                  <div class="progress-percentage" style="color: #4A90E2;">{{ levelStats.level3.rate.toFixed(1) }}%</div>
                  <div class="progress-name">三级医院</div>
                  <div class="progress-detail">
                    <span>总数: {{ levelStats.level3.total }}</span>
                    <span>已上报: {{ levelStats.level3.reported }}</span>
                  </div>
                </div>
                <div class="progress-item">
                  <div class="progress-percentage" style="color: #7ED321;">{{ levelStats.level2.rate.toFixed(1) }}%</div>
                  <div class="progress-name">二级医院</div>
                  <div class="progress-detail">
                    <span>总数: {{ levelStats.level2.total }}</span>
                    <span>已上报: {{ levelStats.level2.reported }}</span>
                  </div>
                </div>
                <div class="progress-item">
                  <div class="progress-percentage" style="color: #F5A623;">{{ levelStats.baseLevel.rate.toFixed(1) }}%</div>
                  <div class="progress-name">基层医疗</div>
                  <div class="progress-detail">
                    <span>总数: {{ levelStats.baseLevel.total }}</span>
                    <span>已上报: {{ levelStats.baseLevel.reported }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 区域概览 -->
          <el-card class="province-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-title">
                  <el-icon><DataAnalysis /></el-icon>
                  {{ selectedArea ? '区域详情' : '各市上报情况' }}
                </span>
                <el-tooltip content="点击柱状图查看详情" placement="top">
                  <el-icon class="info-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>
            <div class="province-chart" ref="provinceChart"></div>
            <div class="legend-info">
              <span class="legend-item">
                <span class="legend-color" style="background: #52c41a;"></span>
                优秀(≥ 80%)
              </span>
              <span class="legend-item">
                <span class="legend-color" style="background: #faad14;"></span>
                良好(60-80%)
              </span>
              <span class="legend-item">
                <span class="legend-color" style="background: #ff4d4f;"></span>
                待提升(&lt; 60%)
              </span>
            </div>
          </el-card>

          <!-- 上报趋势 -->
          <el-card class="city-detail-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-title">
                  <el-icon><Calendar /></el-icon>
                  上报趋势分析
                </span>
              </div>
            </template>
            <div class="city-detail-chart" ref="cityDetailChart"></div>
          </el-card>
        </el-col>

        <!-- 右侧统计信息 -->
        <el-col :span="8">
          <div class="stats-sidebar">
            <!-- 基本统计卡片 -->
            <el-card class="stat-card primary-card" shadow="hover">
              <el-statistic :value="basicStats.totalInstitutions">
                <template #title>
                  <span class="stat-title">应监测机构数</span>
                </template>
                <template #suffix>家</template>
              </el-statistic>
            </el-card>

            <el-card class="stat-card success-card" shadow="hover">
              <el-statistic :value="basicStats.reportedInstitutions">
                <template #title>
                  <span class="stat-title">已上报机构数</span>
                </template>
                <template #suffix>家</template>
              </el-statistic>
              <div class="stat-sub-info">
                <span class="sub-item">前置: {{ taskStats.preOnlyTasks }}</span>
                <span class="sub-item">后置: {{ taskStats.postOnlyTasks }}</span>
              </div>
            </el-card>

            <el-card class="stat-card warning-card" shadow="hover">
              <el-statistic :value="basicStats.unreportedInstitutions">
                <template #title>
                  <span class="stat-title">未上报机构数</span>
                </template>
                <template #suffix>家</template>
              </el-statistic>
            </el-card>

            <el-card class="stat-card danger-card" shadow="hover">
              <el-statistic :value="basicStats.unregisteredInstitutions">
                <template #title>
                  <span class="stat-title">未注册机构数</span>
                </template>
                <template #suffix>家</template>
              </el-statistic>
            </el-card>

            <!-- 任务执行统计 -->
            <el-card class="task-stats-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span class="card-title">
                    <el-icon><Warning /></el-icon>
                    任务执行统计
                  </span>
                </div>
              </template>
              <div class="task-stats">
                <div class="task-item">
                  <span class="task-label">总任务数:</span>
                  <span class="task-value">{{ taskStats.totalTasks }}</span>
                </div>
                <div class="task-item success">
                  <span class="task-label">成功:</span>
                  <span class="task-value">{{ taskStats.successTasks }}</span>
                </div>
                <div class="task-item danger">
                  <span class="task-label">失败:</span>
                  <span class="task-value">{{ taskStats.failedTasks }}</span>
                </div>
                <div class="task-item warning">
                  <span class="task-label">部分成功:</span>
                  <span class="task-value">{{ taskStats.partialSuccessTasks }}</span>
                </div>
              </div>
            </el-card>

            <!-- 区域详情（选中时显示） -->
            <el-card v-if="selectedAreaDetail" class="area-detail-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span class="card-title">{{ selectedAreaDetail.areaName }}详情</span>
                </div>
              </template>
              <div class="area-detail">
                <div class="detail-item">
                  <span>总机构:</span>
                  <strong>{{ selectedAreaDetail.totalInstitutions }}</strong>
                </div>
                <div class="detail-item">
                  <span>上报率:</span>
                  <strong>{{ selectedAreaDetail.reportRate.toFixed(1) }}%</strong>
                </div>
                <el-divider />
                <div class="level-breakdown">
                  <div class="level-item">
                    <span>三级:</span>
                    <span>{{ selectedAreaDetail.levelBreakdown.level3.reported }}/{{ selectedAreaDetail.levelBreakdown.level3.total }}</span>
                  </div>
                  <div class="level-item">
                    <span>二级:</span>
                    <span>{{ selectedAreaDetail.levelBreakdown.level2.reported }}/{{ selectedAreaDetail.levelBreakdown.level2.total }}</span>
                  </div>
                  <div class="level-item">
                    <span>基层:</span>
                    <span>{{ selectedAreaDetail.levelBreakdown.baseLevel.reported }}/{{ selectedAreaDetail.levelBreakdown.baseLevel.total }}</span>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 机构详情弹框 -->
    <InstitutionReportDialog ref="institutionDialogRef" />
  </div>
</template>

<style scoped>
.institution-progress-container {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 24px 32px;
  border-radius: 8px;
  color: white;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
}

.page-title {
  margin: 0 0 16px 0;
  font-size: 28px;
  font-weight: 600;
}

.basic-info {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.info-item {
  font-size: 14px;
  opacity: 0.9;
}

.info-item strong {
  font-size: 18px;
  margin-right: 4px;
}

.report-rate {
  color: #52c41a !important;
}

.status-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.content-section {
  margin-top: 24px;
}

/* 进度卡片 */
.progress-card {
  margin-bottom: 24px;
  border: none;
  border-radius: 8px;
}

.progress-section {
  display: flex;
  align-items: center;
  padding: 20px 0;
}

.progress-charts {
  flex: 1;
  height: 200px;
}

.progress-labels {
  display: flex;
  justify-content: space-around;
  width: 400px;
  margin-left: 40px;
}

.progress-item {
  text-align: center;
}

.progress-percentage {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 8px;
}

.progress-name {
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
}

.progress-range {
  font-size: 12px;
  color: #999;
}

/* 全省概览卡片 */
.province-card {
  margin-bottom: 24px;
  border: none;
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
  color: #333;
}

.province-chart {
  height: 300px;
  margin-bottom: 16px;
}

.legend-info {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

/* 城市详情卡片 */
.city-detail-card {
  border: none;
  border-radius: 8px;
}

.back-btn {
  color: #1890ff;
  padding: 0;
}

.back-btn:hover {
  color: #40a9ff;
}

.city-detail-chart {
  height: 300px;
}

/* 右侧统计 */
.stats-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  text-align: center;
  padding: 8px 0;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.stat-number.primary {
  color: #1890ff;
}

.stat-number.warning {
  color: #faad14;
}

.stat-number.danger {
  color: #ff4d4f;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .progress-section {
    flex-direction: column;
  }
  
  .progress-labels {
    margin-left: 0;
    margin-top: 20px;
  }
}

@media (max-width: 768px) {
  .institution-progress-container {
    padding: 16px;
  }
  
  .basic-info {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .content-section :deep(.el-col) {
    margin-bottom: 16px;
  }
}
</style>
