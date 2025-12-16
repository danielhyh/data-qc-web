<template>
  <div class="manual-match-panel">
    <!-- 待匹配药品信息 -->
    <el-card class="drug-info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon">
            <Coin />
          </el-icon>
          <span class="header-title">待匹配药品信息</span>
        </div>
      </template>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="院内编码" label-align="left">
          {{ pendingData.hospitalDrugCode }}
        </el-descriptions-item>
        <el-descriptions-item label="产品名称" label-align="left">
          {{ pendingData.productName }}
        </el-descriptions-item>
        <el-descriptions-item label="通用名" label-align="left">
          {{ pendingData.genericName }}
        </el-descriptions-item>
        <el-descriptions-item label="规格" label-align="left">
          {{ pendingData.spec }}
        </el-descriptions-item>
        <el-descriptions-item label="剂型" label-align="left">
          {{ pendingData.dosageForm }}
        </el-descriptions-item>
        <el-descriptions-item label="生产企业" label-align="left">
          {{ pendingData.manufacturer }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 候选匹配项 -->
    <el-card class="candidates-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon">
            <Search />
          </el-icon>
          <span class="header-title">推荐匹配项</span>
          <el-button size="small" @click="searchInStandard" :loading="searchLoading">
            <el-icon><Search /></el-icon>
            在标准库中搜索
          </el-button>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div v-if="showSearchForm" class="search-form">
        <el-form :model="searchForm" inline>
          <el-form-item label="药品名称">
            <el-input
              v-model="searchForm.drugName"
              placeholder="药品名称"
              clearable
              style="width: 150px"
            />
          </el-form-item>
          <el-form-item label="生产企业">
            <el-input
              v-model="searchForm.manufacturer"
              placeholder="生产企业"
              clearable
              style="width: 150px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="performSearch" :loading="searchLoading" size="small">
              搜索
            </el-button>
            <el-button @click="resetSearch" size="small">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 候选项列表 -->
      <el-table
        :data="candidates"
        v-loading="candidatesLoading"
        highlight-current-row
        @current-change="handleCandidateSelect"
        max-height="300"
        size="small"
      >
        <el-table-column type="index" label="序号" width="50" />
        <el-table-column prop="ypid" label="YPID" width="120" />
        <el-table-column prop="drugName" label="药品名称" min-width="150" show-overflow-tooltip />
        <el-table-column
          prop="manufacturer"
          label="生产企业"
          min-width="120"
          show-overflow-tooltip
        />
        <el-table-column prop="spec" label="规格" width="80" />
        <el-table-column label="匹配度" width="80">
          <template #default="{ row }">
            <el-progress
              v-if="row.matchScore"
              :percentage="row.matchScore"
              :color="getScoreColor(row.matchScore)"
              :stroke-width="5"
              :show-text="false"
            />
            <span class="score-text">{{ row.matchScore }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="70">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="selectCandidate(row)"> 选择 </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button @click="$emit('cancel')"> 取消 </el-button>
      <el-button type="primary" @click="confirmMatch" :disabled="!selectedCandidate">
        确认匹配
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Coin, Search } from '@element-plus/icons-vue'
import { YpidApi } from '@/api/drug/ypid'

defineOptions({ name: 'ManualMatchPanel' })

interface Props {
  pendingData: any
  taskId: number
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

// 候选项数据
const candidates = ref<any[]>([])

// 搜索表单
const searchForm = reactive({
  drugName: '',
  manufacturer: ''
})

// 生命周期
onMounted(() => {
  loadCandidates()
})

// 加载推荐候选项
const loadCandidates = async () => {
  candidatesLoading.value = true
  try {
    // 先尝试从 match_detail 字段中获取候选项
    if (props.pendingData.matchDetail) {
      const matchDetail = typeof props.pendingData.matchDetail === 'string' 
        ? JSON.parse(props.pendingData.matchDetail) 
        : props.pendingData.matchDetail
      
      if (matchDetail.candidates && matchDetail.candidates.length > 0) {
        // 为候选项添加详细信息（示例数据）
        candidates.value = matchDetail.candidates.map((candidate, index) => ({
          ypid: candidate.ypid,
          matchScore: candidate.score,
          drugName: `阿司匹林肠溶片 ${index + 1}`,
          manufacturer: `某某制药有限公司 ${index + 1}`,
          spec: '100mg×30片',
          dosageForm: '片剂',
          approvalNo: `国药准字H${candidate.ypid.slice(-8)}`
        }))
        candidatesLoading.value = false
        return
      }
    }

    // 如果 match_detail 中没有数据，使用示例数据
    candidates.value = [
      {
        ypid: '12345678901234',
        matchScore: 95.5,
        drugName: '阿司匹林肠溶片(拜耳)',
        manufacturer: '拜耳医药保健有限公司',
        spec: '100mg×30片',
        dosageForm: '片剂',
        approvalNo: 'H20160647'
      },
      {
        ypid: '12345678901235',
        matchScore: 88.2,
        drugName: '阿司匹林肠溶片(安徽)',
        manufacturer: '安徽某某制药有限公司',
        spec: '100mg×30片',
        dosageForm: '片剂',
        approvalNo: 'H20160648'
      },
      {
        ypid: '12345678901236',
        matchScore: 82.1,
        drugName: '阿司匹林肠溶片(江苏)',
        manufacturer: '江苏某某药业有限公司',
        spec: '100mg×30片',
        dosageForm: '片剂',
        approvalNo: 'H20160649'
      }
    ]
  } catch (error) {
    ElMessage.error('加载候选项失败')
    // 使用示例数据作为fallback
    candidates.value = [
      {
        ypid: '12345678901234',
        matchScore: 95.5,
        drugName: '阿司匹林肠溶片',
        manufacturer: '示例制药有限公司',
        spec: '100mg×30片',
        dosageForm: '片剂',
        approvalNo: 'H20160647'
      }
    ]
  } finally {
    candidatesLoading.value = false
  }
}

// 在标准库中搜索
const searchInStandard = () => {
  showSearchForm.value = !showSearchForm.value
  if (showSearchForm.value) {
    // 预填充搜索条件
    searchForm.drugName = props.pendingData.productName
    searchForm.manufacturer = props.pendingData.manufacturer
  }
}

// 执行搜索
const performSearch = async () => {
  searchLoading.value = true
  try {
    const result = await YpidApi.searchStandard({
      drugName: searchForm.drugName,
      manufacturer: searchForm.manufacturer,
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
  searchForm.drugName = ''
  searchForm.manufacturer = ''
  loadCandidates()
}

// 处理候选项选择
const handleCandidateSelect = (row: any) => {
  selectedCandidate.value = row
}

// 选择候选项
const selectCandidate = (candidate: any) => {
  selectedCandidate.value = candidate
}

// 确认匹配
const confirmMatch = async () => {
  if (!selectedCandidate.value) {
    ElMessage.warning('请选择一个匹配项')
    return
  }

  try {
    await YpidApi.confirmManualMatch({
      pendingId: props.pendingData.id,
      ypid: selectedCandidate.value.ypid,
      taskId: props.taskId
    })
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
  gap: 12px;
}

.drug-info-card,
.candidates-card {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
}

.card-header .header-icon,
.card-header .header-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-icon {
  font-size: 14px;
  color: #409eff;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
}

.search-form {
  margin-bottom: 12px;
  padding: 10px 15px;
  background-color: #f8fafc;
  border-radius: 4px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 8px;
}

.search-form :deep(.el-form-item__label) {
  padding-right: 6px;
  font-size: 12px;
}

.search-form :deep(.el-button) {
  margin-right: 8px;
}

:deep(.el-table th), 
:deep(.el-table td) {
  padding: 4px 0;
}

.score-text {
  margin-left: 4px;
  font-size: 12px;
  color: #606266;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 0 6px;
  border-top: 1px solid #e4e7ed;
}
</style>
