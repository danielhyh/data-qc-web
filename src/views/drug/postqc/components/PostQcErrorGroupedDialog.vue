<template>
  <Dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="1100px"
    :close-on-click-modal="false"
    destroy-on-close
    class="post-qc-error-grouped-dialog"
  >
    <div v-loading="loading" class="qc-error-content">
      <!-- 顶部统计信息 -->
      <div class="validation-error-header" v-if="errorData">
        <div class="header-info">
          <el-icon class="header-icon error">
            <CircleCloseFilled />
          </el-icon>
          <div class="header-content">
            <h3 class="header-title">{{ errorData.deptName }}</h3>
            <p class="header-subtitle">
              共发现 <span class="error-count-text">{{ errorData.totalErrors }}</span> 处错误
              （涉及 <span class="error-rows-text">{{ errorData.ruleGroups?.length || 0 }}</span> 条规则）
            </p>
          </div>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="exportErrors" :icon="Download">
            导出错误清单
          </el-button>
        </div>
      </div>

      <!-- 按规则分组的错误列表 -->
      <div class="rule-groups" v-if="errorData?.ruleGroups?.length">
        <div 
          v-for="(ruleGroup, ruleIndex) in errorData.ruleGroups" 
          :key="ruleGroup.ruleCode"
          class="rule-group"
        >
          <!-- 规则标题 -->
          <div class="rule-header" @click="toggleRuleExpand(ruleIndex)">
            <div class="rule-title">
              <el-icon class="expand-icon" :class="{ expanded: expandedRules.includes(ruleIndex) }">
                <ArrowRight />
              </el-icon>
              <el-tag type="primary" size="small">{{ ruleGroup.ruleCode }}</el-tag>
              <span class="rule-name">{{ ruleGroup.ruleName }}</span>
              
              <!-- 区分显示异常和警告 -->
              <template v-if="ruleGroup.executeAction === 'MARK_ANOMALY'">
                <el-tag type="danger" size="small" class="error-badge">
                  {{ ruleGroup.anomalyCount }} 个异常（错误）
                </el-tag>
              </template>
              <template v-else-if="ruleGroup.executeAction === 'WARNING'">
                <el-tag type="warning" size="small" class="error-badge">
                  {{ ruleGroup.warningCount }} 个疑似问题（警告）
                </el-tag>
              </template>
              <template v-else>
                <!-- 兼容旧数据：同时显示异常和警告 -->
                <el-tag v-if="ruleGroup.anomalyCount > 0" type="danger" size="small" class="error-badge">
                  {{ ruleGroup.anomalyCount }} 个异常
                </el-tag>
                <el-tag v-if="ruleGroup.warningCount > 0" type="warning" size="small" class="error-badge">
                  {{ ruleGroup.warningCount }} 个警告
                </el-tag>
              </template>
            </div>
          </div>
          
          <!-- 规则说明 -->
          <div class="rule-description" v-if="ruleGroup.ruleDescription && expandedRules.includes(ruleIndex)">
            {{ ruleGroup.ruleDescription }}
          </div>

          <!-- 错误详情列表 -->
          <div class="error-details" v-show="expandedRules.includes(ruleIndex)">
            <div 
              v-for="(errorDetail, errorIndex) in ruleGroup.errorDetails" 
              :key="errorIndex"
              class="error-detail-item"
            >
              <div class="error-message">
                <el-icon class="error-icon"><WarningFilled /></el-icon>
                <div class="error-content">
                  <div class="error-text">{{ errorDetail.errorMessage }}</div>
                  <div class="error-meta">
                    <el-tag type="info" size="small">{{ getTableTypeName(errorDetail.tableType) }}</el-tag>
                    <span v-if="errorDetail.excelRowNum" class="excel-row">
                      Excel行号: {{ errorDetail.excelRowNum }}
                    </span>
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
        <el-button type="primary" @click="exportErrors" :icon="Download">
          导出错误清单
        </el-button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ArrowRight, WarningFilled, CircleCloseFilled, Download } from '@element-plus/icons-vue'
import { getOrgPostQcErrorsGrouped, type PostQcOrgErrorGroupedVO } from '@/api/drug/postqc'
import { useMessage } from '@/hooks/web/useMessage'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  taskId: { type: Number, required: true },
  deptName: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])
const message = useMessage()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const dialogTitle = computed(() => {
  return props.deptName ? `后置质控错误详情 - ${props.deptName}` : '后置质控错误详情'
})

const loading = ref(false)
const errorData = ref<PostQcOrgErrorGroupedVO | null>(null)
const expandedRules = ref<number[]>([])

