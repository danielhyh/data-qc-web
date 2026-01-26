<template>
  <div class="post-qc-statistics">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="16" class="statistics-cards">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card total">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalRules }}</div>
              <div class="stat-label">后置质控规则数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card error">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><WarningFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalErrorOrgs }}</div>
              <div class="stat-label">错误机构数（去重）</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card suggested-return">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><CircleClose /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalSuggestedReturnOrgs }}</div>
              <div class="stat-label">建议退回机构数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 阈值提示 -->
    <el-alert
      title="⚠️ 建议退回阈值：二三级医院错误率 ≥ 5%，基层医院错误率 ≥ 55%"
      type="warning"
      :closable="false"
      class="threshold-alert"
    />

    <!-- 规则详情区（折叠面板） -->
    <ContentWrap title="后置质控规则详情" class="mt-16px">
      <el-collapse v-model="activeRules" v-loading="loading">
        <el-collapse-item 
          v-for="rule in ruleStatistics" 
          :key="rule.ruleCode" 
          :name="rule.ruleCode"
          @click="loadRuleErrorDetail(rule.ruleCode)"
        >
          <template #title>
            <div class="rule-header">
              <div class="rule-title">
                <el-tag type="primary" size="large">{{ rule.ruleCode }}</el-tag>
                <span class="rule-name">{{ rule.ruleName }}</span>
              </div>
              <div class="rule-stats">
                <el-tag type="danger" size="small">
                  错误记录: {{ rule.totalErrorRecords }}
                </el-tag>
              </div>
            </div>
          </template>

          <!-- 规则描述 -->
          <div class="rule-description" v-if="rule.ruleDescription">
            <el-alert :title="rule.ruleDescription" type="info" :closable="false" />
          </div>

          <!-- 错误数据列表（虚拟列表） -->
          <div class="virtual-table-container mt-12px" v-loading="ruleDetailLoading[rule.ruleCode]">
            <el-auto-resizer v-if="ruleErrorDetails[rule.ruleCode]">
              <template #default="{ height, width }">
                <el-table-v2
                  :columns="getErrorDataColumns(rule.ruleCode)"
                  :data="ruleErrorDetails[rule.ruleCode]?.errorDataList || []"
                  :width="width"
                  :height="Math.min(height, 500)"
                  :row-height="50"
                  fixed
                />
              </template>
            </el-auto-resizer>
            <el-empty v-else description="暂无错误数据" />
          </div>
        </el-collapse-item>
      </el-collapse>

      <!-- 空状态 -->
      <el-empty 
        v-if="!loading && ruleStatistics.length === 0" 
        description="暂无后置质控数据"
      />
    </ContentWrap>

    <!-- 机构汇总区 -->
    <ContentWrap title="错误机构汇总列表" class="mt-16px">
      <div class="virtual-table-container" v-loading="orgSummaryLoading">
        <el-auto-resizer v-if="orgSummary.length > 0">
          <template #default="{ height, width }">
            <el-table-v2
              :columns="orgSummaryColumns"
              :data="orgSummary"
              :width="width"
              :height="Math.min(height, 600)"
              :row-height="50"
              fixed
            />
          </template>
        </el-auto-resizer>
        <el-empty v-else description="暂无错误机构" />
      </div>
    </ContentWrap>
  </div>

  <!-- 机构错误详情弹框（复用QcErrorGroupedDialog） -->
  <QcErrorGroupedDialog
    v-model="errorDialog.visible"
    :task-id="errorDialog.taskId"
    :table-type="errorDialog.tableType"
    :file-name="errorDialog.fileName"
    :error-type="1"
  />
</template>

<script setup lang="tsx">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Document, WarningFilled, CircleClose, Warning } from '@element-plus/icons-vue'
import { Column, TableV2FixedDir } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { getRuleList, getRuleErrorDetail, getOrgSummary, returnOrg, type PostQcRuleStatistics } from '@/api/drug/postqc'
import QcErrorGroupedDialog from '@/views/drug/report/submission/components/QcErrorGroupedDialog.vue'
import { useMessage } from '@/hooks/web/useMessage'

defineOptions({ name: 'PostQcStatistics' })

const route = useRoute()
const message = useMessage()

const loading = ref(false)
const ruleStatistics = ref<PostQcRuleStatistics[]>([])
const activeRules = ref<string[]>([]) // 展开的规则
const ruleErrorDetails = ref<Record<string, any>>({}) // 规则错误详情缓存
const ruleDetailLoading = ref<Record<string, boolean>>({}) // 规则详情加载状态
const orgSummary = ref<any[]>([]) // 机构汇总列表
const orgSummaryLoading = ref(false)
const errorDialog = ref({
  visible: false,
  taskId: 0,
  tableType: '',
  fileName: ''
})

// 总规则数
const totalRules = computed(() => ruleStatistics.value.length)

