<template>
  <Dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="1100px"
    :close-on-click-modal="false"
    destroy-on-close
    class="qc-error-grouped-dialog"
  >
    <div v-loading="loading" class="qc-error-content">
      <!-- 顶部统计信息（参考上传校验弹框样式） -->
      <div class="validation-error-header" :class="{ 'warning-mode': isWarningMode }" v-if="errorData">
        <div class="header-info">
          <el-icon :class="['header-icon', isWarningMode ? 'warning' : 'error']">
            <WarningFilled v-if="isWarningMode" />
            <CircleCloseFilled v-else />
          </el-icon>
          <div class="header-content">
            <h3 class="header-title">{{ props.fileName }}</h3>
            <p class="header-subtitle">
              共 <span class="total-rows">{{ errorData.totalRows }}</span> 行数据，
              发现 <span :class="isWarningMode ? 'warning-count-text' : 'error-count-text'">{{ errorData.affectedRows }}</span> 处{{ isWarningMode ? '警告' : '错误' }}
              （涉及 <span :class="isWarningMode ? 'warning-rows-text' : 'error-rows-text'">{{ errorData.errorRuleCount }}</span> 条规则）
            </p>
          </div>
        </div>
        <div class="header-stats">
          <div class="pass-rate-badge" :class="isWarningMode ? 'good' : getPassRateBadgeClass(errorData.passRate)">
            <span class="rate-value">{{ isWarningMode ? '100.00' : errorData.passRate?.toFixed(2) }}%</span>
            <span class="rate-label">通过率</span>
          </div>
        </div>
      </div>

      <!-- 按规则分组的错误列表 -->
      <div class="rule-groups" v-if="errorData?.ruleGroups?.length">
        <div 
          v-for="(ruleGroup, ruleIndex) in errorData.ruleGroups" 
          :key="ruleGroup.ruleId"
          class="rule-group"
        >
          <!-- 规则标题 -->
          <div class="rule-header" @click="toggleRuleExpand(ruleIndex)">
            <div class="rule-title">
              <el-icon class="expand-icon" :class="{ expanded: expandedRules.includes(ruleIndex) }">
                <ArrowRight />
              </el-icon>
              <span class="rule-name">{{ ruleGroup.ruleName }}</span>
              <el-tag :type="isWarningMode ? 'warning' : 'danger'" size="small" class="error-badge">
                {{ ruleGroup.errorCount }} 个{{ isWarningMode ? '警告' : '错误' }}
              </el-tag>
              <el-tag type="info" size="small" class="row-badge">
                影响 {{ ruleGroup.affectedRows }} 行
              </el-tag>
            </div>
          </div>
          
          <!-- 规则说明 -->
          <div class="rule-description" v-if="ruleGroup.ruleDescription && expandedRules.includes(ruleIndex)">
            {{ ruleGroup.ruleDescription }}
          </div>

          <!-- 错误详情列表 -->
          <div class="error-groups" v-show="expandedRules.includes(ruleIndex)">
            <div 
              v-for="(errorGroup, errorIndex) in ruleGroup.errorGroups" 
              :key="errorIndex"
              class="error-group"
            >
              <div class="error-message">
                <el-icon class="error-icon"><WarningFilled /></el-icon>
                <span>{{ errorGroup.errorMessage }}</span>
              </div>
              <!-- 错误行数据展示 -->
              <!-- 如果rowNumbers只包含0，说明是统计类规则，不显示行号列表 -->
              <div class="row-data-list" v-if="!isStatisticalError(errorGroup.rowNumbers)">
                <div 
                  v-for="rowNum in errorGroup.rowNumbers" 
                  :key="rowNum"
                  class="row-data-item"
                >
                  <div class="row-header" @click="toggleRowExpand(ruleIndex, errorIndex, rowNum)">
                    <el-icon class="row-expand-icon" :class="{ expanded: isRowExpanded(ruleIndex, errorIndex, rowNum) }">
                      <ArrowRight />
                    </el-icon>
                    <span class="row-label">第 {{ rowNum }} 行</span>
                    <span class="row-preview" v-if="getCachedRowData(rowNum)">
                      {{ getRowPreview(getCachedRowData(rowNum)!) }}
                    </span>
                    <el-icon v-if="isRowLoading(rowNum)" class="is-loading row-loading-icon">
                      <Loading />
                    </el-icon>
                  </div>
                  <!-- 行详细数据 -->
                  <div 
                    class="row-detail" 
                    v-if="isRowExpanded(ruleIndex, errorIndex, rowNum)"
                  >
                    <div v-if="isRowLoading(rowNum)" class="row-loading">
                      <el-icon class="is-loading"><Loading /></el-icon>
                      <span>加载中...</span>
                    </div>
                    <el-descriptions v-else-if="getCachedRowData(rowNum)" :column="2" border size="small">
                      <el-descriptions-item 
                        v-for="(value, key) in getCachedRowData(rowNum)" 
                        :key="key"
                        :label="getFieldLabel(key as string)"
                      >
                        {{ formatFieldValue(value) }}
                      </el-descriptions-item>
                    </el-descriptions>
                    <div v-else class="row-no-data">暂无数据</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无错误提示 -->
      <el-empty v-else-if="!loading" description="暂无质控错误" />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button 
          type="primary" 
          @click="exportErrors" 
          :icon="Download" 
          :loading="exporting"
          v-if="errorData?.errorGroupCount"
        >
          导出错误清单
        </el-button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Download, ArrowRight, WarningFilled, CircleCloseFilled, Loading } from '@element-plus/icons-vue'
