<template>
  <Dialog title="填报数据预览" v-model="dialogVisible" width="1400px">
    <!-- 头部统计卡片 -->
    <div class="header-statistics" v-if="statistics">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card total">
            <div class="stat-icon">
              <Icon icon="ep:document" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.totalDrugs }}</div>
              <div class="stat-label">填报药品总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card success">
            <div class="stat-icon">
              <Icon icon="ep:circle-check" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.sufficientCount }}</div>
              <div class="stat-label">供应充足</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card warning">
            <div class="stat-icon">
              <Icon icon="ep:warning" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.shortageCount }}</div>
              <div class="stat-label">短缺药品</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card danger">
            <div class="stat-icon">
              <Icon icon="ep:circle-close" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.severeShortageCount }}</div>
              <div class="stat-label">严重短缺</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 数据表格 -->
    <div class="table-wrapper">
      <el-table
        :data="displayData"
        border
        max-height="500"
        :span-method="previewSpanMethod"
        :row-class-name="getRowClassName"
        class="preview-table"
      >
        <el-table-column
          label="序号"
          type="index"
          width="60"
          fixed
          align="center"
          class-name="header-bold"
        />
        <el-table-column
          label="药品分类"
          prop="drugCategory"
          width="150"
          class-name="header-bold category-column"
          show-overflow-tooltip
        />
        <el-table-column
          label="药品名称"
          prop="drugName"
          min-width="200"
          class-name="header-bold"
          show-overflow-tooltip
        />
        <el-table-column
          label="剂型"
          prop="dosageCategory"
          width="120"
          align="center"
          class-name="header-bold"
        />
        <el-table-column
          label="最小剂量单位"
          prop="dosageUnit"
          width="150"
          align="center"
          class-name="header-bold"
        >
          <template #default="scope">
            <el-tag type="info" size="small" v-if="scope.row.dosageUnit">
              {{ scope.row.dosageUnit }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          label="本周累计使用量"
          prop="weekUsageAmount"
          width="180"
          align="right"
          class-name="header-bold"
        >
          <template #header>
            <div class="custom-header">
              <span>本周累计使用量</span>
              <el-tooltip content="按最小剂量单位统计" placement="top">
                <Icon icon="ep:info-filled" class="header-icon" />
              </el-tooltip>
            </div>
          </template>
          <template #default="scope">
            <span class="number-value usage">{{ formatNumber(scope.row.weekUsageAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="当日实时库存量"
          prop="currentStockAmount"
          width="180"
          align="right"
          class-name="header-bold"
        >
          <template #header>
            <div class="custom-header">
              <span>当日实时库存量</span>
              <el-tooltip content="按最小剂量单位统计" placement="top">
                <Icon icon="ep:info-filled" class="header-icon" />
              </el-tooltip>
            </div>
          </template>
          <template #default="scope">
            <span class="number-value stock">{{ formatNumber(scope.row.currentStockAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="供应情况"
          prop="supplyStatus"
          width="120"
          align="center"
          class-name="header-bold"
        >
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.SUPPLY_STATUS" :value="scope.row.supplyStatus" />
          </template>
        </el-table-column>
        <el-table-column
          label="预计可用天数"
          width="120"
          align="center"
          class-name="header-bold"
        >
          <template #default="scope">
            <div class="stock-days" :class="getStockDaysClass(scope.row)">
              <Icon :icon="getStockDaysIcon(scope.row)" class="days-icon" />
              <span>{{ calculateStockDays(scope.row) }}</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 底部说明 -->
    <div class="footer-tips">
      <el-alert type="info" :closable="false">
        <template #title>
          <div class="tips-content">
            <span>📊 数据统计时间：{{ formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss') }}</span>
            <el-divider direction="vertical" />
            <span>📌 请仔细核对数据后再提交</span>
          </div>
        </template>
      </el-alert>
    </div>

    <template #footer>
      <el-button @click="handleExport" type="primary">
        <Icon icon="ep:download" class="mr-1" />
        导出数据
      </el-button>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { type ReportRecordVO } from '@/api/shortage'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'

interface Statistics {
  totalDrugs: number
  sufficientCount: number
  shortageCount: number
  severeShortageCount: number
}

const message = useMessage()
const dialogVisible = ref(false)
const displayData = ref<ReportRecordVO[]>([])

// 统计信息
const statistics = computed((): Statistics | null => {
  if (!displayData.value.length) return null

  return {
    totalDrugs: displayData.value.length,
    sufficientCount: displayData.value.filter(
      (item) => item.supplyStatus === 1 || item.supplyStatus === 2
    ).length,
    shortageCount: displayData.value.filter((item) => item.supplyStatus === 3).length,
    severeShortageCount: displayData.value.filter((item) => item.supplyStatus === 4).length
  }
})

// 打开对话框
const open = (data: ReportRecordVO[] = []) => {
  // 根据用量和库存字段来判断用户是否填报了数据（大于0）
  const filteredData = data.filter(item => 
    (item.weekUsageAmount !== undefined && item.weekUsageAmount !== null && item.weekUsageAmount > 0) ||
    (item.currentStockAmount !== undefined && item.currentStockAmount !== null && item.currentStockAmount > 0)
  )
  displayData.value = [...filteredData]
  dialogVisible.value = true
}

// 格式化数字
const formatNumber = (value: number | undefined): string => {
  if (value === undefined || value === null) return '0.00'
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 计算库存天数
const calculateStockDays = (row: ReportRecordVO): string => {
  const weekUsage = row.weekUsageAmount || 0
  const currentStock = row.currentStockAmount || 0

  if (weekUsage === 0) return '充足'

  const dailyUsage = weekUsage / 7
  if (dailyUsage === 0) return '充足'

  const days = Math.floor(currentStock / dailyUsage)

  if (days > 999) return '充足'
  if (days < 0) return '0天'
  return `${days}天`
}

// 获取库存天数样式类
const getStockDaysClass = (row: ReportRecordVO): string => {
  const weekUsage = row.weekUsageAmount || 0
  const currentStock = row.currentStockAmount || 0

  if (weekUsage === 0) return 'sufficient'

  const dailyUsage = weekUsage / 7
  const days = Math.floor(currentStock / dailyUsage)

  if (days > 30) return 'sufficient'
  if (days > 7) return 'warning'
  return 'danger'
}

// 获取库存天数图标
const getStockDaysIcon = (row: ReportRecordVO): string => {
  const className = getStockDaysClass(row)
  if (className === 'sufficient') return 'ep:circle-check-filled'
  if (className === 'warning') return 'ep:warning-filled'
  return 'ep:circle-close-filled'
}

// 获取行样式
const getRowClassName = ({ row }: { row: ReportRecordVO }): string => {
  if (row.supplyStatus === 4) return 'severe-shortage-row'
  if (row.supplyStatus === 3) return 'shortage-row'
  if (row.supplyStatus === 2) return 'warning-row'
  return ''
}

// 表格合并单元格方法
const previewSpanMethod = ({ row, column, rowIndex, columnIndex }) => {
  // 只对药品分类列进行合并（第2列，因为第1列是序号）
  if (columnIndex === 1) {
    const currentCategory = row.drugCategory
    const dataList = displayData.value

    if (!currentCategory || !dataList.length) {
      return { rowspan: 1, colspan: 1 }
    }

    // 找到当前分类的第一行
    let startIndex = -1
    for (let i = 0; i < dataList.length; i++) {
      if (dataList[i].drugCategory === currentCategory) {
        startIndex = i
        break
      }
    }

    // 计算当前分类的总行数
    const categoryCount = dataList.filter((item) => item.drugCategory === currentCategory).length

    if (rowIndex === startIndex) {
      // 第一行显示合并的单元格
      return {
        rowspan: categoryCount,
        colspan: 1
      }
    } else if (dataList[rowIndex]?.drugCategory === currentCategory) {
      // 同一分类的其他行不显示
      return {
        rowspan: 0,
        colspan: 0
      }
    }
  }

  return {
    rowspan: 1,
    colspan: 1
  }
}

// 导出数据
const handleExport = () => {
  // TODO: 实现导出功能
  message.info('导出功能开发中...')
}

defineExpose({ open })
</script>

<style scoped>
/* 统计卡片样式 */
.header-statistics {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
  border: 1px solid #e6e8eb;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-card.total {
  background: linear-gradient(135deg, #409eff15 0%, #409eff05 100%);
  border-color: #409eff30;
}

.stat-card.success {
  background: linear-gradient(135deg, #67c23a15 0%, #67c23a05 100%);
  border-color: #67c23a30;
}

.stat-card.warning {
  background: linear-gradient(135deg, #e6a23c15 0%, #e6a23c05 100%);
  border-color: #e6a23c30;
}

.stat-card.danger {
  background: linear-gradient(135deg, #f56c6c15 0%, #f56c6c05 100%);
  border-color: #f56c6c30;
}

.stat-icon {
  font-size: 32px;
  margin-right: 12px;
  opacity: 0.8;
}

.stat-card.total .stat-icon { color: #409eff; }
.stat-card.success .stat-icon { color: #67c23a; }
.stat-card.warning .stat-icon { color: #e6a23c; }
.stat-card.danger .stat-icon { color: #f56c6c; }

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  line-height: 1;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

/* 表格样式 */
.table-wrapper {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ebeef5;
}

.preview-table {
  font-size: 14px;
}

.preview-table :deep(.el-table__header) {
  background: linear-gradient(180deg, #f8f9fb 0%, #f5f7fa 100%);
}

.preview-table :deep(.header-bold .cell) {
  font-weight: 600;
  color: #303133;
}

.preview-table :deep(.category-column .cell) {
  background: #fafbfc;
  font-weight: 600;
  color: #409eff;
  font-size: 14px;
  vertical-align: middle;
}

/* 行样式 */
.preview-table :deep(.warning-row) {
  background-color: #fdf6ec;
}

.preview-table :deep(.shortage-row) {
  background-color: #fef0f0;
}

.preview-table :deep(.severe-shortage-row) {
  background-color: #fee;
}

/* 自定义表头 */
.custom-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.header-icon {
  color: #909399;
  font-size: 14px;
}

/* 数值样式 */
.number-value {
  font-weight: 600;
  font-size: 14px;
}

.number-value.usage {
  color: #409eff;
}

.number-value.stock {
  color: #67c23a;
}

/* 库存天数样式 */
.stock-days {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.stock-days.sufficient {
  color: #67c23a;
  background: #67c23a10;
}

.stock-days.warning {
  color: #e6a23c;
  background: #e6a23c10;
}

.stock-days.danger {
  color: #f56c6c;
  background: #f56c6c10;
}

.days-icon {
  font-size: 16px;
}

/* 底部提示 */
.footer-tips {
  margin-top: 16px;
}

.tips-content {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
}

/* 响应式调整 */
@media (max-width: 1440px) {
  .stat-card {
    padding: 12px;
  }

  .stat-value {
    font-size: 24px;
  }

  .stat-icon {
    font-size: 28px;
  }
}
</style>
