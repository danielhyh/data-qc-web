<template>
  <div class="post-qc-statistics">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="16" class="statistics-cards">
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card total">
          <div class="stat-content">
            <div class="stat-icon">
              <Icon icon="ep:document" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalRules }}</div>
              <div class="stat-label">后置质控规则数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card anomaly">
          <div class="stat-content">
            <div class="stat-icon">
              <Icon icon="ep:circle-close-filled" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalAnomalyRecords }}</div>
              <div class="stat-label">异常记录数（异常数据）</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card warning">
          <div class="stat-content">
            <div class="stat-icon">
              <Icon icon="ep:warning-filled" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalWarningRecords }}</div>
              <div class="stat-label">警告记录数（疑似问题）</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card error">
          <div class="stat-content">
            <div class="stat-icon">
              <Icon icon="ep:warning" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalErrorOrgs }}</div>
              <div class="stat-label">异常+警告机构数（去重）</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card anomaly-only">
          <div class="stat-content">
            <div class="stat-icon">
              <Icon icon="ep:circle-close" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalAnomalyOrgs }}</div>
              <div class="stat-label">仅异常机构数（去重）</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card suggested-return">
          <div class="stat-content">
            <div class="stat-icon">
              <Icon icon="ep:back" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalSuggestedReturnOrgs }}</div>
              <div class="stat-label">建议退回机构数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 类型说明和阈值提示 -->
    <el-alert title="💡 质控类型说明" type="info" :closable="false" class="type-explanation-alert">
      <template #default>
        <div class="type-explanation">
          <div class="type-item">
            <el-tag type="danger" size="small">异常数据（异常）</el-tag>
            <span>：计入质控错误条数，如价格超过100倍、三倍标准差异常等</span>
          </div>
          <div class="type-item">
            <el-tag type="warning" size="small">疑似问题（警告）</el-tag>
            <span>：需要人工核实，如金额为0（可能是免费药品）、环比异常（可能有合理原因）等</span>
          </div>
        </div>
      </template>
    </el-alert>

    <el-alert
      type="warning"
      :closable="false"
      class="threshold-alert"
    >
      <template #title>
        <div class="threshold-tip-content">
          <span class="tip-icon">💡</span>
          <span class="tip-text">
            <strong>质控标准：</strong>
            二级、三级医院异常率达到 <strong class="threshold-value">4%</strong> 时建议退回修改；
            基层医疗机构异常率达到 <strong class="threshold-value">40%</strong> 时建议退回修改
            <span class="tip-note">（异常率仅统计标记为"异常"的数据，不包含"警告"提示）</span>
          </span>
        </div>
      </template>
    </el-alert>

    <!-- 批量操作按钮 -->
    <div class="batch-actions mb-16px">
      <el-button
        type="danger"
        :disabled="totalSuggestedReturnOrgs === 0"
        :loading="batchReturnLoading"
        @click="handleBatchReturnSuggested"
      >
        <Icon icon="ep:close" class="mr-1" />
        批量退回（建议退回+POST_QC_014+POST_QC_015）
      </el-button>
      <el-button
        type="danger"
        plain
        :disabled="totalAnomalyOrgs === 0"
        :loading="batchReturnAllLoading"
        @click="handleBatchReturnAllErrors"
      >
        <Icon icon="ep:warning" class="mr-1" />
        批量退回所有错误机构(仅异常) ({{ totalAnomalyOrgs }})
      </el-button>
      <el-button
        type="primary"
        :disabled="totalAnomalyOrgs === 0"
        @click="handleViewCityStatistics"
      >
        <Icon icon="ep:data-analysis" class="mr-1" />
        查看错误机构市属统计表(仅异常) ({{ totalAnomalyOrgs }})
      </el-button>
      <el-button
        type="success"
        :disabled="totalSuggestedReturnOrgs === 0"
        @click="handleViewSuggestedReturnCityStatistics"
      >
        <Icon icon="ep:data-analysis" class="mr-1" />
        查看建议退回机构市属统计表 ({{ totalSuggestedReturnOrgs }})
      </el-button>
      <el-button
        type="warning"
        :disabled="totalSuggestedReturnOrgs === 0"
        @click="handleExportSuggestedReturnOrgList"
      >
        <Icon icon="ep:download" class="mr-1" />
        导出所有建议退回机构列表 ({{ totalSuggestedReturnOrgs }})
      </el-button>
    </div>

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
                <!-- 执行动作标签 -->
                <el-tag
                  :type="rule.executeAction === 'MARK_ANOMALY' ? 'danger' : 'warning'"
                  size="small"
                >
                  {{
                    rule.executeActionLabel ||
                    (rule.executeAction === 'MARK_ANOMALY' ? '异常数据' : '疑似问题')
                  }}
                </el-tag>
              </div>
              <div class="rule-stats">
                <!-- 根据规则类型显示对应的错误数量 -->
                <el-tag v-if="rule.executeAction === 'MARK_ANOMALY'" type="danger" size="small">
                  异常: {{ rule.totalAnomalyRecords }}
                </el-tag>
                <el-tag v-else-if="rule.executeAction === 'WARNING'" type="warning" size="small">
                  警告: {{ rule.totalWarningRecords }}
                </el-tag>
                <!-- 导出按钮 -->
                <el-button
                  type="success"
                  size="small"
                  :loading="ruleExportLoading[rule.ruleCode]"
                  @click.stop="handleExportRuleOrgList(rule)"
                >
                  <Icon icon="ep:download" class="mr-1" />
                  导出机构列表
                </el-button>
              </div>
            </div>
          </template>

          <!-- 规则描述 -->
          <div class="rule-description" v-if="rule.ruleDescription">
            <el-alert :title="rule.ruleDescription" type="info" :closable="false" />
          </div>

          <!-- 规则机构筛选条件 -->
          <div class="filter-bar mb-12px mt-12px">
            <el-form :inline="true" :model="getRuleOrgFilter(rule.ruleCode)">
              <el-form-item label="机构名称">
                <el-input
                  v-model="getRuleOrgFilter(rule.ruleCode).deptName"
                  placeholder="请输入机构名称"
                  clearable
                  style="width: 240px"
                >
                  <template #append>
                    <el-button :icon="Search" />
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="机构等级">
                <el-select
                  v-model="getRuleOrgFilter(rule.ruleCode).hospitalLevel"
                  placeholder="请选择机构等级"
                  clearable
                  style="width: 160px"
                >
                  <el-option label="三级医院" :value="3" />
                  <el-option label="二级医院" :value="2" />
                  <el-option label="基层医院" :value="1" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button @click="handleResetRuleOrgFilter(rule.ruleCode)">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 错误数据列表（虚拟列表） -->
          <div class="virtual-table-container mt-12px" v-loading="ruleDetailLoading[rule.ruleCode]">
            <el-auto-resizer v-if="ruleErrorDetails[rule.ruleCode]">
              <template #default="{ height, width }">
                <el-table-v2
                  :columns="getErrorDataColumns(rule.ruleCode, rule.executeAction)"
                  :data="getFilteredRuleErrorData(rule.ruleCode)"
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
      <el-empty v-if="!loading && ruleStatistics.length === 0" description="暂无后置质控数据" />
    </ContentWrap>

    <!-- 机构汇总区 -->
    <ContentWrap title="错误机构汇总列表" class="mt-16px">
      <!-- 筛选条件 -->
      <div class="filter-bar mb-16px">
        <el-form :inline="true" :model="orgFilter">
          <el-form-item label="机构名称">
            <el-input
              v-model="orgFilter.deptName"
              placeholder="请输入机构名称"
              clearable
              style="width: 240px"
              @clear="handleOrgFilterChange"
              @keyup.enter="handleOrgFilterChange"
            >
              <template #append>
                <el-button :icon="Search" @click="handleOrgFilterChange" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="机构等级">
            <el-select
              v-model="orgFilter.hospitalLevel"
              placeholder="请选择机构等级"
              clearable
              style="width: 160px"
              @change="handleOrgFilterChange"
            >
              <el-option label="三级医院" :value="3" />
              <el-option label="二级医院" :value="2" />
              <el-option label="基层医院" :value="1" />
            </el-select>
          </el-form-item>
          <el-form-item label="是否建议退回">
            <el-select
              v-model="orgFilter.suggestedReturn"
              placeholder="请选择"
              clearable
              style="width: 160px"
              @change="handleOrgFilterChange"
            >
              <el-option label="是" :value="true" />
              <el-option label="否" :value="false" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="handleResetOrgFilter">重置</el-button>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :icon="Download"
              :loading="exportLoading"
              :disabled="filteredOrgSummary.length === 0"
              @click="handleExportErrorOrgList"
            >
              导出异常机构列表
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="virtual-table-container" v-loading="orgSummaryLoading">
        <el-auto-resizer v-if="filteredOrgSummary.length > 0">
          <template #default="{ height, width }">
            <el-table-v2
              :columns="orgSummaryColumns"
              :data="filteredOrgSummary"
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

  <!-- 规则错误详情弹窗 -->
  <el-dialog
    v-model="ruleErrorDialog.visible"
    :title="`${ruleErrorDialog.ruleName} - ${ruleErrorDialog.deptName} - 错误详情`"
    width="80%"
    destroy-on-close
  >
    <el-table
      v-loading="ruleErrorDialog.loading"
      :data="ruleErrorDialog.errorList"
      border
      stripe
      max-height="600"
    >
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="tableType" label="表类型" width="150" align="center">
        <template #default="{ row }">
          {{ getTableTypeName(row.tableType) }}
        </template>
      </el-table-column>
      <el-table-column prop="errorMessage" label="错误信息" min-width="500" show-overflow-tooltip />
    </el-table>

    <el-pagination
      v-model:current-page="ruleErrorDialog.pagination.page"
      v-model:page-size="ruleErrorDialog.pagination.pageSize"
      :total="ruleErrorDialog.pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      class="mt-16px"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    />
  </el-dialog>

  <!-- 机构错误详情弹窗（后置质控专用） -->
  <PostQcErrorGroupedDialog
    v-model="errorDialogVisible"
    :task-id="errorDialogTaskId"
    :dept-name="errorDialogDeptName"
    :total-records="errorDialogOrgData?.totalRecords || 0"
    :error-records="errorDialogOrgData?.errorRecords || 0"
    :warning-records="errorDialogOrgData?.warningRecords || 0"
    :error-rate="errorDialogOrgData?.errorRate || 0"
    :suggested-return="errorDialogOrgData?.suggestedReturn || false"
    :hospital-level="errorDialogOrgData?.hospitalLevel || 0"
  />

  <!-- 退回机构市属统计表弹窗 -->
  <el-dialog
    v-model="cityStatisticsDialog.visible"
    title="错误机构市属统计表（仅异常）"
    width="800px"
    destroy-on-close
  >
    <div v-loading="cityStatisticsDialog.loading">
      <el-table
        :data="cityStatisticsDialog.data"
        border
        stripe
        show-summary
        :summary-method="getCityStatisticsSummary"
      >
        <el-table-column prop="cityName" label="所属市" width="150" align="center" />
        <el-table-column prop="primaryCount" label="基层" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.primaryCount > 0" type="success">{{ row.primaryCount }}</el-tag>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="secondaryCount" label="二级" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.secondaryCount > 0" type="warning">{{ row.secondaryCount }}</el-tag>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="tertiaryCount" label="三级" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.tertiaryCount > 0" type="danger">{{ row.tertiaryCount }}</el-tag>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalCount" label="总计" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ row.totalCount }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <el-button @click="cityStatisticsDialog.visible = false">关闭</el-button>
      <el-button type="primary" @click="handleExportCityStatistics">
        <Icon icon="ep:download" class="mr-1" />
        导出Excel
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Download, Search, Warning } from '@element-plus/icons-vue'
import { Column, ElMessageBox, TableV2FixedDir } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import {
  batchReturnAllErrorOrgs,
  batchReturnSuggestedOrgs,
  type CityStatistics,
  exportErrorOrgList,
  exportRuleOrgList,
  exportSuggestedReturnOrgList,
  getOrgSummary,
  getReturnCityStatistics,
  getRuleErrorDetail,
  getRuleList,
  getRuleOrgErrorList,
  getSuggestedReturnCityStatistics,
  type PostQcRuleStatistics,
  returnOrg
} from '@/api/drug/postqc'
import { useMessage } from '@/hooks/web/useMessage'
import PostQcErrorGroupedDialog from '../components/PostQcErrorGroupedDialog.vue'
import { Icon } from '@/components/Icon'

