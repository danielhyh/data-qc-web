<template>
  <div class="institution-progress-container" v-loading="loading">
    <ContentWrap>
      <el-form class="-mb-15px" :model="queryParams" :inline="true" label-width="68px">
        <el-form-item label="填报任务">
          <el-select v-model="queryParams.reportId" placeholder="请选择填报任务" class="!w-240px" @change="handleChangeReport">
            <el-option v-for="task in reportTaskList" :key="task.id" :label="task.taskName" :value="task.id" />
          </el-select>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 统计内容区域 -->
    <ContentWrap>
      <div class="section-header">
        <div class="section-icon blue"><Icon icon="ep:data-analysis" /></div>
        <span class="section-title">监测数据汇总</span>
      </div>
      <el-row :gutter="20">
        <el-col :span="16">
          <ul class="stat-list">
            <li class="stat-card">
              <div class="stat-icon blue"><Icon icon="ep:office-building" /></div>
              <div class="stat-info">
                <p class="stat-label">应监测机构数</p>
                <p class="stat-value"><span>{{ taskStatisticsData.totalMonitoringInstitutions }}</span><em>家</em></p>
              </div>
            </li>
            <li class="stat-card">
              <div class="stat-icon green"><Icon icon="ep:circle-check" /></div>
              <div class="stat-info">
                <p class="stat-label">已上报机构数</p>
                <p class="stat-value"><span>{{ taskStatisticsData.reportedInstitutions }}</span><em>家</em></p>
              </div>
            </li>
            <li class="stat-card">
              <div class="stat-icon orange"><Icon icon="ep:trend-charts" /></div>
              <div class="stat-info">
                <p class="stat-label">总体上报率</p>
                <p class="stat-value green"><span>{{ formatPercent(taskStatisticsData.overallReportRate) }}</span><em>%</em></p>
              </div>
            </li>
            <li class="stat-card">
              <div class="stat-icon purple"><Icon icon="ep:document" /></div>
              <div class="stat-info">
                <p class="stat-label">已上传数据量</p>
                <p class="stat-value"><span>{{ taskStatisticsData.uploadedDataCount }}</span><em>行</em></p>
              </div>
            </li>
            <li class="stat-card wide">
              <div class="stat-icon cyan"><Icon icon="ep:calendar" /></div>
              <div class="stat-info">
                <p class="stat-label">任务周期</p>
                <p class="stat-value time">{{ formatDate(taskStatisticsData.startTime) }} ~ {{ formatDate(taskStatisticsData.endTime) }}</p>
              </div>
            </li>
            <li class="stat-card">
              <div class="stat-icon pink"><Icon icon="ep:flag" /></div>
              <div class="stat-info">
                <p class="stat-label">任务状态</p>
                <p class="stat-value"><dict-tag :type="DICT_TYPE.REPORT_STATUS_TYPE" :value="taskStatisticsData.taskStatus" /></p>
              </div>
            </li>
          </ul>
        </el-col>
        <el-col :span="8">
          <div class="progress-box">
            <div class="progress-header"><Icon icon="ep:pie-chart" /><span>各级机构上报率</span></div>
            <ul class="progress-list">
              <li v-for="(item, index) in taskStatisticsData.levelReportStats" :key="index">
                <span class="level-name">{{ item.levelDesc || '' }}</span>
                <el-progress :percentage="Number(((item.reportRate || 0) * 100).toFixed(1))" :stroke-width="12" :color="getProgressColor(item.reportRate)" />
              </li>
            </ul>
          </div>
        </el-col>
      </el-row>
    </ContentWrap>

    <el-row :gutter="20">
      <el-col :span="14">
        <ContentWrap>
          <div class="section-header">
            <div class="section-icon green"><Icon icon="ep:histogram" /></div>
            <span class="section-title">全省各市区上报情况</span>
          </div>
          <div class="chart-container" ref="barCharts"></div>
        </ContentWrap>
      </el-col>
      <el-col :span="10">
        <ContentWrap>
          <div class="section-header">
            <div class="section-icon orange"><Icon icon="ep:data-board" /></div>
            <span class="section-title">详细数据</span>
            <span class="section-tip">点击图表或卡片查看详情</span>
          </div>
          <div class="city-header"><Icon icon="ep:location" /><span>{{ reportChartDetails.cityName || '请选择地区' }}</span></div>
          <ul class="detail-list">
            <li class="clickable" @click="handleViewDetails('monitoring')">
              <div class="detail-icon blue"><Icon icon="ep:office-building" /></div>
              <p class="detail-label">应监测机构数</p>
              <p class="detail-value">{{ reportChartDetails.totalMonitoringInstitutions }}</p>
            </li>
            <li class="clickable" @click="handleViewDetails('reported')">
              <div class="detail-icon green"><Icon icon="ep:select" /></div>
              <p class="detail-label">已上报机构数</p>
              <p class="detail-value green">{{ reportChartDetails.reportedInstitutions }}</p>
            </li>
            <li class="clickable" @click="handleViewDetails('unreported')">
              <div class="detail-icon red"><Icon icon="ep:close" /></div>
              <p class="detail-label">未上报机构数</p>
              <p class="detail-value red">{{ reportChartDetails.unreportedInstitutions }}</p>
            </li>
            <li>
              <div class="detail-icon orange"><Icon icon="ep:data-line" /></div>
              <p class="detail-label">上报率</p>
              <p class="detail-value blue">{{ formatPercent(reportChartDetails.reportRate) }}%</p>
            </li>
            <li>
              <div class="detail-icon pink"><Icon icon="ep:medal" /></div>
              <p class="detail-label">三级机构上报率</p>
              <p class="detail-value">{{ formatPercent(reportChartDetails.level3ReportRate) }}%</p>
            </li>
            <li>
              <div class="detail-icon purple"><Icon icon="ep:trophy" /></div>
              <p class="detail-label">二级机构上报率</p>
              <p class="detail-value">{{ formatPercent(reportChartDetails.level2ReportRate) }}%</p>
            </li>
            <li>
              <div class="detail-icon cyan"><Icon icon="ep:house" /></div>
              <p class="detail-label">基层机构上报率</p>
              <p class="detail-value">{{ formatPercent(reportChartDetails.baseLevelReportRate) }}%</p>
            </li>
          </ul>
        </ContentWrap>
      </el-col>
    </el-row>
  </div>
  <InstitutionReportDialog ref="institutionDialogRef" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getFillInTaskStatisticsData, getCityChartsData, getCityReportData } from '@/api/drug/statistics'
