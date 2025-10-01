<template>
  <div class="institution-progress-container" v-loading="loading">
    <ContentWrap>
      <!-- 搜索工作栏 -->
      <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
        <el-form-item label="填报任务" prop="reportTaskId">
          <el-select v-model="queryParams.reportId" placeholder="请选择填报任务" class="!w-200px" @change="handleChangeReport">
            <el-option v-for="task in reportTaskList" :key="task.id" :label="task.taskName" :value="task.id" />
          </el-select>
        </el-form-item>
        <el-form-item  v-if="false">
          <el-button type="primary" @click="exportReport">导出报告</el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 统计内容区域 -->
    <ContentWrap>
      <div class="subtitle">
        监测数据汇总
      </div>
      <el-row :gutter="24">
        <el-col :span="16">
          <ul class="statistical-content">
            <li>
              <p>应监测机构数</p>
              <p>
                <span>{{ taskStatisticsData.totalMonitoringInstitutions }}</span> 家
              </p>
            </li>
            <li>
              <p>已上报机构数</p>
              <p>
                <span>{{ taskStatisticsData.reportedInstitutions }}</span> 家
              </p>
            </li>
            <li>
              <p>总体上报率</p>
              <p>
                <span>{{ formatProcessing(taskStatisticsData.overallReportRate) }}</span> %
              </p>
            </li>
            <li>
              <p>已给国家上传数据量(行数)</p>
              <p>
                <span>{{ taskStatisticsData.uploadedDataCount }}</span>
              </p>
            </li>
            <li>
              <p>开始时间</p>
              <p>
                <span>{{ getCurrentDate(taskStatisticsData.startTime) }}</span>
              </p>
            </li>
            <li>
              <p>结束时间</p>
              <p>
                <span>{{ getCurrentDate(taskStatisticsData.endTime) }}</span>
              </p>
            </li>
            <li>
              <p>上报任务状态</p>
              <p class="tag">
                <dict-tag :type="DICT_TYPE.REPORT_STATUS_TYPE" :value="taskStatisticsData.taskStatus" />
              </p>
            </li>
          </ul>
        </el-col>
        <el-col :span="8">
          <div class="progress-content">
            <div class="progress-title">各级机构上报率</div>
            <ul>
              <li v-for="(item, index) in taskStatisticsData.levelReportStats" :key="index">
                <span>{{ item.levelDesc || '' }}</span>
                <span>
                  <el-progress :percentage="(item.reportRate || 0) * 100" :stroke-width="15" color="#4a7bc8" />
                </span>
              </li>
            </ul>
          </div>
        </el-col>
      </el-row>

    </ContentWrap>
    <el-row :gutter="24">
      <el-col :span="14">
        <ContentWrap>
          <div class="report-echarts">
            <div class="subtitle center">
              全省各市区上报情况
            </div>
            <div class="report-my-echarts" ref="barCharts"></div>
          </div>
        </ContentWrap>
      </el-col>
      <el-col :span="10" class="echarts-col">
        <ContentWrap>
          <div class="report-title">
            <span>详细数据</span>
            <span> (鼠标点击详细查看更多内容)</span>
          </div>
          <div class="report-details">
            <div class="subtitle center">
              {{ reportChartDetails.cityName }} 详细数据
            </div>
            <ul class="report-details-info">
              <li @click="handleViewDetails('monitoring')">
                <p>应监测机构数</p>
                <p>{{ reportChartDetails.totalMonitoringInstitutions }}</p>
              </li>
              <li @click="handleViewDetails('reported')">
                <p>已上报机构数</p>
                <p>{{ reportChartDetails.reportedInstitutions }}</p>
              </li>
              <li @click="handleViewDetails('unreported')">
                <p>未上报机构数</p>
                <p>{{ reportChartDetails.unreportedInstitutions }}</p>
              </li>
              <li>
                <p>上报率</p>
                <p>{{ formatProcessing(reportChartDetails.reportRate) }}%</p>
              </li>
              <li>
                <p>三级机构上报率</p>
                <p>{{ formatProcessing(reportChartDetails.level3ReportRate) }}%</p>
              </li>
              <li>
                <p>二级机构上报率</p>
                <p>{{ formatProcessing(reportChartDetails.level2ReportRate) }}%</p>
              </li>
              <li>
                <p>基层机构上报率</p>
                <p>{{ formatProcessing(reportChartDetails.baseLevelReportRate) }}%</p>
              </li>
            </ul>
          </div>
        </ContentWrap>
      </el-col>
    </el-row>
  </div>
  <!-- 机构详情弹框 -->
  <InstitutionReportDialog ref="institutionDialogRef" />
