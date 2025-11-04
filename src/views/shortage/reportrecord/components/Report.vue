<template>
  <!-- 页面头部 -->
  <PageHeader
    title="药品短缺填报"
    :show-back-button="true"
    back-button-text="返回列表"
    :dict-tag="{ type: DICT_TYPE.DRUG_REPORT_STATUS, value: reportStatus }"
    :meta="reportMeta"
    @back-click="handleBack"
  >
    <template #extra>
      <el-form :inline="true" class="header-form">
        <el-form-item label="填报专区">
          <el-select
            v-model="selectedZoneId"
            @change="loadDrugList"
            placeholder="请选择专区"
            :disabled="isZoneDisabled"
            style="width: 240px"
          >
            <el-option
              v-for="zone in zoneList"
              :key="zone.id"
              :label="zone.zoneName"
              :value="zone.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="当前周期">
          <el-tag type="info">{{ displayWeek }}</el-tag>
        </el-form-item>
      </el-form>
    </template>
  </PageHeader>

  <!-- 时间提醒组件 -->
  <TimeAlert
    v-if="!isReadOnly"
    :is-time-restricted="isTimeRestricted"
    :is-in-report-time="isInReportTime"
    :remaining-time="remainingTime"
    :time-config-display="timeConfigDisplay"
    :closable="true"
  />

  <!-- 通知区域 -->
  <ContentWrap
    v-if="zoneNotice && selectedZoneId"
    title="填报通知"
    header-icon="ep:bell"
    headerIconColor="orange"
  >
    <div v-html="zoneNotice" class="notice-content"></div>
  </ContentWrap>

  <!-- 填报表格 -->
  <ContentWrap
    v-if="selectedZoneId"
    :title="tableTitle"
    message="请检查填报数据，确保准确无误后提交"
    header-icon="ep:edit"
  >
    <!-- 完成度统计 -->
    <div class="completion-stats">
      <el-alert type="info" :closable="false" class="stats-alert">
        <template #title>
          <div class="stats-content">
            <span class="stats-text">
              已完成 <strong>{{ completedCount }}</strong> / {{ totalCount }} 项
            </span>
            <span class="stats-separator">|</span>
            <span class="stats-text">
              完成度: <strong>{{ completionRate }}%</strong>
            </span>
            <el-progress
              :percentage="completionRate"
              :color="getProgressColor(completionRate)"
              :stroke-width="8"
              class="stats-progress"
            />
          </div>
        </template>
      </el-alert>
    </div>

    <!-- 药品分类Tab -->
    <el-tabs v-model="activeDrugCategory" class="drug-category-tabs" @tab-change="handleTabChange">
      <el-tab-pane
        v-for="category in drugCategories"
        :key="category"
        :label="`${category} (${getCategoryCount(category)})`"
        :name="category"
      >
        <el-table
          v-loading="loading"
          :data="filteredReportList"
          border
          class="report-table"
          :row-class-name="getRowClassName"
        >
          <el-table-column label="序号" type="index" width="60" fixed class-name="header-bold" />
          <el-table-column
            label="药品分类"
            prop="drugCategory"
            width="150"
            class-name="header-bold"
            show-overflow-tooltip
          />
          <el-table-column label="药品名称" prop="drugName" width="200" class-name="header-bold" />
          <el-table-column
            label="剂型分类"
            prop="dosageCategory"
            width="150"
            class-name="header-bold"
            show-overflow-tooltip
          />
          <el-table-column
            label="最小剂量单位"
            prop="dosageUnit"
            width="200"
            class-name="header-bold"
          >
            <template #default="scope">
              <el-select
                v-model="scope.row.dosageUnit"
                :disabled="isReadOnly"
                style="width: 100%"
                placeholder="请选择"
              >
                <el-option
                  v-for="unit in scope.row.dosageUnitOptions || []"
                  :key="unit.value"
                  :label="unit.label"
                  :value="unit.value"
                />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column
            label="本周累计使用量（最小剂量单位）"
            width="240"
            align="center"
            class-name="header-bold"
          >
            <template #default="scope">
              <div class="usage-input">
                <el-input-number
                  v-model="scope.row.weekUsageAmount"
                  :min="0"
                  :precision="2"
                  :disabled="isReadOnly"
                  style="width: 100%"
                  placeholder="按包装单位"
                  @change="handleUsageChange(scope.row)"
                />
              </div>
            </template>
          </el-table-column>

          <el-table-column
            label="当日实时库存量（最小剂量单位）"
            width="240"
            align="center"
            class-name="header-bold"
          >
            <template #default="scope">
              <div class="stock-input">
                <el-input-number
                  v-model="scope.row.currentStockAmount"
                  :min="0"
                  :precision="2"
                  :disabled="isReadOnly"
                  style="width: 100%"
                  placeholder="按包装单位"
                  @change="handleStockChange(scope.row)"
                />
              </div>
            </template>
          </el-table-column>

          <el-table-column label="供应情况" width="150" align="center" class-name="header-bold">
            <template #header>
              <div class="custom-header">
                <span>供应情况</span>
              </div>
            </template>
            <template #default="scope">
              <div class="supply-input-wrapper">
                <el-select
                  v-model="scope.row.supplyStatus"
                  :disabled="isReadOnly"
                  style="width: 100%"
                  placeholder="请选择"
                  :class="{ 'required-field': isSupplyStatusRequired(scope.row) }"
                  :key="`supply-${scope.$index}-${scope.row.weekUsageAmount}-${scope.row.currentStockAmount}`"
                >
                  <el-option
                    v-for="status in getIntDictOptions(DICT_TYPE.SUPPLY_STATUS)"
                    :key="status.value"
                    :label="status.label"
                    :value="status.value"
                  />
                </el-select>
                <span
                  v-if="isSupplyStatusRequired(scope.row)"
                  class="required-indicator"
                  :key="`required-${scope.$index}-${scope.row.weekUsageAmount}-${scope.row.currentStockAmount}`"
                  >*</span
                >
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 提交区域 -->
    <div class="submit-area" v-if="selectedZoneId && reportList.length > 0 && !isReadOnly">
      <div class="flex items-center justify-between">
        <div class="submit-buttons">
          <el-button @click="handlePreview" :disabled="!isInReportTime"> 预览数据</el-button>
          <el-button type="info" @click="handleSaveDraft" :loading="savingDraft">
            <Icon icon="ep:document-add" class="mr-1" />
            保存草稿
          </el-button>
          <el-button
            type="primary"
            @click="handleSubmit"
            :loading="submitting"
            :disabled="!isInReportTime || !isDataValid"
          >
            <Icon icon="ep:upload" class="mr-1" />
            提交填报
          </el-button>
        </div>
      </div>
    </div>
  </ContentWrap>

  <!-- 空状态 -->
  <el-empty v-if="!selectedZoneId" description="请选择填报专区开始填报" :image-size="100" />

  <!-- 预览对话框 -->
  <PreviewDialog ref="previewDialogRef" />
