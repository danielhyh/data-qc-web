<template>
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
      <el-table-column label="组织机构名称" align="center" prop="organizationName" min-width="200" show-overflow-tooltip />
      <el-table-column label="国家药品编码（YPID）" align="center" prop="ypid" width="150" show-overflow-tooltip />
      <el-table-column label="院内药品唯一码" align="center" prop="hospitalDrugId" width="150" show-overflow-tooltip />
      <el-table-column label="产品名称" align="center" prop="productName" width="150" show-overflow-tooltip />
      <el-table-column label="入库总金额（元）" align="center" prop="inboundTotalAmount" width="140">
        <template #default="{ row }">
          <span class="total-amount">¥{{ formatAmount(row.inboundTotalAmount) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="入库数量（最小销售包装单位）" align="center" prop="inboundPackQuantity" width="180">
        <template #default="{ row }">
          {{ formatNumber(row.inboundPackQuantity) }}
        </template>
      </el-table-column>
      <el-table-column label="入库数量（最小制剂单位）" align="center" prop="inboundDosageQuantity" width="180">
        <template #default="{ row }">
          {{ formatNumber(row.inboundDosageQuantity) }}
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" :formatter="dateFormatter" width="180px" />
    </el-table>
    <!-- 分页 -->
    <Pagination
:total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize"
      @pagination="getList" />
  </ContentWrap>
</template>

<script setup lang="ts">
import { ReportDataApi } from '@/api/drug/reportdata'
import { dateFormatter } from '@/utils/formatTime'

// 定义组件名称
defineOptions({ name: 'DrugStorageStatus' })

const props = defineProps({
  taskId: Number
})

const loading = ref(true) // 列表的加载中
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskId: props.taskId
})
const total = ref(0) // 列表的总页数
/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ReportDataApi.getInboundList(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 格式化日期 */
const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr.length < 8) return dateStr || ''
  return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
}

/** 格式化数字 */
const formatNumber = (num: number | undefined): string => {
  if (!num) return '0'
  return num.toLocaleString()
}

/** 格式化金额 */
const formatAmount = (amount: number | undefined): string => {
  if (!amount) return '0.00'
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

<style>
.total-amount {
  font-weight: 600;
  color: #67c23a;
  font-size: 14px;
}
</style>