</template>


<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { exportInstitutionReport, getFillInTaskStatisticsData, getCityChartsData, getCityReportData } from '@/api/drug/statistics'
import { getReportTaskList, ReportTaskVO } from '@/api/drug/dataManage'
import InstitutionReportDialog from '../components/InstitutionReportDialog.vue'
import { DICT_TYPE } from '@/utils/dict'
import dayjs from 'dayjs'

const loading = ref(false)
const queryParams = ref({
  reportId: ''
})
const taskStatisticsData = ref({
  totalMonitoringInstitutions: 0,
  reportedInstitutions: 0,
  overallReportRate: 0,
  uploadedDataCount: 0,
  startTime: '',
  endTime: '',
  taskStatus: 0,
  levelReportStats: {}
})

const reportChartDetails = ref({
  cityName: '',
  totalMonitoringInstitutions: 0,
  reportedInstitutions: 0,
  unreportedInstitutions: 0,
  reportRate: 0,
  level3ReportRate: 0,
  level2ReportRate: 0,
  baseLevelReportRate: 0
})

const chartsData = ref([])

const barCharts = ref<HTMLElement | null>(null)
const institutionDialogRef = ref<HTMLElement | null>(null)
const myCharts = ref()

let option = {
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    },
    formatter: (params) => {
      let res = ''
      params.forEach(item => {
        res += item.marker + item.seriesName + ':' + item.data + '<br />'
      })
      return res
    }
  },
  legend: {},
  xAxis: [
    {
      type: 'category',
      data: []
    }
  ],
  yAxis: [
    {
      type: 'value'
    }
  ],
  series: [
    {
      name: '已上报',
      type: 'bar',
      stack: 'Ad',
      barWidth: 20,
      emphasis: {
        focus: 'series'
      },
      data: []
    },
    {
      name: '未上报',
      type: 'bar',
      stack: 'Ad',
      barWidth: 20,
      emphasis: {
        focus: 'series'
      },
      itemStyle: {
        borderRadius: [5, 5, 0, 0]
      },
      data: []
    },
  ]
};

const reportTaskList = ref<ReportTaskVO[]>([]) // 填报任务列表

/** 获取填报任务列表 */
const getReportTaskListData = async () => {
  loading.value = true
  try {
    const data = await getReportTaskList()
    reportTaskList.value = data
    queryParams.value.reportId = data[0].id
    loading.value = false
  } catch (error) {
    loading.value = false
    console.error('获取填报任务列表失败:', error)
  }
}

/** 获取监测数据汇总 */
const getFillInTaskStatisticsInfo = async () => {
  loading.value = true
  try {
    const data = await getFillInTaskStatisticsData(Number(queryParams.value.reportId))
    taskStatisticsData.value = data
    loading.value = false
  } catch (error) {
    loading.value = false
    console.error('获取监测数据汇总失败:', error)
  }
}

const handleChangeReport = async (reportId) => {
  queryParams.value.reportId = reportId
  await getFillInTaskStatisticsInfo()
  await getCityChartsInfo()
  initCharts()
  getCityDetauilsInfo()
}

/** 获取全省各市区上报情况图表数据 */
const getCityChartsInfo = async () => {
  loading.value = true
  try {
    const data = await getCityChartsData(Number(queryParams.value.reportId))
    const chartData = data?.chartData || []
    chartsData.value = chartData
    option.xAxis[0].data = []
    option.series[0].data = []
    option.series[1].data = []
    chartData.forEach(chartData => {
      option.xAxis[0].data.push(chartData.cityName)
      option.series[0].data.push(chartData.reportedCount)
      option.series[1].data.push(chartData.unreportedCount)
    })
    option.tooltip.formatter = (params) => {
      let res = ''
      params.forEach(item => {
        res += item.marker + item.seriesName + ': ' + item.data + '<br />'
      })
      const currentData = chartData.find(chartData => chartData.cityName === params[0].axisValue)
      res += '总数: ' + currentData.totalCount + '<br />' + '上报率: ' + formatProcessing(currentData.reportRate) + '%'
      return res
    }
    loading.value = false
  } catch (error) {
    loading.value = false
    console.error('获取全省各市区上报情况图表数据失败:', error)
  }
}