defineOptions({ name: 'PostQcStatistics' })

const route = useRoute()
const message = useMessage()

const loading = ref(false)
const batchReturnLoading = ref(false)
const batchReturnAllLoading = ref(false)
const exportLoading = ref(false) // 导出异常机构列表加载状态
const ruleExportLoading = ref<Record<string, boolean>>({}) // 规则导出加载状态
const ruleStatistics = ref<PostQcRuleStatistics[]>([])
const activeRules = ref<string[]>([]) // 展开的规则
const ruleErrorDetails = ref<Record<string, any>>({}) // 规则错误详情缓存
const ruleDetailLoading = ref<Record<string, boolean>>({}) // 规则详情加载状态
const orgSummary = ref<any[]>([]) // 机构汇总列表（原始数据）
const orgSummaryLoading = ref(false)

// 机构筛选条件
const orgFilter = ref({
  deptName: '',
  hospitalLevel: undefined as number | undefined,
  suggestedReturn: undefined as boolean | undefined
})

// 规则详情机构筛选条件（每个规则独立的筛选条件）
const ruleOrgFilters = ref<Record<string, { deptName: string; hospitalLevel: number | undefined }>>(
  {}
)

// 获取规则的筛选条件
const getRuleOrgFilter = (ruleCode: string) => {
  if (!ruleOrgFilters.value[ruleCode]) {
    ruleOrgFilters.value[ruleCode] = {
      deptName: '',
      hospitalLevel: undefined
    }
  }
  return ruleOrgFilters.value[ruleCode]
}

