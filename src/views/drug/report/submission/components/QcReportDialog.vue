<template>
  <Dialog
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
            <div class="dim-label-wrapper">
              <span class="dim-label">完整性</span>
              <el-tooltip placement="top" effect="light" :show-after="200">
                <template #content>
                  <div class="tooltip-content">
                    <div class="tooltip-title">完整性计算方法</div>
                    <div class="tooltip-formula">完整性 = 记录通过率</div>
                    <div class="tooltip-desc">
                      <div>记录通过率 = (总记录数 - 错误记录数) / 总记录数 × 100%</div>
                      <div class="tooltip-note">反映数据的完整程度，错误越少完整性越高</div>
                    </div>
                  </div>
                </template>
                <el-icon class="info-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
            <el-progress :percentage="summary.dimensions.completeness || 0" :stroke-width="8" />
          </div>
          <div class="dimension-item">
            <div class="dim-label-wrapper">
              <span class="dim-label">准确性</span>
              <el-tooltip placement="top" effect="light" :show-after="200">
                <template #content>
                  <div class="tooltip-content">
                    <div class="tooltip-title">准确性计算方法</div>
                    <div class="tooltip-formula">准确性 = 规则通过率</div>
                    <div class="tooltip-desc">
                      <div>规则通过率 = 通过规则数 / 总规则数 × 100%</div>
                      <div class="tooltip-note">反映数据符合质控规则的程度，通过规则越多准确性越高</div>
                    </div>
                  </div>
                </template>
                <el-icon class="info-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
            <el-progress :percentage="summary.dimensions.accuracy || 0" :stroke-width="8" />
          </div>
          <div class="dimension-item">
            <div class="dim-label-wrapper">
              <span class="dim-label">一致性</span>
              <el-tooltip placement="top" effect="light" :show-after="200">
                <template #content>
                  <div class="tooltip-content">
                    <div class="tooltip-title">一致性计算方法</div>
                    <div class="tooltip-formula">一致性 = 质量综合评分</div>
                    <div class="tooltip-desc">
                      <div>质量评分 = 记录通过率 × 70% + 规则通过率 × 30%</div>
                      <div class="tooltip-note">综合评估数据质量，兼顾完整性和准确性</div>
                    </div>
                  </div>
                </template>
                <el-icon class="info-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
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
              <div class="stat-rate"> 通过率: {{ (summary.filePassRate || 0).toFixed(1) }}% </div>
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
              <div class="stat-rate"> 通过率: {{ (summary.recordPassRate || 0).toFixed(1) }}% </div>
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
              <div class="stat-rate"> 通过率: {{ (summary.rulePassRate || 0).toFixed(1) }}% </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 规则执行明细 -->
      <div class="section-title">
        <el-icon><Tickets /></el-icon>
        <span>规则执行明细</span>
      </div>
      
      <!-- Tab切换 -->
      <el-tabs v-model="activeTableTab" class="rule-tabs">
        <el-tab-pane label="全部" name="all">
          <el-badge :value="ruleDetails.length" :max="999" class="tab-badge" />
        </el-tab-pane>
        <el-tab-pane label="医疗机构" name="hospital">
          <el-badge :value="getRuleCountByTable('hospital')" :max="999" class="tab-badge" />
        </el-tab-pane>
        <el-tab-pane label="药品目录" name="catalog">
          <el-badge :value="getRuleCountByTable('catalog')" :max="999" class="tab-badge" />
        </el-tab-pane>
        <el-tab-pane label="入库数据" name="inbound">
          <el-badge :value="getRuleCountByTable('inbound')" :max="999" class="tab-badge" />
        </el-tab-pane>
        <el-tab-pane label="出库数据" name="outbound">
          <el-badge :value="getRuleCountByTable('outbound')" :max="999" class="tab-badge" />
        </el-tab-pane>
        <el-tab-pane label="使用数据" name="usage">
          <el-badge :value="getRuleCountByTable('usage')" :max="999" class="tab-badge" />
        </el-tab-pane>
      </el-tabs>
      
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
        <el-table-column prop="warningCount" label="警告数" align="right" width="80">
          <template #default="{ row }">
            <span :class="row.warningCount > 0 ? 'warning-text' : ''">{{ row.warningCount || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="passRate" label="通过率" align="right" width="80">
          <template #default="{ row }">{{ row.passRate?.toFixed(1) }}%</template>
        </el-table-column>
        <el-table-column
          prop="fixSuggestion"
          label="修复建议"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column label="操作" align="center" width="180" fixed="right">
          <template #default="{ row }">
            <!-- 有错误时显示查看错误按钮 -->
            <el-button
              v-if="row.errorCount > 0"
              type="danger"
              link
              size="small"
              @click="viewRuleErrors(row, 1)"
            >
              <el-icon><Warning /></el-icon>
              查看错误
            </el-button>
            <!-- 有警告时显示查看警告按钮 -->
            <el-button
              v-if="row.warningCount > 0"
              type="warning"
              link
              size="small"
              @click="viewRuleErrors(row, 2)"
            >
              <el-icon><Warning /></el-icon>
              查看警告
            </el-button>
            <!-- 都没有时显示无问题 -->
            <span v-if="!row.errorCount && !row.warningCount" class="text-success">
              <el-icon><CircleCheckFilled /></el-icon>
              无问题
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <span class="qc-time" v-if="summary">
          质控时间: {{ formatDateTime(summary.qcTime) }} | 耗时:
          {{ formatDuration(summary.duration) }}
        </span>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Document, Grid, List, SetUp, Tickets, QuestionFilled, Warning, CircleCheckFilled } from '@element-plus/icons-vue'
import {
  QcReportSummaryVO,
  QcRuleDetailVO,
  QcTableResultVO,
  ReportDataApi
} from '@/api/drug/reportdata/index'

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
const activeTableTab = ref('all')

const filteredRuleDetails = computed(() => {
  if (activeTableTab.value === 'all') return ruleDetails.value
  return ruleDetails.value.filter((r) => r.tableType === activeTableTab.value)
})

// 获取指定表类型的规则数量
const getRuleCountByTable = (tableType: string) => {
  return ruleDetails.value.filter((r) => r.tableType === tableType).length
}

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

watch(
  () => props.modelValue,
  (val) => {
    if (val) loadData()
  }
)

// 工具函数
const formatNumber = (num: number) => num?.toLocaleString() || '0'
const formatDateTime = (date: string) => (date ? new Date(date).toLocaleString('zh-CN') : '')
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
  const map: Record<string, string> = { 优秀: 'success', 良好: '', 一般: 'warning', 较差: 'danger' }
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

const viewRuleErrors = (row: QcRuleDetailVO, errorType: number) => {
  // errorType: 1=错误, 2=警告
  // 调用父组件的viewErrors方法，传递表类型和错误类型
  emit('viewErrors', row.tableType, errorType)
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
  background: rgba(255, 255, 255, 0.2);
  border: 3px solid white;
}

.score-circle.excellent {
  background: rgba(103, 194, 58, 0.3);
}
.score-circle.good {
  background: rgba(64, 158, 255, 0.3);
}
.score-circle.fair {
  background: rgba(230, 162, 60, 0.3);
}
.score-circle.poor {
  background: rgba(245, 108, 108, 0.3);
}

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

.dim-label-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 80px;
}