import { ReportDataApi, QcErrorGroupedVO } from '@/api/drug/reportdata'
import { useMessage } from '@/hooks/web/useMessage'
import download from '@/utils/download'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  taskId: { type: Number, required: true },
  tableType: { type: String, required: true },
  fileName: { type: String, default: '' },
  errorType: { type: Number, default: 1 } // 1=错误，2=警告
})

const emit = defineEmits(['update:modelValue'])
const message = useMessage()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 是否为警告模式
const isWarningMode = computed(() => props.errorType === 2)

const dialogTitle = computed(() => {
  const typeLabel = isWarningMode.value ? '质控警告详情' : '质控错误详情'
  return props.fileName ? `${typeLabel} - ${props.fileName}` : typeLabel
})

const loading = ref(false)
const exporting = ref(false)
const errorData = ref<QcErrorGroupedVO | null>(null)
const expandedRules = ref<number[]>([])
const expandedRows = ref<Set<string>>(new Set())
const rowDataCache = ref<Map<string, Record<string, any>>>(new Map()) // 行数据缓存
const loadingRows = ref<Set<string>>(new Set()) // 正在加载的行

// 字段中英文映射（与数据库实际字段对应）
const fieldLabelMap: Record<string, string> = {
  // 通用字段（数据库下划线格式）
  excel_row_num: 'Excel行号',
  upload_date: '数据上报日期',
  domain_code: '省级行政区划代码',
  organization_code: '组织机构代码',
  hospital_code: '医疗机构代码',
  hospital_drug_id: '院内药品唯一码',
  ypid: '国家药品编码（YPID）',
  
  // 医疗机构表字段
  hospital_name: '医疗机构名称',
  hospital_level: '医院等级',
  hospital_type: '医院类型',
  hospital_nature: '医院性质',
  hospital_address: '医院地址',
  hospital_phone: '联系电话',
  hospital_email: '电子邮箱',
  
  // 药品目录表字段
  product_name: '产品名称',
  drug_name: '药品通用名',
  trade_name: '商品名',
  trade_name_en: '商品名（英文）',
  approval_number: '批准文号',
  manufacturer: '生产企业',
  drug_form: '剂型名称',
  drug_spec: '制剂规格',
  dosage_unit: '制剂单位',
  pack_unit: '最小销售包装单位',
  conversion_factor: '转换系数',
  is_basic_drug: '是否基本药物',
  
  // 入库表字段
  inbound_total_amount: '入库总金额（元）',
  inbound_pack_quantity: '入库数量（最小销售包装单位）',
  inbound_dosage_quantity: '入库数量（最小制剂单位）',
  
  // 出库表字段
  province_drug_code: '省级药品编码',
  province_drug_id: '省级药品编码',
  outbound_pack_quantity: '出库数量（最小销售包装单位）',
  outbound_dosage_quantity: '出库数量（最小制剂单位）',
  
  // 使用表字段
  use_quantity: '使用数量',
  use_amount: '使用金额',
  use_date: '使用日期',
  dept_name: '科室名称'
}

// 加载数据
const loadData = async () => {
  if (!props.taskId || !props.tableType) return
  loading.value = true
  try {
    errorData.value = await ReportDataApi.getQcErrorsGrouped(props.taskId, props.tableType, props.errorType)
    // 默认展开所有规则
    if (errorData.value?.ruleGroups) {
      expandedRules.value = errorData.value.ruleGroups.map((_, index) => index)
    }
  } catch (error) {
    console.error('加载质控错误失败:', error)
    message.error('加载质控错误失败')
  } finally {
    loading.value = false
  }
}

