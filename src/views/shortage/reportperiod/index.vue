<!--
  采集周期管理页面
  功能：查看各专区的填报周期列表，点击跳转到填报记录页查看详情
-->
<template>
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
      <el-form-item label="所属专区" prop="zoneId">
        <el-select
          v-model="queryParams.zoneId"
          placeholder="请选择专区"
          clearable
          class="!w-200px"
        >
          <el-option
            v-for="zone in zoneOptions"
            :key="zone.id"
            :label="zone.zoneName"
            :value="zone.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="周期状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择状态"
          clearable
          class="!w-140px"
        >
          <el-option
            v-for="item in periodStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="年份" prop="year">
        <el-select
          v-model="queryParams.year"
          placeholder="请选择年份"
          clearable
          class="!w-120px"
        >
          <el-option
            v-for="year in yearOptions"
            :key="year"
            :label="year + '年'"
            :value="year"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="周期编码" prop="periodCode">
        <el-input
          v-model="queryParams.periodCode"
          placeholder="如: 2025-47"
          clearable
          @keyup.enter="handleQuery"
          class="!w-140px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" />
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
      <el-table-column label="专区名称" align="center" prop="zoneName" min-width="120">
        <template #default="scope">
          <span class="font-bold text-primary">{{ scope.row.zoneName || getZoneName(scope.row.zoneId) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="周期编码" align="center" prop="periodCode" width="120">
        <template #default="scope">
          <el-tag type="info">{{ scope.row.periodCode }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="数据采集范围" align="center" min-width="160">
        <template #default="scope">
          <span class="text-gray-600">
            {{ formatDateRange(scope.row.dataStartTime, scope.row.dataEndTime) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="填报时间" align="center" min-width="180">
        <template #default="scope">
          <div class="flex flex-col items-center">
            <span>{{ formatDateTime(scope.row.reportStartTime) }}</span>
            <span class="text-gray-400">至</span>
            <span>{{ formatDateTime(scope.row.reportEndTime) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="周期状态" align="center" width="100">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.status)">
            {{ getStatusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="填报进度" align="center" min-width="200">
        <template #default="scope">
          <div class="flex items-center gap-2">
            <el-progress
              :percentage="calcProgress(scope.row)"
              :stroke-width="10"
              :color="getProgressColor(calcProgress(scope.row))"
              style="flex: 1"
            />
            <span class="text-sm text-gray-500 whitespace-nowrap">
              {{ scope.row.submittedCount || 0 }}/{{ scope.row.totalOrgCount || 0 }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleViewTasks(scope.row)">
            <Icon icon="ep:view" class="mr-3px" />
            查看任务
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
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ReportPeriodApi, ReportPeriodVO } from '@/api/shortage/reportperiod'
import { ReportZoneApi } from '@/api/shortage'
import dayjs from 'dayjs'

/** 采集周期管理 */
defineOptions({ name: 'ReportPeriod' })

const router = useRouter()
const loading = ref(true)
const list = ref<ReportPeriodVO[]>([])
const total = ref(0)
const zoneOptions = ref<any[]>([])

// 周期状态选项（简化为3种）
const periodStatusOptions = [
  { label: '未开始', value: 0 },
  { label: '填报中', value: 1 },
  { label: '已结束', value: 2 }
]

// 年份选项（当前年份及前2年）
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return [currentYear, currentYear - 1, currentYear - 2]
})

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  zoneId: undefined as number | undefined,
  periodCode: undefined as string | undefined,
  year: undefined as number | undefined,
  status: undefined as number | undefined
})
const queryFormRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ReportPeriodApi.getReportPeriodPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 加载专区列表（所有专区，不过滤status） */
const loadZoneOptions = async () => {
  try {
    // 使用 getAllOptions 获取所有专区（包括已关闭的），用于显示历史周期的专区名称
    const data = await ReportZoneApi.getAllOptions()
    zoneOptions.value = data || []
  } catch (error) {
    console.error('加载专区列表失败:', error)
  }
}

/** 根据专区ID获取专区名称 */
const getZoneName = (zoneId: number): string => {
  const zone = zoneOptions.value.find(z => z.id === zoneId)
  return zone?.zoneName || '-'
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 跳转到填报记录页查看任务 */
const handleViewTasks = (row: ReportPeriodVO) => {
  router.push({
    path: '/shortage/report-record',  // 路由路径带横线，与 system_menu 配置一致
    query: {
      zoneId: row.zoneId,
      reportWeek: row.periodCode
    }
  })
}

/** 格式化日期范围 */
const formatDateRange = (start: Date | string, end: Date | string): string => {
  if (!start || !end) return '-'
  const startStr = dayjs(start).format('M月D日')
  const endStr = dayjs(end).format('M月D日')
  return `${startStr} - ${endStr}`
}

/** 格式化日期时间 */
const formatDateTime = (dateTime: Date | string): string => {
  if (!dateTime) return '-'
  return dayjs(dateTime).format('M月D日 HH:mm')
}

/** 获取状态标签类型 */
const getStatusTagType = (status: number): string => {
  switch (status) {
    case 0: return 'info'      // 未开始
    case 1: return 'success'   // 填报中
    case 2: return ''          // 已结束
    default: return 'info'
  }
}

/** 获取状态标签文字 */
const getStatusLabel = (status: number): string => {
  const option = periodStatusOptions.find(o => o.value === status)
  return option?.label || '未知'
}

/** 计算填报进度百分比 */
const calcProgress = (row: ReportPeriodVO): number => {
  if (!row.totalOrgCount || row.totalOrgCount === 0) return 0
  return Math.round((row.submittedCount || 0) / row.totalOrgCount * 100)
}

/** 获取进度条颜色 */
const getProgressColor = (percentage: number): string => {
  if (percentage >= 100) return '#67C23A'
  if (percentage >= 60) return '#409EFF'
  if (percentage >= 30) return '#E6A23C'
  return '#F56C6C'
}

/** 初始化 */
onMounted(async () => {
  await loadZoneOptions()
  await getList()
})
</script>

<style scoped>
.text-primary {
  color: var(--el-color-primary);
}
</style>