// 规则错误详情弹窗
const ruleErrorDialog = ref({
  visible: false,
  loading: false,
  ruleCode: '',
  ruleName: '',
  taskId: 0,
  deptName: '',
  errorList: [] as any[],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0
  }
})

// 总规则数
const totalRules = computed(() => ruleStatistics.value.length)

// 总异常记录数（异常数据）
const totalAnomalyRecords = computed(() => {
  return ruleStatistics.value
    .filter((r) => r.executeAction === 'MARK_ANOMALY')
    .reduce((sum, r) => sum + (r.totalAnomalyRecords || 0), 0)
})

// 总警告记录数（疑似问题）
const totalWarningRecords = computed(() => {
  return ruleStatistics.value
    .filter((r) => r.executeAction === 'WARNING')
    .reduce((sum, r) => sum + (r.totalWarningRecords || 0), 0)
})

// 总错误机构数（去重）- 包含异常和警告
const totalErrorOrgs = computed(() => {
  const orgSet = new Set<number>()
  orgSummary.value.forEach((org) => orgSet.add(org.taskId))
  return orgSet.size
})

// 总异常机构数（去重）- 仅包含异常数据的机构
const totalAnomalyOrgs = computed(() => {
  const orgSet = new Set<number>()
  orgSummary.value.forEach((org) => {
    if (org.anomalyRecords && org.anomalyRecords > 0) {
      orgSet.add(org.taskId)
    }
  })
  return orgSet.size
})