import { getReportTaskList, ReportTaskVO } from '@/api/drug/dataManage'
import InstitutionReportDialog from '../components/InstitutionReportDialog.vue'
import { DICT_TYPE } from '@/utils/dict'
import dayjs from 'dayjs'

const loading = ref(false)
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
  reportRate: 0, level3ReportRate: 0, level2ReportRate: 0, baseLevelReportRate: 0
})

const formatDate = (ts: string | number) => ts ? dayjs(ts).format('YYYY-MM-DD') : '-'
const formatPercent = (n: number) => (!n || n === 0) ? '0.00' : (n * 100).toFixed(2)
const getProgressColor = (rate: number) => {
  const p = (rate || 0) * 100
  return p >= 80 ? '#67c23a' : p >= 50 ? '#e6a23c' : '#f56c6c'
}

const getChartOption = (data: any[]) => ({
  tooltip: {
    trigger: 'axis', axisPointer: { type: 'shadow' },
    formatter: (params: any) => {
      const d = data.find(x => x.cityName === params[0].axisValue)
      let r = `<b>${params[0].axisValue}</b><br/>`
      params.forEach((i: any) => { r += `${i.marker} ${i.seriesName}: ${i.data}<br/>` })
      if (d) r += `总数: ${d.totalCount}<br/>上报率: <b style="color:#67c23a">${formatPercent(d.reportRate)}%</b>`
      return r
    }
  },
  legend: { top: 10 },
  grid: { left: '3%', right: '4%', bottom: '3%', top: 50, containLabel: true },
  xAxis: [{ type: 'category', data: data.map(d => d.cityName), axisLabel: { rotate: 30, fontSize: 11 } }],
  yAxis: [{ type: 'value', splitLine: { lineStyle: { type: 'dashed' } } }],
  series: [
    { name: '已上报', type: 'bar', stack: 'total', barWidth: 24, itemStyle: { color: '#67c23a' }, data: data.map(d => d.reportedCount) },
    { name: '未上报', type: 'bar', stack: 'total', barWidth: 24, itemStyle: { color: '#f56c6c', borderRadius: [4, 4, 0, 0] }, data: data.map(d => d.unreportedCount) }
  ]
})

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
    // 转换levelReportStats为数组格式
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
    // 转换levelReportStats为数组格式
    taskStatisticsData.value = {
      ...stats,
      levelReportStats: convertLevelReportStats(stats?.levelReportStats)
    }
    chartsData.value = chart?.chartData || []
    myCharts.value?.setOption(getChartOption(chartsData.value))
    if (chartsData.value.length > 0) {
      reportChartDetails.value = await getCityReportData(Number(reportId), chartsData.value[0].regionId)
    }
  } catch (e) { console.error('切换失败:', e) }
  finally { loading.value = false }
}

const initCharts = () => {
  if (!barCharts.value) return
  myCharts.value?.dispose()
  myCharts.value = echarts.init(barCharts.value)
  myCharts.value.setOption(getChartOption(chartsData.value))
  myCharts.value.on('click', (params: any) => {
    const d = chartsData.value.find(x => x.cityName === params.name)
    if (d) getCityReportData(Number(queryParams.value.reportId), d.regionId).then(r => reportChartDetails.value = r)
  })
}

