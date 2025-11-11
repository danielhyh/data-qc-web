<template>
  <div class="drug-analysis-container">
    <!-- 分析控制面板 -->
    <!-- 这个面板就像是分析师的工作台，提供各种筛选和配置选项 -->
    <div class="analysis-controls">
      <el-card class="control-card">
        <template #header>
          <div class="control-header">
            <Icon icon="ep:setting" class="header-icon" />
            <span class="header-title">分析控制台</span>
          </div>
        </template>

        <el-form :model="analysisParams" :inline="true" class="control-form">
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="analysisParams.dateRange"
              type="daterange"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYYMMDD"
              class="date-picker"
              @change="handleDateRangeChange"
            />
          </el-form-item>

          <el-form-item label="分析维度">
            <el-select
              v-model="analysisParams.dimension"
              placeholder="选择分析维度"
              @change="handleDimensionChange"
            >
              <el-option label="使用频次" value="frequency" />
              <el-option label="销售金额" value="amount" />
              <el-option label="基药分类" value="category" />
              <el-option label="供应商分布" value="supplier" />
            </el-select>
          </el-form-item>

          <el-form-item label="图表类型">
            <el-radio-group v-model="chartType" @change="handleChartTypeChange">
              <el-radio-button value="bar">柱状图</el-radio-button>
              <el-radio-button value="pie">饼图</el-radio-button>
              <el-radio-button value="line">趋势图</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="refreshAnalysis" :loading="loading">
              <Icon icon="ep:refresh" />
              更新分析
            </el-button>
            <el-button type="success" @click="exportChart">
              <Icon icon="ep:download" />
              导出图表
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 核心指标展示区域 -->
    <!-- 这里展示最重要的KPI指标，就像企业仪表板的核心数据 -->
    <div class="metrics-overview">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(metric, index) in drugMetrics" :key="index">
          <el-card class="metric-card" :class="metric.level">
            <div class="metric-content">
              <div class="metric-icon" :style="{ backgroundColor: metric.color }">
                <Icon :icon="metric.icon" />
              </div>
              <div class="metric-details">
                <div class="metric-number">{{ metric.value }}</div>
                <div class="metric-label">{{ metric.label }}</div>
                <div class="metric-description">{{ metric.description }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要分析图表区域 -->
    <el-row :gutter="20" class="chart-section">
      <!-- 药品使用排行榜 -->
      <!-- 排行榜能直观显示哪些药品最受欢迎，帮助库存管理决策 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <Icon icon="ep:trophy" class="chart-icon" />
              <span class="chart-title">药品使用排行TOP20</span>
              <div class="chart-controls">
                <el-select v-model="rankingMetric" size="small" @change="updateRankingChart">
                  <el-option label="使用数量" value="quantity" />
                  <el-option label="销售金额" value="amount" />
                  <el-option label="处方频次" value="frequency" />
                </el-select>
              </div>
            </div>
          </template>
          <div class="chart-container" ref="rankingChartRef"></div>
        </el-card>
      </el-col>

      <!-- 基药使用分析 -->
      <!-- 基药使用率是医院管理的重要合规指标，需要重点监控 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <Icon icon="ep:pie-chart" class="chart-icon" />
              <span class="chart-title">基药使用分析</span>
              <div class="chart-info">
                <el-tag
                  :type="baseDrugRateLevel"
                  class="rate-tag"
                >
                  使用率：{{ baseDrugRate }}%
                </el-tag>
              </div>
            </div>
          </template>
          <div class="chart-container" ref="baseDrugChartRef"></div>

          <!-- 基药合规性提示 -->
          <div class="compliance-tips">
            <div class="tip-item" :class="baseDrugRateLevel">
              <Icon :icon="getComplianceIcon()" />
              <span class="tip-text">{{ getComplianceMessage() }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细分析图表区域 -->
    <el-row :gutter="20" class="detailed-charts">
      <!-- 供应商分析 -->
      <!-- 供应商分析帮助评估供应链稳定性和集中度风险 -->
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <Icon icon="ep:office-building" class="chart-icon" />
              <span class="chart-title">供应商分布</span>
            </div>
          </template>
          <div class="chart-container small-chart" ref="supplierChartRef"></div>

          <!-- 供应商风险提示 -->
          <div class="risk-indicator">
            <div class="risk-item">
              <span class="risk-label">集中度风险：</span>
              <el-tag :type="supplierRiskLevel" size="small">
                {{ supplierRiskText }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 价格区间分析 -->
      <!-- 价格分析帮助了解用药成本结构 -->
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <Icon icon="ep:money" class="chart-icon" />
              <span class="chart-title">价格区间分布</span>
            </div>
          </template>
          <div class="chart-container small-chart" ref="priceChartRef"></div>
        </el-card>
      </el-col>

      <!-- 使用趋势分析 -->
      <!-- 趋势分析帮助预测未来的用药需求 -->
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <Icon icon="ep:trend-charts" class="chart-icon" />
              <span class="chart-title">使用趋势</span>
            </div>
          </template>
          <div class="chart-container small-chart" ref="trendChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据详情表格 -->
    <!-- 表格提供具体的数据详情，支持进一步的数据钻取 -->
    <div class="data-table-section">
      <el-card class="table-card">
        <template #header>
          <div class="table-header">
            <Icon icon="ep:data-board" class="header-icon" />
            <span class="header-title">详细数据</span>
            <div class="table-controls">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索药品名称或编码"
                prefix-icon="ep:search"
                clearable
                class="search-input"
                @input="handleSearch"
              />
              <el-button type="primary" @click="exportTableData">
                <Icon icon="ep:download" />
                导出数据
              </el-button>
            </div>
          </div>
        </template>

        <el-table
          :data="filteredTableData"
          v-loading="tableLoading"
          @sort-change="handleSortChange"
          height="400"
        >
          <el-table-column label="排名" width="80" align="center">
            <template #default="scope">
              <div class="rank-cell" :class="getRankClass(scope.$index)">
                {{ scope.$index + 1 }}
              </div>
            </template>
          </el-table-column>

          <el-table-column
            label="药品编码"
            prop="hosDrugId"
            width="120"
            sortable="custom"
          />

          <el-table-column
            label="药品名称"
            prop="productName"
            min-width="200"
            sortable="custom"
            show-overflow-tooltip
          />

          <el-table-column
            label="使用次数"
            prop="useCount"
            width="100"
            align="center"
            sortable="custom"
          />

          <el-table-column
            label="销售金额"
            prop="totalAmount"
            width="120"
            align="center"
            sortable="custom"
          >
            <template #default="scope">
              <span class="amount-cell">
                ¥{{ formatAmount(scope.row.totalAmount) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column
            label="市场占比"
            prop="percentage"
            width="100"
            align="center"
          >
            <template #default="scope">
              <el-progress
                :percentage="scope.row.percentage"
                :stroke-width="8"
                :show-text="false"
                class="progress-bar"
              />
              <span class="percentage-text">{{ scope.row.percentage }}%</span>
            </template>
          </el-table-column>

          <el-table-column
            label="基药类型"
            prop="isBaseDrug"
            width="100"
            align="center"
          >
            <template #default="scope">
              <el-tag
                :type="scope.row.isBaseDrug ? 'success' : 'info'"
                size="small"
              >
                {{ scope.row.isBaseDrug ? '基药' : '非基药' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="scope">
              <el-button
                type="primary"
                link
                size="small"
                @click="viewDrugDetails(scope.row)"
              >
                <Icon icon="ep:view" />
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="table-pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="totalCount"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import * as AnalysisApi from '@/api/dataqc/analysis'

defineOptions({ name: 'DrugAnalysisChart' })

// ========== Props 和 Emits 定义 ==========

interface Props {
  data: AnalysisApi.DrugAnalysisData
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({} as AnalysisApi.DrugAnalysisData)
})

const emit = defineEmits<{
  'data-change': [data: any]
}>()

// ========== 响应式数据定义 ==========

const loading = ref(false)
const tableLoading = ref(false)
const chartType = ref('bar')
const rankingMetric = ref('quantity')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

// 分析参数 - 这就像是数据分析的配置面板
const analysisParams = ref({
  dateRange: [] as string[],
  dimension: 'frequency',
  category: 'all'
})

// 图表DOM引用 - 每个图表都需要一个容器来渲染
const rankingChartRef = ref<HTMLElement>()
const baseDrugChartRef = ref<HTMLElement>()
const supplierChartRef = ref<HTMLElement>()
const priceChartRef = ref<HTMLElement>()
const trendChartRef = ref<HTMLElement>()

// 图表实例存储 - 管理多个ECharts实例
let rankingChart: echarts.ECharts | null = null
let baseDrugChart: echarts.ECharts | null = null
let supplierChart: echarts.ECharts | null = null
let priceChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

// ========== 计算属性 ==========

/**
 * 药品核心指标计算
 * 这些指标就像是体检报告的关键数值，能快速反映药品管理的健康状况
 */
const drugMetrics = computed(() => {
  const stats = props.data.drugStats || {}

  return [
    {
      label: '药品总数',
      value: stats.totalCount || 0,
      description: '系统中的药品种类总数',
      icon: 'fa-solid:notes-medical',
      color: '#409EFF',
      level: 'primary'
    },
    {
      label: '基药品种',
      value: stats.baseDrugCount || 0,
      description: '基本药物品种数量',
      icon: 'ep:check',
      color: '#67C23A',
      level: 'success'
    },
    {
      label: '供应商数',
      value: stats.manufacturerCount || 0,
      description: '合作供应商总数',
      icon: 'ep:office-building',
      color: '#E6A23C',
      level: 'warning'
    },
    {
      label: '剂型种类',
      value: stats.formCount || 0,
      description: '药品剂型规格总数',
      icon: 'ep:collection',
      color: '#909399',
      level: 'info'
    }
  ]
})

/**
 * 基药使用率计算
 * 这是医院管理的重要合规指标，国家要求基药使用率不低于60%
 */
const baseDrugRate = computed(() => {
  const analysis = props.data.baseDrugAnalysis || {}
  const total = (analysis.baseDrugAmount || 0) + (analysis.nonBaseDrugAmount || 0)

  if (total === 0) return 0
  return Math.round((analysis.baseDrugAmount / total) * 100)
})

/**
 * 基药使用率等级评定
 * 根据国家政策要求进行等级划分
 */
const baseDrugRateLevel = computed(() => {
  const rate = baseDrugRate.value
  if (rate >= 70) return 'success'    // 优秀
  if (rate >= 60) return 'success'    // 达标
  if (rate >= 40) return 'warning'    // 预警
  return 'danger'                     // 不达标
})

/**
 * 供应商集中度风险评估
 * 评估供应链的稳定性和风险程度
 */
const supplierRiskLevel = computed(() => {
  const suppliers = props.data.supplierAnalysis || []
  if (suppliers.length === 0) return 'info'

  // 计算前三大供应商的市场占有率
  const totalAmount = suppliers.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
  const top3Amount = suppliers.slice(0, 3).reduce((sum, s) => sum + (s.totalAmount || 0), 0)
  const concentration = totalAmount > 0 ? (top3Amount / totalAmount) * 100 : 0

  if (concentration > 80) return 'danger'   // 高风险
  if (concentration > 60) return 'warning'  // 中风险
  return 'success'                          // 低风险
})

const supplierRiskText = computed(() => {
  const level = supplierRiskLevel.value
  const riskMap = {
    'danger': '高风险',
    'warning': '中风险',
    'success': '低风险',
    'info': '无数据'
  }
  return riskMap[level] || '未知'
})

/**
 * 表格数据过滤
 * 支持按药品名称和编码进行搜索
 */
const filteredTableData = computed(() => {
  let data = props.data.topDrugs || []

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    data = data.filter(item =>
      item.productName?.toLowerCase().includes(keyword) ||
      item.hosDrugId?.toLowerCase().includes(keyword)
    )
  }

  return data
})

const totalCount = computed(() => filteredTableData.value.length)

// ========== 生命周期管理 ==========

onMounted(() => {
  initializeCharts()
  // 设置默认时间范围为最近3个月
  setDefaultDateRange()
})

onUnmounted(() => {
  disposeAllCharts()
})

// ========== 监听器 ==========

/**
 * 监听数据变化，自动更新图表
 * 这确保了当父组件传入新数据时，所有图表能够同步更新
 */
watch(() => props.data, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    nextTick(() => {
      updateAllCharts()
    })
  }
}, { deep: true })

// ========== 图表初始化方法 ==========

/**
 * 初始化所有图表
 * 这个方法就像是搭建一个完整的数据可视化工作台
 */
const initializeCharts = () => {
  nextTick(() => {
    try {
      initRankingChart()
      initBaseDrugChart()
      initSupplierChart()
      initPriceChart()
      initTrendChart()

      // 响应式调整
      window.addEventListener('resize', handleWindowResize)
    } catch (error) {
      console.error('图表初始化失败:', error)
      ElMessage.error('图表初始化失败')
    }
  })
}

/**
 * 初始化排行榜图表
 * 横向柱状图最适合展示排名数据，因为药品名称通常较长
 */
const initRankingChart = () => {
  if (!rankingChartRef.value) return

  rankingChart = echarts.init(rankingChartRef.value)

  const option = {
    title: {
      text: '药品使用排行',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const data = params[0]
        return `${data.name}<br/>使用数量: ${data.value}`
      }
    },
    grid: {
      left: '15%',
      right: '10%',
      top: '15%',
      bottom: '10%'
    },
    xAxis: {
      type: 'value',
      name: '使用数量'
    },
    yAxis: {
      type: 'category',
      data: [],
      axisLabel: {
        interval: 0,
        formatter: (value: string) => {
          // 药品名称过长时进行截断
          return value.length > 12 ? value.substring(0, 12) + '...' : value
        }
      }
    },
    series: [{
      type: 'bar',
      data: [],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#409EFF' },
          { offset: 1, color: '#66B1FF' }
        ])
      }
    }]
  }

  rankingChart.setOption(option)
}

