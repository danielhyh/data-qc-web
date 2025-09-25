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
      label="出库数量（最小销售包装单位）"
      align="center"
      prop="outboundPackQuantity"
    >
      <template #default="{ row }">
        {{ formatNumber(row.outboundPackQuantity) }}
      </template>
    </el-table-column>
    <el-table-column
      label="出库数量（最小制剂单位）"
      align="center"
      prop="outboundDosageQuantity"
    >
      <template #default="{ row }">
        {{ formatNumber(row.outboundDosageQuantity) }}
      </template>
    </el-table-column>
  </el-table>
</template>
<script setup>
defineOptions({name: 'OutboundDetails'})
import { defineProps } from 'vue'
const props = defineProps({
  dataViewDialog: Object
})
/** 格式化数字 */
const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString()
}

</script>