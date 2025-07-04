<template>
  <div class="catalog-container">
    <!-- Page Header -->
    <PageHeader
      title="药品目录管理"
      content="维护医疗机构药品目录信息，包括药品编码、名称、规格、生产企业等关键数据，支持YPID匹配和质控管理"
    >
      <template #extra>
        <el-button type="primary" @click="openForm('create')" v-hasPermi="['drug:catalog:create']">
          <Icon icon="ep:plus" class="mr-5px" />
          新增药品
        </el-button>
        <el-button
          type="success"
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['drug:catalog:export']"
        >
          <Icon icon="ep:download" class="mr-5px" />
          导出目录
        </el-button>
      </template>
    </PageHeader>

    <!-- Statistics Overview -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="药品品种总数"
            :value="statistics.totalDrugs || 0"
            icon="FirstAidKit"
            color="#409eff"
            description="已登记品种"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="基本药物品种"
            :value="statistics.basicDrugs || 0"
            icon="CircleCheck"
            color="#67c23a"
            description="国家基药目录"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="一致性评价药品"
            :value="statistics.consistencyDrugs || 0"
            icon="Medal"
            color="#e6a23c"
            description="通过评价"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="YPID匹配率"
            :value="statistics.ypidMatchRate || 0"
            suffix="%"
            icon="Connection"
            color="#909399"
            :trend="statistics.matchRateTrend || 0"
            :loading="statsLoading"
          />
        </el-col>
      </el-row>
    </div>

    <!-- Search Card -->
    <el-card class="search-card" shadow="never">
      <el-form
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        label-width="100px"
        class="search-form"
      >
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="药品编码" prop="ypid">
              <el-input
                v-model="queryParams.ypid"
                placeholder="YPID编码"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="产品名称" prop="productName">
              <el-input
                v-model="queryParams.productName"
                placeholder="产品名称"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="通用名" prop="drugName">
              <el-input
                v-model="queryParams.drugName"
                placeholder="药品通用名"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="生产企业" prop="manufacturer">
              <el-input
                v-model="queryParams.manufacturer"
                placeholder="生产企业名称"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="基本药物" prop="isBasicDrug">
              <el-select
                v-model="queryParams.isBasicDrug"
                placeholder="是否基药"
                clearable
                style="width: 100%"
              >
                <el-option label="全部" value="" />
                <el-option label="是" :value="1" />
                <el-option label="否" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="匹配状态" prop="ypidMatchStatus">
              <el-select
                v-model="queryParams.ypidMatchStatus"
                placeholder="YPID匹配状态"
                clearable
                style="width: 100%"
              >
                <el-option label="全部" value="" />
                <el-option label="未匹配" :value="0" />
                <el-option label="自动匹配" :value="1" />
                <el-option label="手动匹配" :value="2" />
                <el-option label="匹配失败" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24" style="text-align: center">
            <el-form-item>
              <el-button type="primary" @click="handleQuery">
                <Icon icon="ep:search" class="mr-5px" />
                搜索
              </el-button>
              <el-button @click="resetQuery">
                <Icon icon="ep:refresh" class="mr-5px" />
                重置
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- Data Table -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <span class="table-title">药品目录列表</span>
          <div class="table-actions">
            <el-button size="small" @click="handleRefresh" :loading="refreshing">
              <Icon icon="ep:refresh" class="mr-5px" />
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="list"
        :stripe="true"
        :show-overflow-tooltip="true"
        border
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />

        <!-- Drug Basic Info -->
        <el-table-column label="药品信息" align="left" min-width="300" fixed="left">
          <template #default="{ row }">
            <div class="drug-info">
              <div class="drug-name">{{ row.productName }}</div>
              <div class="drug-details">
                <span class="generic-name">通用名: {{ row.drugName }}</span>
                <span v-if="row.tradeName" class="trade-name">商品名: {{ row.tradeName }}</span>
              </div>
              <div class="drug-codes">
                <el-tag size="small" type="info">YPID: {{ row.ypid }}</el-tag>
                <el-tag size="small" v-if="row.hospitalDrugId"
                  >院内码: {{ row.hospitalDrugId }}</el-tag
                >
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Manufacturer -->
        <el-table-column
          label="生产企业"
          align="center"
          prop="manufacturer"
          width="180"
          show-overflow-tooltip
        />

        <!-- Drug Specs -->
        <el-table-column label="规格信息" align="center" width="200">
          <template #default="{ row }">
            <div class="spec-info">
              <div>{{ row.drugForm }} | {{ row.drugSpec }}</div>
              <div class="units">
                <span>制剂: {{ row.dosageUnit }}</span>
                <span>包装: {{ row.packUnit }}</span>
              </div>
              <div class="conversion">转换系数: {{ row.conversionFactor }}</div>
            </div>
          </template>
        </el-table-column>

        <!-- Approval Number -->
        <el-table-column
          label="批准文号"
          align="center"
          prop="approvalNumber"
          width="150"
          show-overflow-tooltip
        />

        <!-- Drug Properties -->
        <el-table-column label="药品属性" align="center" width="160">
          <template #default="{ row }">
            <div class="property-tags">
              <el-tag v-if="row.isCentralizedPurchase === 1" size="small" type="primary"
                >集采</el-tag
              >
              <el-tag v-if="row.isBasicDrug === 1" size="small" type="success">基药</el-tag>
              <el-tag v-if="row.isConsistencyEvaluation === 1" size="small" type="warning"
                >一致性</el-tag
              >
            </div>
          </template>
        </el-table-column>

        <!-- Match Status -->
        <el-table-column label="匹配状态" align="center" prop="ypidMatchStatus" width="100">
          <template #default="{ row }">
            <el-tag :type="getMatchStatusType(row.ypidMatchStatus)" size="small" effect="dark">
              {{ getMatchStatusText(row.ypidMatchStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- QC Status -->
        <el-table-column label="质控状态" align="center" prop="qcStatus" width="100">
          <template #default="{ row }">
            <el-tag :type="getQcStatusType(row.qcStatus)" size="small">
              {{ getQcStatusText(row.qcStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Create Time -->
        <el-table-column
          label="创建时间"
          align="center"
          prop="createTime"
          :formatter="dateFormatter"
          width="160"
        />

        <!-- Actions -->
        <el-table-column label="操作" align="center" width="160" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button
                link
                type="primary"
                size="small"
                @click="openForm('update', scope.row.id)"
                v-hasPermi="['drug:catalog:update']"
              >
                <Icon icon="ep:edit" class="mr-3px" />
                编辑
              </el-button>
              <el-button
                link
                type="danger"
                size="small"
                @click="handleDelete(scope.row.id)"
                v-hasPermi="['drug:catalog:delete']"
              >
                <Icon icon="ep:delete" class="mr-3px" />
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-wrapper">
        <Pagination
          :total="total"
          v-model:page="queryParams.pageNo"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
        />
      </div>
    </el-card>

    <!-- Form Dialog -->
    <CatalogForm ref="formRef" @success="handleFormSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { CatalogApi, CatalogVO } from '@/api/drug/data/catalog'
import CatalogForm from './CatalogForm.vue'
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '@/components/StatCard/index.vue'

/** Drug Catalog Management Page */
defineOptions({ name: 'Catalog' })

const message = useMessage()
const { t } = useI18n()

// ========================= Reactive Data =========================
const loading = ref(true)
const refreshing = ref(false)
const statsLoading = ref(true)
const list = ref<CatalogVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  ypid: undefined,
  productName: undefined,
  drugName: undefined,
  manufacturer: undefined,
  isBasicDrug: undefined,
  ypidMatchStatus: undefined
})
const queryFormRef = ref()
const exportLoading = ref(false)

// Statistics data
const statistics = reactive({
  totalDrugs: 0,
  basicDrugs: 0,
  consistencyDrugs: 0,
  ypidMatchRate: 0,
  matchRateTrend: 0
})

// ========================= Lifecycle =========================
onMounted(() => {
  getList()
  loadStatistics()
})

// ========================= Core Methods =========================

/** Query list */
const getList = async () => {
  loading.value = true
  try {
    const data = await CatalogApi.getCatalogPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** Load statistics */
const loadStatistics = async () => {
  statsLoading.value = true
  try {
    const allData = await CatalogApi.getCatalogPage({ pageNo: 1, pageSize: 100 })
    const allList = allData.list || []

    statistics.totalDrugs = allData.total || 0
    statistics.basicDrugs = allList.filter((item) => item.isBasicDrug === 1).length
    statistics.consistencyDrugs = allList.filter(
      (item) => item.isConsistencyEvaluation === 1
    ).length

    const matchedCount = allList.filter(
      (item) => item.ypidMatchStatus === 1 || item.ypidMatchStatus === 2
    ).length
    statistics.ypidMatchRate =
      allList.length > 0 ? Math.round((matchedCount / allList.length) * 100) : 0
    statistics.matchRateTrend = 2
  } catch (error) {
    console.error('Failed to load statistics:', error)
  } finally {
    statsLoading.value = false
  }
}

/** Search */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** Reset query */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** Refresh */
const handleRefresh = async () => {
  refreshing.value = true
  try {
    await Promise.all([getList(), loadStatistics()])
    message.success('刷新成功')
  } finally {
    refreshing.value = false
  }
}

/** Open form */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** Form success callback */
const handleFormSuccess = () => {
  getList()
  loadStatistics()
}

/** Delete */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await CatalogApi.deleteCatalog(id)
    message.success(t('common.delSuccess'))
    await getList()
    await loadStatistics()
  } catch {}
}

/** Export */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await CatalogApi.exportCatalog(queryParams)
    download.excel(data, '药品目录.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

// ========================= Utility Methods =========================

/** Get match status type */
const getMatchStatusType = (status: number): string => {
  const types = {
    0: 'info',
    1: 'success',
    2: 'primary',
    3: 'danger'
  }
  return types[status] || 'info'
}

/** Get match status text */
const getMatchStatusText = (status: number): string => {
  const texts = {
    0: '未匹配',
    1: '自动匹配',
    2: '手动匹配',
    3: '匹配失败'
  }
  return texts[status] || '未知'
}

/** Get QC status type */
const getQcStatusType = (status: number): string => {
  const types = {
    0: 'info',
    1: 'success',
    2: 'danger'
  }
  return types[status] || 'info'
}

/** Get QC status text */
const getQcStatusText = (status: number): string => {
  const texts = {
    0: '未质控',
    1: '质控通过',
    2: '质控失败'
  }
  return texts[status] || '未知'
}
</script>

<style scoped>
.catalog-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.stats-overview {
  margin-bottom: 20px;
}

.search-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.search-form {
  margin-bottom: -18px;
}

.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
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

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: end;
  margin-top: 20px;
  padding: 20px;
}

/* Drug info styles */
.drug-info {
  text-align: left;
  padding: 8px 0;
}

.drug-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  font-size: 14px;
}

.drug-details {
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
}

.generic-name {
  margin-right: 12px;
}

.trade-name {
  color: #909399;
}

.drug-codes {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* Spec info styles */
.spec-info {
  font-size: 12px;
  line-height: 1.6;
}

.units {
  color: #606266;
  margin-top: 2px;
}

.units span {
  margin-right: 8px;
}

.conversion {
  color: #909399;
  margin-top: 2px;
}

/* Property tags */
.property-tags {
  display: flex;
  gap: 4px;
  justify-content: center;
  flex-wrap: wrap;
}

/* Responsive design */
@media (max-width: 768px) {
  .catalog-container {
    padding: 10px;
  }

  .search-form :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  .table-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .drug-codes {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
}

/* Table optimization */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}

/* Tag styles */
:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
}

/* Card styles */
:deep(.el-card) {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

:deep(.el-card__header) {
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
  padding: 16px 20px;
}
</style>