/**
 * 初始化基药分析饼图
 * 饼图能直观显示基药与非基药的比例关系
 */
const initBaseDrugChart = () => {
  if (!baseDrugChartRef.value) return

  baseDrugChart = echarts.init(baseDrugChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [{
      name: '基药分析',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      data: [],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      label: {
        formatter: '{b}\n{d}%'
      }
    }]
  }

  baseDrugChart.setOption(option)
}

/**
 * 初始化供应商分布图表
 * 使用玫瑰图展示供应商的相对重要性
 */
const initSupplierChart = () => {
  if (!supplierChartRef.value) return

  supplierChart = echarts.init(supplierChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: '供应商分布',
      type: 'pie',
      radius: [20, 80],
      roseType: 'area',
      data: []
    }]
  }

  supplierChart.setOption(option)
}

/**
 * 初始化价格区间分析图表
 * 柱状图展示不同价格区间的药品分布
 */
const initPriceChart = () => {
  if (!priceChartRef.value) return

  priceChart = echarts.init(priceChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['0-10元', '10-50元', '50-100元', '100-500元', '500元以上']
    },
    yAxis: {
      type: 'value',
      name: '药品数量'
    },
    series: [{
      type: 'bar',
      data: [120, 200, 150, 80, 70],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#E6A23C' },
          { offset: 1, color: '#F0A020' }
        ])
      }
    }]
  }

  priceChart.setOption(option)
}