// 总错误机构数（去重）
const totalErrorOrgs = computed(() => {
  const orgSet = new Set<number>()
  orgSummary.value.forEach(org => orgSet.add(org.taskId))
  return orgSet.size
})

// 总建议退回机构数
const totalSuggestedReturnOrgs = computed(() => {
  return orgSummary.value.filter(org => org.suggestedReturn).length
})

// 获取等级标签类型
const getLevelTagType = (level: number) => {
  switch (level) {
    case 3: return 'danger'  // 三级
    case 2: return 'warning' // 二级
    case 1: return 'success' // 基层
    default: return 'info'
  }
}

// 获取错误率标签类型
const getErrorRateType = (errorRate: number, hospitalLevel: number) => {
  if (!errorRate) return 'success'
  
  // 三级、二级：错误率 >= 5% 为danger
  if (hospitalLevel === 3 || hospitalLevel === 2) {
    return errorRate >= 5 ? 'danger' : errorRate >= 2 ? 'warning' : 'success'
  }
  // 基层：错误率 >= 55% 为danger
  else if (hospitalLevel === 1) {
    return errorRate >= 55 ? 'danger' : errorRate >= 30 ? 'warning' : 'success'
  }
  
  return 'info'
}

// 定义错误数据列
const getErrorDataColumns = (ruleCode: string): Column[] => [
  {
    dataKey: 'index',
    title: '序号',
    width: 60,
    align: 'center',
    cellRenderer: ({ rowIndex }: any) => rowIndex + 1
  },
  {
    dataKey: 'deptName',
    title: '机构名称',
    width: 250,
    cellRenderer: ({ cellData }: any) => (
      <div class="text-ellipsis" title={cellData}>
        {cellData}
      </div>
    )
  },
  {
    dataKey: 'hospitalLevelName',
    title: '等级',
    width: 120,
    align: 'center',
    cellRenderer: ({ rowData }: any) => (
      <el-tag type={getLevelTagType(rowData.hospitalLevel)} size="small">
        {rowData.hospitalLevelName}
      </el-tag>
    )
  },
  {
    dataKey: 'errorMessage',
    title: '错误信息',
    width: 300,
    cellRenderer: ({ cellData }: any) => (
      <div class="text-ellipsis" title={cellData}>
        {cellData || '-'}
      </div>
    )
  },
  {
    dataKey: 'errorReason',
    title: '错误原因',
    width: 350,
    cellRenderer: ({ cellData }: any) => (
      <div class="text-ellipsis" title={cellData}>
        {cellData || '-'}
      </div>
    )
  },
  {
    dataKey: 'errorRecords',
    title: '错误记录数',
    width: 110,
    align: 'center',
    cellRenderer: ({ cellData }: any) => (
      <span class="error-text">{cellData}</span>
    )
  },
  {
    dataKey: 'totalRecords',
    title: '总记录数',
    width: 100,
    align: 'center'
  },
  {
    dataKey: 'errorRate',
    title: '错误率',
    width: 100,
    align: 'center',
    cellRenderer: ({ cellData, rowData }: any) => (
      <el-tag type={getErrorRateType(cellData, rowData.hospitalLevel)}>
        {cellData?.toFixed(2) || 0}%
      </el-tag>
    )
  }
]

// 定义机构汇总列
const orgSummaryColumns: Column[] = [
  {
    dataKey: 'index',
    title: '序号',
    width: 60,
    align: 'center',
    cellRenderer: ({ rowIndex }: any) => rowIndex + 1
  },
  {
    dataKey: 'deptName',
    title: '机构名称',
    width: 250,
    cellRenderer: ({ cellData }: any) => (
      <div class="text-ellipsis" title={cellData}>
        {cellData}
      </div>
    )
  },
  {
    dataKey: 'hospitalLevelName',
    title: '等级',
    width: 120,
    align: 'center',
    cellRenderer: ({ rowData }: any) => (
      <el-tag type={getLevelTagType(rowData.hospitalLevel)} size="small">
        {rowData.hospitalLevelName}
      </el-tag>
    )
  },
  {
    dataKey: 'totalRecords',
    title: '总记录数',
    width: 100,
    align: 'center'
  },
  {
    dataKey: 'errorRecords',
    title: '错误记录数',
    width: 110,
    align: 'center',
    cellRenderer: ({ cellData }: any) => (
      <span class="error-text">{cellData}</span>
    )
  },
  {
    dataKey: 'errorRate',
    title: '错误率',
    width: 100,
    align: 'center',
    cellRenderer: ({ cellData, rowData }: any) => (
      <el-tag type={getErrorRateType(cellData, rowData.hospitalLevel)}>
        {cellData?.toFixed(2) || 0}%
      </el-tag>
    )
  },
  {
    dataKey: 'suggestedReturn',
    title: '是否建议退回',
    width: 120,
    align: 'center',
    cellRenderer: ({ cellData }: any) => (
      <el-tag type={cellData ? 'danger' : 'success'}>
        {cellData ? '是' : '否'}
      </el-tag>
    )
  },
  {
    dataKey: 'actions',
    title: '操作',
    width: 200,
    align: 'center',
    fixed: TableV2FixedDir.RIGHT,
    cellRenderer: ({ rowData }: any) => (
      <div class="action-buttons">
        <el-button 
          type="primary" 
          link 
          onClick={() => viewOrgErrors(rowData)}
        >
          <el-icon><Warning /></el-icon>
          查看错误
        </el-button>
        <el-button 
          type="danger" 
          link 
          onClick={() => handleReturnOrg(rowData)}
        >
          退回
        </el-button>
      </div>
    )
  }
]

