<template>
  <el-dialog
    v-model="dialogVisible"
    title="质控报告"
    width="90%"
    :close-on-click-modal="false"
    destroy-on-close
    class="qc-report-dialog"
  >
    <div v-loading="loading" class="qc-report-content">
      <!-- 质量评分卡片 -->
      <div class="score-card" v-if="summary">
        <div class="score-main">
          <div class="score-circle" :class="getScoreClass(summary.qualityScore)">
            <span class="score-value">{{ summary.qualityScore?.toFixed(1) || 0 }}</span>
            <span class="score-label">质量评分</span>
          </div>
          <div class="score-level">
            <el-tag :type="getLevelTagType(summary.qualityLevel)" size="large">
              {{ summary.qualityLevel || '未知' }}
            </el-tag>
          </div>
        </div>
        <div class="score-dimensions" v-if="summary.dimensions">
          <div class="dimension-item">
            <span class="dim-label">完整性</span>
            <el-progress :percentage="summary.dimensions.completeness || 0" :stroke-width="8" />
          </div>
          <div class="dimension-item">
            <span class="dim-label">准确性</span>
            <el-progress :percentage="summary.dimensions.accuracy || 0" :stroke-width="8" />
          </div>
          <div class="dimension-item">
            <span class="dim-label">一致性</span>
            <el-progress :percentage="summary.dimensions.consistency || 0" :stroke-width="8" />
          </div>
        </div>
      </div>

      <!-- 统计概览 -->
      <el-row :gutter="16" class="stats-row" v-if="summary">
        <el-col :span="8">
          <div class="stat-card">
            <div class="stat-header">
              <el-icon><Document /></el-icon>
              <span>文件统计</span>
            </div>
            <div class="stat-body">
              <div class="stat-item">
                <span>总文件</span>
                <span class="value">{{ summary.totalFiles || 0 }}</span>
              </div>
              <div class="stat-item success">
                <span>成功</span>
                <span class="value">{{ summary.successFiles || 0 }}</span>
              </div>
              <div class="stat-item warning" v-if="summary.warningFiles > 0">
                <span>警告</span>
                <span class="value">{{ summary.warningFiles }}</span>
              </div>
              <div class="stat-item error" v-if="summary.failedFiles > 0">
                <span>失败</span>
                <span class="value">{{ summary.failedFiles }}</span>
              </div>
              <div class="stat-rate">
                通过率: {{ (summary.filePassRate || 0).toFixed(1) }}%
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-card">
            <div class="stat-header">
              <el-icon><List /></el-icon>
              <span>记录统计</span>
            </div>
            <div class="stat-body">
              <div class="stat-item">
                <span>总记录</span>
                <span class="value">{{ formatNumber(summary.totalRecords) }}</span>
              </div>
              <div class="stat-item success">
                <span>成功</span>
                <span class="value">{{ formatNumber(summary.successRecords) }}</span>
              </div>
              <div class="stat-item error" v-if="summary.errorRecords > 0">
                <span>错误</span>
                <span class="value">{{ formatNumber(summary.errorRecords) }}</span>
              </div>
              <div class="stat-rate">
                通过率: {{ (summary.recordPassRate || 0).toFixed(1) }}%
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-card">
            <div class="stat-header">
              <el-icon><SetUp /></el-icon>
              <span>规则统计</span>
            </div>
            <div class="stat-body">
              <div class="stat-item">
                <span>总规则</span>
                <span class="value">{{ summary.totalRules || 0 }}</span>
              </div>
              <div class="stat-item success">
                <span>通过</span>
                <span class="value">{{ summary.passedRules || 0 }}</span>
              </div>
              <div class="stat-item error" v-if="summary.failedRules > 0">
                <span>失败</span>
                <span class="value">{{ summary.failedRules }}</span>
              </div>
              <div class="stat-rate">
                通过率: {{ (summary.rulePassRate || 0).toFixed(1) }}%
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 分表结果 -->
      <div class="section-title">
        <el-icon><Grid /></el-icon>
        <span>分表质控结果</span>
      </div>
      <el-table :data="tableResults" border stripe class="table-results">
        <el-table-column prop="tableName" label="数据表" width="150" />
        <el-table-column prop="checkedCount" label="检查记录" align="right" width="120">
          <template #default="{ row }">{{ formatNumber(row.checkedCount) }}</template>
        </el-table-column>
        <el-table-column prop="errorCount" label="错误数" align="right" width="100">
          <template #default="{ row }">
            <span :class="row.errorCount > 0 ? 'error-text' : ''">{{ row.errorCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="warningCount" label="警告数" align="right" width="100">
          <template #default="{ row }">
            <span :class="row.warningCount > 0 ? 'warning-text' : ''">{{ row.warningCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="passRate" label="通过率" align="right" width="100">
          <template #default="{ row }">
            <span :class="getPassRateClass(row.passRate)">{{ row.passRate?.toFixed(1) }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="qcStatus" label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="getQcStatusType(row.qcStatus)" size="small">
              {{ getQcStatusText(row.qcStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="120">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewTableErrors(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 规则执行明细 -->
      <div class="section-title">
        <el-icon><Tickets /></el-icon>
        <span>规则执行明细</span>
        <el-select v-model="selectedTableType" placeholder="筛选表类型" clearable size="small" style="margin-left: 16px; width: 150px;">
          <el-option label="全部" value="" />
          <el-option label="医疗机构" value="hospital" />
          <el-option label="药品目录" value="catalog" />
          <el-option label="入库数据" value="inbound" />
          <el-option label="出库数据" value="outbound" />
          <el-option label="使用数据" value="usage" />
        </el-select>
      </div>
      <el-table :data="filteredRuleDetails" border stripe max-height="400" class="rule-details">
        <el-table-column prop="ruleCode" label="规则编码" width="120" />
        <el-table-column prop="ruleName" label="规则名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="tableName" label="数据表" width="100" />
        <el-table-column prop="checkedCount" label="检查数" align="right" width="100">
          <template #default="{ row }">{{ formatNumber(row.checkedCount) }}</template>
        </el-table-column>
        <el-table-column prop="errorCount" label="错误数" align="right" width="80">
          <template #default="{ row }">
            <span :class="row.errorCount > 0 ? 'error-text' : ''">{{ row.errorCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="passRate" label="通过率" align="right" width="80">
          <template #default="{ row }">{{ row.passRate?.toFixed(1) }}%</template>
        </el-table-column>
        <el-table-column prop="fixSuggestion" label="修复建议" min-width="200" show-overflow-tooltip />
      </el-table>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <span class="qc-time" v-if="summary">
          质控时间: {{ formatDateTime(summary.qcTime) }} | 耗时: {{ formatDuration(summary.duration) }}
        </span>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Document, List, SetUp, Grid, Tickets } from '@element-plus/icons-vue'
import { ReportDataApi, QcReportSummaryVO, QcTableResultVO, QcRuleDetailVO } from '@/api/drug/reportdata/index'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  taskId: { type: Number, required: true }
})

const emit = defineEmits(['update:modelValue', 'viewErrors'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const summary = ref<QcReportSummaryVO | null>(null)
const tableResults = ref<QcTableResultVO[]>([])
const ruleDetails = ref<QcRuleDetailVO[]>([])
const selectedTableType = ref('')

const filteredRuleDetails = computed(() => {
  if (!selectedTableType.value) return ruleDetails.value
  return ruleDetails.value.filter(r => r.tableType === selectedTableType.value)
})

// 加载数据
const loadData = async () => {
  if (!props.taskId) return
  loading.value = true
  try {
    const [summaryRes, tableRes, ruleRes] = await Promise.all([
      ReportDataApi.getQcReportSummary(props.taskId),
      ReportDataApi.getQcTableResults(props.taskId),
      ReportDataApi.getQcRuleDetails(props.taskId)
    ])
    summary.value = summaryRes
    tableResults.value = tableRes || []
    ruleDetails.value = ruleRes || []
  } catch (error) {
    console.error('加载质控报告失败:', error)
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, (val) => {
  if (val) loadData()
})

// 工具函数
const formatNumber = (num: number) => num?.toLocaleString() || '0'
const formatDateTime = (date: string) => date ? new Date(date).toLocaleString('zh-CN') : ''
const formatDuration = (seconds: number) => {
  if (!seconds) return '0秒'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
}

const getScoreClass = (score: number) => {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 60) return 'fair'
  return 'poor'
}

const getLevelTagType = (level: string) => {
  const map: Record<string, string> = { '优秀': 'success', '良好': '', '一般': 'warning', '较差': 'danger' }
  return map[level] || 'info'
}

const getPassRateClass = (rate: number) => {
  if (rate >= 95) return 'success-text'
  if (rate >= 80) return ''
  return 'error-text'
}

const getQcStatusType = (status: number) => {
  const map: Record<number, string> = { 0: 'success', 1: 'danger', 2: 'warning' }
  return map[status] || 'info'
}

const getQcStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '通过', 1: '失败', 2: '警告' }
  return map[status] || '未知'
}

const viewTableErrors = (row: QcTableResultVO) => {
  emit('viewErrors', row.tableType)
}
</script>

<style scoped>
.qc-report-dialog :deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
}

.qc-report-content {
  padding: 0 8px;
}

/* 评分卡片 */
.score-card {
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin-bottom: 20px;
  color: white;
}

.score-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.2);
  border: 3px solid white;
}

.score-circle.excellent { background: rgba(103, 194, 58, 0.3); }
.score-circle.good { background: rgba(64, 158, 255, 0.3); }
.score-circle.fair { background: rgba(230, 162, 60, 0.3); }
.score-circle.poor { background: rgba(245, 108, 108, 0.3); }

.score-value {
  font-size: 32px;
  font-weight: 700;
}

.score-label {
  font-size: 12px;
  opacity: 0.9;
}

.score-dimensions {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dimension-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dim-label {
  width: 60px;
  font-size: 14px;
}

.dimension-item :deep(.el-progress) {
  flex: 1;
}

.dimension-item :deep(.el-progress__text) {
  color: white;
}

/* 统计卡片 */
.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  height: 100%;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #606266;
}

.stat-item .value {
  font-weight: 600;
  color: #303133;
}

.stat-item.success .value { color: #67c23a; }
.stat-item.warning .value { color: #e6a23c; }
.stat-item.error .value { color: #f56c6c; }

.stat-rate {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e4e7ed;
  font-size: 12px;
  color: #909399;
  text-align: right;
}

/* 区块标题 */
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 20px 0 12px;
}

/* 表格 */
.table-results, .rule-details {
  margin-bottom: 16px;
}

.error-text { color: #f56c6c; font-weight: 600; }
.warning-text { color: #e6a23c; font-weight: 600; }
.success-text { color: #67c23a; }

/* 底部 */
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.qc-time {
  font-size: 13px;
  color: #909399;
}
</style>
