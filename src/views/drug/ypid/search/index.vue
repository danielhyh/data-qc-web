<template>
  <div class="ypid-search-container">
    <!-- 页面头部 -->
    <PageHeader
      title="YPID编码搜索"
      content="查询标准药品编码库，支持按编码、药品名称、生产企业等多维度搜索"
    />

    <!-- 统计概览 -->
    <div class="stats-overview">
      <el-row :gutter="16">
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <StatCard title="药品总数" :value="statistics.totalDrugs" icon="Box" color="#409eff" />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <StatCard
            title="已匹配药品"
            :value="statistics.matchedDrugs"
            icon="CircleCheck"
            color="#67c23a"
            :rate="calculateRate(statistics.matchedDrugs, statistics.totalDrugs)"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <StatCard
            title="未匹配药品"
            :value="statistics.unmatchedDrugs"
            icon="Warning"
            color="#e6a23c"
            :rate="calculateRate(statistics.unmatchedDrugs, statistics.totalDrugs)"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <StatCard
            title="匹配率"
            :value="statistics.matchRate"
            suffix="%"
            icon="DataLine"
            color="#909399"
            :trend="statistics.matchRateTrend"
          />
        </el-col>
      </el-row>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="关键词" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="支持YPID、药品名、生产企业搜索"
            clearable
            style="width: 300px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item label="YPID编码" prop="ypid">
          <el-input
            v-model="queryParams.ypid"
            placeholder="请输入YPID编码"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="药品名称" prop="drugName">
          <el-input
            v-model="queryParams.drugName"
            placeholder="请输入药品通用名"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="生产企业" prop="manufacturer">
          <el-input
            v-model="queryParams.manufacturer"
            placeholder="请输入生产企业"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="药品类别" prop="category">
          <el-select
            v-model="queryParams.category"
            placeholder="请选择类别"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" value="" />
            <el-option label="西药" value="western" />
            <el-option label="中成药" value="chinese" />
            <el-option label="中药饮片" value="herbal" />
            <el-option label="生物制品" value="biological" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="全部" value="" />
            <el-option label="正常" :value="1" />
            <el-option label="停用" :value="2" />
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
          <el-button type="success" @click="handleExport" :loading="exportLoading">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 搜索结果 -->
    <el-card class="result-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">搜索结果</span>
          <span class="result-count">共 {{ total }} 条记录</span>
        </div>
      </template>

      <el-table v-loading="loading" :data="drugList" stripe border highlight-current-row>
        <el-table-column prop="ypid" label="YPID编码" width="150" fixed="left">
          <template #default="{ row }">
            <el-link type="primary" @click="handleViewDetail(row)">
              {{ row.ypid }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column prop="drugName" label="药品通用名" min-width="150" show-overflow-tooltip />

        <el-table-column
          prop="productName"
          label="产品名称"
          min-width="150"
          show-overflow-tooltip
        />

        <el-table-column prop="specification" label="规格" width="120" show-overflow-tooltip />

        <el-table-column prop="dosageForm" label="剂型" width="100" />

        <el-table-column
          prop="manufacturer"
          label="生产企业"
          min-width="200"
          show-overflow-tooltip
        />

        <el-table-column prop="approvalNumber" label="批准文号" width="150" show-overflow-tooltip />

        <el-table-column prop="conversionFactor" label="转换系数" width="100" align="center" />

        <el-table-column prop="category" label="类别" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getCategoryTag(row.category)">
              {{ getCategoryLabel(row.category) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)">
              <el-icon><View /></el-icon>
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="loadDrugList"
      />
    </el-card>

    <!-- 药品详情对话框 -->
    <YpidDetailModal v-model="detailVisible" :ypid="selectedYpid" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download, View } from '@element-plus/icons-vue'
import { YpidApi, type YpidDrugVO, type YpidSearchVO, type YpidStatisticsVO } from '@/api/drug/ypid'

// 导入组件
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '@/components/StatCard/index.vue'
import YpidDetailModal from './components/YpidDetailModal.vue'

defineOptions({ name: 'YpidSearchIndex' })

// ========================= 响应式数据 =========================

const loading = ref(false)
const exportLoading = ref(false)

const queryParams = reactive<YpidSearchVO>({
  pageNo: 1,
  pageSize: 20,
  keyword: undefined,
  ypid: undefined,
  drugName: undefined,
  manufacturer: undefined,
  category: undefined,
  status: undefined
})

const drugList = ref<YpidDrugVO[]>([])
const total = ref(0)

const statistics = reactive<YpidStatisticsVO>({
  totalDrugs: 0,
  matchedDrugs: 0,
  unmatchedDrugs: 0,
  matchRate: 0,
  todayMatched: 0,
  manualMatched: 0,
  autoMatched: 0,
  matchRateTrend: 0
})

const detailVisible = ref(false)
const selectedYpid = ref('')

// ========================= 生命周期 =========================

onMounted(() => {
  initPage()
})

// ========================= 方法 =========================

const initPage = async () => {
  await Promise.all([loadDrugList(), loadStatistics()])
}

const loadDrugList = async () => {
  loading.value = true
  try {
    const { list, total: totalCount } = await YpidApi.searchYpid(queryParams)
    drugList.value = list || []
    total.value = totalCount || 0
  } catch (error) {
    console.error('加载药品列表失败:', error)
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const data = await YpidApi.getStatistics()
    Object.assign(statistics, data)
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  loadDrugList()
}

const resetQuery = () => {
  Object.assign(queryParams, {
    pageNo: 1,
    pageSize: 20,
    keyword: undefined,
    ypid: undefined,
    drugName: undefined,
    manufacturer: undefined,
    category: undefined,
    status: undefined
  })
  handleQuery()
}

const handleExport = async () => {
  exportLoading.value = true
  try {
    ElMessage.info('导出功能开发中...')
  } finally {
    exportLoading.value = false
  }
}

const handleViewDetail = (row: YpidDrugVO) => {
  selectedYpid.value = row.ypid
  detailVisible.value = true
}

// ========================= 工具方法 =========================

const calculateRate = (value: number, total: number) => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

const getCategoryLabel = (category: string) => {
  const categoryMap = {
    western: '西药',
    chinese: '中成药',
    herbal: '中药饮片',
    biological: '生物制品'
  }
  return categoryMap[category] || category
}

const getCategoryTag = (category: string) => {
  const tagMap = {
    western: 'primary',
    chinese: 'success',
    herbal: 'warning',
    biological: 'danger'
  }
  return tagMap[category] || 'info'
}
</script>

<style scoped>
.ypid-search-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.stats-overview {
  margin-bottom: 20px;
}

.search-card,
.result-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.result-count {
  font-size: 14px;
  color: #909399;
}
</style>