// 总建议退回机构数
const totalSuggestedReturnOrgs = computed(() => {
  return orgSummary.value.filter((org) => org.suggestedReturn).length
})

// 筛选后的机构列表
const filteredOrgSummary = computed(() => {
  let result = orgSummary.value

  // 按机构名称筛选
  if (orgFilter.value.deptName) {
    const keyword = orgFilter.value.deptName.toLowerCase()
    result = result.filter((org) => org.deptName?.toLowerCase().includes(keyword))
  }

  // 按机构等级筛选
  if (orgFilter.value.hospitalLevel !== undefined) {
    result = result.filter((org) => org.hospitalLevel === orgFilter.value.hospitalLevel)
  }

  // 按是否建议退回筛选
  if (orgFilter.value.suggestedReturn !== undefined) {
    result = result.filter((org) => org.suggestedReturn === orgFilter.value.suggestedReturn)
  }

  return result
})

// 获取规则筛选后的机构列表
const getFilteredRuleErrorData = (ruleCode: string) => {
  const errorData = ruleErrorDetails.value[ruleCode]?.errorDataList || []
  const filter = getRuleOrgFilter(ruleCode)

  let result = errorData

  // 按机构名称筛选
  if (filter.deptName) {
    const keyword = filter.deptName.toLowerCase()
    result = result.filter((org) => org.deptName?.toLowerCase().includes(keyword))
  }

  // 按机构等级筛选
  if (filter.hospitalLevel !== undefined) {
    result = result.filter((org) => org.hospitalLevel === filter.hospitalLevel)
  }

  return result
}

// 处理筛选条件变化
const handleOrgFilterChange = () => {
  // 筛选是响应式的，不需要额外操作
}

// 重置筛选条件
const handleResetOrgFilter = () => {
  orgFilter.value.deptName = ''
  orgFilter.value.hospitalLevel = undefined
  orgFilter.value.suggestedReturn = undefined
}