</template>

<script setup lang="ts">
import {
  ReportZoneApi,
  ReportRecordApi,
  type ReportZoneVO,
  type ReportRecordVO,
  getSupplyStatusLabel,
  SupplyStatusEnum
} from '@/api/shortage'
import { Clock } from '@element-plus/icons-vue'
import { ReportTaskApi, type ReportTaskVO } from '@/api/shortage/reporttask'
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import PreviewDialog from './PreviewDialog.vue'
import TimeAlert from './TimeAlert.vue'
import PageHeader from '@/components/PageHeader/index.vue'
import { useRoute, useRouter } from 'vue-router'

/** 元数据项接口 */
interface MetaItem {
  label: string
  value: string | number
  icon?: any
}

/** 短缺药品数据填报页面 */
defineOptions({ name: 'ShortageReport' })

const message = useMessage()
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const savingDraft = ref(false) // 保存草稿loading
const selectedZoneId = ref<number>()
const zoneList = ref<ReportZoneVO[]>([])
const reportList = ref<ReportRecordVO[]>([])
const zoneNotice = ref('')
const taskDetail = ref<ReportTaskVO>()

// 从路由获取参数
const taskId = ref<string>(route.params.taskId as string)
const routeZoneId = ref<string | undefined>(route.query.zoneId as string | undefined)
const routeReportWeek = ref<string | undefined>(route.query.reportWeek as string | undefined)
const reportStatus = ref<number>(route.query.reportStatus ? Number(route.query.reportStatus) : 0)

// 根据填报状态判断是否为只读模式: 2-已提交为只读
const isReadOnly = computed(() => reportStatus.value === 2)