// 表类型映射
const tableTypeMap: Record<string, string> = {
  // 标准枚举类型
  USAGE_DEFAULT: '使用数据',
  INBOUND_DEFAULT: '入库数据',
  OUTBOUND_DEFAULT: '出库数据',
  CATALOG_DEFAULT: '目录数据',
  HOSPITAL_DEFAULT: '机构信息',
  
  // 原始表名映射
  drug_usage: '使用数据',
  drug_inbound: '入库数据',
  drug_outbound: '出库数据',
  drug_catalog: '目录数据',
  drug_hospital: '机构信息',
  
  // 带后缀的表名
  drug_usage_default: '使用数据',
  drug_inbound_default: '入库数据',
  drug_outbound_default: '出库数据',
  drug_catalog_default: '目录数据',
  drug_hospital_default: '机构信息'
}

// 获取表类型中文名（支持逗号分隔的多个表类型）
const getTableTypeName = (tableType: string) => {
  if (!tableType) return '未知'
  
  // 如果包含逗号，说明是多个表类型
  if (tableType.includes(',')) {
    const types = tableType.split(',').map(t => t.trim())
    const names = types.map(t => tableTypeMap[t] || t)
    return names.join('、')
  }
  
  // 单个表类型
  return tableTypeMap[tableType] || tableType
}

// 加载数据
const loadData = async () => {
  if (!props.taskId) return
  loading.value = true
  try {
    errorData.value = await getOrgPostQcErrorsGrouped(props.taskId)
    // 默认展开所有规则
    if (errorData.value?.ruleGroups) {
      expandedRules.value = errorData.value.ruleGroups.map((_, index) => index)
    }
  } catch (error) {
    console.error('加载后置质控错误失败:', error)
    message.error('加载后置质控错误失败')
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

// 导出错误清单
const exportErrors = () => {
  if (!errorData.value || !errorData.value.ruleGroups || errorData.value.ruleGroups.length === 0) {
    message.warning('暂无错误数据可导出')
    return
  }

  try {
    const timestamp = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\//g, '-').replace(/:/g, '-')

    // CSV表头（去除Excel行号列）
    let csvContent = '\uFEFF' // UTF-8 BOM
    csvContent += '序号,规则编码,规则名称,错误类型,表类型,错误详情\n'

    // 遍历所有规则组
    let rowIndex = 1
    errorData.value.ruleGroups.forEach(ruleGroup => {
      const errorType = ruleGroup.executeAction === 'MARK_ANOMALY' ? '异常（错误）' : '疑似问题（警告）'
      
      // 遍历该规则的所有错误详情
      ruleGroup.errorDetails.forEach(errorDetail => {
        const row = [
          rowIndex++,
          ruleGroup.ruleCode,
          ruleGroup.ruleName,
          errorType,
          getTableTypeName(errorDetail.tableType),
          `"${(errorDetail.errorMessage || '').replace(/"/g, '""')}"` // 转义双引号
        ].join(',')
        
        csvContent += row + '\n'
      })
    })

    // 创建Blob并下载
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `后置质控错误清单_${errorData.value.deptName}_${timestamp}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    message.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败，请重试')
  }
}

watch(() => props.modelValue, (val) => {
  if (val) {
    loadData()
  } else {
    errorData.value = null
    expandedRules.value = []
  }
})
</script>

<style scoped lang="scss">
.post-qc-error-grouped-dialog {
  :deep(.el-dialog__body) {
    max-height: 70vh;
    overflow-y: auto;
    padding: 16px 20px;
  }
}

.qc-error-content {
  min-height: 200px;
}

// 顶部统计信息样式
.validation-error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #fff5f5 0%, #fff 100%);
  border: 1px solid #fde2e2;
  border-radius: 8px;
  margin-bottom: 16px;

  .header-info {
    display: flex;
    align-items: center;
    gap: 16px;

    .header-icon {
      font-size: 40px;

      &.error {
        color: #f56c6c;
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

        .error-count-text,
        .error-rows-text {
          color: #f56c6c;
          font-weight: 600;
        }
      }
    }
  }

  .header-actions {
    flex-shrink: 0;
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
    }
  }

  .rule-description {
    padding: 8px 16px 8px 40px;
    font-size: 13px;
    color: #909399;
    background: #fafafa;
    border-bottom: 1px solid #e4e7ed;
  }

  .error-details {
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .error-detail-item {
    padding: 12px;
    background: #fff8f8;
    border: 1px solid #fde2e2;
    border-radius: 6px;

    .error-message {
      display: flex;
      align-items: flex-start;
      gap: 8px;

      .error-icon {
        color: #f56c6c;
        margin-top: 2px;
        flex-shrink: 0;
        font-size: 16px;
      }

      .error-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .error-text {
          font-size: 14px;
          color: #303133;
          line-height: 1.6;
          word-break: break-word;
        }

        .error-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;

          .excel-row {
            color: #909399;
          }
        }
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
