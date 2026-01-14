<template>
  <div class="institution-progress-container" v-loading="loading">
    <!-- 固定头部栏 -->
    <div class="fixed-header">
      <div class="header-content">
        <div class="header-title">
          <Icon icon="ep:data-analysis" class="title-icon" />
          <h1 class="title-text">填报进度追踪</h1>
        </div>
        <div class="header-actions">
          <el-form :model="queryParams" :inline="true" class="search-form">
            <el-form-item label="填报任务">
              <el-select
                v-model="queryParams.reportId"
                placeholder="请选择填报任务"
                style="width: 240px"
                @change="handleChangeReport"
              >
                <el-option
                  v-for="task in reportTaskList"
                  :key="task.id"
                  :label="task.taskName"
                  :value="task.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleRefresh">
                <Icon icon="ep:refresh" class="mr-5px" />
                刷新
              </el-button>
              <el-button type="success" @click="handleExportReport" :loading="exportLoading">
                <Icon icon="ep:download" class="mr-5px" />
                导出上报情况
              </el-button>
              <el-button type="warning" @click="handleExportRegionSummary" :loading="exportRegionLoading">
                <Icon icon="ep:document" class="mr-5px" />
                导出区域汇总
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 监测数据汇总 -->
      <ContentWrap
        title="监测数据汇总"
        headerIcon="ep:data-analysis"
        headerIconColor="#305789"
      >
        <el-row :gutter="20">
          <el-col :span="16">
            <ul class="summary-stat-list">
              <li class="summary-stat-card">
                <div class="summary-icon summary-icon-blue"><Icon icon="ep:office-building" /></div>
                <div class="summary-info">
                  <p class="summary-label">应监测机构数</p>
                  <p class="summary-value"><span>{{ taskStatisticsData.totalMonitoringInstitutions }}</span><em>家</em></p>
                </div>
              </li>
              <li class="summary-stat-card">
                <div class="summary-icon summary-icon-green"><Icon icon="ep:circle-check" /></div>
                <div class="summary-info">
                  <p class="summary-label">已上报机构数</p>
                  <p class="summary-value"><span>{{ taskStatisticsData.reportedInstitutions }}</span><em>家</em></p>
                </div>
              </li>
              <li class="summary-stat-card">
                <div class="summary-icon summary-icon-orange"><Icon icon="ep:trend-charts" /></div>
                <div class="summary-info">
                  <p class="summary-label">总体上报率</p>
                  <p class="summary-value summary-value-green"><span>{{ formatPercent(taskStatisticsData.overallReportRate) }}</span><em>%</em></p>
                </div>
              </li>
              <li class="summary-stat-card">
                <div class="summary-icon summary-icon-purple"><Icon icon="ep:document" /></div>
                <div class="summary-info">
                  <p class="summary-label">已上传数据量</p>
                  <p class="summary-value"><span>{{ taskStatisticsData.uploadedDataCount }}</span><em>行</em></p>
                </div>
              </li>
              <li class="summary-stat-card summary-stat-card-wide">
                <div class="summary-icon summary-icon-cyan"><Icon icon="ep:calendar" /></div>
                <div class="summary-info">
                  <p class="summary-label">任务周期</p>
                  <p class="summary-value summary-value-time">{{ formatDate(taskStatisticsData.startTime) }} ~ {{ formatDate(taskStatisticsData.endTime) }}</p>
                </div>
              </li>
              <li class="summary-stat-card">
                <div class="summary-icon summary-icon-pink"><Icon icon="ep:flag" /></div>
                <div class="summary-info">
                  <p class="summary-label">任务状态</p>
                  <div class="summary-value-tag"><dict-tag :type="DICT_TYPE.REPORT_STATUS_TYPE" :value="taskStatisticsData.taskStatus" /></div>
                </div>
              </li>
            </ul>
          </el-col>
          <el-col :span="8">
            <div class="progress-box">
              <div class="progress-header"><Icon icon="ep:pie-chart" /><span>各级机构上报率</span></div>
              <ul class="progress-list">
                <li v-for="(item, index) in taskStatisticsData.levelReportStats" :key="index">
                  <div class="level-icon-wrap" :class="getLevelIconClass(item.levelDesc)">
                    <Icon :icon="getLevelIcon(item.levelDesc)" />
                  </div>
                  <span class="level-name">{{ item.levelDesc || '' }}</span>
                  <span class="level-count">{{ item.reportedInstitutions || 0 }}/{{ item.totalInstitutions || 0 }}</span>
                  <el-progress :percentage="Number(((item.reportRate || 0) * 100).toFixed(1))" :stroke-width="12" :color="getProgressColor(item.reportRate)" />
                </li>
              </ul>
            </div>
          </el-col>
        </el-row>
      </ContentWrap>

      <!-- 图表区域 -->
      <el-row :gutter="20" class="chart-row">
        <el-col :span="14">
          <ContentWrap
            title="全省各市区上报情况"
            headerIcon="ep:histogram"
            headerIconColor="#67c23a"
          >
            <div class="chart-container" ref="barCharts"></div>
          </ContentWrap>
        </el-col>
        <el-col :span="10">
          <ContentWrap
            title="详细数据"
            message="点击图表或卡片查看详情"
            headerIcon="ep:data-board"
            headerIconColor="#e6a23c"
          >
            <div class="city-header" :class="{ 'animate-pulse': isDetailUpdating }"><Icon icon="ep:map-location" /><span>{{ reportChartDetails.cityName || '请选择地区' }}</span></div>
            <ul class="detail-data-list" :class="{ 'animate-highlight': isDetailUpdating }">
              <li class="detail-data-item detail-data-item-clickable" @click="handleViewDetails('monitoring')">
                <div class="detail-data-icon detail-data-icon-blue"><Icon icon="ep:office-building" /></div>
                <div class="detail-data-content">
                  <p class="detail-data-label">应监测机构数</p>
                  <p class="detail-data-value">{{ reportChartDetails.totalMonitoringInstitutions }} <em>家</em></p>
                </div>
              </li>
              <li class="detail-data-item detail-data-item-clickable" @click="handleViewDetails('reported')">
                <div class="detail-data-icon detail-data-icon-green"><Icon icon="ep:success-filled" /></div>
                <div class="detail-data-content">
                  <p class="detail-data-label">已上报机构数</p>
                  <p class="detail-data-value detail-data-value-green">{{ reportChartDetails.reportedInstitutions }} <em>家</em></p>
                </div>
              </li>
              <li class="detail-data-item detail-data-item-clickable" @click="handleViewDetails('unreported')">
                <div class="detail-data-icon detail-data-icon-red"><Icon icon="ep:circle-close-filled" /></div>
                <div class="detail-data-content">
                  <p class="detail-data-label">未上报机构数</p>
                  <p class="detail-data-value detail-data-value-red">{{ reportChartDetails.unreportedInstitutions }} <em>家</em></p>
                </div>
              </li>
              <li class="detail-data-item">
                <div class="detail-data-icon detail-data-icon-orange"><Icon icon="ep:pie-chart" /></div>
                <div class="detail-data-content">
                  <p class="detail-data-label">上报率</p>
                  <p class="detail-data-value detail-data-value-blue">{{ formatPercent(reportChartDetails.reportRate) }}%</p>
                </div>
              </li>
              <li class="detail-data-item">
                <div class="detail-data-icon detail-data-icon-pink"><Icon icon="ep:office-building" /></div>
                <div class="detail-data-content">
                  <p class="detail-data-label">三级机构上报率</p>
                  <p class="detail-data-value">
                    <span class="detail-data-ratio">{{ reportChartDetails.levelStats?.level3?.reportedInstitutions || 0 }}/{{ reportChartDetails.levelStats?.level3?.totalInstitutions || 0 }}</span>
                    <span class="detail-data-percent">{{ formatPercent(reportChartDetails.level3ReportRate) }}%</span>
                  </p>
                </div>
              </li>
              <li class="detail-data-item">
                <div class="detail-data-icon detail-data-icon-purple"><Icon icon="ep:school" /></div>
                <div class="detail-data-content">
                  <p class="detail-data-label">二级机构上报率</p>
                  <p class="detail-data-value">
                    <span class="detail-data-ratio">{{ reportChartDetails.levelStats?.level2?.reportedInstitutions || 0 }}/{{ reportChartDetails.levelStats?.level2?.totalInstitutions || 0 }}</span>
                    <span class="detail-data-percent">{{ formatPercent(reportChartDetails.level2ReportRate) }}%</span>
                  </p>
                </div>
              </li>
              <li class="detail-data-item">
                <div class="detail-data-icon detail-data-icon-cyan"><Icon icon="ep:first-aid-kit" /></div>
                <div class="detail-data-content">
                  <p class="detail-data-label">基层机构上报率</p>
                  <p class="detail-data-value">
                    <span class="detail-data-ratio">{{ reportChartDetails.levelStats?.baseLevel?.reportedInstitutions || 0 }}/{{ reportChartDetails.levelStats?.baseLevel?.totalInstitutions || 0 }}</span>
                    <span class="detail-data-percent">{{ formatPercent(reportChartDetails.baseLevelReportRate) }}%</span>
                  </p>
                </div>
              </li>
            </ul>
          </ContentWrap>
        </el-col>
      </el-row>
    </div>
  </div>
  <InstitutionReportDialog ref="institutionDialogRef" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getFillInTaskStatisticsData, getCityChartsData, getCityReportData, InstitutionReportApi } from '@/api/drug/statistics'