// 页面头部元数据
const reportMeta = computed<MetaItem[]>(() => {
  const meta: MetaItem[] = []

  // 如果是已提交状态且有提交时间，显示提交时间
  if (reportStatus.value === 2 && taskDetail.value?.submitTime) {
    meta.push({
      label: '提交时间',
      value: formatDate(taskDetail.value.submitTime),
      icon: Clock
    })
  }

  return meta
})

// 药品分类Tab
const activeDrugCategory = ref<string>('')

// 获取所有药品分类
const drugCategories = computed(() => {
  const categories = [...new Set(reportList.value.map((item) => item.drugCategory))]
  return categories.filter((c) => c) // 过滤掉空值
})

// 根据当前选中的药品分类过滤数据
const filteredReportList = computed(() => {
  if (!activeDrugCategory.value) return reportList.value
  return reportList.value.filter((item) => item.drugCategory === activeDrugCategory.value)
})

// 获取某个分类的数量
const getCategoryCount = (category: string) => {
  return reportList.value.filter((item) => item.drugCategory === category).length
}

// Tab切换处理
const handleTabChange = (tabName: string) => {
  activeDrugCategory.value = tabName
}

// 专区选择框是否禁用(当从列表页传入专区ID时禁用)
const isZoneDisabled = computed(() => !!routeZoneId.value)

// 返回列表
const handleBack = () => {
  router.push({ name: 'ReportRecord' })
}

// 当前周期 - 优先使用路由传入的周期,否则计算当前周期
const currentWeek = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const week = getWeekNumber(now)
  return `${year}-${week.toString().padStart(2, '0')}周`
})

// 显示的周期
const displayWeek = computed(() => {
  return routeReportWeek.value || currentWeek.value
})

// 表格标题
const tableTitle = computed(() => {
  const baseTitle = '药品填报数据'
  return reportList.value.length > 0
    ? `${baseTitle} (共 ${reportList.value.length} 个药品)`
    : baseTitle
})

// 填报时间控制
const isTimeRestricted = ref(false) // 是否有时间限制
const isInReportTime = ref(false)
const remainingTime = ref('')
const timeConfigDisplay = ref('加载中...')

// 判断供应情况是否必填 - 使用计算属性确保响应式更新
const getIsSupplyStatusRequired = (row: ReportRecordVO): boolean => {
  // 显式检查数值，确保响应式更新
  const weekUsage = row.weekUsageAmount
  const stockAmount = row.currentStockAmount

  return (
    (weekUsage !== undefined && weekUsage !== null && weekUsage > 0) ||
    (stockAmount !== undefined && stockAmount !== null && stockAmount > 0)
  )
}

// 为了在模板中使用，创建一个方法
const isSupplyStatusRequired = (row: ReportRecordVO): boolean => {
  return getIsSupplyStatusRequired(row)
}

// 处理用量变化
const handleUsageChange = (row: ReportRecordVO) => {
  checkAndClearSupplyStatus(row)
}

// 处理库存变化
const handleStockChange = (row: ReportRecordVO) => {
  checkAndClearSupplyStatus(row)
}

// 检查并清空供应情况
const checkAndClearSupplyStatus = (row: ReportRecordVO) => {
  // 如果两个值都为0或未填写，清空供应情况
  const weekUsage = row.weekUsageAmount || 0
  const stockAmount = row.currentStockAmount || 0

  if (weekUsage === 0 && stockAmount === 0) {
    row.supplyStatus = null
  }
}

// 完成度统计 - 与预览数据显示逻辑一致
const totalCount = computed(() => reportList.value.length)

const completedCount = computed(() => {
  return reportList.value.filter((item) => {
    // 判断逻辑与预览数据一致：用量或库存大于0才算填报
    return (
      (item.weekUsageAmount !== undefined && item.weekUsageAmount !== null && item.weekUsageAmount > 0) ||
      (item.currentStockAmount !== undefined && item.currentStockAmount !== null && item.currentStockAmount > 0)
    )
  }).length
})

const completionRate = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

// 进度条颜色
const getProgressColor = (percentage: number) => {
  if (percentage >= 100) {
    return '#67C23A' // 绿色 - 完成
  } else if (percentage >= 60) {
    return '#409EFF' // 蓝色 - 良好
  } else if (percentage >= 30) {
    return '#E6A23C' // 橙色 - 一般
  } else {
    return '#F56C6C' // 红色 - 较低
  }
}

