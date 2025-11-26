<template>
  <el-table
    :data="dataViewDialog.data"
    stripe
    max-height="500"
    v-loading="dataViewDialog.loading"
    :row-class-name="getRowClassName"
  >
    <el-table-column label="ID" align="center" prop="orderNo">
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
    <el-table-column label="医疗机构代码" align="center" prop="hospitalCode" width="150" />
    <el-table-column
      label="组织机构名称"
      align="center"
      prop="organizationName"
      min-width="200"
      show-overflow-tooltip
    />
    <el-table-column
      label="单位负责人"
      align="center"
      prop="unitManager"
      width="120"
      show-overflow-tooltip
    />
    <el-table-column
      label="统计负责人"
      align="center"
      prop="statisticsManager"
      width="120"
      show-overflow-tooltip
    />
    <el-table-column label="年度药品总收入（元）" align="center" width="160">
      <template #default="{ row }">
        <div class="income-comparison">
          <div>导入: ¥{{ formatAmount(row.annualDrugIncomeImport) }}</div>
          <div>直报: ¥{{ formatAmount(row.annualDrugIncomeSync) }}</div>
          <div class="difference"
            >差异: ¥{{
              formatAmount((row.annualDrugIncomeImport || 0) - (row.annualDrugIncomeSync || 0))
            }}</div
          >
        </div>
      </template>
    </el-table-column>
    <el-table-column label="实有床位数" align="center" prop="bedCount">
      <template #default="{ row }">
        <el-tag type="info" effect="plain">{{ row.bedCount || 0 }}</el-tag>
      </template>
    </el-table-column>
  </el-table>
</template>
<script setup lang="ts">
import { WarningFilled } from '@element-plus/icons-vue'

// 定义组件名称
defineOptions({ name: 'Hospital' })

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
/** 格式化日期 */
const formatDate = (dateStr) => {
  if (!dateStr || dateStr.length < 8) return dateStr || ''
  return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
}

/** 格式化金额 */
const formatAmount = (amount) => {
  if (!amount) return '0'
  if (amount >= 100000000) {
    return (amount / 100000000).toFixed(2) + '亿'
  } else if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万'
  }
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>
<style scoped>
.income-comparison {
  font-size: 12px;
  line-height: 1.4;
}

.income-comparison .difference {
  color: #e6a23c;
  font-weight: 600;
}

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