/**
 * 初始化使用趋势图表
 * 折线图最适合展示时间序列数据的变化趋势
 */
const initTrendChart = () => {
  if (!trendChartRef.value) return

  trendChart = echarts.init(trendChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value',
      name: '使用量'
    },
    series: [{
      type: 'line',
      data: [820, 932, 901, 934, 1290, 1330],
      smooth: true,
      itemStyle: {
        color: '#67C23A'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
          { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
        ])
      }
    }]
  }

  trendChart.setOption(option)
}

// ========== 图表更新方法 ==========

/**
 * 更新所有图表数据
 * 当数据发生变化时，需要同步更新所有相关的图表
 */
const updateAllCharts = () => {
  updateRankingChart()
  updateBaseDrugChart()
  updateSupplierChart()
  // 价格图表和趋势图表使用模拟数据，实际项目中应该从props.data获取
}

/**
 * 更新排行榜图表
 * 根据当前选择的指标更新排行榜显示
 */
const updateRankingChart = () => {
  if (!rankingChart || !props.data.topDrugs) return

  const topDrugs = props.data.topDrugs.slice(0, 10) // 只显示前10名
  const names = topDrugs.map(drug => drug.productName || '')
  const values = topDrugs.map(drug => {
    switch (rankingMetric.value) {
      case 'amount':
        return drug.totalAmount || 0
      case 'frequency':
        return drug.useCount || 0
      default:
        return drug.useCount || 0
    }
  })

  rankingChart.setOption({
    yAxis: { data: names.reverse() },
    series: [{ data: values.reverse() }]
  })
}