// 数据有效性检查
const isDataValid = computed(() => {
  if (!reportList.value.length) return false

  return reportList.value.every((item) => {
    // 使用相同的逻辑检查是否需要必填
    const isRequired = getIsSupplyStatusRequired(item)

    // 如果需要必填，供应情况必须填写
    if (isRequired) {
      return item.supplyStatus !== undefined && item.supplyStatus !== null
    }

    // 如果不需要必填，则通过验证
    return true
  })
})
const checkReportTime = async () => {
  if (!selectedZoneId.value) {
    timeConfigDisplay.value = '请先选择填报专区'
    isTimeRestricted.value = false
    return
  }

  try {
    const result = await ReportZoneApi.checkReportTime(selectedZoneId.value)
    isInReportTime.value = result.isInTime
    timeConfigDisplay.value = result.message
    isTimeRestricted.value = result.hasTimeRestriction !== false // 如果有时间限制则显示组件

    if (result.isInTime && result.remainingMinutes) {
      const hours = Math.floor(result.remainingMinutes / 60)
      const minutes = result.remainingMinutes % 60
      remainingTime.value = `${hours}小时${minutes}分钟`
    }
  } catch (error) {
    console.error('检查填报时间失败:', error)
    // 降级到固定时间检查
    checkReportTimeFixed()
  }
}

// 保留原有固定时间检查作为降级方案
const checkReportTimeFixed = () => {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()

  isInReportTime.value = day === 5 && hour >= 12 && hour < 18
  isTimeRestricted.value = true // 降级方案默认有时间限制

  if (isInReportTime.value) {
    const endTime = new Date()
    endTime.setHours(18, 0, 0, 0)
    const remaining = endTime.getTime() - now.getTime()
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    remainingTime.value = `${hours}小时${minutes}分钟`
  }

  timeConfigDisplay.value = '填报时间：每周五 12:00-18:00'
}

// 使用统一的周期工具函数
import { getWeekNumber } from '@/utils/reportWeek'

// 加载专区列表
const loadZoneList = async () => {
  try {
    const data = await ReportZoneApi.getList({
      pageNo: 1,
      pageSize: -1,
      status: 0,
      taskId: Number(taskId.value) // 传递taskId用于权限过滤
    })
    zoneList.value = data
  } catch (error) {
    console.error('加载专区列表失败:', error)
  }
}

// 加载药品列表
const loadDrugList = async () => {
  if (!selectedZoneId.value) return

  loading.value = true
  try {
    const data = await ReportRecordApi.getReportListByZoneId(
      selectedZoneId.value,
      Number(taskId.value) // 传递taskId
    )
    reportList.value = data

    // 初始化第一个tab
    if (drugCategories.value.length > 0) {
      activeDrugCategory.value = drugCategories.value[0]
    }

    // 获取通知内容
    const zone = zoneList.value.find((z) => z.id === selectedZoneId.value)
    zoneNotice.value = zone?.noticeContent || ''

    // 检查填报时间
    await checkReportTime()

    // 切换专区时重置时间提醒的关闭状态
    // if (timeAlertRef.value) {
    //   timeAlertRef.value.reset()
    // }
  } catch (error) {
    console.error('加载药品列表失败:', error)
    message.error('加载药品列表失败')
  } finally {
    loading.value = false
  }
}

// 获取行样式类名
const getRowClassName = ({ row }: { row: ReportRecordVO }): string => {
  if (row.supplyStatus === 4) return 'severe-shortage-row'
  if (row.supplyStatus === 3) return 'shortage-row'
  return ''
}

// 预览数据
const previewDialogRef = ref()
const handlePreview = () => {
  previewDialogRef.value?.open(reportList.value)
}

// 提交填报
const handleSubmit = async () => {
  if (!isInReportTime.value) {
    message.warning('当前不在填报时间内')
    return
  }

  if (!isDataValid.value) {
    message.warning('请完整填写所有必填字段')
    return
  }

  try {
    await message.confirm('确认提交本次填报数据吗？提交后将无法修改。')

    submitting.value = true

    // 过滤出需要提交的数据（有供应情况的记录）
    const submitData = reportList.value
      .filter((item) => item.supplyStatus !== undefined && item.supplyStatus !== null)
      .map((item) => ({
        ...item,
        dosageUnit: item.dosageUnit // 确保包含 dosageUnit 字段
      }))

    // 调用提交接口,传递taskId和reportWeek
    await ReportRecordApi.submitReport({
      taskId: Number(taskId.value),
      reportWeek: displayWeek.value, // 传入当前显示的周期
      data: submitData
    })
    message.success('填报成功')

    // 返回列表页面
    router.push({ name: 'ReportRecord', params: { refresh: 'true' } })
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitting.value = false
  }
}