// 懒加载规则错误详情
const loadRuleErrorDetail = async (ruleCode: string) => {
  // 如果已经加载过，不重复加载
  if (ruleErrorDetails.value[ruleCode]) {
    return
  }
  
  const reportId = Number(route.query.reportTaskId)
  if (!reportId) {
    message.error('缺少报送任务ID')
    return
  }
  
  ruleDetailLoading.value[ruleCode] = true
  try {
    const result = await getRuleErrorDetail(reportId, ruleCode)
    ruleErrorDetails.value[ruleCode] = result
  } catch (error) {
    console.error('加载规则错误详情失败:', error)
    message.error('加载规则错误详情失败')
  } finally {
    ruleDetailLoading.value[ruleCode] = false
  }
}

// 查看机构错误详情
const viewOrgErrors = (row: any) => {
  errorDialog.value = {
    visible: true,
    taskId: row.taskId,
    tableType: 'all', // 显示所有表的错误
    fileName: `${row.deptName} - 后置质控错误`
  }
}

// 退回机构
const handleReturnOrg = async (row: any) => {
  try {
    await message.confirm(`确定要退回机构【${row.deptName}】吗？`)
    const reason = await message.prompt('请输入退回原因', '退回原因')
    if (!reason) {
      message.warning('请输入退回原因')
      return
    }
    
    await returnOrg(row.taskId, reason)
    message.success('退回成功')
    // 刷新数据
    loadOrgSummary()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('退回失败:', error)
      message.error('退回失败')
    }
  }
}

// 加载规则统计数据
const loadRuleStatistics = async () => {
  const reportId = Number(route.query.reportTaskId)
  if (!reportId) {
    message.error('缺少报送任务ID')
    return
  }
  
  loading.value = true
  try {
    const result = await getRuleList(reportId)
    ruleStatistics.value = result.rules || []
    
    // 默认展开第一条规则
    if (ruleStatistics.value.length > 0) {
      activeRules.value = [ruleStatistics.value[0].ruleCode]
      // 加载第一条规则的详情
      loadRuleErrorDetail(ruleStatistics.value[0].ruleCode)
    }
  } catch (error) {
    console.error('加载规则统计数据失败:', error)
    message.error('加载规则统计数据失败')
  } finally {
    loading.value = false
  }
}

// 加载机构汇总数据
const loadOrgSummary = async () => {
  const reportId = Number(route.query.reportTaskId)
  if (!reportId) {
    return
  }
  
  orgSummaryLoading.value = true
  try {
    const result = await getOrgSummary(reportId)
    orgSummary.value = result.orgList || []
  } catch (error) {
    console.error('加载机构汇总数据失败:', error)
    message.error('加载机构汇总数据失败')
  } finally {
    orgSummaryLoading.value = false
  }
}

onMounted(() => {
  loadRuleStatistics()
  loadOrgSummary()
})
</script>

<style scoped lang="scss">
.post-qc-statistics {
  padding: 16px;
}

.statistics-cards {
  .stat-card {
    :deep(.el-card__body) {
      padding: 20px;
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
      }

      .stat-info {
        flex: 1;

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
        }
      }
    }

    &.total {
      .stat-icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
      }
      .stat-value {
        color: #667eea;
      }
    }

    &.error {
      .stat-icon {
        background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
        color: #fff;
      }
      .stat-value {
        color: #f56c6c;
      }
    }

    &.suggested-return {
      .stat-icon {
        background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
        color: #fff;
      }
      .stat-value {
        color: #e6a23c;
      }
    }
  }
}

.threshold-alert {
  margin-top: 16px;
  font-size: 15px;
  font-weight: 600;
  
  :deep(.el-alert__title) {
    font-size: 15px;
  }
}

.rule-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 20px;

  .rule-title {
    display: flex;
    align-items: center;
    gap: 12px;

    .rule-name {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .rule-stats {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.rule-description {
  margin-bottom: 12px;
}

.error-text {
  color: #f56c6c;
  font-weight: 600;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.virtual-table-container {
  width: 100%;
  height: 500px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

:deep(.el-collapse-item__header) {
  height: auto;
  padding: 16px 0;
  line-height: 1.5;
}

:deep(.el-collapse-item__content) {
  padding-bottom: 16px;
}
</style>