/** 详细数据 */
const getCityDetauilsInfo = async (id: number | undefined = undefined) => {
  loading.value = true
  try {
    let regionId
    if (id) {
      regionId = id
    } else {
      regionId = chartsData.value[0].regionId
    }
    const data = await getCityReportData(Number(queryParams.value.reportId), regionId)
    reportChartDetails.value = data
    loading.value = false
  } catch (error) {
    loading.value = false
    console.error('获取详细数据失败:', error)
  }
}

// 导出报告
const exportReport = async () => {
  try {
    await exportInstitutionReport({ year: '', format: 'excel' })
  } catch (error) {
    console.error('导出失败:', error)
  }
}

/** 初始化chart图 */
const initCharts = () => {
  const initEchart = echarts.init(barCharts.value)
  initEchart.setOption(option)
  initEchart.on('click', params => {
    const currentData = chartsData.value.find(chartData => chartData.cityName === params.name)
    currentData && getCityDetauilsInfo(Number(currentData.regionId))
  })

  myCharts.value = initEchart
}

const handleViewDetails = (type) => {
  institutionDialogRef.value?.open(Number(queryParams.value.reportId), type)
}

/** 根据当前时间戳获取年月日 */
const getCurrentDate = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD')
}

/** 处理%格式 */
const formatProcessing = (number) => {
  if (number === 0) return number
  return (number * 100).toFixed(2)
}

// 窗口大小变化时重绘图表
const handleResize = () => {
  myCharts.value?.resize()
}

// 生命周期
onMounted(async () => {
  await getReportTaskListData()
  await getFillInTaskStatisticsInfo()
  await getCityChartsInfo()
  initCharts()
  getCityDetauilsInfo()
  // 添加窗口大小监听
  window.addEventListener('resize', handleResize)
})

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.subtitle {
  font-size: 16px;
  font-weight: 600;
  color: #305789;
  margin-bottom: 15px;
  border-bottom: 2px solid #f0f3f7;
  padding-bottom: 8px;
}

.subtitle.center {
  text-align: center;
}

.statistical-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 0;
}

li {
  list-style: none;
}

.statistical-content li {
  text-align: center;
  padding: 12px 8px;
  background: linear-gradient(135deg, #f8fafb 0%, #f0f3f7 100%);
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.statistical-content li:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(48, 87, 137, 0.1);
}

.statistical-content li p:first-child {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
  font-weight: 500;
}

.statistical-content li p:last-child span {
  font-size: 18px;
  font-weight: bold;
  color: #305789;
}

.progress-content {
  padding: 15px;
  background: linear-gradient(135deg, #f8fafb 0%, #f0f3f7 100%);
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.progress-title {
  font-size: 14px;
  font-weight: 600;
  color: #305789;
  margin-bottom: 12px;
  text-align: center;
}

.progress-content li {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.progress-content li span:first-child {
  width: 80px;
  font-size: 12px;
  color: #333;
  font-weight: 500;
}

.progress-content li span:last-child {
  width: calc(100% - 80px);
  font-size: 12px;
  color: #333;
  font-weight: 500;
}

.progress-content :deep(.el-progress__text) {
  font-size: 12px !important;
  font-weight: 600;
  color: #305789 !important;
}

.echarts-col :deep(.el-card__body) {
  padding: 0 !important;
}

.echarts-col .report-title {
  background: linear-gradient(135deg, #305789, #4a7bc8);
  color: white;
  padding: 12px 20px;
  border-radius: 12px 12px 0 0;
  justify-content: space-between;
  align-items: center;
}

.echarts-col .report-title span:first-child {
  font-size: 16px;
  font-weight: 600;
}

.echarts-col .report-title span:last-child {
  font-size: 12px;
  color: #f3f3f3;
}

.echarts-col .report-details {
  padding: 20px;
}

.report-my-echarts {
  width: 100%;
  height: 300px;
}

.report-details-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.report-details-info li {
  text-align: center;
  padding: 8px 6px;
  background: linear-gradient(135deg, #f8fafb 0%, #f0f3f7 100%);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
}

.report-details-info li:hover {
  background: linear-gradient(135deg, #e9f2ff 0%, #dae8f5 100%);
  border-color: #305789;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(48, 87, 137, 0.15);
}

.report-details-info li p:first-child {
  font-size: 10px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
}

.report-details-info li p:last-child {
  font-size: 14px;
  font-weight: bold;
  color: #305789;
}
</style>