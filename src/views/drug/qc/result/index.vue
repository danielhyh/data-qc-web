<template>
  <div class="qc-result-container">
    <!-- 页面头部 -->
    <PageHeader
      title="质控结果管理"
      content="查看质控异常数据，进行数据修复和质控报告生成，确保数据质量符合要求"
    >
      <template #extra>
        <el-button type="primary" @click="generateReport">
          <el-icon><Document /></el-icon>
          生成报告
        </el-button>
        <el-button type="success" @click="batchFix" :disabled="!multipleSelection.length">
          <el-icon><Tools /></el-icon>
          批量修复
        </el-button>
        <el-button @click="handleExport" :loading="exportLoading">
          <el-icon><Download /></el-icon>
          导出结果
        </el-button>
      </template>
    </PageHeader>

    <!-- 结果统计概览 -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <ResultCard
            title="总检测记录"
            :value="resultStats.totalRecords"
            icon="Document"
            color="#409eff"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <ResultCard
            title="通过记录"
            :value="resultStats.passedRecords"
            icon="CircleCheck"
            color="#67c23a"
            :rate="resultStats.passRate"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <ResultCard
            title="异常记录"
            :value="resultStats.failedRecords"
            icon="Warning"
            color="#f56c6c"
            :rate="resultStats.failureRate"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <ResultCard
            title="已修复记录"
            :value="resultStats.fixedRecords"
            icon="Tools"
            color="#e6a23c"
            :description="`修复率: ${resultStats.fixRate}%`"
            :loading="statsLoading"
          />
        </el-col>
      </el-row>
    </div>

    <!-- 异常分布图表 -->
    <el-row :gutter="20" class="chart-section">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>规则异常分布</span>
              <el-radio-group v-model="chartPeriod" size="small" @change="loadRuleChart">
                <el-radio-button label="today">今天</el-radio-button>
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="ruleChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>表类型异常分布</span>
          </template>
          <div ref="tableChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索和过滤 -->
    <el-card class="search-card" shadow="never">
      <el-form
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        label-width="80px"
        class="search-form"
      >
        <el-form-item label="执行批次" prop="executionNo">
          <el-input
            v-model="queryParams.executionNo"
            placeholder="请输入执行批次"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="规则编码" prop="ruleCode">
          <el-select
            v-model="queryParams.ruleCode"
            placeholder="请选择规则"
            clearable
            filterable
            style="width: 200px"
          >
            <el-option
              v-for="rule in ruleOptions"
              :key="rule.value"
              :label="`${rule.value} - ${rule.label}`"
              :value="rule.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="表类型" prop="tableType">
          <el-select
            v-model="queryParams.tableType"
            placeholder="请选择表类型"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" value="" />
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.DRUG_QC_TABLE_TYPE)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="结果状态" prop="resultStatus">
          <el-select
            v-model="queryParams.resultStatus"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="全部" value="" />
            <el-option label="失败" value="1" />
            <el-option label="警告" value="2" />
          </el-select>
        </el-form-item>

        <el-form-item label="修复状态" prop="isFixed">
          <el-select
            v-model="queryParams.isFixed"
            placeholder="请选择"
            clearable
            style="width: 120px"
          >
            <el-option label="全部" value="" />
            <el-option label="已修复" :value="true" />
            <el-option label="未修复" :value="false" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetQuery">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 异常结果列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <span class="table-title">质控异常记录</span>
          <div class="table-actions">
            <el-button
              size="small"
              type="warning"
              @click="batchFix"
              :disabled="!multipleSelection.length"
            >
              <el-icon><Tools /></el-icon>
              批量修复({{ multipleSelection.length }})
            </el-button>
            <el-button size="small" @click="handleRefresh" :loading="refreshing">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="resultList"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column type="expand">
          <template #default="{ row }">
            <ResultExpandContent :result="row" />
          </template>
        </el-table-column>

        <el-table-column prop="executionNo" label="执行批次" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" @click="openExecutionDetail(row.executionId)">
              {{ row.executionNo }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column prop="ruleCode" label="规则编码" width="120" show-overflow-tooltip />

        <el-table-column prop="ruleName" label="规则名称" min-width="180" show-overflow-tooltip />

        <el-table-column prop="tableType" label="表类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">
              {{ getDictLabel(DICT_TYPE.DRUG_QC_TABLE_TYPE, row.tableType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="checkField" label="检查字段" width="120" show-overflow-tooltip />

        <el-table-column prop="fieldValue" label="字段值" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip :content="row.fieldValue" placement="top">
              <span class="field-value">{{ row.fieldValue }}</span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column prop="expectedValue" label="期望值" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip :content="row.expectedValue" placement="top">
              <span class="expected-value">{{ row.expectedValue }}</span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column prop="resultStatus" label="结果状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.resultStatus === 1 ? 'danger' : 'warning'" size="small">
              {{ row.resultStatus === 1 ? '失败' : '警告' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="isFixed" label="修复状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isFixed ? 'success' : 'info'" size="small">
              {{ row.isFixed ? '已修复' : '待修复' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="createTime"
          label="检测时间"
          width="150"
          align="center"
          sortable="custom"
          :formatter="dateFormatter"
        />

        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" link size="small" @click="viewDetail(row)">
                <el-icon><View /></el-icon>
                查看详情
              </el-button>

              <el-button
                v-if="!row.isFixed"
                type="warning"
                link
                size="small"
                @click="fixSingle(row)"
              >
                <el-icon><Tools /></el-icon>
                修复
              </el-button>

              <el-button
                v-if="row.isFixed"
                type="success"
                link
                size="small"
                @click="viewFixHistory(row)"
              >
                <el-icon><Clock /></el-icon>
                修复历史
              </el-button>

              <el-dropdown trigger="click" @command="(command) => handleMoreAction(command, row)">
                <el-button link size="small">
                  <el-icon><MoreFilled /></el-icon>
                  更多
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="viewOriginal">
                      <el-icon><DataAnalysis /></el-icon>
                      查看原始数据
                    </el-dropdown-item>
                    <el-dropdown-item command="viewSuggestion">
                      <el-icon><Promotion /></el-icon>
                      修复建议
                    </el-dropdown-item>
                    <el-dropdown-item command="ignore" v-if="!row.isFixed">
                      <el-icon><Hide /></el-icon>
                      忽略此项
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.pageNo"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleQuery"
          @current-change="handleQuery"
        />
      </div>
    </el-card>

    <!-- 结果详情弹窗 -->
    <ResultDetailModal v-model="detailVisible" :result-id="selectedResultId" />

    <!-- 数据修复弹窗 -->
    <DataFixModal v-model="fixVisible" :result-ids="fixResultIds" @success="handleFixSuccess" />

    <!-- 修复历史弹窗 -->
    <FixHistoryModal v-model="historyVisible" :result-id="selectedResultId" />

    <!-- 质控报告生成弹窗 -->
    <ReportGenerateModal v-model="reportVisible" @success="handleReportSuccess" />

    <!-- 原始数据查看弹窗 -->
    <OriginalDataModal
      v-model="originalVisible"
      :record-id="selectedRecordId"
      :table-type="selectedTableType"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  Document,
  Tools,
  Download,
  Search,
  Refresh,
  View,
  Clock,
  MoreFilled,
  DataAnalysis,
  Promotion,
  Hide
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { dateFormatter } from '@/utils/formatTime'
import {
  QcResultApi,
  type QcResultRespVO,
  type QcResultPageReqVO,
  type QcResultStatsVO
} from '@/api/drug/qc/result'
import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'

// 导入组件
import PageHeader from '@/components/PageHeader/index.vue'
import ResultCard from './components/ResultCard.vue'
import ResultExpandContent from './components/ResultExpandContent.vue'
import ResultDetailModal from './components/ResultDetailModal.vue'
import DataFixModal from './components/DataFixModal.vue'
import FixHistoryModal from './components/FixHistoryModal.vue'
import ReportGenerateModal from './components/ReportGenerateModal.vue'
import OriginalDataModal from './components/OriginalDataModal.vue'

/** 页面组件名称 */
defineOptions({ name: 'DrugQcResultManagement' })

// ========================= 响应式数据 =========================

const loading = ref(false)
const refreshing = ref(false)
const exportLoading = ref(false)
const statsLoading = ref(false)
const chartPeriod = ref('today')
const queryFormRef = ref()

/** 查询参数 */
const queryParams = reactive<QcResultPageReqVO>({
  pageNo: 1,
  pageSize: 20,
  executionNo: undefined,
  ruleCode: undefined,
  tableType: undefined,
  resultStatus: undefined,
  isFixed: undefined
})

/** 结果列表数据 */
const resultList = ref<QcResultRespVO[]>([])
const total = ref(0)
const multipleSelection = ref<QcResultRespVO[]>([])

/** 统计数据 */
const resultStats = reactive<QcResultStatsVO>({
  totalRecords: 0,
  passedRecords: 0,
  failedRecords: 0,
  warningRecords: 0,
  fixedRecords: 0,
  passRate: 0,
  failureRate: 0,
  fixRate: 0
})

/** 规则选项 */
const ruleOptions = ref<Array<{ value: string; label: string }>>([])

/** 模态框控制 */
const detailVisible = ref(false)
const fixVisible = ref(false)
const historyVisible = ref(false)
const reportVisible = ref(false)
const originalVisible = ref(false)

/** 选中数据 */
const selectedResultId = ref<number>()
const selectedRecordId = ref<number>()
const selectedTableType = ref<number>()
const fixResultIds = ref<number[]>([])

/** 图表引用 */
const ruleChartRef = ref<HTMLElement>()
const tableChartRef = ref<HTMLElement>()
let ruleChart: echarts.ECharts | null = null
let tableChart: echarts.ECharts | null = null

// ========================= 生命周期 =========================

onMounted(() => {
  initPage()
})

// ========================= 核心方法 =========================

/** 初始化页面 */
const initPage = async () => {
  await Promise.all([loadResultStats(), loadResultList(), loadRuleOptions()])

  // 等待DOM渲染完成后初始化图表
  await nextTick()
  initCharts()
}

/** 加载结果统计 */
const loadResultStats = async () => {
  statsLoading.value = true
  try {
    const data = await QcResultApi.getResultStats()
    Object.assign(resultStats, data)
  } catch (error) {
    console.error('加载结果统计失败:', error)
  } finally {
    statsLoading.value = false
  }
}

/** 加载结果列表 */
const loadResultList = async () => {
  loading.value = true
  try {
    const { list, total: totalCount } = await QcResultApi.getResultPage(queryParams)
    resultList.value = list || []
    total.value = totalCount || 0
  } catch (error) {
    ElMessage.error('加载结果列表失败')
    console.error('加载结果列表失败:', error)
  } finally {
    loading.value = false
  }
}

/** 加载规则选项 */
const loadRuleOptions = async () => {
  try {
    const data = await QcResultApi.getRuleOptions()
    ruleOptions.value = data || []
  } catch (error) {
    console.error('加载规则选项失败:', error)
  }
}

/** 搜索查询 */
const handleQuery = () => {
  queryParams.pageNo = 1
  loadResultList()
}

/** 重置查询 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  Object.assign(queryParams, {
    pageNo: 1,
    pageSize: 20,
    executionNo: undefined,
    ruleCode: undefined,
    tableType: undefined,
    resultStatus: undefined,
    isFixed: undefined
  })
  loadResultList()
}

/** 刷新页面 */
const handleRefresh = async () => {
  refreshing.value = true
  try {
    await Promise.all([loadResultStats(), loadResultList(), loadRuleChart(), loadTableChart()])
    ElMessage.success('刷新成功')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

/** 排序变化处理 */
const handleSortChange = ({ column, prop, order }) => {
  console.log('排序变化:', { column, prop, order })
  // 实现排序逻辑
}

/** 多选变化处理 */
const handleSelectionChange = (selection: QcResultRespVO[]) => {
  multipleSelection.value = selection
}

// ========================= 图表相关方法 =========================

/** 初始化图表 */
const initCharts = () => {
  if (ruleChartRef.value) {
    ruleChart = echarts.init(ruleChartRef.value)
    loadRuleChart()
  }

  if (tableChartRef.value) {
    tableChart = echarts.init(tableChartRef.value)
    loadTableChart()
  }
}

/** 加载规则分布图表 */
const loadRuleChart = async () => {
  if (!ruleChart) return

  try {
    const data = await QcResultApi.getRuleDistribution(chartPeriod.value)

    const option = {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.ruleCode),
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: '异常数量',
          type: 'bar',
          data: data.map((item) => item.count),
          itemStyle: {
            color: '#f56c6c'
          }
        }
      ]
    }

    ruleChart.setOption(option)
  } catch (error) {
    console.error('加载规则分布图表失败:', error)
  }
}

/** 加载表类型分布图表 */
const loadTableChart = async () => {
  if (!tableChart) return

  try {
    const data = await QcResultApi.getTableDistribution()

    const option = {
      tooltip: { trigger: 'item' },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          type: 'pie',
          radius: '50%',
          data: data.map((item) => ({
            name: item.tableTypeName,
            value: item.count
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    }

    tableChart.setOption(option)
  } catch (error) {
    console.error('加载表类型分布图表失败:', error)
  }
}

// ========================= 业务操作方法 =========================

/** 查看详情 */
const viewDetail = (row: QcResultRespVO) => {
  selectedResultId.value = row.id
  detailVisible.value = true
}

/** 单个修复 */
const fixSingle = (row: QcResultRespVO) => {
  fixResultIds.value = [row.id]
  fixVisible.value = true
}

/** 批量修复 */
const batchFix = () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请选择要修复的记录')
    return
  }

  fixResultIds.value = multipleSelection.value.map((item) => item.id)
  fixVisible.value = true
}

/** 修复成功处理 */
const handleFixSuccess = () => {
  ElMessage.success('数据修复成功')
  loadResultList()
  loadResultStats()
}

/** 查看修复历史 */
const viewFixHistory = (row: QcResultRespVO) => {
  selectedResultId.value = row.id
  historyVisible.value = true
}

/** 生成报告 */
const generateReport = () => {
  reportVisible.value = true
}

/** 报告生成成功 */
const handleReportSuccess = () => {
  ElNotification.success({
    title: '报告生成成功',
    message: '质控报告已生成并下载',
    duration: 3000
  })
}

/** 打开执行详情 */
const openExecutionDetail = (executionId: number) => {
  // 跳转到执行监控页面
  window.open(`/drug-qc/execution?executionId=${executionId}`, '_blank')
}

/** 更多操作处理 */
const handleMoreAction = async (command: string, row: QcResultRespVO) => {
  selectedResultId.value = row.id
  selectedRecordId.value = row.recordId
  selectedTableType.value = row.tableType

  switch (command) {
    case 'viewOriginal':
      originalVisible.value = true
      break
    case 'viewSuggestion':
      await showFixSuggestion(row)
      break
    case 'ignore':
      await ignoreResult(row)
      break
  }
}

/** 显示修复建议 */
const showFixSuggestion = async (row: QcResultRespVO) => {
  try {
    const suggestion = await QcResultApi.getFixSuggestion(row.id)
    ElMessageBox.alert(suggestion, '修复建议', {
      confirmButtonText: '知道了',
      type: 'info'
    })
  } catch (error) {
    ElMessage.error('获取修复建议失败')
  }
}

/** 忽略结果 */
const ignoreResult = async (row: QcResultRespVO) => {
  try {
    await ElMessageBox.confirm('确认忽略该异常记录？忽略后将不再显示在待修复列表中。', '确认忽略', {
      type: 'warning'
    })

    await QcResultApi.ignoreResult(row.id)
    ElMessage.success('已忽略该异常记录')
    loadResultList()
    loadResultStats()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('忽略操作失败')
    }
  }
}

/** 导出数据 */
const handleExport = async () => {
  try {
    await ElMessageBox.confirm('确认导出当前查询条件下的结果数据？', '确认导出', {
      type: 'warning'
    })

    exportLoading.value = true
    await QcResultApi.exportResultList(queryParams)
    ElMessage.success('导出成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('导出失败')
    }
  } finally {
    exportLoading.value = false
  }
}
</script>

<style scoped>
.qc-result-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.stats-overview {
  margin-bottom: 20px;
}

.chart-section {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.search-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.search-form {
  margin-bottom: 0;
}

.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.field-value {
  max-width: 140px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #f56c6c;
  font-weight: 500;
}

.expected-value {
  max-width: 140px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #67c23a;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: end;
  margin-top: 20px;
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .qc-result-container {
    padding: 10px;
  }

  .chart-section .el-col {
    margin-bottom: 20px;
  }

  .search-form :deep(.el-form-item) {
    width: 100%;
    margin-right: 0;
  }

  .table-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}

:deep(.el-table .el-table__expand-icon) {
  color: #409eff;
}

:deep(.el-table .el-table__expanded-cell) {
  background-color: #f8f9fa;
  padding: 20px;
}

/* 标签样式 */
:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
}

/* 卡片样式 */
:deep(.el-card) {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

:deep(.el-card__header) {
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
}
</style>