import { getReportTaskList, ReportTaskVO } from '@/api/drug/dataManage'
import InstitutionReportDialog from '../components/InstitutionReportDialog.vue'
import { DICT_TYPE } from '@/utils/dict'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const exportLoading = ref(false)
const exportRegionLoading = ref(false)
const isDetailUpdating = ref(false)
const queryParams = ref({ reportId: '' })
const reportTaskList = ref<ReportTaskVO[]>([])
const chartsData = ref<any[]>([])
const barCharts = ref<HTMLElement | null>(null)
const institutionDialogRef = ref<InstanceType<typeof InstitutionReportDialog> | null>(null)
const myCharts = ref<echarts.ECharts | null>(null)

const taskStatisticsData = ref({
  totalMonitoringInstitutions: 0, reportedInstitutions: 0, overallReportRate: 0,
  uploadedDataCount: 0, startTime: '', endTime: '', taskStatus: 0, levelReportStats: [] as any[]
})

// 将后端返回的levelReportStats对象转换为数组格式
const convertLevelReportStats = (stats: any) => {
  if (!stats) return []
  const result = []
  if (stats.level3) result.push(stats.level3)
  if (stats.level2) result.push(stats.level2)
  if (stats.baseLevel) result.push(stats.baseLevel)
  return result
}