// 保存草稿
const handleSaveDraft = async () => {
  try {
    savingDraft.value = true

    // 过滤出有数据的记录
    const draftData = reportList.value
      .filter(
        (item) =>
          (item.weekUsageAmount !== undefined && item.weekUsageAmount !== null) ||
          (item.currentStockAmount !== undefined && item.currentStockAmount !== null) ||
          (item.supplyStatus !== undefined && item.supplyStatus !== null)
      )
      .map((item) => ({
        ...item,
        dosageUnit: item.dosageUnit
      }))

    if (draftData.length === 0) {
      message.warning('请至少填写一项数据再保存草稿')
      return
    }

    // 调用保存草稿API,传递taskId和reportWeek
    await ReportRecordApi.saveDraft({
      taskId: Number(taskId.value),
      reportWeek: displayWeek.value, // 传入当前显示的周期
      data: draftData
    })

    message.success('草稿保存成功')

    // 返回列表页面
    router.push({ name: 'ReportRecord', params: { refresh: 'true' } })
  } catch (error) {
    console.error('保存草稿失败:', error)
    message.error('保存草稿失败')
  } finally {
    savingDraft.value = false
  }
}

// 初始化
onMounted(async () => {
  await loadZoneList()

  // 加载任务详情
  if (taskId.value) {
    try {
      taskDetail.value = await ReportTaskApi.getReportTask(Number(taskId.value))
    } catch (error) {
      console.error('加载任务详情失败:', error)
    }
  }

  // 如果路由中有专区ID,设置为默认选中
  if (routeZoneId.value) {
    selectedZoneId.value = Number(routeZoneId.value)
    // 自动加载药品列表
    await loadDrugList()
  } else {
    // 初始化时间显示
    timeConfigDisplay.value = '请选择填报专区'
    isTimeRestricted.value = false
  }

  // 每分钟检查一次时间（如果已选择专区）
  setInterval(() => {
    if (selectedZoneId.value) {
      checkReportTime()
    }
  }, 60000)
})
</script>

<style scoped>
/* 页面头部表单样式 */
.header-form {
  margin: 0;
}

.header-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 20px;
}

.header-form :deep(.el-form-item:last-child) {
  margin-right: 0;
}

/* 完成度统计样式 */
.completion-stats {
  margin-bottom: 16px;
}

.stats-alert {
  border-radius: 6px;
}

.stats-content {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
}

.stats-text {
  color: #606266;
}

.stats-text strong {
  color: #409eff;
  font-size: 16px;
  margin: 0 4px;
}

.stats-separator {
  color: #dcdfe6;
  font-weight: 300;
}

.stats-progress {
  flex: 1;
  max-width: 200px;
  min-width: 120px;
}

.stats-progress :deep(.el-progress__text) {
  min-width: 40px;
}

/* 药品分类Tab样式 */
.drug-category-tabs {
  margin-bottom: 16px;
}

.drug-category-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.drug-category-tabs :deep(.el-tabs__item) {
  font-size: 14px;
  font-weight: 500;
}

.drug-category-tabs :deep(.el-tabs__item.is-active) {
  color: #409eff;
}

.notice-content {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  padding: 12px 0;
}

.notice-content :deep(h3) {
  color: #303133;
  margin-top: 0;
  margin-bottom: 12px;
}

.notice-content :deep(ol) {
  padding-left: 20px;
}

.notice-content :deep(li) {
  margin-bottom: 8px;
}

.report-table {
  margin-bottom: 20px;
}

.report-table :deep(.shortage-row) {
  background-color: #fef2f2;
}

.report-table :deep(.severe-shortage-row) {
  background-color: #fef2f2;
}

.submit-area {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.info-text {
  display: flex;
  align-items: center;
  color: #909399;
  font-size: 14px;
}

.submit-buttons {
  display: flex;
  gap: 12px;
}

.report-table :deep(.header-bold .cell) {
  font-weight: bold;
}

.usage-input,
.stock-input {
  display: flex;
  align-items: center;
}

.usage-input .el-input-number,
.stock-input .el-input-number {
  width: 100%;
}

.supply-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.required-indicator {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  color: #f56c6c;
  font-weight: bold;
  font-size: 14px;
  line-height: 1;
}

.required-field {
  border-color: #f56c6c !important;
}

.custom-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
</style>