// 切换规则展开/折叠
const toggleRuleExpand = (index: number) => {
  const idx = expandedRules.value.indexOf(index)
  if (idx > -1) {
    expandedRules.value.splice(idx, 1)
  } else {
    expandedRules.value.push(index)
  }
}

// 判断是否为统计类错误（行号为0或空表示整体统计，不是具体某一行的问题）
const isStatisticalError = (rowNumbers: number[]) => {
  if (!rowNumbers || rowNumbers.length === 0) return true
  // 如果只有一个行号且为0，说明是统计类规则
  if (rowNumbers.length === 1 && rowNumbers[0] === 0) return true
  return false
}

// 生成行展开的唯一key
const getRowKey = (ruleIndex: number, errorIndex: number, rowNum: number) => {
  return `${ruleIndex}-${errorIndex}-${rowNum}`
}

// 生成行数据缓存的key
const getRowDataCacheKey = (rowNum: number) => {
  return `${props.taskId}-${props.tableType}-${rowNum}`
}

// 切换行展开/折叠（懒加载）
const toggleRowExpand = async (ruleIndex: number, errorIndex: number, rowNum: number) => {
  const key = getRowKey(ruleIndex, errorIndex, rowNum)
  if (expandedRows.value.has(key)) {
    expandedRows.value.delete(key)
  } else {
    expandedRows.value.add(key)
    // 懒加载：如果缓存中没有该行数据，则请求
    const cacheKey = getRowDataCacheKey(rowNum)
    if (!rowDataCache.value.has(cacheKey) && !loadingRows.value.has(cacheKey)) {
      loadingRows.value.add(cacheKey)
      try {
        const rowData = await ReportDataApi.getErrorRowData(props.taskId, props.tableType, rowNum)
        rowDataCache.value.set(cacheKey, rowData)
      } catch (error) {
        console.error('加载行数据失败:', error)
        message.error('加载行数据失败')
      } finally {
        loadingRows.value.delete(cacheKey)
      }
    }
  }
}

// 检查行是否展开
const isRowExpanded = (ruleIndex: number, errorIndex: number, rowNum: number) => {
  return expandedRows.value.has(getRowKey(ruleIndex, errorIndex, rowNum))
}

// 检查行数据是否正在加载
const isRowLoading = (rowNum: number) => {
  return loadingRows.value.has(getRowDataCacheKey(rowNum))
}

// 获取缓存的行数据
const getCachedRowData = (rowNum: number) => {
  return rowDataCache.value.get(getRowDataCacheKey(rowNum))
}

// 获取字段中文标签
const getFieldLabel = (key: string) => {
  return fieldLabelMap[key] || key
}

// 格式化字段值
const formatFieldValue = (value: any) => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') return value.toString()
  return value
}

// 获取行数据预览（显示前几个关键字段）
const getRowPreview = (rowData: Record<string, any>) => {
  if (!rowData) return ''
  // 按优先级尝试不同的字段名（兼容不同表类型，使用数据库下划线格式）
  const previewFields = [
    'product_name',       // 产品名称
    'drug_name',          // 药品通用名
    'hospital_drug_id',   // 院内药品唯一码
    'hospital_name',      // 医疗机构名称
    'ypid',               // YPID
    'upload_date'         // 上报日期
  ]
  const previews: string[] = []
  const usedLabels = new Set<string>()
  
  for (const field of previewFields) {
    if (rowData[field]) {
      const label = fieldLabelMap[field] || field
      // 避免重复显示相同标签
      if (!usedLabels.has(label)) {
        previews.push(`${label}: ${rowData[field]}`)
        usedLabels.add(label)
        if (previews.length >= 2) break
      }
    }
  }
  return previews.join(' | ')
}

// 获取通过率样式（用于文字颜色）
const getPassRateClass = (rate: number) => {
  if (rate >= 95) return 'pass-rate-good'
  if (rate >= 80) return 'pass-rate-warning'
  return 'pass-rate-bad'
}

// 获取通过率徽章样式（用于徽章背景）
const getPassRateBadgeClass = (rate: number) => {
  if (rate >= 80) return 'good'
  if (rate >= 50) return 'warning'
  return 'bad'
}

// 导出错误
const exportErrors = async () => {
  exporting.value = true
  try {
    const data = await ReportDataApi.exportErrors(props.taskId, props.tableType)
    download.excel(data, `质控错误清单_${props.fileName || props.tableType}.xlsx`)
    message.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败')
  } finally {
    exporting.value = false
  }
}

watch(() => props.modelValue, (val) => {
  if (val) {
    loadData()
  } else {
    errorData.value = null
    expandedRules.value = []
    expandedRows.value.clear()
    rowDataCache.value.clear()
    loadingRows.value.clear()
  }
})
</script>