const reportChartDetails = ref({
  cityName: '', totalMonitoringInstitutions: 0, reportedInstitutions: 0, unreportedInstitutions: 0,
  reportRate: 0, level3ReportRate: 0, level2ReportRate: 0, baseLevelReportRate: 0, regionId: undefined,
  levelStats: {
    level3: { totalInstitutions: 0, reportedInstitutions: 0 },
    level2: { totalInstitutions: 0, reportedInstitutions: 0 },
    baseLevel: { totalInstitutions: 0, reportedInstitutions: 0 }
  }
})

const formatDate = (ts: string | number) => ts ? dayjs(ts).format('YYYY-MM-DD') : '-'
const formatPercent = (n: number) => (!n || n === 0) ? '0.00' : (n * 100).toFixed(2)
const getProgressColor = (rate: number) => {
  const p = (rate || 0) * 100
  return p >= 80 ? '#67c23a' : p >= 50 ? '#e6a23c' : '#f56c6c'
}

// 根据机构级别获取图标
const getLevelIcon = (levelDesc: string) => {
  if (levelDesc?.includes('三级')) return 'ep:office-building'
  if (levelDesc?.includes('二级')) return 'ep:school'
  if (levelDesc?.includes('基层')) return 'ep:house'
  return 'ep:hospital'
}

// 根据机构级别获取图标颜色类
const getLevelIconClass = (levelDesc: string) => {
  if (levelDesc?.includes('三级')) return 'icon-purple'
  if (levelDesc?.includes('二级')) return 'icon-blue'
  if (levelDesc?.includes('基层')) return 'icon-green'
  return 'icon-orange'
}