.dim-label {
  font-size: 14px;
}

.info-icon {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  cursor: help;
  transition: all 0.2s;
}

.info-icon:hover {
  color: white;
  transform: scale(1.15);
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

.stat-item.success .value {
  color: #67c23a;
}
.stat-item.warning .value {
  color: #e6a23c;
}
.stat-item.error .value {
  color: #f56c6c;
}

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

/* Tab样式 */
.rule-tabs {
  margin-bottom: 16px;
}

.rule-tabs :deep(.el-tabs__item) {
  font-size: 14px;
  padding: 0 16px;
}

.rule-tabs :deep(.el-badge) {
  margin-left: 6px;
}

.rule-tabs :deep(.el-badge__content) {
  background-color: #409eff;
  border: none;
  font-size: 11px;
  height: 16px;
  line-height: 16px;
  padding: 0 5px;
}

/* 表格 */
.table-results,
.rule-details {
  margin-bottom: 16px;
}

.text-success {
  color: #67c23a;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.error-text {
  color: #f56c6c;
  font-weight: 600;
}
.warning-text {
  color: #e6a23c;
  font-weight: 600;
}
.success-text {
  color: #67c23a;
}

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

/* Tooltip 样式 */
.tooltip-content {
  max-width: 350px;
  padding: 4px;
}

.tooltip-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e4e7ed;
}

.tooltip-formula {
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
  background: #ecf5ff;
  padding: 6px 10px;
  border-radius: 4px;
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
}

.tooltip-desc {
  font-size: 12px;
  color: #606266;
  line-height: 1.6;
}

.tooltip-desc > div {
  margin-bottom: 4px;
}

.tooltip-note {
  color: #909399;
  font-style: italic;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #e4e7ed;
}
</style>