// 重置规则筛选条件
const handleResetRuleOrgFilter = (ruleCode: string) => {
  const filter = getRuleOrgFilter(ruleCode)
  filter.deptName = ''
  filter.hospitalLevel = undefined
}

// 获取等级标签类型
const getLevelTagType = (level: number) => {
  switch (level) {
    case 3:
      return 'danger' // 三级
    case 2:
      return 'warning' // 二级
    case 1:
      return 'success' // 基层
    default:
      return 'info'
  }
}

// 获取错误率标签类型
const getErrorRateType = (errorRate: number, hospitalLevel: number) => {
  if (!errorRate) return 'success'

  // 三级、二级：错误率 >= 4% 为danger
  if (hospitalLevel === 3 || hospitalLevel === 2) {
    return errorRate >= 4 ? 'danger' : errorRate >= 2 ? 'warning' : 'success'
  }
  // 基层：错误率 >= 50% 为danger
  else if (hospitalLevel === 1) {
    return errorRate >= 50 ? 'danger' : errorRate >= 25 ? 'warning' : 'success'
  }

  return 'info'
}

// 定义错误数据列
const getErrorDataColumns = (ruleCode: string, executeAction: string): Column[] => [
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
    width: 100,
    align: 'center',
    cellRenderer: ({ rowData }: any) => (
      <el-tag type={getLevelTagType(rowData.hospitalLevel)} size="small">
        {rowData.hospitalLevelName}
      </el-tag>
    )
  },
  {
    dataKey: 'anomalyRecords',
    title: '异常数',
    width: 100,
    align: 'center',
    cellRenderer: ({ rowData }: any) => {
      // 如果是异常规则，显示异常数
      if (executeAction === 'MARK_ANOMALY') {
        return (
          <el-tag type="danger" size="small">
            {rowData.anomalyRecords || 0}
          </el-tag>
        )
      }
      // 如果是警告规则，显示 "-"
      return <span style="color: #909399;">-</span>
    }
  },
  {
    dataKey: 'warningRecords',
    title: '警告数',
    width: 100,
    align: 'center',
    cellRenderer: ({ rowData }: any) => {
      // 如果是警告规则，显示警告数
      if (executeAction === 'WARNING') {
        return (
          <el-tag type="warning" size="small">
            {rowData.warningRecords || 0}
          </el-tag>
        )
      }
      // 如果是异常规则，显示 "-"
      return <span style="color: #909399;">-</span>
    }
  },
  {
    dataKey: 'totalRecords',
    title: '总记录数',
    width: 100,
    align: 'center'
  },
  {
    dataKey: 'actions',
    title: '操作',
    width: 150,
    align: 'center',
    fixed: TableV2FixedDir.RIGHT,
    cellRenderer: ({ rowData }: any) => (
      <el-button type="primary" link onClick={() => viewRuleOrgErrors(ruleCode, rowData)}>
        <el-icon>
          <Warning />
        </el-icon>
        查看错误
      </el-button>
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
    cellRenderer: ({ cellData }: any) => <span class="error-text">{cellData}</span>
  },
  {
    dataKey: 'anomalyRecords',
    title: '异常数',
    width: 100,
    align: 'center',
    cellRenderer: ({ cellData }: any) => (
      <el-tag type="danger" size="small">
        {cellData || 0}
      </el-tag>
    )
  },
  {
    dataKey: 'warningRecords',
    title: '警告数',
    width: 100,
    align: 'center',
    cellRenderer: ({ cellData }: any) => (
      <el-tag type="warning" size="small">
        {cellData || 0}
      </el-tag>
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
      <el-tag type={cellData ? 'danger' : 'success'}>{cellData ? '是' : '否'}</el-tag>
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
        <el-button type="primary" link onClick={() => viewOrgErrors(rowData)}>
          <el-icon>
            <Warning />
          </el-icon>
          查看错误
        </el-button>
        <el-button type="danger" link onClick={() => handleReturnOrg(rowData)}>
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
    const types = tableType.split(',').map((t) => t.trim())
    const names = types.map((t) => tableTypeMap[t] || t)
    return names.join('、')
  }

  // 单个表类型
  return tableTypeMap[tableType] || tableType
}

// 查看规则机构错误详情
const viewRuleOrgErrors = async (ruleCode: string, rowData: any) => {
  // 使用统一的错误详情弹窗
  errorDialogTaskId.value = rowData.taskId
  errorDialogDeptName.value = rowData.deptName
  errorDialogOrgData.value = rowData // 保存完整的机构数据
  errorDialogVisible.value = true
}

// 加载规则机构错误列表
const loadRuleOrgErrorList = async () => {
  ruleErrorDialog.value.loading = true
  try {
    const { ruleCode, taskId, pagination } = ruleErrorDialog.value

    // 调用后端接口获取错误数据
    const result = await getRuleOrgErrorList(taskId, ruleCode, pagination.page, pagination.pageSize)

    ruleErrorDialog.value.errorList = result.list || []
    ruleErrorDialog.value.pagination.total = result.total || 0
  } catch (error) {
    console.error('加载错误数据失败:', error)
    message.error('加载错误数据失败')
  } finally {
    ruleErrorDialog.value.loading = false
  }
}

// 分页变化
const handlePageChange = (page: number) => {
  ruleErrorDialog.value.pagination.page = page
  loadRuleOrgErrorList()
}

const handleSizeChange = (size: number) => {
  ruleErrorDialog.value.pagination.pageSize = size
  ruleErrorDialog.value.pagination.page = 1
  loadRuleOrgErrorList()
}

// 错误详情弹窗
const errorDialogVisible = ref(false)
const errorDialogTaskId = ref(0)
const errorDialogDeptName = ref('')
const errorDialogOrgData = ref<any>(null) // 存储当前机构的完整数据

// 退回机构市属统计弹窗
const cityStatisticsDialog = ref({
  visible: false,
  loading: false,
  data: [] as CityStatistics[],
  totalStatistics: null as CityStatistics | null
})

// 查看机构错误详情
const viewOrgErrors = (row: any) => {
  errorDialogTaskId.value = row.taskId
  errorDialogDeptName.value = row.deptName
  errorDialogOrgData.value = row // 保存完整的机构数据
  errorDialogVisible.value = true
}

// 退回机构
const handleReturnOrg = async (row: any) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入退回原因（可选）',
      `退回机构【${row.deptName}】`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '请输入退回原因...'
      }
    )

    await returnOrg(row.taskId, reason || undefined)
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