/** 初始化柱状图 */
const initCharts = () => {
  if (!barCharts.value) return

  // 销毁旧实例
  if (myCharts.value) {
    myCharts.value.dispose()
    myCharts.value = null
  }

  // 创建新实例
  myCharts.value = echarts.init(barCharts.value)

  // 设置配置
  updateCharts()

  // 绑定点击事件 - 监听整个图表区域的点击
  myCharts.value.getZr().on('click', (params: any) => {
    if (!myCharts.value) return

    // 获取点击位置的像素坐标
    const pointInPixel = [params.offsetX, params.offsetY]

    // 检查点击是否在grid区域内
    if (myCharts.value.containPixel('grid', pointInPixel)) {
      // 将像素坐标转换为数据索引
      const pointInGrid = myCharts.value.convertFromPixel({ seriesIndex: 0 }, pointInPixel)
      const dataIndex = Math.round(pointInGrid[0])

      // 确保索引在有效范围内
      if (dataIndex >= 0 && dataIndex < chartsData.value.length) {
        const cityData = chartsData.value[dataIndex]
        if (cityData) {
          // 触发联动动画
          isDetailUpdating.value = true
          getCityReportData(Number(queryParams.value.reportId), cityData.regionId)
            .then(res => {
              reportChartDetails.value = res
              // 动画结束后重置状态
              setTimeout(() => { isDetailUpdating.value = false }, 600)
            })
            .catch(() => { isDetailUpdating.value = false })
        }
      }
    }
  })
}

/** 更新图表数据 */
const updateCharts = () => {
  if (!myCharts.value || !chartsData.value.length) return

  const cityNames = chartsData.value.map(item => item.cityName)
  const reportedData = chartsData.value.map(item => item.reportedCount || 0)
  const unreportedData = chartsData.value.map(item => item.unreportedCount || 0)
  const reportRates = chartsData.value.map(item => Number(((item.reportRate || 0) * 100).toFixed(1)))

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: '#e4e7ed',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: { color: '#303133' },
      formatter: (params: any) => {
        const name = params[0]?.name || ''
        const cityData = chartsData.value.find(item => item.cityName === name)
        let html = `<div style="font-weight:600;font-size:14px;margin-bottom:10px;color:#303133;border-bottom:1px solid #ebeef5;padding-bottom:8px">${name}</div>`
        params.forEach((p: any) => {
          if (p.seriesType === 'bar') {
            html += `<div style="display:flex;align-items:center;margin:6px 0">${p.marker}<span style="margin-left:6px">${p.seriesName}:</span><span style="font-weight:600;margin-left:auto;color:${p.seriesName === '已上报' ? '#52c41a' : '#ff4d4f'}">${p.value} 家</span></div>`
          } else if (p.seriesType === 'line') {
            html += `<div style="display:flex;align-items:center;margin:6px 0">${p.marker}<span style="margin-left:6px">${p.seriesName}:</span><span style="font-weight:600;margin-left:auto;color:#1890ff">${p.value}%</span></div>`
          }
        })
        if (cityData) {
          html += `<div style="margin-top:8px;padding-top:8px;border-top:1px dashed #ebeef5;color:#909399;font-size:12px">应监测总数: <b style="color:#303133">${cityData.totalCount || 0}</b> 家</div>`
        }
        return html
      }
    },
    legend: {
      data: ['已上报', '未上报', '上报率'],
      top: 0,
      itemGap: 24,
      textStyle: { fontSize: 12, color: '#606266' },
      selectedMode: false
    },
    grid: {
      left: 60,
      right: 60,
      top: 50,
      bottom: 70
    },
    xAxis: {
      type: 'category',
      data: cityNames,
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisTick: { show: false },
      axisLabel: {
        rotate: 30,
        fontSize: 11,
        color: '#606266',
        margin: 12
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '机构数',
        nameTextStyle: { color: '#909399', fontSize: 12 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { type: 'dashed', color: '#ebeef5' } },
        axisLabel: { color: '#909399', fontSize: 11 }
      },
      {
        type: 'value',
        name: '上报率',
        nameTextStyle: { color: '#909399', fontSize: 12 },
        min: 0,
        max: 100,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#909399', fontSize: 11, formatter: '{value}%' }
      }
    ],
    series: [
      {
        name: '已上报',
        type: 'bar',
        stack: 'total',
        data: reportedData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#86efac' },
            { offset: 1, color: '#22c55e' }
          ]),
          borderRadius: [0, 0, 0, 0]
        },
        barMaxWidth: 36
      },
      {
        name: '未上报',
        type: 'bar',
        stack: 'total',
        data: unreportedData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#fca5a5' },
            { offset: 1, color: '#ef4444' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        barMaxWidth: 36
      },
      {
        name: '上报率',
        type: 'line',
        yAxisIndex: 1,
        data: reportRates,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#69c0ff' },
            { offset: 1, color: '#1890ff' }
          ])
        },
        itemStyle: {
          color: '#1890ff',
          borderWidth: 2,
          borderColor: '#fff'
        },
        label: {
          show: false,
          position: 'top',
          formatter: '{c}%',
          fontSize: 11,
          fontWeight: 600,
          color: '#1890ff',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: [4, 8],
          borderRadius: 4,
          borderWidth: 1,
          borderColor: '#1890ff'
        },
        emphasis: {
          label: {
            show: true
          },
          itemStyle: {
            color: '#1890ff',
            borderWidth: 3,
            borderColor: '#fff',
            shadowBlur: 10,
            shadowColor: 'rgba(24, 144, 255, 0.5)'
          }
        }
      }
    ]
  }

  myCharts.value.setOption(option, true)
}

