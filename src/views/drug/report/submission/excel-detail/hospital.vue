<template>
  <div class="data-view-container">
    <!-- 搜索框 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索 医疗机构代码、机构名称、负责人..."
        clearable
        @input="handleSearch"
        style="width: 400px"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

  <el-table
    :data="filteredData"
    stripe
    max-height="calc(70vh - 120px)"
    v-loading="dataViewDialog.loading"
    :row-class-name="getRowClassName"
  >
    <el-table-column label="Excel行号" align="center" prop="excelRowNum" width="100" sortable>
      <template #default="{ row }">
        <div class="id-cell">
          <el-icon v-if="row.hasError" class="error-icon"><WarningFilled /></el-icon>
          <span>{{ row.excelRowNum || '-' }}</span>
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
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { WarningFilled, Search } from '@element-plus/icons-vue'

// 定义组件名称
defineOptions({ name: 'Hospital' })

interface Props {
  dataViewDialog?: {
    data: any[]
    loading: boolean
  }
}

const props = defineProps<Props>()

// 搜索关键字
const searchKeyword = ref('')

// 过滤后的数据
const filteredData = computed(() => {
  if (!props.dataViewDialog?.data) return []
  
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return props.dataViewDialog.data
  
  return props.dataViewDialog.data.filter(row => {
    return (
      (row.hospitalCode && row.hospitalCode.toLowerCase().includes(keyword)) ||
      (row.organizationName && row.organizationName.toLowerCase().includes(keyword)) ||
      (row.unitManager && row.unitManager.toLowerCase().includes(keyword)) ||
      (row.statisticsManager && row.statisticsManager.toLowerCase().includes(keyword)) ||
      (row.organizationCode && row.organizationCode.toLowerCase().includes(keyword))
    )
  })
})

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

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
  if (!amount) return '0.00'
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

.data-view-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-bar {
  padding: 0 4px;
}
</style>
