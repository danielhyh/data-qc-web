<template>
  <el-table :data="dataViewDialog.data" stripe max-height="500" v-loading="dataViewDialog.loading" :row-class-name="getRowClassName">
    <el-table-column label="ID" align="center" prop="id">
      <template #default="{ row }">
        <div class="id-cell">
          <el-icon v-if="row.hasError" class="error-icon"><WarningFilled /></el-icon>
          <span>{{ row.orderNo }}</span>
        </div>
      </template>
    </el-table-column>
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
  </el-table>
</template>
<script setup lang="ts">
import { WarningFilled } from '@element-plus/icons-vue'

defineOptions({ name: 'OutboundDetails' })

interface Props {
  dataViewDialog?: {
    data: any[]
    loading: boolean
  }
}

const props = defineProps<Props>()

/** 获取行样式类名 */
const getRowClassName = ({ row }) => {
  return row.hasError ? 'error-row' : ''
}

/** 格式化数字 */
const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString()
}

/** 格式化日期 */
const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr.length < 8) return dateStr || ''
  return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
}
</script>
<style scoped>
.id-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.error-icon {
  color: #f56c6c;
  font-size: 16px;
}

/* 错误行样式 */
:deep(.error-row) {
  background-color: #fef0f0 !important;
}

:deep(.error-row:hover > td) {
  background-color: #fde2e2 !important;
}
</style>
