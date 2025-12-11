<template>
  <div class="outbound-container">
    <!-- 页面头部 -->
    <PageHeader
      title="药品出库管理"
      content="管理药品出库记录，跟踪药品使用情况，确保药品流向可追溯，支持出库数据统计分析"
    >
      <template #extra>
        <div class="header-actions">
          <el-select
            v-model="queryParams.uploadDate"
            placeholder="选择导入批次"
            clearable
            style="width: 200px; margin-right: 12px"
            @change="handleQuery"
          >
            <el-option
              v-for="batch in dimensionFilters.uploadDates"
              :key="batch"
              :label="`${batch.substring(0, 4)}-${batch.substring(4, 6)}-${batch.substring(6, 8)}`"
              :value="batch"
            />
          </el-select>
          <el-button
            type="primary"
            @click="openForm('create')"
            v-hasPermi="['drug:outbound:create']"
          >
            <Icon icon="ep:plus" class="mr-5px" />
            新增出库
          </el-button>
          <el-button
            type="success"
            @click="handleExport"
            :loading="exportLoading"
            v-hasPermi="['drug:outbound:export']"
          >
            <Icon icon="ep:download" class="mr-5px" />
            导出数据
          </el-button>
        </div>
      </template>
    </PageHeader>

    <!-- 统计概览卡片 -->
    <!--
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="今日出库批次"
            :value="statistics.todayBatches || 0"
            icon="TakeawayBox"
            color="#409eff"
            description="今日出库"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="今日出库数量"
            :value="statistics.todayQuantity || 0"
            icon="Box"
            color="#67c23a"
            suffix="件"
            description="包装单位"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="本月出库批次"
            :value="statistics.monthBatches || 0"
            icon="Calendar"
            color="#e6a23c"
            description="当月累计"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="出库合格率"
            :value="statistics.qcPassRate || 0"
            suffix="%"
            icon="CircleCheck"
            color="#909399"
            :trend="statistics.qcPassRateTrend || 0"
            :loading="statsLoading"
          />
        </el-col>
      </el-row>
    </div>
