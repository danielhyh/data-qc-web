<!-- src/views/drug/ypid/batch-match/components/MatchPreviewModal.vue -->
<template>
  <el-dialog
    v-model="visible"
    title="YPID匹配预览"
    width="900px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div v-loading="loading" class="match-preview-content">
      <!-- 待匹配药品信息 -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <span class="card-title">待匹配药品信息</span>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="院内编码">
            {{ unmatchedDrug?.hospitalDrugId || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="院内名称">
            <span class="highlight">{{ unmatchedDrug?.hospitalDrugName || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="规格">
            {{ unmatchedDrug?.specification || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="剂型">
            {{ unmatchedDrug?.dosageForm || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="生产企业" :span="2">
            {{ unmatchedDrug?.manufacturer || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="批准文号">
            {{ unmatchedDrug?.approvalNumber || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="来源表">
            {{ getTableLabel(unmatchedDrug?.sourceTable) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 匹配结果 -->
      <el-card class="result-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">匹配结果</span>
            <el-tag v-if="matchResult.confidence" :type="getConfidenceTag(matchResult.confidence)">
              置信度：{{ matchResult.confidence }}%
            </el-tag>
          </div>
        </template>

        <div v-if="matchResult.matchedYpid" class="match-success">
          <el-alert
            :title="`推荐匹配：${matchResult.matchedYpid}`"
            :type="matchResult.confidence >= 90 ? 'success' : 'warning'"
            :closable="false"
            show-icon
          >
            <template #default>
              <div class="match-detail">
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="YPID">
                    <span class="ypid-code">{{ matchResult.matchedYpid }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="药品名称">
                    {{ matchResult.matchedDrugName }}
                  </el-descriptions-item>
                  <el-descriptions-item label="匹配类型">
                    <el-tag size="small">{{ getMatchTypeLabel(matchResult.matchType) }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="匹配原因">
                    {{ matchResult.matchReason }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </template>
          </el-alert>
        </div>

        <el-empty v-else description="未找到合适的匹配项" />
      </el-card>

      <!-- 其他候选项 -->
      <el-card v-if="matchResult.suggestions?.length > 0" class="suggestions-card" shadow="never">
        <template #header>
          <span class="card-title">其他候选项</span>
        </template>

        <el-table :data="matchResult.suggestions" stripe max-height="300">
          <el-table-column type="index" width="50" />

          <el-table-column prop="ypid" label="YPID" width="150">
            <template #default="{ row }">
              <el-link type="primary" @click="handleViewDetail(row.ypid)">
                {{ row.ypid }}
              </el-link>
            </template>
          </el-table-column>

          <el-table-column prop="drugName" label="药品名称" min-width="150" show-overflow-tooltip />

          <el-table-column prop="specification" label="规格" width="100" />

          <el-table-column prop="dosageForm" label="剂型" width="80" />

          <el-table-column
            prop="manufacturer"
            label="生产企业"
            min-width="150"
            show-overflow-tooltip
          />

          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleSelectCandidate(row)">
                选择
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 匹配对比 -->
      <el-card v-if="selectedCandidate" class="comparison-card" shadow="never">
        <template #header>
          <span class="card-title">匹配对比</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="comparison-panel">
              <h4 class="panel-title">院内药品</h4>
              <div class="comparison-content">
                <div class="comparison-item">
                  <span class="label">名称：</span>
                  <span class="value">{{ unmatchedDrug?.hospitalDrugName }}</span>
                </div>
                <div class="comparison-item">
                  <span class="label">规格：</span>
                  <span class="value">{{ unmatchedDrug?.specification || '-' }}</span>
                </div>
                <div class="comparison-item">
                  <span class="label">剂型：</span>
                  <span class="value">{{ unmatchedDrug?.dosageForm || '-' }}</span>
                </div>
                <div class="comparison-item">
                  <span class="label">生产企业：</span>
                  <span class="value">{{ unmatchedDrug?.manufacturer || '-' }}</span>
                </div>
              </div>
            </div>
          </el-col>

          <el-col :span="12">
            <div class="comparison-panel">
              <h4 class="panel-title">标准药品</h4>
              <div class="comparison-content">
                <div class="comparison-item">
                  <span class="label">名称：</span>
                  <span class="value" :class="{ match: isFieldMatch('drugName') }">
                    {{ selectedCandidate.drugName }}
                  </span>
                </div>
                <div class="comparison-item">
                  <span class="label">规格：</span>
                  <span class="value" :class="{ match: isFieldMatch('specification') }">
                    {{ selectedCandidate.specification }}
                  </span>
                </div>
                <div class="comparison-item">
                  <span class="label">剂型：</span>
                  <span class="value" :class="{ match: isFieldMatch('dosageForm') }">
                    {{ selectedCandidate.dosageForm }}
                  </span>
                </div>
                <div class="comparison-item">
                  <span class="label">生产企业：</span>
                  <span class="value" :class="{ match: isFieldMatch('manufacturer') }">
                    {{ selectedCandidate.manufacturer }}
                  </span>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :disabled="!currentYpid" @click="handleConfirm">
          确认匹配
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { YpidApi, type UnmatchedDrugVO, type MatchResultVO, type YpidDrugVO } from '@/api/drug/ypid'

defineOptions({ name: 'MatchPreviewModal' })

// ========================= 属性定义 =========================

interface Props {
  modelValue: boolean
  unmatchedDrug?: UnmatchedDrugVO
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [ypid: string]
}>()

// ========================= 响应式数据 =========================

const visible = ref(false)
const loading = ref(false)
const matchResult = ref<MatchResultVO>({} as MatchResultVO)
const selectedCandidate = ref<YpidDrugVO>()

// ========================= 计算属性 =========================

const currentYpid = computed(() => {
  return selectedCandidate.value?.ypid || matchResult.value.matchedYpid
})

// ========================= 监听器 =========================

watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal
    if (newVal && props.unmatchedDrug) {
      loadMatchResult()
    }
  }
)

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// ========================= 方法 =========================

const loadMatchResult = async () => {
  if (!props.unmatchedDrug) return

  loading.value = true
  try {
    matchResult.value = await YpidApi.getMatchCandidates(props.unmatchedDrug.id)

    // 如果有高置信度的匹配结果，自动选中
    if (matchResult.value.matchedYpid && matchResult.value.confidence >= 90) {
      // 可以自动确认
    }
  } catch (error) {
    console.error('加载匹配结果失败:', error)
    ElMessage.error('加载匹配结果失败')
  } finally {
    loading.value = false
  }
}

const handleClosed = () => {
  matchResult.value = {} as MatchResultVO
  selectedCandidate.value = undefined
}

const handleViewDetail = (ypid: string) => {
  // 在新窗口中查看YPID详情
  window.open(`#/drug/ypid/search?ypid=${ypid}`, '_blank')
}

const handleSelectCandidate = (candidate: YpidDrugVO) => {
  selectedCandidate.value = candidate
}

const handleConfirm = () => {
  if (!currentYpid.value) {
    ElMessage.warning('请选择要匹配的YPID')
    return
  }

  emit('confirm', currentYpid.value)
}

const isFieldMatch = (field: string) => {
  if (!props.unmatchedDrug || !selectedCandidate.value) return false

  const unmatchedValue = props.unmatchedDrug[field]?.toLowerCase()
  const candidateValue = selectedCandidate.value[field]?.toLowerCase()

  return unmatchedValue === candidateValue
}

// ========================= 工具方法 =========================

const getTableLabel = (table?: string) => {
  if (!table) return '-'
  const tableMap = {
    catalog: '药品目录',
    inbound: '入库情况',
    outbound: '出库情况',
    usage: '使用情况'
  }
  return tableMap[table] || table
}

const getConfidenceTag = (confidence: number) => {
  if (confidence >= 90) return 'success'
  if (confidence >= 70) return 'warning'
  return 'danger'
}

const getMatchTypeLabel = (type: string) => {
  const typeMap = {
    exact: '精确匹配',
    fuzzy: '模糊匹配',
    manual: '手动匹配'
  }
  return typeMap[type] || type
}
</script>

<style scoped>
.match-preview-content {
  max-height: 600px;
  overflow-y: auto;
  padding: 0 10px;
}

.info-card,
.result-card,
.suggestions-card,
.comparison-card {
  margin-bottom: 16px;
  border-radius: 8px;
}

.info-card:last-child,
.result-card:last-child,
.suggestions-card:last-child,
.comparison-card:last-child {
  margin-bottom: 0;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.highlight {
  color: #409eff;
  font-weight: 600;
}

.ypid-code {
  font-family: monospace;
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.match-success {
  margin-top: 0;
}

.match-detail {
  margin-top: 12px;
}

.comparison-panel {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 16px;
}

.panel-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.comparison-content {
  font-size: 13px;
}

.comparison-item {
  display: flex;
  margin-bottom: 8px;
}

.comparison-item:last-child {
  margin-bottom: 0;
}

.comparison-item .label {
  flex-shrink: 0;
  width: 80px;
  color: #909399;
}

.comparison-item .value {
  flex: 1;
  color: #303133;
  word-break: break-all;
}

.comparison-item .value.match {
  color: #67c23a;
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 滚动条样式 */
.match-preview-content::-webkit-scrollbar {
  width: 6px;
}

.match-preview-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.match-preview-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.match-preview-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