<style scoped lang="scss">
.qc-error-grouped-dialog {
  :deep(.el-dialog__body) {
    max-height: 70vh;
    overflow-y: auto;
    padding: 16px 20px;
  }
}

.qc-error-content {
  min-height: 200px;
}

// 顶部统计信息样式（参考上传校验弹框）
.validation-error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #fff5f5 0%, #fff 100%);
  border: 1px solid #fde2e2;
  border-radius: 8px;
  margin-bottom: 16px;

  // 警告模式样式
  &.warning-mode {
    background: linear-gradient(135deg, #fdf6ec 0%, #fff 100%);
    border: 1px solid #f5dab1;
  }

  .header-info {
    display: flex;
    align-items: center;
    gap: 16px;

    .header-icon {
      font-size: 40px;

      &.error {
        color: #f56c6c;
      }
      
      &.warning {
        color: #e6a23c;
      }
    }

    .header-content {
      .header-title {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .header-subtitle {
        margin: 0;
        font-size: 14px;
        color: #606266;

        .total-rows {
          color: #303133;
          font-weight: 600;
        }

        .error-count-text,
        .error-rows-text {
          color: #f56c6c;
          font-weight: 600;
        }
        
        .warning-count-text,
        .warning-rows-text {
          color: #e6a23c;
          font-weight: 600;
        }
      }
    }
  }

  .header-stats {
    .pass-rate-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 20px;
      border-radius: 8px;
      min-width: 80px;

      &.good {
        background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
        border: 1px solid #c2e7b0;

        .rate-value {
          color: #67c23a;
        }
      }

      &.warning {
        background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
        border: 1px solid #f5dab1;

        .rate-value {
          color: #e6a23c;
        }
      }

      &.bad {
        background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
        border: 1px solid #fbc4c4;

        .rate-value {
          color: #f56c6c;
        }
      }

      .rate-value {
        font-size: 24px;
        font-weight: 700;
        line-height: 1.2;
      }

      .rate-label {
        font-size: 12px;
        color: #909399;
        margin-top: 2px;
      }
    }
  }
}

.rule-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-group {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;

  .rule-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: #fafafa;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #f0f2f5;
    }

    .rule-title {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;

      .expand-icon {
        transition: transform 0.2s;
        color: #909399;

        &.expanded {
          transform: rotate(90deg);
        }
      }

      .rule-name {
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }

      .error-badge {
        margin-left: 8px;
      }

      .row-badge {
        margin-left: 4px;
      }
    }
  }

  .rule-description {
    padding: 8px 16px 8px 40px;
    font-size: 13px;
    color: #909399;
    background: #fafafa;
    border-bottom: 1px solid #e4e7ed;
  }

  .error-groups {
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .error-group {
    padding: 12px;
    background: #fff8f8;
    border: 1px solid #fde2e2;
    border-radius: 6px;

    .error-message {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 12px;
      font-size: 14px;
      color: #303133;
      line-height: 1.5;

      .error-icon {
        color: #f56c6c;
        margin-top: 2px;
        flex-shrink: 0;
      }
    }

    .row-data-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-left: 24px;

      .row-data-item {
        background: #fff;
        border: 1px solid #e4e7ed;
        border-radius: 4px;
        overflow: hidden;

        .row-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          cursor: pointer;
          transition: background 0.2s;

          &:hover {
            background: #f5f7fa;
          }

          .row-expand-icon {
            font-size: 12px;
            color: #909399;
            transition: transform 0.2s;

            &.expanded {
              transform: rotate(90deg);
            }
          }

          .row-label {
            font-size: 13px;
            font-weight: 500;
            color: #606266;
            min-width: 60px;
          }

          .row-preview {
            font-size: 12px;
            color: #909399;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
          }

          .row-loading-icon {
            color: #409eff;
            margin-left: auto;
          }
        }

        .row-detail {
          padding: 12px;
          background: #fafafa;
          border-top: 1px solid #e4e7ed;

          .row-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 20px;
            color: #909399;
            font-size: 13px;
          }

          .row-no-data {
            text-align: center;
            padding: 20px;
            color: #909399;
            font-size: 13px;
          }

          :deep(.el-descriptions) {
            .el-descriptions__label {
              font-weight: 500;
              color: #606266;
              width: 140px;
            }

            .el-descriptions__content {
              color: #303133;
            }
          }
        }
      }
    }

    .row-numbers {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding-left: 24px;

      .row-tag {
        display: inline-block;
        padding: 2px 8px;
        font-size: 12px;
        color: #909399;
        background: #f4f4f5;
        border-radius: 4px;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
