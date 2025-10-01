<template>
  <div class="flex h-full">
    <!-- 左侧地区树选择器 -->
    <div
      ref="selectorPanel"
      class="selector-panel"
      :style="{ width: selectorWidth + 'px' }"
    >
      <ContentWrap class="h-full selector-card" title="地区">
        <RegionTree @node-click="handleRegionSelect" />
      </ContentWrap>
    </div>

    <!-- 拖拽分隔条 -->
    <div
      class="resize-handle"
      @mousedown="startResize"
    ></div>

    <!-- 右侧内容区域 -->
    <div class="flex-1 ml-5">
      <ContentWrap>
        <!-- 搜索工作栏 -->
        <el-form
          class="-mb-15px"
          :model="queryParams"
          ref="queryFormRef"
          :inline="true"
          label-width="80px"
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
            <el-select v-model="queryParams.reportWeek" placeholder="请选择填报周期" clearable class="!w-200px">
              <el-option v-for="week in reportWeekOptions" :key="week" :label="week" :value="week" />
            </el-select>
          </el-form-item>
          <el-form-item label="机构名称" prop="deptName">
            <el-input
              v-model="queryParams.deptName"
              placeholder="请输入机构名称"
              clearable
              class="!w-200px"
            />
          </el-form-item>
          <el-form-item label="联系人" prop="contactPerson">
            <el-input
              v-model="queryParams.contactPerson"
              placeholder="请输入联系人"
              clearable
              class="!w-160px"
            />
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
          </el-form-item>
        </el-form>
      </ContentWrap>

      <!-- 列表 -->
      <ContentWrap>
        <!-- 当前选择的地区信息 -->
        <div v-if="selectedRegion" class="mb-15px">
          <el-tag type="info" size="large">
            <Icon icon="ep:location" class="mr-5px" />
            当前地区：{{ getRegionDisplayName(selectedRegion) }}
          </el-tag>
        </div>

        <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
          <el-table-column label="所属市" align="center" prop="cityName" width="100" />
          <el-table-column label="所属区县" align="center" prop="districtName" width="120" />
          <el-table-column label="机构名称" align="center" prop="deptName" min-width="150" />
          <el-table-column label="联系人" align="center" prop="contactPerson" width="100" />
          <el-table-column label="联系电话" align="center" prop="contactPhone" width="120" />
          <el-table-column label="填报时间" align="center" prop="submitTime" width="180" :formatter="dateFormatter"/>
          <el-table-column label="填报周期" align="center" prop="reportWeek" width="100" />
          <el-table-column label="填报完成度" align="center" prop="completionRate" width="120">
            <template #default="scope">
              <div class="flex items-center gap-2">
                <el-progress
                  :percentage="scope.row.completionRate || 0"
                  :stroke-width="8"
                  style="flex: 1"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="备注" align="center" prop="remark" min-width="120" />
          <el-table-column label="操作" align="center" width="80px" fixed="right">
            <template #default="scope">
              <el-button
                link
                type="primary"
                @click="handleView(scope.row.taskId)"
              >
                查看
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
  </div>
</template>

<script setup lang="ts">
import { ReportRecordApi, ReportZoneApi } from '@/api/shortage'
import RegionTree from '@/views/system/user/RegionTree.vue'
import { useRouter } from 'vue-router'
import {dateFormatter} from "@/utils/formatTime";

/** 填报记录查询列表 */
defineOptions({ name: 'ReportRecordList' })

const message = useMessage() // 消息弹窗
const router = useRouter() // 路由

const loading = ref(true) // 列表的加载中
const list = ref<any[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const selectedRegion = ref<any>(null) // 选中的地区节点
const reportWeekOptions = ref<string[]>([]) // 填报周期选项
const zoneOptions = ref<any[]>([]) // 填报专区选项

// 面板拖拽相关
const selectorPanel = ref<HTMLElement>()
const selectorWidth = ref(250) // 默认宽度设为最小宽度
const isResizing = ref(false)

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  regionCode: undefined, // 地区代码
  zoneId: undefined, // 填报专区ID
  reportWeek: undefined, // 填报周期
  deptName: undefined, // 机构名称
  contactPerson: undefined // 联系人
})
const queryFormRef = ref() // 搜索的表单

/** 开始拖拽调整大小 */
const startResize = (e: MouseEvent) => {
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

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ReportRecordApi.getReportRecordList(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 地区选择处理 */
const handleRegionSelect = (region: any) => {
  selectedRegion.value = region
  queryParams.regionCode = region?.code
  queryParams.pageNo = 1
  getList()
}

/** 获取地区显示名称 */
const getRegionDisplayName = (region: any) => {
  if (!region) return ''
  const levelNames = { 1: '省', 2: '市', 3: '区县' }
  return `${region.name}(${levelNames[region.level] || ''})`
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 查看按钮操作 */
const handleView = (taskId: number) => {
  // 从列表中找到对应的任务记录
  const record = list.value.find((r) => r.taskId === taskId)
  if (!record) return

  // 跳转到填报查看页面,传递专区ID、周期和填报状态
  router.push({
    name: 'ShortageReportView',
    params: { taskId: taskId.toString() },
    query: {
      zoneId: record.zoneId?.toString(),
      reportWeek: record.reportWeek,
      reportStatus: record.reportStatus?.toString()
    }
  })
}

/** 加载填报周期选项 */
const loadReportWeekOptions = async () => {
  try {
    const data = await ReportRecordApi.getReportWeeks()
    reportWeekOptions.value = data
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

/** 初始化 **/
onMounted(() => {
  loadReportWeekOptions()
  loadZoneOptions()
  // 不自动加载数据，等待用户选择地区
})
</script>

<style scoped lang="scss">
.selector-panel {
  flex-shrink: 0;
  min-width: 250px;
  max-width: 600px;
  height: 100vh;
  overflow: hidden;
}

.selector-card {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px;
  }
}

.resize-handle {
  width: 5px;
  background: var(--el-border-color-light);
  cursor: ew-resize;
  flex-shrink: 0;
  transition: background-color 0.2s;

  &:hover {
    background: var(--el-color-primary);
  }
}
</style>