/**
 * 更新基药分析图表
 * 展示基药与非基药的比例关系
 */
const updateBaseDrugChart = () => {
  if (!baseDrugChart || !props.data.baseDrugAnalysis) return

  const analysis = props.data.baseDrugAnalysis
  const data = [
    {
      name: '基本药物',
      value: analysis.baseDrugAmount || 0,
      itemStyle: { color: '#67C23A' }
    },
    {
      name: '非基本药物',
      value: analysis.nonBaseDrugAmount || 0,
      itemStyle: { color: '#E6A23C' }
    }
  ]

  baseDrugChart.setOption({
    series: [{ data }]
  })
}

/**
 * 更新供应商分布图表
 * 展示各供应商的市场份额
 */
const updateSupplierChart = () => {
  if (!supplierChart || !props.data.supplierAnalysis) return

  const suppliers = props.data.supplierAnalysis.slice(0, 8) // 只显示前8名供应商
  const data = suppliers.map((supplier, index) => ({
    name: supplier.supplierName || `供应商${index + 1}`,
    value: supplier.totalAmount || 0
  }))

  supplierChart.setOption({
    series: [{ data }]
  })
}

// ========== 事件处理方法 ==========

/**
 * 处理日期范围变化
 * 当用户选择新的时间范围时，触发数据重新加载
 */
