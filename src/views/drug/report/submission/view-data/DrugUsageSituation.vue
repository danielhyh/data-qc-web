<template>
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
      <el-table-column label="医疗机构代码" align="center" prop="hospitalCode" width="150" />
      <el-table-column label="组织机构名称" align="center" prop="organizationName" min-width="200" show-overflow-tooltip />
      <el-table-column label="国家药品编码（YPID）" align="center" prop="ypid" width="150" />
      <el-table-column label="院内药品唯一码" align="center" prop="hospitalDrugId" width="130" />
      <el-table-column label="省级药品集中采购平台药品编码" align="center" prop="provinceDrugId" width="180" />
      <el-table-column label="产品名称" align="center" prop="productName" min-width="200" show-overflow-tooltip />
      <el-table-column label="销售总金额（元）" align="center" prop="usageTotalAmount" width="130">
        <template #default="{ row }">
          <span class="total-amount">¥{{ formatAmount(row.usageTotalAmount) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="销售数量（最小销售包装单位）" align="center" prop="usagePackQuantity" width="180">
        <template #default="{ row }">
          {{ formatNumber(row.usagePackQuantity) }}
        </template>
      </el-table-column>
      <el-table-column label="销售数量（最小制剂单位）" align="center" prop="usageDosageQuantity" width="170">
        <template #default="{ row }">
          {{ formatNumber(row.usageDosageQuantity) }}
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
defineOptions({ name: 'DrugUsageSituation' })

const props = defineProps({
  taskId: Number
})

const queryFormRef = ref()
const loading = ref(true) // 列表的加载中
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskId: props.taskId,
  ypid: undefined,
  productName: undefined,
  organizationName: undefined
})
const total = ref(0) // 列表的总页数
/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ReportDataApi.getUsageList(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
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

/** 格式化日期 */
const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr.length < 8) return dateStr || ''
  return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
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