-->

    <!-- 搜索和操作区域 -->
    <ContentWrap>
      <el-form
        class="-mb-15px"
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="68px"
      >
        <el-form-item label="药品编码" prop="ypid">
          <el-input
            v-model="queryParams.ypid"
            placeholder="请输入YPID编码"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="产品名称" prop="productName">
          <el-input
            v-model="queryParams.productName"
            placeholder="请输入产品名称"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="机构名称" prop="organizationName">
          <el-input
            v-model="queryParams.organizationName"
            placeholder="请输入机构名称"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="质控状态" prop="qcStatus">
          <el-select
            v-model="queryParams.qcStatus"
            placeholder="请选择质控状态"
            clearable
            class="!w-240px"
          >
            <el-option label="全部" value="" />
            <el-option label="未质控" :value="0" />
            <el-option label="质控通过" :value="1" />
            <el-option label="质控失败" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
          <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 列表 -->
    <ContentWrap>
      <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
        <el-table-column label="ID" align="center" prop="id" />
        <el-table-column label="数据上报日期" align="center" prop="uploadDate" width="100">
          <template #default="{ row }">
            {{ formatDate(row.uploadDate) }}
          </template>
        </el-table-column>
        <el-table-column label="省级行政区划代码" align="center" prop="domainCode" width="130" />
        <el-table-column label="组织机构代码" align="center" prop="organizationCode" width="120" />
        <el-table-column label="医疗机构代码" align="center" prop="hospitalCode" width="120" />
        <el-table-column
          label="医疗机构名称"
          align="center"
          prop="organizationName"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column
          label="国家药品编码（YPID）"
          align="center"
          prop="ypid"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column
          label="院内药品唯一码"
          align="center"
          prop="hospitalDrugId"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column
          label="省级药品集中采购平台药品编码"
          align="center"
          prop="provinceDrugCode"
          width="180"
          show-overflow-tooltip
        />
        <el-table-column
          label="产品名称"
          align="center"
          prop="productName"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column
          label="出库数量（最小销售包装单位）"
          align="center"
          prop="outboundPackQuantity"
          width="180"
        >
          <template #default="{ row }">
            {{ formatNumber(row.outboundPackQuantity) }}
          </template>
        </el-table-column>
        <el-table-column
          label="出库数量（最小制剂单位）"
          align="center"
          prop="outboundDosageQuantity"
          width="180"
        >
          <template #default="{ row }">
            {{ formatNumber(row.outboundDosageQuantity) }}
          </template>
        </el-table-column>
        <el-table-column label="修复规则" align="center" prop="fixRule" width="100" />
        <el-table-column label="质控状态" align="center" prop="qcStatus" width="100">
          <template #default="{ row }">
            <el-tag :type="getQcStatusType(row.qcStatus)" size="small" effect="dark">
              {{ getQcStatusText(row.qcStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="创建时间"
          align="center"
          prop="createTime"
          :formatter="dateFormatter"
          width="180px"
        />
        <el-table-column label="操作" align="center" min-width="120px">
          <template #default="scope">
            <el-button
              link
              type="primary"
              @click="openForm('update', scope.row.id)"
              v-hasPermi="['drug:outbound:update']"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['drug:outbound:delete']"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </ContentWrap>

    <!-- 表单弹窗：添加/修改 -->
    <OutboundForm ref="formRef" @success="handleFormSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { OutboundApi, OutboundVO } from '@/api/drug/data/outbound'
import OutboundForm from './OutboundForm.vue'
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '@/components/StatCard/index.vue'
import { Box, FirstAidKit } from '@element-plus/icons-vue'

/** 药品出库管理页面 */
defineOptions({ name: 'Outbound' })

const message = useMessage()
const { t } = useI18n()

// ========================= 响应式数据 =========================
const loading = ref(true)
const refreshing = ref(false)
const statsLoading = ref(true)
const list = ref<OutboundVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  ypid: undefined,
  productName: undefined,
  organizationName: undefined,
  qcStatus: undefined,
  uploadDate: undefined
})
const queryFormRef = ref()
const exportLoading = ref(false)

// 统计数据
const statistics = reactive({
  todayBatches: 0,
  todayQuantity: 0,
  monthBatches: 0,
  qcPassRate: 0,
  qcPassRateTrend: 0
})

// 维度筛选数据
const dimensionFilters = reactive({
  uploadDates: []
})

// ========================= 生命周期 =========================
onMounted(() => {
  getList()
  loadStatistics()
  loadDimensionFilters()
})

// ========================= 核心方法 =========================

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await OutboundApi.getOutboundPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 加载统计数据 */
const loadStatistics = async () => {
  statsLoading.value = true
  try {
    // 获取今日数据
    const today = new Date().toISOString().split('T')[0]
    const todayData = await OutboundApi.getOutboundPage({
      pageNo: 1,
      pageSize: 100,
      outboundDate: [today + ' 00:00:00', today + ' 23:59:59']
    })

    const todayList = todayData.list || []
    statistics.todayBatches = todayList.length
    statistics.todayQuantity = todayList.reduce(
      (sum, item) => sum + (item.outboundPackQuantity || 0),
      0
    )

    // 获取本月数据
    const monthStart = new Date()
    monthStart.setDate(1)
    const monthData = await OutboundApi.getOutboundPage({
      pageNo: 1,
      pageSize: 100,
      outboundDate: [monthStart.toISOString().split('T')[0] + ' 00:00:00', today + ' 23:59:59']
    })
    statistics.monthBatches = monthData.total || 0

    // 计算质控通过率
    const allData = await OutboundApi.getOutboundPage({ pageNo: 1, pageSize: 100 })
    const allList = allData.list || []
    const passCount = allList.filter((item) => item.qcStatus === 1).length
    statistics.qcPassRate = allList.length > 0 ? Math.round((passCount / allList.length) * 100) : 0
    statistics.qcPassRateTrend = 5 // 模拟趋势数据
  } catch (error) {
    console.error('加载统计数据失败:', error)
  } finally {
    statsLoading.value = false
  }
}

/** 加载维度筛选数据 */
const loadDimensionFilters = async () => {
  try {
    const data = await OutboundApi.getDimensionFilters()
    dimensionFilters.uploadDates = data.uploadDates || []
  } catch (error) {
    console.error('加载维度筛选数据失败:', error)
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 刷新操作 */
const handleRefresh = async () => {
  refreshing.value = true
  try {
    await Promise.all([getList(), loadStatistics()])
    message.success('刷新成功')
  } finally {
    refreshing.value = false
  }
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 表单成功回调 */
const handleFormSuccess = () => {
  getList()
  loadStatistics()
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await OutboundApi.deleteOutbound(id)
    message.success(t('common.delSuccess'))
    await getList()
    await loadStatistics()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await OutboundApi.exportOutbound(queryParams)
    download.excel(data, '药品出库情况.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

// ========================= 工具方法 =========================

/** 格式化数字 */
const formatNumber = (num: number | undefined): string => {
  if (!num) return '0'
  return num.toLocaleString()
}

/** 获取质控状态类型 */
const getQcStatusType = (status: number): string => {
  const types = {
    0: 'info',
    1: 'success',
    2: 'danger'
  }
  return types[status] || 'info'
}

/** 获取质控状态文本 */
const getQcStatusText = (status: number): string => {
  const texts = {
    0: '未质控',
    1: '质控通过',
    2: '质控失败'
  }
  return texts[status] || '未知'
}

/** 格式化日期 */
const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr.length < 8) return dateStr || ''
  return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
}
</script>

<style scoped>
.outbound-container {
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

/* 药品信息样式 */
.drug-info {
  text-align: left;
}

.drug-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.drug-code {
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 12px;
}

/* 机构信息样式 */
.org-info {
  font-size: 13px;
  line-height: 1.4;
}

/* 数量信息样式 */
.quantity-info {
  font-size: 13px;
  line-height: 1.8;
}

.pack-quantity,
.dosage-quantity {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
}

.pack-quantity {
  color: #409eff;
}

.dosage-quantity {
  color: #67c23a;
}

.quantity-info .el-icon {
  font-size: 14px;
}

.text-muted {
  color: #909399;
  font-size: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .outbound-container {
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

  .drug-code {
    flex-direction: column;
    gap: 2px;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
}
</style>