const handleDateRangeChange = (dateRange: string[]) => {
  analysisParams.value.dateRange = dateRange
  emit('data-change', { type: 'dateRange', value: dateRange })
}

/**
 * 处理分析维度变化
 * 不同的分析维度会影响数据的展示方式
 */
const handleDimensionChange = (dimension: string) => {
  analysisParams.value.dimension = dimension
  emit('data-change', { type: 'dimension', value: dimension })
}

/**
 * 处理图表类型变化
 * 用户可以在不同的图表类型之间切换
 */
const handleChartTypeChange = (type: string) => {
  chartType.value = type
  // 根据图表类型重新渲染相应图表
  updateAllCharts()
}

/**
 * 刷新分析数据
 * 重新从服务器获取最新的分析数据
 */
const refreshAnalysis = async () => {
  loading.value = true
  try {
    // 这里应该调用API重新获取数据
    emit('data-change', { type: 'refresh', params: analysisParams.value })
    ElMessage.success('分析数据已更新')
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('刷新数据失败')
  } finally {
    loading.value = false
  }
}

// ========== 辅助方法 ==========

/**
 * 设置默认时间范围
 * 默认显示最近3个月的数据
 */
const setDefaultDateRange = () => {
  const endDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10).replace(/-/g, '')

  analysisParams.value.dateRange = [startDate, endDate]
}

/**
 * 获取合规性图标
 * 根据基药使用率返回对应的状态图标
 */
const getComplianceIcon = () => {
  const level = baseDrugRateLevel.value
  const iconMap = {
    'success': 'ep:check',
    'warning': 'ep:warning',
    'danger': 'ep:close'
  }
  return iconMap[level] || 'ep:question'
}

/**
 * 获取合规性提示信息
 * 为用户提供明确的合规性指导建议
 */
const getComplianceMessage = () => {
  const rate = baseDrugRate.value

  if (rate >= 70) {
    return '基药使用率优秀，继续保持良好的用药结构'
  } else if (rate >= 60) {
    return '基药使用率达标，符合国家政策要求'
  } else if (rate >= 40) {
    return '基药使用率偏低，建议优化用药结构'
  } else {
    return '基药使用率不达标，需要紧急调整用药政策'
  }
}

/**
 * 格式化金额显示
 * 将大数字转换为更易读的格式
 */
const formatAmount = (amount: number): string => {
  return AnalysisApi.formatAmount(amount)
}

/**
 * 获取排名样式类
 * 为前三名提供特殊的视觉效果
 */
