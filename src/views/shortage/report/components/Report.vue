<template>
  <div class="report-container">
    <!-- 固定头部卡片 -->
    <ContentWrap class="header-card">
      <div class="header-content">
        <div class="header-left">
          <el-button class="back-button" @click="handleBack" text>
            <el-icon class="back-icon">
              <ArrowLeft />
            </el-icon>
            <span>返回</span>
          </el-button>
          <div class="header-divider"></div>
          <div class="header-info">
            <h2 class="page-title">{{ zoneInfo?.zoneName || '药品短缺填报' }}</h2>
            <p class="page-subtitle">{{ displayWeek }} 填报周期</p>
          </div>
        </div>
        <div class="header-right">
          <!-- 填报状态 -->
          <div class="meta-item">
            <span class="meta-label">状态：</span>
            <dict-tag :type="DICT_TYPE.DRUG_REPORT_STATUS" :value="reportStatus" />
          </div>
          <div class="meta-divider"></div>
          
          <!-- 进度信息 - 所有状态都显示 -->
          <div class="meta-item progress-info">
            <span class="meta-label">已完成：</span>
            <span class="meta-value-primary">{{ completedCount }}</span>
            <span class="meta-text">/</span>
            <span class="meta-value">{{ totalCount }}</span>
            <span class="meta-text">项</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item progress-info">
            <span class="meta-label">完成度：</span>
            <span class="meta-value-primary">{{ completionRate }}%</span>
            <el-progress
              :percentage="completionRate"
              :color="getProgressColor(completionRate)"
              :stroke-width="6"
              :show-text="false"
              class="mini-progress"
            />
          </div>
          
          <!-- 提交时间（仅已提交状态且有提交时间时显示） -->
          <template v-if="reportStatus === 2 && taskDetail?.submitTime">
            <div class="meta-divider"></div>
            <div class="meta-item">
              <span class="meta-label">提交时间：</span>
              <span class="meta-value">{{ dayjs(taskDetail.submitTime).format('YYYY-MM-DD HH:mm') }}</span>
            </div>
          </template>
        </div>
      </div>
    </ContentWrap>

  <!-- 通知区域（包含剩余时间提示） -->
  <ContentWrap
    v-if="!noticeClosedByUser && zoneNotice && selectedZoneId"
    :title="noticeTitle"
    header-icon="ep:bell"
    headerIconColor="orange"
    class="notice-card"
  >
    <template #header>
      <el-button text @click="handleCloseNotice" class="close-notice-btn">
        <el-icon><Close /></el-icon>
      </el-button>
    </template>
    <div v-html="zoneNotice" class="notice-content"></div>
  </ContentWrap>

  <!-- 填报表格 -->
  <ContentWrap
    v-if="selectedZoneId"
    :title="tableTitle"
    message="请检查填报数据，确保准确无误后提交"
    header-icon="ep:edit"
  >

    <!-- 药品分类Tab -->
    <el-tabs v-model="activeDrugCategory" type="border-card" class="drug-category-tabs" @tab-change="handleTabChange">
      <el-tab-pane
        v-for="category in drugCategories"
        :key="category"
        :name="category"
      >
        <template #label>
          <span class="tab-label">
            {{ category ?? '' }}
            <el-badge :value="getCategoryCount(category ?? '')" class="tab-badge" />
          </span>
        </template>
        <el-table
          v-loading="loading"
          :data="filteredReportList"
          border
          class="report-table"
          :row-class-name="getRowClassName"
        >
          <el-table-column label="序号" type="index" width="80" fixed class-name="header-bold" />
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
            width="280"
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
            width="280"
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
    <div class="submit-area" v-if="selectedZoneId && reportList.length > 0">
      <div class="flex items-center justify-between">
        <div class="submit-buttons">
          <!-- 预览按钮 - 所有状态都显示 -->
          <el-tooltip 
            :content="reportList.length === 0 ? '暂无数据可预览' : '预览已填写的数据'"
            placement="top"
          >
            <el-button @click="handlePreview" :disabled="reportList.length === 0">
              <Icon icon="ep:view" class="mr-1" />
              预览数据
            </el-button>
          </el-tooltip>
          
          <!-- 草稿和提交按钮 - 仅非只读模式显示 -->
          <template v-if="!isReadOnly">
            <el-tooltip 
              :content="getSaveDraftTooltip"
              placement="top"
            >
              <span>
                <el-button 
                  type="info" 
                  @click="handleSaveDraft" 
                  :loading="savingDraft"
                  :disabled="hasNoFilledData"
                >
                  <Icon icon="ep:document-add" class="mr-1" />
                  保存草稿
                </el-button>
              </span>
            </el-tooltip>
            <el-tooltip 
              :content="getSubmitTooltip"
              placement="top"
            >
              <span>
                <el-button
                  type="primary"
                  @click="handleSubmit"
                  :loading="submitting"
                  :disabled="!isInReportTime"
                >
                  <Icon icon="ep:upload" class="mr-1" />
                  提交填报
                </el-button>
              </span>
            </el-tooltip>
          </template>
        </div>
      </div>
    </div>
  </ContentWrap>

  <!-- 预览对话框 -->
  <PreviewDialog ref="previewDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import {
  ReportZoneApi,
  ReportRecordApi,
  type ReportZoneVO,
  type ReportRecordVO
} from '@/api/shortage'
import { ArrowLeft, Close } from '@element-plus/icons-vue'
import { ReportTaskApi, type ReportTaskVO } from '@/api/shortage/reporttask'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { useMessage } from '@/hooks/web/useMessage'
import PreviewDialog from './PreviewDialog.vue'

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
const zoneInfo = ref<ReportZoneVO>()
const noticeClosedByUser = ref(false) // 用户是否手动关闭通知

