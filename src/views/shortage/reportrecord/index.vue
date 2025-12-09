<!--填报记录管理页面-->
<template>
  <div class="report-record-page">
    <div class="flex record-container">
    <!-- 左侧地区树选择器（排除短缺无法上报机构） -->
    <RegionTree
      ref="regionTreeRef"
      :style="{ width: selectorWidth + 'px', flexShrink: 0, height: '100%' }"
      :auto-select-first="false"
      :show-org-count="true"
      :show-collapse-button="true"
      exclude-module-code="SHORTAGE"
      @node-click="handleRegionSelect"
    />

    <!-- 拖拽分隔条 -->
    <div
      class="resize-handle"
      @mousedown="startResize"
    ></div>

    <!-- 右侧内容区域 -->
    <div class="flex-1 ml-5 main-content">
      <!-- 当前选择的地区信息 - 始终显示 -->
      <div class="mb-15px">
        <el-tag
          type="primary"
          size="large"
          class="region-tag"
          :closable="!!selectedRegion"
          @close="handleClearRegion"
        >
          <Icon icon="ep:location" class="mr-5px" />
          {{ selectedRegion ? `当前地区：${getRegionDisplayName(selectedRegion)}` : '全部机构' }}
        </el-tag>
      </div>

      <ContentWrap>
        <!-- 搜索工作栏 -->
        <el-form
          class="-mb-15px"
          :model="queryParams"
          ref="queryFormRef"
          :inline="true"
          label-width="80px"
          @submit.prevent
        >
          <el-form-item label="填报专区" prop="zoneId">
            <el-select v-model="queryParams.zoneId" placeholder="请选择填报专区" clearable class="!w-240px">
              <el-option
                v-for="zone in zoneOptions"
                :key="zone.id"
                :label="zone.zoneName"
                :value="zone.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="填报周期" prop="reportWeek">
            <el-select v-model="queryParams.reportWeek" placeholder="请选择填报周期" class="!w-200px">
              <el-option v-for="week in reportWeekOptions" :key="week" :label="week" :value="week" />
            </el-select>
          </el-form-item>
          <el-form-item label="机构名称" prop="deptName">
            <el-input
              v-model="queryParams.deptName"
              placeholder="请输入机构名称"
              clearable
              class="!w-200px"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="填报状态" prop="reportStatus">
            <el-select
              v-model="queryParams.reportStatus"
              placeholder="请选择填报状态"
              clearable
              class="!w-160px"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.DRUG_REPORT_STATUS)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="handleQuery">
              <Icon icon="ep:search" class="mr-5px" />
              搜索
            </el-button>
            <el-button @click="resetQuery">
              <Icon icon="ep:refresh" class="mr-5px" />
              重置
            </el-button>
            <el-tooltip
              placement="top"
              content="请选择填报专区、填报周期，并筛选到已提交状态后再导出"
            >
                <el-button
                  type="success"
                  plain
                  :disabled="!canExport"
                  :loading="exportLoading"
                  @click="handleExport"
                >
                  <Icon icon="ep:download" class="mr-5px" />
                  导出机构周上报药品信息
                </el-button>

            </el-tooltip>
            <el-tooltip
              placement="top"
              content="请选择填报专区、填报周期，并筛选后再导出"
            >
              <el-button
                type="success"
                plain
                :disabled="!canExport2"
                :loading="exportLoading2"
                @click="handleExport2"
              >
                <Icon icon="ep:download" class="mr-5px" />
                导出本轮机构上报情况
              </el-button>
            </el-tooltip>

          </el-form-item>
        </el-form>
      </ContentWrap>

      <!-- 进度统计 -->
      <ContentWrap v-if="queryParams.reportWeek">
        <div class="progress-stats">
          <div class="progress-item">
            <span class="label">总机构数：</span>
            <span class="value">{{ progressData.totalCount || 0 }}</span>
          </div>
          <div class="progress-item success">
            <span class="label">已上报：</span>
            <span class="value">{{ progressData.reportedCount || 0 }}</span>
          </div>
          <div class="progress-item warning">
            <span class="label">未上报：</span>
            <span class="value">{{ progressData.unreportedCount || 0 }}</span>
          </div>
          <div class="progress-item primary">
            <span class="label">上报率：</span>
            <span class="value">{{ progressData.reportRate || 0 }}%</span>
          </div>
          <el-progress
            :percentage="progressData.reportRate || 0"
            :stroke-width="10"
            style="width: 200px; margin-left: 16px"
          />
        </div>
      </ContentWrap>

      <!-- 列表 -->
      <ContentWrap>
        <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
          <el-table-column label="序号" width="80" type="index" align="center" />
          <el-table-column label="所属地区" align="center" prop="regionPath" min-width="180">
            <template #default="scope">
              <span class="region-path">{{ scope.row.regionPath || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="机构名称" align="center" prop="deptName" min-width="180">
            <template #default="scope">
              <div class="institution-name-cell">
                <el-tooltip
                  :content="getInstitutionCategoryLabel(scope.row.institutionCategory)"
                  placement="top"
                >
                  <DictIcon
                    :dict-type="DICT_TYPE.INSTITUTION_CATEGORY"
                    :value="scope.row.institutionCategory ?? ''"
                    :size="18"
                    default-color="#5b8def"
                  />
                </el-tooltip>
                <span class="institution-name-text font-bold">{{ scope.row.deptName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="联系人" align="center" prop="contactPerson" width="100" />
          <el-table-column label="联系电话" align="center" prop="contactPhone" width="120" />
          <el-table-column label="填报周期" align="center" prop="reportWeek" width="100" />
          <el-table-column label="截止时间" align="center" width="150px">
            <template #default="scope">
              {{ formatDeadlineTime(scope.row.deadlineTime) }}
            </template>
          </el-table-column>
          <el-table-column label="剩余时间" align="center" width="150px">
            <template #default="scope">
              <span v-if="scope.row.reportStatus === 3" class="text-gray-400">已结束</span>
              <span v-else :class="getRemainingTimeClass(scope.row.deadlineTime)">
                {{ calculateRemainingTime(scope.row.deadlineTime) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="填报完成度" align="center" prop="completionRate" width="180px">
            <template #default="scope">
              <div class="flex items-center gap-2">
                <el-progress
                  :percentage="scope.row.completionRate || 0"
                  :color="getProgressColor(scope.row.completionRate)"
                  :stroke-width="8"
                  style="flex: 1"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="填报状态" align="center" prop="reportStatus" width="100px">
            <template #default="scope">
              <dict-tag :type="DICT_TYPE.DRUG_REPORT_STATUS" :value="scope.row.reportStatus" />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="100px" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" @click="handleDetail(scope.row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <!-- 分页 -->
        <Pagination
          :total="total"
          v-model:page="queryParams.pageNo"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
        />
      </ContentWrap>
    </div>

    <!-- 详情弹窗 -->
    <Dialog :title="`${detailData.deptName || ''} - 填报详情`" v-model="detailDialogVisible" width="1200px">
      <div v-loading="detailLoading" class="detail-container">
        <!-- 基本信息卡片 -->
        <ContentWrap
          title="基本信息"
          header-icon="ep:info-filled"
          :collapsible="true"
          :default-collapsed="false"
          shadow="hover"
          class="detail-section"
        >
          <el-descriptions :column="2" border>
            <el-descriptions-item label="填报专区">{{ detailData.zoneName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="机构名称">{{ detailData.deptName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="所属地区">{{ detailData.regionPath || '-' }}</el-descriptions-item>
            <el-descriptions-item label="填报周期">{{ detailData.reportWeek || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ detailData.contactPerson || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ detailData.contactPhone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="填报状态">
              <dict-tag :type="DICT_TYPE.DRUG_REPORT_STATUS" :value="detailData.reportStatus" />
            </el-descriptions-item>
            <el-descriptions-item label="填报完成度">
              <el-progress
                :percentage="Number(detailData.completionRate) || 0"
                :color="getProgressColor(detailData.completionRate)"
                :stroke-width="10"
                style="width: 200px"
              />
            </el-descriptions-item>
            <el-descriptions-item label="提交时间">
              {{ formatDeadlineTime(detailData.submitTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="截止时间">
              {{ formatDeadlineTime(detailData.deadlineTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </ContentWrap>

        <!-- 填报明细卡片 -->
        <ContentWrap
          :title="`填报明细（${detailDrugCount} 种药品）`"
          header-icon="ep:document"
          :collapsible="true"
          :default-collapsed="false"
          shadow="hover"
          class="detail-section"
        >
          <div class="table-wrapper">
            <el-table
              :data="detailRecords"
              border
              max-height="450"
              :row-class-name="getDetailRowClassName"
              :span-method="detailSpanMethod"
              class="detail-table"
            >
              <el-table-column label="序号" width="90" align="center" class-name="header-bold">
                <template #default="scope">
                  {{ getDrugIndex(scope.row, scope.$index) }}
                </template>
              </el-table-column>
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
                min-width="180"
                show-overflow-tooltip
                class-name="header-bold"
              />
              <el-table-column
                label="剂型"
                prop="dosageCategory"
                width="100"
                align="center"
                class-name="header-bold"
              />
              <el-table-column
                label="最小剂量单位"
                prop="dosageUnit"
                width="120"
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
                label="本机构未使用此药品"
                width="150"
                align="center"
                class-name="header-bold"
              >
                <template #default="scope">
                  <el-tag v-if="scope.row.notAvailable" type="info" size="small">是</el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column
                label="本周累计使用量"
                prop="weekUsageAmount"
                width="140"
                align="right"
                class-name="header-bold"
              >
                <template #default="scope">
                  <span v-if="scope.row.notAvailable" class="not-available-text">未使用</span>
                  <span v-else class="number-value usage">
                    {{ formatNumber(scope.row.weekUsageAmount) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column
                label="当日实时库存量"
                prop="currentStockAmount"
                width="140"
                align="right"
                class-name="header-bold"
              >
                <template #default="scope">
                  <span v-if="scope.row.notAvailable" class="not-available-text">未使用</span>
                  <span v-else class="number-value stock">
                    {{ formatNumber(scope.row.currentStockAmount) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column
                label="供应情况"
                prop="supplyStatus"
                width="100"
                align="center"
                class-name="header-bold"
              >
                <template #default="scope">
                  <span v-if="scope.row.notAvailable" class="not-available-text">-</span>
                  <dict-tag v-else :type="DICT_TYPE.SUPPLY_STATUS" :value="scope.row.supplyStatus" />
                </template>
              </el-table-column>
<!--              <el-table-column
                label="预计可用天数"
                width="120"
                align="center"
                class-name="header-bold"
              >
                <template #default="scope">
                  <div class="stock-days" :class="getAvailableDaysClass(scope.row)">
                    <Icon :icon="getStockDaysIcon(scope.row)" class="days-icon" />
                    <span>{{ calculateAvailableDays(scope.row) }}</span>
                  </div>
                </template>
              </el-table-column>-->
            </el-table>
          </div>
        </ContentWrap>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { getIntDictOptions, DICT_TYPE, getDictLabel, getDictObj } from '@/utils/dict'
import { ReportRecordApi, ReportZoneApi } from '@/api/shortage'
import download from '@/utils/download'
import RegionTree from '@/views/system/user/RegionTree.vue'
import DictIcon from '@/components/DictIcon'
import { useMessage } from '@/hooks/web/useMessage'
import { Dialog } from '@/components/Dialog'
import { ContentWrap } from '@/components/ContentWrap'
import { Icon } from '@/components/Icon'
import dayjs from 'dayjs'

/** 填报记录查询列表 */
defineOptions({ name: 'ReportRecordList' })

const message = useMessage() // 消息弹窗
const SUBMITTED_STATUS = 2

const loading = ref(true) // 列表的加载中
const list = ref<any[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const selectedRegion = ref<any>(null) // 选中的地区节点
const reportWeekOptions = ref<string[]>([]) // 填报周期选项
const zoneOptions = ref<any[]>([]) // 填报专区选项
const exportLoading = ref(false) // 导出按钮加载状态
const exportLoading2 = ref(false) // 导出本轮机构上报情况按钮加载状态

// 详情弹窗相关
const detailDialogVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref<any>({})
const detailRecords = ref<any[]>([])

// 填报明细药品数量（按药品名称去重）
const detailDrugCount = computed(() => {
  const drugNames = new Set(detailRecords.value.map(item => item.drugName))
  return drugNames.size
})

// 获取药品序号（按药品名称分组，相同药品显示相同序号）
const getDrugIndex = (row: any, rowIndex: number): number => {
  const dataList = detailRecords.value
  if (!dataList.length) return rowIndex + 1
  
  // 获取当前药品名称在所有药品名称中的排序位置
  const drugNames: string[] = []
  dataList.forEach(item => {
    if (!drugNames.includes(item.drugName)) {
      drugNames.push(item.drugName)
    }
  })
  
  return drugNames.indexOf(row.drugName) + 1
}

// 面板拖拽相关
const regionTreeRef = ref<InstanceType<typeof RegionTree>>()
const selectorWidth = ref(250) // 默认宽度设为最小宽度
const isResizing = ref(false)

const queryParams = reactive<{
  pageNo: number
  pageSize: number
  regionCode: string | undefined
  zoneId: number | undefined
  reportWeek: string | undefined
  deptName: string | undefined
  reportStatus: number | undefined
}>({
  pageNo: 1,
  pageSize: 10,
  regionCode: undefined, // 地区代码
  zoneId: undefined, // 填报专区ID
  reportWeek: undefined, // 填报周期
  deptName: undefined, // 机构名称
  reportStatus: undefined // 填报状态
})
const queryFormRef = ref() // 搜索的表单

// 进度统计数据
const progressData = ref<{
  totalCount: number
  reportedCount: number
  unreportedCount: number
  reportRate: number
}>({
  totalCount: 0,
  reportedCount: 0,
  unreportedCount: 0,
  reportRate: 0
})

const getInstitutionCategoryLabel = (value: string | number | boolean | undefined) => {
  return getDictObj(DICT_TYPE.INSTITUTION_CATEGORY, value)?.label ?? '机构分类'
}

/** 开始拖拽调整大小 */
const startResize = (e: MouseEvent) => {
  // 如果地区树处于折叠状态，禁用拖拽
  if (regionTreeRef.value?.isCollapsed) {
    return
  }

  isResizing.value = true
  const startX = e.clientX
  const startWidth = selectorWidth.value

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!isResizing.value) return
    const diff = moveEvent.clientX - startX
    const newWidth = Math.max(250, Math.min(600, startWidth + diff)) // 限制最小250px，最大600px
    selectorWidth.value = newWidth
  }

  const onMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
  e.preventDefault()
}

/** 监听地区树折叠状态，自动调整宽度 */
watch(
  () => regionTreeRef.value?.isCollapsed,
  (collapsed) => {
    if (collapsed) {
      selectorWidth.value = 50 // 折叠状态宽度 - 只显示展开按钮
    } else if (selectorWidth.value === 50) {
      selectorWidth.value = 250 // 恢复默认宽度
    }
  }
)

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ReportRecordApi.getReportRecordList(queryParams)
    list.value = data.list
    total.value = data.total
    // 同时获取进度统计
    if (queryParams.reportWeek) {
      loadReportProgress()
    }
  } finally {
    loading.value = false
  }
}

/** 加载填报进度统计 */
const loadReportProgress = async () => {
  try {
    const data = await ReportRecordApi.getReportProgress({
      zoneId: queryParams.zoneId,
      reportWeek: queryParams.reportWeek,
      regionCode: queryParams.regionCode
    })
    progressData.value = data || { totalCount: 0, reportedCount: 0, unreportedCount: 0, reportRate: 0 }
  } catch (error) {
    console.error('加载进度统计失败:', error)
  }
}
const handleExport2 = async () => {
  try {
    await message.exportConfirm()
    exportLoading2.value = true
    const data = await ReportRecordApi.exportReportDetail(queryParams)
    download.excel(data, '填报记录明细.xlsx')
    message.success('导出成功')
  } finally {
    exportLoading2.value = false
  }
}

/** 地区选择处理 */
const handleRegionSelect = (region: any) => {
  selectedRegion.value = region
  queryParams.regionCode = region?.code
  queryParams.pageNo = 1
  getList()
}

/** 清除地区选择 */
const handleClearRegion = () => {
  selectedRegion.value = null
  queryParams.regionCode = undefined
  queryParams.pageNo = 1
  // 清除树的选中状态
  regionTreeRef.value?.clearSelection()
  getList()
}

/** 获取地区显示名称 */
const getRegionDisplayName = (region: any) => {
  if (!region) return ''
  // 使用字典获取地区级别的文字
  const levelLabel = getDictLabel(DICT_TYPE.REGION_LEVEL, region.level)
  return `${region.name}(${levelLabel || ''})`
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 导出按钮可用状态 */
const canExport = computed(() => {
  if (!queryParams.zoneId || !queryParams.reportWeek) {
    return false
  }
  return Number(queryParams.reportStatus) === SUBMITTED_STATUS
})

const canExport2 = computed(() => {
  return (queryParams.zoneId != null && queryParams.reportWeek != null)
})


/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  // 重置后重新选中最新周期
  if (reportWeekOptions.value.length > 0) {
    queryParams.reportWeek = reportWeekOptions.value[0]
  }
  handleQuery()
}

/** 格式化截止时间 */
const formatDeadlineTime = (deadlineTime: string) => {
  if (!deadlineTime) return '-'
  return dayjs(deadlineTime).format('YYYY-MM-DD HH:mm')
}

/** 计算剩余时间 */
const calculateRemainingTime = (targetTime: string, isStartTime: boolean = false) => {
  if (!targetTime) return '-'

  const now = new Date()
  const target = new Date(targetTime)
  const diff = target.getTime() - now.getTime()
  const absDiff = Math.abs(diff)

  // 根据是否是开始时间,决定前缀
  let prefix = ''
  if (isStartTime) {
    prefix = diff <= 0 ? '已开始' : '距开始'
  } else {
    // 超过截止时间直接返回"已结束"，不再计算具体时间
    if (diff <= 0) return '已结束'
    prefix = '剩余'
  }

  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60))

  // 大于等于1天：显示天+小时
  if (days > 0) {
    return `${prefix}${days}天${hours}小时`
  }
  // 大于等于1小时：显示小时+分钟
  if (hours > 0) {
    return `${prefix}${hours}小时${minutes}分钟`
  }
  // 小于1小时：只显示分钟
  return `${prefix}${minutes}分钟`
}

/** 获取剩余时间样式类名 */
const getRemainingTimeClass = (deadlineTime: string) => {
  if (!deadlineTime) return ''

  const now = new Date()
  const deadline = new Date(deadlineTime)
  const diff = deadline.getTime() - now.getTime()

  if (diff <= 0) {
    return 'text-red-500 font-bold' // 逾期显示红色加粗
  } else if (diff <= 24 * 60 * 60 * 1000) {
    return 'text-orange-500 font-bold' // 24小时内显示橙色加粗
  } else if (diff <= 3 * 24 * 60 * 60 * 1000) {
    return 'text-orange-400' // 3天内显示橙色
  } else {
    return 'text-green-500' // 正常显示绿色
  }
}

/** 获取进度条颜色 */
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

/** 详情按钮操作 */
const handleDetail = async (row: any) => {
  detailDialogVisible.value = true
  detailData.value = { ...row }
  detailLoading.value = true
  
  try {
    // 获取填报明细数据
    const data = await ReportRecordApi.getReportRecordDetail(row.taskId)
    
    // 按照药品分类、药品名称、剂型排序，确保相同药品名称的数据连续显示
    const sortedData = [...(data || [])].sort((a, b) => {
      // 先按药品分类排序
      const categoryCompare = (a.drugCategory || '').localeCompare(b.drugCategory || '', 'zh-CN')
      if (categoryCompare !== 0) return categoryCompare
      
      // 同一分类内按药品名称排序
      const nameCompare = (a.drugName || '').localeCompare(b.drugName || '', 'zh-CN')
      if (nameCompare !== 0) return nameCompare
      
      // 同一药品名称按剂型排序
      return (a.dosageCategory || '').localeCompare(b.dosageCategory || '', 'zh-CN')
    })
    
    detailRecords.value = sortedData
  } catch (error) {
    console.error('加载填报明细失败:', error)
    message.error('加载填报明细失败')
  } finally {
    detailLoading.value = false
  }
}

/** 格式化数字 */
const formatNumber = (value: number | undefined): string => {
  if (value === undefined || value === null) return '0.00'
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** 计算库存可用天数 */
const calculateAvailableDays = (row: any): string => {
  if (row.notAvailable) return '-'
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

/** 获取库存天数样式类 */
const getAvailableDaysClass = (row: any): string => {
  if (row.notAvailable) return ''
  const weekUsage = row.weekUsageAmount || 0
  const currentStock = row.currentStockAmount || 0

  if (weekUsage === 0) return 'sufficient'

  const dailyUsage = weekUsage / 7
  const days = Math.floor(currentStock / dailyUsage)

  if (days > 30) return 'sufficient'
  if (days > 7) return 'warning'
  return 'danger'
}

/** 获取库存天数图标 */
const getStockDaysIcon = (row: any): string => {
  const className = getAvailableDaysClass(row)
  if (className === 'sufficient') return 'ep:circle-check-filled'
  if (className === 'warning') return 'ep:warning-filled'
  return 'ep:circle-close-filled'
}

/** 获取详情表格行样式 */
const getDetailRowClassName = ({ row }: { row: any }): string => {
  if (row.supplyStatus === 4) return 'severe-shortage-row'
  if (row.supplyStatus === 3) return 'shortage-row'
  if (row.supplyStatus === 2) return 'warning-row'
  return ''
}

/** 详情表格合并单元格方法 */
const detailSpanMethod = ({ row, column, rowIndex, columnIndex }: any) => {
  const dataList = detailRecords.value
  
  // 对序号列（第1列）和药品名称列（第3列）进行合并 - 按药品名称分组
  if (columnIndex === 0 || columnIndex === 2) {
    const currentDrugName = row.drugName

    if (!currentDrugName || !dataList.length) {
      return { rowspan: 1, colspan: 1 }
    }

    // 找到当前药品名称在数据中第一次出现的位置
    let startIndex = -1
    for (let i = 0; i < dataList.length; i++) {
      if (dataList[i].drugName === currentDrugName) {
        startIndex = i
        break
      }
    }

    // 如果当前行是该药品名称的第一行
    if (rowIndex === startIndex) {
      // 计算相同药品名称的连续行数
      let count = 0
      for (let i = startIndex; i < dataList.length; i++) {
        if (dataList[i].drugName === currentDrugName) {
          count++
        } else {
          break
        }
      }
      
      return {
        rowspan: count,
        colspan: 1
      }
    } else if (dataList[rowIndex]?.drugName === currentDrugName && rowIndex > startIndex) {
      // 如果当前行药品名称与前面的相同，且不是第一行，则隐藏
      return {
        rowspan: 0,
        colspan: 0
      }
    }
  }
  
  // 对药品分类列（第2列）进行合并 - 按药品分类分组
  if (columnIndex === 1) {
    const currentCategory = row.drugCategory

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

    // 计算当前分类的总行数（整个数据集中该分类的所有行）
    const categoryCount = dataList.filter((item) => item.drugCategory === currentCategory).length

    if (rowIndex === startIndex) {
      return {
        rowspan: categoryCount,
        colspan: 1
      }
    } else if (dataList[rowIndex]?.drugCategory === currentCategory) {
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

/** 加载填报周期选项 */
const loadReportWeekOptions = async () => {
  try {
    const data = await ReportRecordApi.getReportWeeks()
    reportWeekOptions.value = data
    // 默认选中最新的周期（第一个）
    if (data && data.length > 0 && !queryParams.reportWeek) {
      queryParams.reportWeek = data[0]
    }
  } catch (error) {
    console.error('加载填报周期选项失败:', error)
  }
}

/** 加载填报专区选项 */
const loadZoneOptions = async () => {
  try {
    const data = await ReportZoneApi.getOptions()
    zoneOptions.value = data
  } catch (error) {
    console.error('加载填报专区选项失败:', error)
  }
}

/** 导出机构填报数据 */
const handleExport = async () => {
  if (!canExport.value) {
    message.warning('请先选择专区、填报周期并将状态筛选为已提交')
    return
  }
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const params = {
      regionCode: queryParams.regionCode,
      zoneId: queryParams.zoneId,
      reportWeek: queryParams.reportWeek,
      reportStatus: SUBMITTED_STATUS
    }
    const data = await ReportRecordApi.exportReportRecord(params)
    download.excel(data, '机构填报记录.xlsx')
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(async () => {
  // 先加载周期选项（会自动选中最新周期）
  await loadReportWeekOptions()
  loadZoneOptions()
  // 带着默认周期查询列表
  getList()
})
</script>

<style scoped lang="scss">
/* 容器高度自适应 */
.record-container {
  height: calc(100vh - 140px); /* 减去头部导航和边距 */
  min-height: 600px; /* 最小高度保证内容可见 */
  overflow: hidden;
}

.resize-handle {
  width: 5px;
  background: var(--el-border-color-light);
  cursor: ew-resize;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: var(--el-color-primary);
    width: 6px;
  }

  // 折叠状态下禁用拖拽（通过父组件判断）
  &:has(~ .main-content) {
    &:hover {
      cursor: ew-resize;
    }
  }
}

// 右侧内容区域 - 关键：限制宽度避免被表格撑开
.main-content {
  min-width: 0; // flex子元素必须设置，否则默认min-width: auto会导致内容溢出
  overflow-x: auto; // 横向滚动
}

// 地区标签美化
.region-tag {
  padding: 10px 18px;
  font-size: 14px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.25);
    transform: translateY(-1px);
  }

  :deep(.el-icon) {
    font-size: 16px;
  }
}

// 机构名称单元格样式
.institution-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.institution-name-text {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

// 地区路径样式
.region-path {
  color: var(--el-text-color-regular);
  font-size: 13px;
}

// 详情容器
.detail-container {
  max-height: 75vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 4px;

  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 0, 0, 0.2);
    }
  }
}

// 详情区块样式
.detail-section {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

// 表格容器
.table-wrapper {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}

// 详情表格样式
.detail-table {
  font-size: 14px;

  :deep(.el-table__header) {
    background: linear-gradient(180deg, #f8f9fb 0%, #f5f7fa 100%);
  }

  :deep(.header-bold .cell) {
    font-weight: 600;
    color: #303133;
  }

  :deep(.category-column .cell) {
    background: #fafbfc;
    font-weight: 600;
    color: #409eff;
    font-size: 14px;
    vertical-align: middle;
  }

  // 行样式
  :deep(.warning-row) {
    background-color: #fdf6ec;
  }

  :deep(.shortage-row) {
    background-color: #fef0f0;
  }

  :deep(.severe-shortage-row) {
    background-color: #fee;
  }
}

// 数值样式
.number-value {
  font-weight: 600;
  font-size: 14px;

  &.usage {
    color: #409eff;
  }

  &.stock {
    color: #67c23a;
  }
}

/* 未使用提示样式 */
.not-available-text {
  color: #909399;
  font-size: 14px;
  font-style: italic;
}

// 库存天数样式
.stock-days {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;

  &.sufficient {
    color: #67c23a;
    background: #67c23a10;
  }

  &.warning {
    color: #e6a23c;
    background: #e6a23c10;
  }

  &.danger {
    color: #f56c6c;
    background: #f56c6c10;
  }

  .days-icon {
    font-size: 16px;
  }
}

// 进度统计样式
.progress-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 8px 0;

  .progress-item {
    display: flex;
    align-items: center;
    gap: 4px;

    .label {
      color: #606266;
      font-size: 14px;
    }

    .value {
      font-weight: 600;
      font-size: 16px;
      color: #303133;
    }

    &.success .value {
      color: #67c23a;
    }

    &.warning .value {
      color: #e6a23c;
    }

    &.primary .value {
      color: #409eff;
    }
  }
}
</style>