const getRankClass = (index: number): string => {
  if (index === 0) return 'rank-first'
  if (index === 1) return 'rank-second'
  if (index === 2) return 'rank-third'
  return 'rank-normal'
}

/**
 * 窗口大小变化处理
 * 确保图表在窗口大小变化时能够正确调整
 */
const handleWindowResize = () => {
  const charts = [rankingChart, baseDrugChart, supplierChart, priceChart, trendChart]
  charts.forEach(chart => {
    if (chart) {
      chart.resize()
    }
  })
}

/**
 * 销毁所有图表实例
 * 组件卸载时清理资源，避免内存泄漏
 */
const disposeAllCharts = () => {
  const charts = [rankingChart, baseDrugChart, supplierChart, priceChart, trendChart]
  charts.forEach(chart => {
    if (chart) {
      chart.dispose()
    }
  })

  window.removeEventListener('resize', handleWindowResize)
}

// ========== 表格相关方法 ==========

const handleSearch = (keyword: string) => {
  currentPage.value = 1 // 搜索时重置到第一页
}

const handleSortChange = ({ prop, order }: any) => {
  // 实现表格排序逻辑
  console.log('排序变化:', prop, order)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

const viewDrugDetails = (row: any) => {
  console.log('查看药品详情:', row)
  ElMessage.info(`查看 ${row.productName} 的详细信息`)
}

const exportChart = () => {
  ElMessage.info('图表导出功能开发中')
}

const exportTableData = () => {
  ElMessage.info('数据导出功能开发中')
}
</script>

<style scoped>
.drug-analysis-container {
  padding: 20px;
  background: #f8f9fa;
}

/* ========== 控制面板样式 ========== */
.analysis-controls {
  margin-bottom: 20px;
}

.control-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.header-icon {
  margin-right: 8px;
  color: #409eff;
}

.control-form {
  margin: 0;
}

.date-picker {
  width: 300px;
}

/* ========== 指标卡片样式 ========== */
.metrics-overview {
  margin-bottom: 20px;
}

.metric-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.metric-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  margin-right: 16px;
}

.metric-details {
  flex: 1;
}

.metric-number {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 2px;
}

.metric-description {
  font-size: 12px;
  color: #909399;
}

/* ========== 图表区域样式 ========== */
.chart-section {
  margin-bottom: 20px;
}

.detailed-charts {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.chart-icon {
  margin-right: 8px;
  color: #409eff;
}

.chart-title {
  display: flex;
  align-items: center;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-info {
  display: flex;
  align-items: center;
}

.rate-tag {
  font-weight: 600;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.small-chart {
  height: 200px;
}

/* ========== 合规性提示样式 ========== */
.compliance-tips {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.tip-item.success {
  color: #67c23a;
}

.tip-item.warning {
  color: #e6a23c;
}

.tip-item.danger {
  color: #f56c6c;
}

/* ========== 风险指示器样式 ========== */
.risk-indicator {
  margin-top: 12px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

.risk-item {
  display: flex;
  align-items: center;
  font-size: 12px;
}

.risk-label {
  color: #606266;
  margin-right: 8px;
}

/* ========== 表格区域样式 ========== */
.data-table-section {
  margin-top: 20px;
}

.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.header-title {
  display: flex;
  align-items: center;
}

.table-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 300px;
}

/* ========== 表格内容样式 ========== */
.rank-cell {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
  margin: 0 auto;
}

.rank-first {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
}

.rank-second {
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  color: #333;
}

.rank-third {
  background: linear-gradient(135deg, #cd7f32, #daa96e);
}

.rank-normal {
  background: #e4e7ed;
  color: #606266;
}

.amount-cell {
  font-weight: 600;
  color: #67c23a;
}

.progress-bar {
  margin-bottom: 4px;
}

.percentage-text {
  font-size: 12px;
  color: #606266;
}

.table-pagination {
  margin-top: 16px;
  text-align: center;
}

/* ========== 响应式设计 ========== */
@media (max-width: 1200px) {
  .detailed-charts .el-col {
    margin-bottom: 20px;
  }
}

@media (max-width: 768px) {
  .control-form {
    flex-direction: column;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .drug-analysis-container {
    padding: 12px;
  }
}
</style>
