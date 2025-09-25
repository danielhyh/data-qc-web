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
      label="院内药品唯一码"
      align="center"
      prop="hospitalDrugId"
      show-overflow-tooltip
    />
    <el-table-column
      label="省级药品集中采购平台药品编码"
      align="center"
      prop="provinceDrugCode"
      show-overflow-tooltip
    />
    <el-table-column
      label="通用名"
      align="center"
      prop="drugName"
      show-overflow-tooltip
    />
    <el-table-column
      label="产品名称"
      align="center"
      prop="productName"
      show-overflow-tooltip
    />
    <el-table-column
      label="商品名"
      align="center"
      prop="tradeName"
      show-overflow-tooltip
    />
  </el-table>
</template>
<script setup>
defineOptions({name: 'CatalogDetails'})
import { defineProps } from 'vue'
const props = defineProps({
  dataViewDialog: Object
})
</script>