const initPageData = async () => {
  loading.value = true
  try {
    const taskList = await getReportTaskList()
    reportTaskList.value = taskList
    if (!taskList?.length) return
    queryParams.value.reportId = taskList[0].id

    const [stats, chart] = await Promise.all([
      getFillInTaskStatisticsData(Number(queryParams.value.reportId)),
      getCityChartsData(Number(queryParams.value.reportId))
    ])
    taskStatisticsData.value = {
      ...stats,
      levelReportStats: convertLevelReportStats(stats?.levelReportStats)
    }
    chartsData.value = chart?.chartData || []

    await nextTick()
    initCharts()

    if (chartsData.value.length > 0) {
      reportChartDetails.value = await getCityReportData(Number(queryParams.value.reportId), chartsData.value[0].regionId)
    }
  } catch (e) { console.error('初始化失败:', e) }
  finally { loading.value = false }
}

const handleChangeReport = async (reportId: string | number) => {
  queryParams.value.reportId = String(reportId)
  loading.value = true
  try {
    const [stats, chart] = await Promise.all([
      getFillInTaskStatisticsData(Number(reportId)),
      getCityChartsData(Number(reportId))
    ])
    taskStatisticsData.value = {
      ...stats,
      levelReportStats: convertLevelReportStats(stats?.levelReportStats)
    }
    chartsData.value = chart?.chartData || []
    updateCharts()
    if (chartsData.value.length > 0) {
      reportChartDetails.value = await getCityReportData(Number(reportId), chartsData.value[0].regionId)
    }
  } catch (e) { console.error('切换失败:', e) }
  finally { loading.value = false }
}

const handleRefresh = async () => {
  loading.value = true
  try {
    // 重新获取任务列表，确保下拉框显示正确
    const taskList = await getReportTaskList()
    reportTaskList.value = taskList

    if (queryParams.value.reportId) {
      // 刷新当前选中任务的统计数据
      const [stats, chart] = await Promise.all([
        getFillInTaskStatisticsData(Number(queryParams.value.reportId)),
        getCityChartsData(Number(queryParams.value.reportId))
      ])
      taskStatisticsData.value = {
        ...stats,
        levelReportStats: convertLevelReportStats(stats?.levelReportStats)
      }
      chartsData.value = chart?.chartData || []
      updateCharts()
      if (chartsData.value.length > 0) {
        reportChartDetails.value = await getCityReportData(Number(queryParams.value.reportId), chartsData.value[0].regionId)
      }
    } else {
      // 没有选中任务时，选择第一个
      if (taskList?.length) {
        queryParams.value.reportId = taskList[0].id
        await handleChangeReport(taskList[0].id)
      }
    }
  } catch (e) {
    console.error('刷新失败:', e)
  } finally {
    loading.value = false
  }
}

const handleViewDetails = (type: string) => {
  const regionId = reportChartDetails.value.regionId || undefined
  institutionDialogRef.value?.open(Number(queryParams.value.reportId), type, regionId)
}