// 从路由获取参数
const taskId = ref<string>(route.params.taskId as string)
const routeZoneId = ref<string | undefined>(route.query.zoneId as string | undefined)
const routeReportWeek = ref<string | undefined>(route.query.reportWeek as string | undefined)
const reportStatus = ref<number>(route.query.reportStatus ? Number(route.query.reportStatus) : 0)

// 根据填报状态判断是否为只读模式: 2-已提交/3-已逾期为只读
const isReadOnly = computed(() => reportStatus.value === 2 || reportStatus.value === 3)

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

// 返回列表
const handleBack = () => {
  router.push({ name: 'ShortageReportList' })
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

// 通知标题（包含剩余时间信息）
const noticeTitle = computed(() => {
  if (!isReadOnly.value && isTimeRestricted.value && remainingTime.value) {
    if (isInReportTime.value) {
      return `填报通知（剩余时间：${remainingTime.value}）`
    } else {
      return `填报通知（${timeConfigDisplay.value}）`
    }
  }
  return '填报通知'
})

// 关闭通知
const handleCloseNotice = () => {
  noticeClosedByUser.value = true
}

// 是否有填写的数据
const hasNoFilledData = computed(() => {
  return reportList.value.every((item) => {
    return (
      (!item.weekUsageAmount || item.weekUsageAmount === 0) &&
      (!item.currentStockAmount || item.currentStockAmount === 0) &&
      (!item.supplyStatus || item.supplyStatus === 0)
    )
  })
})

// 保存草稿按钮提示
const getSaveDraftTooltip = computed(() => {
  if (hasNoFilledData.value) {
    return '请至少填写一项数据后再保存草稿'
  }
  return '保存当前填写的数据为草稿'
})

// 提交按钮提示
const getSubmitTooltip = computed(() => {
  if (!isInReportTime.value) {
    if (isTimeRestricted.value) {
      return `当前不在填报时间内，填报时间：${timeConfigDisplay.value}`
    }
    return '当前不在填报时间内'
  }
  return '提交填报数据（提交后将无法修改）'
})

// 验证数据完整性
const validateData = (): { valid: boolean; message: string; incompleteItems: any[] } => {
  const incompleteItems: any[] = []
  
  reportList.value.forEach((item, index) => {
    // 使用相同的逻辑检查是否需要必填
    const isRequired = getIsSupplyStatusRequired(item)
    
    // 如果需要必填，供应情况必须填写
    if (isRequired && (!item.supplyStatus || item.supplyStatus === 0)) {
      incompleteItems.push({
        index: index + 1,
        drugName: item.drugName,
        category: item.drugCategory
      })
    }
  })
  
  if (incompleteItems.length > 0) {
    const firstItem = incompleteItems[0]
    return {
      valid: false,
      message: `请完善供应情况信息！第 ${firstItem.index} 项「${firstItem.drugName}」需要填写供应情况`,
      incompleteItems
    }
  }
  
  return { valid: true, message: '', incompleteItems: [] }
}

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
    // @ts-ignore - 清空供应情况
    row.supplyStatus = undefined
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
const checkReportTime = async () => {
  if (!selectedZoneId.value) {
    timeConfigDisplay.value = '请先选择填报专区'
    isTimeRestricted.value = false
    return
  }

  try {
    const result = await ReportZoneApi.checkReportTime(selectedZoneId.value)
    isInReportTime.value = result.isInTime
    timeConfigDisplay.value = result.message || ''
    // @ts-ignore - 使用 isTimeRestricted 字段
    isTimeRestricted.value = result.isTimeRestricted !== false // 如果有时间限制则显示组件

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
      activeDrugCategory.value = drugCategories.value[0] ?? ''
    }

    // 获取专区信息
    const zone = zoneList.value.find((z) => z.id === selectedZoneId.value)
    if (zone) {
      zoneInfo.value = zone
      zoneNotice.value = zone.noticeContent ?? ''
    } else {
      // 如果从列表中找不到，尝试单独获取
      try {
        const zoneData = await ReportZoneApi.get(selectedZoneId.value)
        zoneInfo.value = zoneData
        zoneNotice.value = zoneData?.noticeContent ?? ''
      } catch (error) {
        console.error('获取专区信息失败:', error)
      }
    }

    // 检查填报时间
    await checkReportTime()
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

  // 验证数据完整性
  const validation = validateData()
  if (!validation.valid) {
    message.warning(validation.message)
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

    // 调用提交接口,传递taskId、reportWeek和completionRate
    await ReportRecordApi.submitReport({
      taskId: Number(taskId.value),
      reportWeek: displayWeek.value, // 传入当前显示的周期
      data: submitData,
      completionRate: completionRate.value // 传递前端计算的完成度
    })
    message.success('填报成功')

    // 返回列表页面
    router.push({ name: 'ShortageReportList', params: { refresh: 'true' } })
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitting.value = false
  }
}

// 保存草稿
const handleSaveDraft = async () => {
  // 检查是否有数据
  if (hasNoFilledData.value) {
    message.warning('请至少填写一项数据后再保存草稿')
    return
  }

  try {
    savingDraft.value = true

    // 过滤出有数据的记录
    const draftData = reportList.value
      .filter(
        (item) =>
          (item.weekUsageAmount !== undefined && item.weekUsageAmount !== null && item.weekUsageAmount > 0) ||
          (item.currentStockAmount !== undefined && item.currentStockAmount !== null && item.currentStockAmount > 0) ||
          (item.supplyStatus !== undefined && item.supplyStatus !== null && item.supplyStatus > 0)
      )
      .map((item) => ({
        ...item,
        dosageUnit: item.dosageUnit
      }))

    // 验证数据完整性，给出提示但允许保存
    const validation = validateData()
    if (!validation.valid) {
      const incompleteCount = validation.incompleteItems.length
      const confirmMsg = `当前有 ${incompleteCount} 项数据的供应情况未填写，是否继续保存草稿？\n提示：填写了使用量或库存的药品需要填写供应情况`
      
      try {
        await message.confirm(confirmMsg)
      } catch {
        return // 用户取消
      }
    }

    // 调用保存草稿API,传递taskId、reportWeek和completionRate
    await ReportRecordApi.saveDraft({
      taskId: Number(taskId.value),
      reportWeek: displayWeek.value, // 传入当前显示的周期
      data: draftData,
      completionRate: completionRate.value // 传递前端计算的完成度
    })

    message.success('草稿保存成功')

    // 返回列表页面
    router.push({ name: 'ShortageReportList', params: { refresh: 'true' } })
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
.report-container {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  min-height: 100vh;
}

/* 固定头部卡片样式 */
.header-card {
  margin-bottom: 20px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 20px;
  z-index: 100;
  transition: all 0.3s ease;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  gap: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  min-width: 0;
}

.back-button {
  color: #4b5563;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 14px;
  margin: -4px 0 0 -4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.back-button:hover {
  color: #667eea;
  background: #f3f4f6;
  border-color: #667eea;
  transform: translateX(-4px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.back-icon {
  font-size: 16px;
  transition: transform 0.3s ease;
}

.back-button:hover .back-icon {
  transform: translateX(-2px);
}

.header-divider {
  width: 1px;
  height: 32px;
  background: linear-gradient(to bottom, transparent, #d1d5db, transparent);
  flex-shrink: 0;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.meta-value {
  font-size: 13px;
  color: #1a202c;
  font-weight: 600;
  background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%);
  padding: 4px 12px;
  border-radius: 6px;
}

.meta-value-primary {
  font-size: 15px;
  color: #409eff;
  font-weight: 700;
}

.meta-text {
  font-size: 13px;
  color: #9ca3af;
  margin: 0 2px;
}

.meta-divider {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mini-progress {
  width: 100px;
  margin-left: 8px;
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

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-badge :deep(.el-badge__content) {
  background-color: #409eff;
  border: none;
  font-weight: 600;
}

/* 通知卡片样式 */
.notice-card {
  transition: all 0.3s ease;
}

.notice-card :deep(.content-wrap__header) {
  position: relative;
}

.close-notice-btn {
  color: #909399;
  transition: all 0.3s ease;
  padding: 4px;
}

.close-notice-btn:hover {
  color: #f56c6c;
  background-color: rgba(245, 108, 108, 0.1);
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
  align-items: center;
}

/* Tooltip 包裹的 span，确保disabled按钮也能显示tooltip */
.submit-buttons :deep(span) {
  display: inline-block;
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

/* 响应式设计 */
@media (max-width: 1200px) {
  .header-content {
    flex-wrap: wrap;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-start;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
  }
}

@media (max-width: 768px) {
  .report-container {
    padding: 16px;
  }

  .header-card {
    top: 16px;
  }

  .header-content {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
  }

  .header-left {
    width: 100%;
    flex-wrap: wrap;
  }

  .back-button {
    padding: 8px 12px;
    font-size: 13px;
  }

  .page-title {
    font-size: 16px;
  }

  .page-subtitle {
    font-size: 12px;
  }

  .header-right {
    width: 100%;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
    flex-wrap: wrap;
  }

  .mini-progress {
    width: 80px;
  }
}
</style>
