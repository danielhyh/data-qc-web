<template>
  <el-table
    :data="dataViewDialog.data"
    stripe
    max-height="500"
    v-loading="dataViewDialog.loading"
  >
    <el-table-column label="ID" align="center" width="55" prop="orderNo" />
    <el-table-column
      label="国家药品编码（YPID）"
      align="center"
      prop="ypid"
      show-overflow-tooltip
    />
    <el-table-column
      label="产品名称"
      align="center"
      prop="productName"
      show-overflow-tooltip
    />
    <el-table-column
      label="销售总金额（元）"
      align="center"
      prop="usageTotalAmount"
    >
      <template #default="{ row }">
        <span class="total-amount">¥{{ formatAmount(row.usageTotalAmount) }}</span>
      </template>
    </el-table-column>
    <el-table-column
      label="销售数量（最小销售包装单位）"
      align="center"
      prop="usagePackQuantity"
    >
      <template #default="{ row }">
        {{ formatNumber(row.usagePackQuantity) }}
      </template>
    </el-table-column>
  </el-table>
</template>
<script setup>
import { defineProps } from 'vue'
defineOptions({name: 'UsageDetails'})
const props = defineProps({
  dataViewDialog: Object
})
/** 格式化数字 */
const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString()
}

/** 格式化金额 */
const formatAmount = (amount) => {
  if (!amount) return '0.00'
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>