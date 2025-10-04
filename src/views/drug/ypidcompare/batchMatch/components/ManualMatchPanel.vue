<template>
  <div class="manual-match-panel">
    <!-- 待匹配药品信息 -->
    <el-card class="drug-info-card" shadow="never">
      <template #header>
        <div class="card-header flex-start">
          <el-icon class="header-icon">
            <Coin />
          </el-icon>
          <span class="header-title ml5">待匹配药品信息</span>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="院内编码">
          {{ pendingData.hospitalDrugCode }}
        </el-descriptions-item>
        <el-descriptions-item label="产品名称">
          {{ pendingData.productName }}
        </el-descriptions-item>
        <el-descriptions-item label="通用名">
          {{ pendingData.genericName }}
        </el-descriptions-item>
        <el-descriptions-item label="规格">
          {{ pendingData.spec }}
        </el-descriptions-item>
        <el-descriptions-item label="剂型">
          {{ pendingData.dosageForm }}
        </el-descriptions-item>
        <el-descriptions-item label="生产企业">
          {{ pendingData.manufacturer }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 候选匹配项 -->
    <el-card class="candidates-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="flex-row-start">
            <el-icon class="header-icon">
              <Search />
            </el-icon>
            <span class="header-title ml5">推荐匹配项</span>
          </span>
          <el-button size="small" @click="searchInStandard" :loading="searchLoading">
            <el-icon><Search /></el-icon>
            <span class="ml5">在标准库中搜索</span>
          </el-button>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div v-if="showSearchForm" class="search-form">
        <el-form :model="searchForm" inline>
          <el-form-item label="药品名称">
            <el-input
              v-model="searchForm.productName"
              placeholder="请输入药品名称"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="生产企业">
            <el-input
              v-model="searchForm.manufacturerName"
              placeholder="请输入生产企业"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="performSearch" :loading="searchLoading">
              搜索
            </el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 候选项列表 -->
      <el-table
        ref="tableRef"
        :data="candidates"
        v-loading="candidatesLoading"
        highlight-current-row
        @current-change="handleCandidateSelect"
        :current-row-key="selectedCandidateId"
        row-key="ypid"
        max-height="400"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="ypid" label="YPID" width="140" />
        <el-table-column prop="productName" label="药品名称" min-width="180" show-overflow-tooltip />
        <el-table-column
          prop="manufacturerName"
          label="生产企业"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column prop="specification" label="规格" width="100" />
        <el-table-column label="匹配度" width="100">
          <template #default="{ row }">
            <el-progress
              v-if="row.matchScore"
              :percentage="row.matchScore"
              :color="getScoreColor(row.matchScore)"
              :stroke-width="6"
              :show-text="false"
            />
            <span class="score-text">{{ row.matchScore }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="选择" width="60" align="center">
          <template #default="{ row }">
            <el-radio
              v-model="selectedCandidateId"
              :value="row.ypid"
              @change="handleRadioSelect(row)"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button size="large" @click="$emit('cancel')"> 取消 </el-button>
      <el-button type="primary" size="large" @click="confirmMatch" :disabled="!selectedCandidate">
        确认匹配
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Coin, Search } from '@element-plus/icons-vue'
import { YpidApi } from '@/api/drug/ypid'

defineOptions({ name: 'ManualMatchPanel' })

interface Props {
  pendingData: any
  taskId: number
  recommendedCandidates?: any[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

// 状态变量
const candidatesLoading = ref(false)
const searchLoading = ref(false)
const showSearchForm = ref(false)
const selectedCandidate = ref<any>(null)
const selectedCandidateId = ref<string>('')
const tableRef = ref()

// 候选项数据
const candidates = ref<any[]>([])

// 搜索表单
const searchForm = reactive({
  productName: '',
  manufacturerName: ''
})

// 生命周期
onMounted(() => {
  loadCandidates()
})

// 监听推荐数据的变化
watch(
  () => props.recommendedCandidates,
  (newCandidates) => {
    if (newCandidates && newCandidates.length > 0) {
      candidates.value = newCandidates
      candidatesLoading.value = false
    }
  },
  { immediate: true, deep: true }
)

// 加载推荐候选项
const loadCandidates = async () => {
  candidatesLoading.value = true
  // 重置选择状态
  selectedCandidate.value = null
  selectedCandidateId.value = ''

  try {
    // 优先使用后端传递的推荐匹配项数据
    if (props.recommendedCandidates && props.recommendedCandidates.length > 0) {
      candidates.value = props.recommendedCandidates
      candidatesLoading.value = false
      return
    }

    // 其次尝试从 match_detail 字段中获取候选项
    if (props.pendingData.matchDetail) {
      const matchDetail = typeof props.pendingData.matchDetail === 'string'
        ? JSON.parse(props.pendingData.matchDetail)
        : props.pendingData.matchDetail

      if (matchDetail.candidates && matchDetail.candidates.length > 0) {
        // 为候选项添加详细信息（示例数据）
        candidates.value = matchDetail.candidates.map((candidate, index) => ({
          ypid: candidate.ypid,
          matchScore: candidate.score,
          productName: `阿司匹林肠溶片 ${index + 1}`,
          manufacturerName: `某某制药有限公司 ${index + 1}`,
          specification: '100mg×30片',
          dosageForm: '片剂',
          approvalNo: `国药准字H${candidate.ypid.slice(-8)}`
        }))
        candidatesLoading.value = false
        return
      }
    }

    // 如果都没有数据，使用空数组
    candidates.value = []
  } catch (error) {
    ElMessage.error('加载候选项失败')
    candidates.value = []
  } finally {
    candidatesLoading.value = false
  }
}

// 在标准库中搜索
const searchInStandard = () => {
  showSearchForm.value = !showSearchForm.value
  if (showSearchForm.value) {
    // 预填充搜索条件
    searchForm.productName = props.pendingData.productName
    searchForm.manufacturerName = props.pendingData.manufacturerName
  }
}

// 执行搜索
const performSearch = async () => {
  searchLoading.value = true
  try {
    const result = await YpidApi.searchStandard({
      productName: searchForm.productName,
      manufacturerName: searchForm.manufacturerName,
      pageNo: 1,
      pageSize: 20
    })
    candidates.value = result.list || []
  } catch (error) {
    ElMessage.error('搜索失败')
  } finally {
    searchLoading.value = false
  }
}

// 重置搜索
const resetSearch = () => {
  searchForm.productName = ''
  searchForm.manufacturerName = ''
  // 重置选择状态
  selectedCandidate.value = null
  selectedCandidateId.value = ''
  loadCandidates()
}

// 处理候选项选择（点击表格行）
const handleCandidateSelect = (row: any) => {
  selectedCandidate.value = row
  selectedCandidateId.value = row.ypid
}

// 选择候选项（点击单选按钮）
const selectCandidate = (candidate: any) => {
  selectedCandidate.value = candidate
  selectedCandidateId.value = candidate.ypid
}

// 处理单选按钮选择
const handleRadioSelect = (row: any) => {
  selectedCandidate.value = row
  // 使用表格的setCurrentRow方法来高亮显示选中行
  if (tableRef.value) {
    tableRef.value.setCurrentRow(row)
  }
}

// 确认匹配
const confirmMatch = async () => {
  if (!selectedCandidate.value) {
    ElMessage.warning('请选择一个匹配项')
    return
  }

  try {
    await YpidApi.getManualMatchConfirm({
      id: selectedCandidate.value.id,
      ypid:selectedCandidate.value.ypid,
      pendingId: selectedCandidate.value.pendingId,
      taskId: selectedCandidate.value.taskId,
      beforeYpid: selectedCandidate.value.beforeYpid,
      matchScore: selectedCandidate.value.matchScore,
      productName: selectedCandidate.value.productName,
      manufacturerName: selectedCandidate.value.manufacturerName,
      approvalNumber: selectedCandidate.value.approvalNumber,
      genericNameCn: selectedCandidate.value.genericNameCn,
      dosageForm: selectedCandidate.value.dosageForm,
      specification: selectedCandidate.value.specification,
      conversionFactor: selectedCandidate.value.conversionFactor,
      packagingMaterial: selectedCandidate.value.packagingMaterial,
      versionId: selectedCandidate.value.versionId,
      relationId: selectedCandidate.value.relationId,
      beforeRelationId: selectedCandidate.value.beforeRelationId
    })
    ElMessage.success('确认匹配成功')
    emit('confirm')
  } catch (error) {
    ElMessage.error('确认匹配失败')
  }
}

// 获取分数颜色
const getScoreColor = (score: number) => {
  if (score >= 90) return '#67c23a'
  if (score >= 70) return '#e6a23c'
  return '#f56c6c'
}
</script>

<style scoped>
.manual-match-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.drug-info-card,
.candidates-card {
  margin-bottom: 0;
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

.search-form {
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 6px;
}

.score-text {
  margin-left: 8px;
  font-size: 12px;
  color: #606266;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 0 10px;
  border-top: 1px solid #e4e7ed;
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
</style>