const handleViewDetails = (type: string) => institutionDialogRef.value?.open(Number(queryParams.value.reportId), type)
const handleResize = () => myCharts.value?.resize()

onMounted(() => { initPageData(); window.addEventListener('resize', handleResize) })
onUnmounted(() => { window.removeEventListener('resize', handleResize); myCharts.value?.dispose() })
</script>

<style scoped lang="scss">
/* 通用颜色 */
.blue { color: #305789; }
.green { color: #67c23a; }
.orange { color: #e6a23c; }
.red { color: #f56c6c; }
.purple { color: #9c27b0; }
.pink { color: #e91e63; }
.cyan { color: #2196f3; }

/* 区块头部 */
.section-header {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #f0f3f7;
}
.section-icon {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; font-size: 16px;
  &.blue { background: linear-gradient(135deg, #305789, #4a7bc8); color: white; }
  &.green { background: linear-gradient(135deg, #67c23a, #85ce61); color: white; }
  &.orange { background: linear-gradient(135deg, #e6a23c, #f5b461); color: white; }
}
.section-title { font-size: 16px; font-weight: 600; color: #303133; }
.section-tip { margin-left: auto; font-size: 12px; color: #909399; }

/* 统计卡片 */
.stat-list {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 0; padding: 0;
}
.stat-card {
  display: flex; align-items: center; gap: 12px; padding: 16px;
  background: #fff; border-radius: 12px; border: 1px solid #e9ecef;
  list-style: none; transition: all 0.3s;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(48,87,137,0.12); }
  &.wide { grid-column: span 2; }
}
.stat-icon {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
  &.blue { background: #e8f4fd; color: #305789; }
  &.green { background: #e8f8e8; color: #67c23a; }
  &.orange { background: #fff3e0; color: #e6a23c; }
  &.purple { background: #f3e5f5; color: #9c27b0; }
  &.pink { background: #fce4ec; color: #e91e63; }
  &.cyan { background: #e3f2fd; color: #2196f3; }
}
.stat-info { flex: 1; }
.stat-label { font-size: 12px; color: #909399; margin: 0 0 4px; }
.stat-value {
  margin: 0; display: flex; align-items: baseline; gap: 2px;
  span { font-size: 24px; font-weight: 700; color: #305789; }
  em { font-style: normal; font-size: 12px; color: #909399; }
  &.green span { color: #67c23a; }
  &.time { font-size: 13px; color: #606266; }
}

/* 进度条 */
.progress-box {
  background: #f8fafb; border-radius: 12px; padding: 20px; height: 100%; border: 1px solid #e9ecef;
}
.progress-header {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 600; color: #305789;
  margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px dashed #dcdfe6;
}
.progress-list { margin: 0; padding: 0; }
.progress-list li {
  display: flex; align-items: center; margin-bottom: 14px; list-style: none;
  &:last-child { margin-bottom: 0; }
}
.level-name { width: 80px; font-size: 13px; color: #606266; font-weight: 500; }
.progress-box :deep(.el-progress) { flex: 1; }
.progress-box :deep(.el-progress__text) { font-size: 12px !important; font-weight: 600; min-width: 45px; }

/* 图表 */
.chart-container { width: 100%; height: 320px; }

/* 详情 */
.city-header {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  font-size: 15px; font-weight: 600; color: #305789;
  margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #f0f3f7;
}
.detail-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 0; padding: 0; }
.detail-list li {
  display: flex; flex-direction: column; align-items: center;
  padding: 12px 8px; background: #f8fafb; border-radius: 10px;
  border: 1px solid #e9ecef; list-style: none; transition: all 0.3s;
  &.clickable { cursor: pointer; }
  &.clickable:hover { background: #e9f2ff; border-color: #305789; transform: translateY(-2px); }
}
.detail-icon {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; font-size: 14px; margin-bottom: 6px;
  &.blue { background: #e8f4fd; color: #305789; }
  &.green { background: #e8f8e8; color: #67c23a; }
  &.red { background: #fef0f0; color: #f56c6c; }
  &.orange { background: #fff3e0; color: #e6a23c; }
  &.pink { background: #fce4ec; color: #e91e63; }
  &.purple { background: #f3e5f5; color: #9c27b0; }
  &.cyan { background: #e3f2fd; color: #2196f3; }
}
.detail-label { font-size: 11px; color: #909399; margin: 0 0 4px; text-align: center; }
.detail-value {
  font-size: 18px; font-weight: 700; color: #303133; margin: 0;
  &.blue { color: #305789; }
  &.green { color: #67c23a; }
  &.red { color: #f56c6c; }
}

@media (max-width: 1400px) {
  .stat-list { grid-template-columns: repeat(2, 1fr); }
  .stat-card.wide { grid-column: span 1; }
}
</style>