/** 导出上报情况 */
const handleExportReport = async () => {
  if (!queryParams.value.reportId) {
    ElMessage.warning('请先选择填报任务')
    return
  }
  exportLoading.value = true
  try {
    const response = await InstitutionReportApi.exportInstitutionReportExcel({
      reportId: Number(queryParams.value.reportId)
    })
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const downloadUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `机构上报情况_${new Date().toLocaleDateString()}.xlsx`
    a.click()
    URL.revokeObjectURL(downloadUrl)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

/** 导出区域汇总 */
const handleExportRegionSummary = async () => {
  if (!queryParams.value.reportId) {
    ElMessage.warning('请先选择填报任务')
    return
  }
  exportRegionLoading.value = true
  try {
    const response = await InstitutionReportApi.exportRegionSummary(Number(queryParams.value.reportId))
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const downloadUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `区域上报汇总_${new Date().toLocaleDateString()}.xlsx`
    a.click()
    URL.revokeObjectURL(downloadUrl)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  } finally {
    exportRegionLoading.value = false
  }
}

const handleResize = () => myCharts.value?.resize()

onMounted(() => { initPageData(); window.addEventListener('resize', handleResize) })
onUnmounted(() => { window.removeEventListener('resize', handleResize); myCharts.value?.dispose() })
</script>

<style scoped lang="scss">
.institution-progress-container {
  min-height: 100%;
  background: #f5f7fa;
}

/* 固定头部栏 - 白色卡片风格 */
.fixed-header {
  position: sticky;
  top: 20px;
  z-index: 100;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  margin: 20px 24px;
  transition: all 0.3s ease;
}

.header-content {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 24px;
  color: #409eff;
}

.title-text {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.search-form {
  margin: 0;

  :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 12px;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #606266;
  }
}

/* 内容区域 */
.content-area {
  padding: 0 24px 24px;
  max-width: 1920px;
  margin: 0 auto;
}

.chart-row {
  margin-top: 0;
}

/* 通用颜色 */
.blue { color: #305789; }
.green { color: #67c23a; }
.orange { color: #e6a23c; }
.red { color: #f56c6c; }
.purple { color: #9c27b0; }
.pink { color: #e91e63; }
.cyan { color: #2196f3; }

/* 监测数据汇总 - 统计卡片 */
.summary-stat-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.summary-stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 16px;
  background: #fff;
  border-radius: 14px;
  list-style: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

/* 卡片顶部色条 */
.summary-stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #a5b4fc 0%, #c4b5fd 100%);
}

.summary-stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(48, 87, 137, 0.15);
}

.summary-stat-card-wide {
  grid-column: span 2;
}

/* 监测数据汇总 - 图标渐变色方框 */
.summary-icon {
  width: 52px;
  height: 52px;
  min-width: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  color: #fff;
}

.summary-icon-blue {
  background: linear-gradient(135deg, #667eea 0%, #3b4cb8 100%);
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
}

.summary-icon-green {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  box-shadow: 0 4px 14px rgba(17, 153, 142, 0.4);
}

.summary-icon-orange {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 4px 14px rgba(245, 87, 108, 0.4);
}

.summary-icon-purple {
  background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
  box-shadow: 0 4px 14px rgba(168, 85, 247, 0.4);
}

.summary-icon-pink {
  background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
  box-shadow: 0 4px 14px rgba(236, 72, 153, 0.4);
}

.summary-icon-cyan {
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
  box-shadow: 0 4px 14px rgba(6, 182, 212, 0.4);
}

.summary-info {
  flex: 1;
}

.summary-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
  margin: 0 0 4px;
}

.summary-value {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.summary-value span {
  font-size: 24px;
  font-weight: 700;
  color: #305789;
}

.summary-value em {
  font-style: normal;
  font-size: 12px;
  color: #909399;
}

.summary-value-green span {
  color: #67c23a;
}

.summary-value-time {
  font-size: 15px;
  font-weight: 700;
  color: #f56c6c;
}

.summary-value-tag {
  margin: 0;
}

@media (max-width: 1400px) {
  .summary-stat-list {
    grid-template-columns: repeat(2, 1fr);
  }
  .summary-stat-card-wide {
    grid-column: span 1;
  }
}
.progress-box {
  background: linear-gradient(145deg, #ffffff 0%, #f8fafb 100%);
  border-radius: 16px;
  padding: 22px;
  height: 100%;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
}

/* 进度条区域顶部色条 */
.progress-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #a5b4fc 0%, #c4b5fd 100%);
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 2px solid #e2e8f0;
}

.progress-header :deep(.iconify) {
  font-size: 20px;
  color: #6366f1;
}

.progress-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.progress-list li {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  list-style: none;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.progress-list li:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

.progress-list li:last-child {
  margin-bottom: 0;
}

/* 级别图标容器 */
.level-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  margin-right: 10px;
  flex-shrink: 0;
}

.level-icon-wrap.icon-purple {
  color: #a855f7;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%);
}
.level-icon-wrap.icon-blue {
  color: #3b82f6;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%);
}
.level-icon-wrap.icon-green {
  color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(52, 211, 153, 0.1) 100%);
}
.level-icon-wrap.icon-orange {
  color: #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(251, 191, 36, 0.1) 100%);
}

.level-name {
  width: 65px;
  font-size: 13px;
  color: #475569;
  font-weight: 600;
  flex-shrink: 0;
}

.level-count {
  width: 55px;
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  text-align: center;
  background: #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 10px;
  flex-shrink: 0;
}

.progress-box :deep(.el-progress) {
  flex: 1;
}

.progress-box :deep(.el-progress-bar__outer) {
  background: #e2e8f0;
  border-radius: 6px;
}

.progress-box :deep(.el-progress-bar__inner) {
  border-radius: 6px;
}

.progress-box :deep(.el-progress__text) {
  font-size: 12px !important;
  font-weight: 700;
  min-width: 48px;
  color: #334155;
}

/* 图表容器 */
.chart-container {
  width: 100%;
  height: 360px;
  padding: 8px 0;
}

/* 详情区域 */
.city-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.city-header :deep(.iconify) {
  font-size: 20px;
  color: #6366f1;
}

.city-header.animate-pulse {
  animation: headerPulse 0.6s ease-out;
}

@keyframes headerPulse {
  0% { transform: scale(1); color: #1e293b; }
  50% { transform: scale(1.05); color: #6366f1; }
  100% { transform: scale(1); color: #1e293b; }
}

/* 详细数据列表 - 使用独立类名 */
.detail-data-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.detail-data-list.animate-highlight .detail-data-item {
  animation: itemHighlight 0.6s ease-out;
}

@keyframes itemHighlight {
  0% {
    transform: scale(1);
    background: #f8fafc;
    box-shadow: none;
  }
  30% {
    transform: scale(1.02);
    background: #e0e7ff;
    box-shadow: 0 0 16px rgba(99, 102, 241, 0.4);
  }
  100% {
    transform: scale(1);
    background: #f8fafc;
    box-shadow: none;
  }
}

.detail-data-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 14px;
  gap: 12px;
  background: #f8fafc;
  border-radius: 12px;
  list-style: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.detail-data-item-clickable {
  cursor: pointer;
}

.detail-data-item-clickable:hover {
  background: #e0e7ff;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.2);
}

.detail-data-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 详细数据图标 - 渐变色方框 */
.detail-data-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  color: #fff;
}

.detail-data-icon-blue {
  background: linear-gradient(135deg, #667eea 0%, #3b4cb8 100%);
  box-shadow: 0 3px 10px rgba(102, 126, 234, 0.35);
}

.detail-data-icon-green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 3px 10px rgba(16, 185, 129, 0.35);
}

.detail-data-icon-red {
  background: linear-gradient(135deg, #f43f5e 0%, #dc2626 100%);
  box-shadow: 0 3px 10px rgba(244, 63, 94, 0.35);
}

.detail-data-icon-orange {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 3px 10px rgba(245, 158, 11, 0.35);
}

.detail-data-icon-pink {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
  box-shadow: 0 3px 10px rgba(236, 72, 153, 0.35);
}

.detail-data-icon-purple {
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
  box-shadow: 0 3px 10px rgba(168, 85, 247, 0.35);
}

.detail-data-icon-cyan {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  box-shadow: 0 3px 10px rgba(6, 182, 212, 0.35);
}

.detail-data-label {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

.detail-data-value {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-data-value em {
  font-style: normal;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  margin-left: 2px;
}

.detail-data-value-blue {
  color: #3b82f6;
}

.detail-data-value-green {
  color: #10b981;
}

.detail-data-value-red {
  color: #f43f5e;
}

.detail-data-ratio {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  padding: 3px 8px;
  border-radius: 6px;
}

.detail-data-percent {
  font-size: 15px;
  font-weight: 700;
  color: #6366f1;
}

@media (max-width: 1400px) {
  .stat-list {
    grid-template-columns: repeat(2, 1fr);
  }
  .stat-card.wide {
    grid-column: span 1;
  }
}
</style>