// 批量退回所有建议退回的机构
const handleBatchReturnSuggested = async () => {
  const count = totalSuggestedReturnOrgs.value

  try {
    // 1. 确认操作
    await ElMessageBox.confirm(
      `确定要批量退回所有符合条件的机构吗？\n\n` +
        `退回范围：\n` +
        `1. 建议退回机构（错误率超过阈值）\n` +
        `2. POST_QC_014规则错误机构\n` +
        `3. POST_QC_015规则错误机构\n\n` +
        `去重后预计退回约 ${count} 个机构`,
      '批量退回确认',
      {
        confirmButtonText: '继续',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 2. 可选：允许管理员添加补充说明
    const { value: extraNote } = await ElMessageBox.prompt(
      '您可以添加补充说明（可选）',
      '批量退回',
      {
        confirmButtonText: '确定退回',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '例如：请在3个工作日内完成修正并重新上报...'
      }
    ).catch(() => ({ value: '' })) // 如果取消，使用空字符串

    // 3. 执行批量退回
    batchReturnLoading.value = true
    const reportId = Number(route.query.reportTaskId)
    const result = await batchReturnSuggestedOrgs(reportId, extraNote || undefined)

    // 4. 显示结果
    if (result.failedCount > 0) {
      message.warning(
        `批量退回完成：成功 ${result.successCount} 个，失败 ${result.failedCount} 个\n` +
          `失败机构：${result.failedOrgs.join('、')}`
      )
    } else {
      message.success(`批量退回成功：共 ${result.successCount} 个机构`)
    }

    // 5. 刷新数据
    await loadOrgSummary()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量退回失败:', error)
      message.error('批量退回失败')
    }
  } finally {
    batchReturnLoading.value = false
  }
}

// 批量退回所有错误机构（仅异常）
const handleBatchReturnAllErrors = async () => {
  const count = totalAnomalyOrgs.value

  try {
    // 1. 确认操作
    await ElMessageBox.confirm(
      `确定要批量退回所有 ${count} 个异常机构吗？\n仅退回包含异常数据的机构，不包含仅有警告的机构。`,
      '批量退回所有异常机构',
      {
        confirmButtonText: '继续',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 2. 可选：允许管理员添加补充说明
    const { value: extraNote } = await ElMessageBox.prompt(
      '您可以添加补充说明（可选）',
      '批量退回',
      {
        confirmButtonText: '确定退回',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '例如：请核实并修正所有异常数据后重新上报...'
      }
    ).catch(() => ({ value: '' })) // 如果取消，使用空字符串

    // 3. 执行批量退回
    batchReturnAllLoading.value = true
    const reportId = Number(route.query.reportTaskId)
    const result = await batchReturnAllErrorOrgs(reportId, extraNote || undefined)

    // 4. 显示结果
    if (result.failedCount > 0) {
      message.warning(
        `批量退回完成：成功 ${result.successCount} 个，失败 ${result.failedCount} 个\n` +
          `失败机构：${result.failedOrgs.join('、')}`
      )
    } else {
      message.success(`批量退回成功：共 ${result.successCount} 个机构`)
    }

    // 5. 刷新数据
    await loadOrgSummary()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量退回失败:', error)
      message.error('批量退回失败')
    }
  } finally {
    batchReturnAllLoading.value = false
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

    // 调试：打印前3个机构的等级信息
    if (orgSummary.value.length > 0) {
      console.log('机构等级调试信息（前3个）:')
      orgSummary.value.slice(0, 3).forEach((org, index) => {
        console.log(
          `机构${index + 1}: ${org.deptName}, hospitalLevel=${org.hospitalLevel}, hospitalLevelName=${org.hospitalLevelName}`
        )
      })
    }
  } catch (error) {
    console.error('加载机构汇总数据失败:', error)
    message.error('加载机构汇总数据失败')
  } finally {
    orgSummaryLoading.value = false
  }
}

// 查看退回机构市属统计表
const handleViewCityStatistics = async () => {
  const reportId = Number(route.query.reportTaskId)
  if (!reportId) {
    message.error('缺少报送任务ID')
    return
  }

  cityStatisticsDialog.value.visible = true
  cityStatisticsDialog.value.loading = true

  try {
    const result = await getReturnCityStatistics(reportId)
    cityStatisticsDialog.value.data = result.cityStatisticsList || []
    cityStatisticsDialog.value.totalStatistics = result.totalStatistics
  } catch (error) {
    console.error('加载退回机构市属统计失败:', error)
    message.error('加载退回机构市属统计失败')
  } finally {
    cityStatisticsDialog.value.loading = false
  }
}

// 获取统计表合计行
const getCityStatisticsSummary = () => {
  const total = cityStatisticsDialog.value.totalStatistics
  if (!total) {
    return ['总计', '-', '-', '-', '-']
  }
  return [
    '总计',
    total.primaryCount || '-',
    total.secondaryCount || '-',
    total.tertiaryCount || '-',
    total.totalCount || '-'
  ]
}

// 导出规则机构列表
const handleExportRuleOrgList = async (rule: PostQcRuleStatistics) => {
  const reportId = Number(route.query.reportTaskId)
  if (!reportId) {
    message.error('缺少报送任务ID')
    return
  }

  ruleExportLoading.value[rule.ruleCode] = true
  try {
    const data = await exportRuleOrgList(reportId, rule.ruleCode)

    // 从响应中提取文件名（如果后端设置了Content-Disposition）
    const fileName = `${rule.ruleName}_机构汇总列表.xlsx`

    // 使用download工具触发文件下载
    const blob = new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    window.URL.revokeObjectURL(url)

    message.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败，请重试')
  } finally {
    ruleExportLoading.value[rule.ruleCode] = false
  }
}

// 导出异常机构汇总列表
const handleExportErrorOrgList = async () => {
  const reportId = Number(route.query.reportTaskId)
  if (!reportId) {
    message.error('缺少报送任务ID')
    return
  }

  if (filteredOrgSummary.value.length === 0) {
    message.warning('暂无可导出的数据')
    return
  }

  exportLoading.value = true
  try {
    const data = await exportErrorOrgList(reportId)

    const fileName = '异常机构汇总列表.xlsx'

    const blob = new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    window.URL.revokeObjectURL(url)

    message.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败，请重试')
  } finally {
    exportLoading.value = false
  }
}

// 查看建议退回机构市属统计表
const handleViewSuggestedReturnCityStatistics = async () => {
  const reportId = Number(route.query.reportTaskId)
  if (!reportId) {
    message.error('缺少报送任务ID')
    return
  }

  cityStatisticsDialog.value.visible = true
  cityStatisticsDialog.value.loading = true

  try {
    const result = await getSuggestedReturnCityStatistics(reportId)
    cityStatisticsDialog.value.data = result.cityStatisticsList || []
    cityStatisticsDialog.value.totalStatistics = result.totalStatistics
  } catch (error) {
    console.error('加载建议退回机构市属统计失败:', error)
    message.error('加载建议退回机构市属统计失败')
  } finally {
    cityStatisticsDialog.value.loading = false
  }
}

// 导出所有建议退回机构列表
const handleExportSuggestedReturnOrgList = async () => {
  const reportId = Number(route.query.reportTaskId)
  if (!reportId) {
    message.error('缺少报送任务ID')
    return
  }

  // 检查是否有建议退回的机构
  if (totalSuggestedReturnOrgs.value === 0) {
    message.warning('暂无建议退回的机构')
    return
  }

  exportLoading.value = true
  try {
    const data = await exportSuggestedReturnOrgList(reportId)

    const fileName = '建议退回机构列表.xlsx'

    const blob = new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    window.URL.revokeObjectURL(url)

    message.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败，请重试')
  } finally {
    exportLoading.value = false
  }
}

// 导出Excel
const handleExportCityStatistics = () => {
  const data = cityStatisticsDialog.value.data
  const total = cityStatisticsDialog.value.totalStatistics

  if (!data || data.length === 0) {
    message.warning('暂无数据可导出')
    return
  }

  // 构建Excel数据
  const excelData = data.map((item) => ({
    所属市: item.cityName,
    基层: item.primaryCount || 0,
    二级: item.secondaryCount || 0,
    三级: item.tertiaryCount || 0,
    总计: item.totalCount || 0
  }))

  // 添加合计行
  if (total) {
    excelData.push({
      所属市: '总计',
      基层: total.primaryCount || 0,
      二级: total.secondaryCount || 0,
      三级: total.tertiaryCount || 0,
      总计: total.totalCount || 0
    })
  }

  // 使用xlsx库导出
  import('xlsx')
    .then((XLSX) => {
      const ws = XLSX.utils.json_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '退回机构市属统计表')

      // 生成文件名（包含时间戳）
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const filename = `退回机构市属统计表_${timestamp}.xlsx`

      XLSX.writeFile(wb, filename)
      message.success('导出成功')
    })
    .catch((error) => {
      console.error('导出失败:', error)
      message.error('导出失败，请重试')
    })
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
        color: #fff;
        flex-shrink: 0;
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
        background: linear-gradient(135deg, #667eea 0%, #3b4cb8 100%);
        box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
      }
      .stat-value {
        color: #667eea;
      }
    }

    &.anomaly {
      .stat-icon {
        background: linear-gradient(135deg, #f43f5e 0%, #dc2626 100%);
        box-shadow: 0 4px 14px rgba(244, 63, 94, 0.4);
      }
      .stat-value {
        color: #f56c6c;
      }
    }

    &.warning {
      .stat-icon {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
      }
      .stat-value {
        color: #e6a23c;
      }
    }

    &.error {
      .stat-icon {
        background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
        box-shadow: 0 4px 14px rgba(236, 72, 153, 0.4);
      }
      .stat-value {
        color: #f56c6c;
      }
    }

    &.anomaly-only {
      .stat-icon {
        background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
        box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
      }
      .stat-value {
        color: #ef4444;
      }
    }

    &.suggested-return {
      .stat-icon {
        background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
        box-shadow: 0 4px 14px rgba(251, 146, 60, 0.4);
      }
      .stat-value {
        color: #fb923c;
      }
    }
  }
}

.type-explanation-alert {
  margin-top: 16px;

  .type-explanation {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .type-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }
  }
}

.threshold-alert {
  margin-top: 12px;

  :deep(.el-alert__title) {
    font-size: 13px;
    line-height: 1.5;
  }

  .threshold-tip-content {
    display: flex;
    align-items: flex-start;
    gap: 8px;

    .tip-icon {
      font-size: 16px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .tip-text {
      flex: 1;
      font-size: 13px;
      line-height: 1.6;
      color: #606266;

      strong {
        color: #303133;
      }

      .threshold-value {
        color: #e6a23c;
        font-size: 14px;
      }

      .tip-note {
        display: block;
        margin-top: 4px;
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

.batch-actions {
  margin-top: 16px;
  padding: 16px;
  background: var(--el-bg-color-overlay);
  border-radius: 4px;
  display: flex;
  gap: 12px;
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

.filter-bar {
  padding: 16px;
  background: var(--el-bg-color-overlay);
  border-radius: 4px;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
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
