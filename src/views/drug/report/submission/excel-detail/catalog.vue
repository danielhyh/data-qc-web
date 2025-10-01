<template>
  <el-table :data="dataViewDialog.data" stripe max-height="500" v-loading="dataViewDialog.loading">
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
      prop="hospitalName"
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
      label="通用名"
      align="center"
      prop="drugName"
      width="120"
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
      label="商品名"
      align="center"
      prop="tradeName"
      width="120"
      show-overflow-tooltip
    />
    <el-table-column
      label="商品名（英文）"
      align="center"
      prop="tradeNameEn"
      width="150"
      show-overflow-tooltip
    />
    <el-table-column
      label="批准文号"
      align="center"
      prop="approvalNumber"
      width="150"
      show-overflow-tooltip
    />
    <el-table-column
      label="生产企业"
      align="center"
      prop="manufacturer"
      width="180"
      show-overflow-tooltip
    />
    <el-table-column label="剂型名称" align="center" prop="drugForm" width="120" />
    <el-table-column label="制剂规格" align="center" prop="drugSpec" width="120" />
    <el-table-column label="制剂单位" align="center" prop="dosageUnit" width="120" />
    <el-table-column label="最小销售包装单位" align="center" prop="packUnit" width="150" />
    <el-table-column label="转换系数" align="center" prop="conversionFactor" width="120" />
    <el-table-column label="是否基本药物" align="center" prop="isBasicDrug" width="120">
      <template #default="{ row }">
        <el-tag :type="row.isBasicDrug === 1 ? 'success' : 'info'" size="small">
          {{ row.isBasicDrug === 1 ? '是' : '否' }}
        </el-tag>
      </template>
    </el-table-column>
  </el-table>
</template>
<script setup lang="ts">
defineOptions({ name: 'CatalogDetails' })
import { defineProps } from 'vue'
const props = defineProps({
  dataViewDialog: Object
})

/** 格式化日期 */
const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr.length < 8) return dateStr || ''
  return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
}
</script>
