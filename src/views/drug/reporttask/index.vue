<!--填报任务列表-->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="任务名称" prop="taskName">
        <el-input
          v-model="queryParams.taskName"
          placeholder="请输入任务名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="上报时间" class="date-range-container">
        <el-date-picker
          v-model="queryParams.startDate"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-180px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-150px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.REPORT_STATUS_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-200px"
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
        <el-button
          type="primary"
          @click="openForm('create')"
          v-hasPermi="['drug:report-task:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" />
          新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      :show-overflow-tooltip="true"
      :row-class-name="getRowClassName"
    >
      <el-table-column label="任务名称" align="center" prop="taskName" min-width="120px" />
      <el-table-column label="年份" align="center" prop="reportYear" width="80px" />
      <el-table-column
        label="上报开始日期"
        align="center"
        prop="startDate"
        :formatter="dateFormatter2"
        width="160px"
      />
      <el-table-column
        label="上报截止日期"
        align="center"
        prop="endDate"
        :formatter="dateFormatter2"
        width="160px"
      />
      <!-- 新增 剩余时间 -->
      <el-table-column label="剩余时间" align="center" width="120px">
        <template #default="scope">
          <span v-if="scope.row.status === 3" class="text-gray-500">
            已结束
          </span>
          <span v-else :class="getRemainingTimeClass(scope.row.endDate)">
            {{ calculateRemainingTime(scope.row.endDate) }}
          </span>
        </template>
      </el-table-column>
      <!-- 新增 填报进度 -->
      <el-table-column label="填报进度" align="center" prop="completionRate" width="200">
        <template #default="scope">
          <div class="flex items-center gap-2">
            <el-progress
              :percentage="calcCompletionRate(scope.row)"
              :color="getProgressColor(calcCompletionRate(scope.row))"
              :stroke-width="8"
              style="flex: 1"
            />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100px">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.REPORT_STATUS_TYPE" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="任务描述"
        align="center"
        prop="description"
        min-width="150px"
        show-overflow-tooltip
      />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="160px"
      />
      <el-table-column label="操作" align="center" width="260px" fixed="right">
        <template #default="{ row }">
          <el-button
            size="small"
            type="primary"
            @click="handleView(row)"
            v-hasPermi="['drug:report-task:query']"
          >
            <Icon icon="ep:view" />
            查看
          </el-button>
          <el-button
            size="small"
            type="success"
            @click="openForm('update', row.id)"
            v-hasPermi="['drug:report-task:update']"
          >
            <Icon icon="ep:edit" />
            编辑
          </el-button>
          <el-dropdown 
            @command="(command) => handleCommand(command, row)" 
            @visible-change="(visible) => handleDropdownVisibleChange(row.id, visible)"
            trigger="click"
          >
            <el-button size="small" type="info" class="more-btn">
              <Icon :icon="dropdownStates[row.id] ? 'ep:arrow-up' : 'ep:arrow-down'" />
              更多
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-if="row.status !== 2"
                  command="activate"
                  v-hasPermi="['drug:report-task:update']"
                >
                  <Icon icon="ep:check" class="mr-5px" />
                  启用
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="row.status === 2"
                  command="deactivate"
                  v-hasPermi="['drug:report-task:update']"
                >
                  <Icon icon="ep:close" class="mr-5px" />
                  停用
                </el-dropdown-item>
                <el-dropdown-item
                  command="delete"
                  v-hasPermi="['drug:report-task:delete']"
                >
                  <Icon icon="ep:delete" class="mr-5px" />
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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

  <!-- 表单弹窗：添加/修改 -->
  <ReportTaskForm ref="formRef" @success="getList" />

  <!-- 页面尾部加任务详情弹窗 -->
  <el-dialog v-model="viewDialogVisible" title="任务详情" width="800px">
    <el-descriptions border>
      <el-descriptions-item label="任务名称">{{ viewDetail.taskName }}</el-descriptions-item>
      <el-descriptions-item label="上报年份">{{ viewDetail.reportYear }}</el-descriptions-item>
      <el-descriptions-item label="剩余时间">
        {{ viewDetail.status === 3 ? '已结束' : calculateRemainingTime(viewDetail.endDate) }}
      </el-descriptions-item>
      <el-descriptions-item label="状态"><dict-tag :type="DICT_TYPE.REPORT_STATUS_TYPE" :value="viewDetail.status" /></el-descriptions-item>
      <el-descriptions-item label="任务描述">{{ viewDetail.description }}</el-descriptions-item>
      <el-descriptions-item label="填报机构">{{ viewDetail.orgs ? viewDetail.orgs.length : 0 }}</el-descriptions-item>
    </el-descriptions>
    <div style="margin-top: 20px">
      <el-table :data="viewDetail.orgs || []" border size="small">
        <el-table-column label="所属市" prop="cityName" width="100" />
        <el-table-column label="所属区县" prop="districtName" width="120" />
        <el-table-column label="机构名称" prop="name" min-width="150" />
        <el-table-column label="机构类别" prop="institutionCategory" width="120">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.INSTITUTION_CATEGORY" :value="scope.row.institutionCategory" />
          </template>
        </el-table-column>
        <el-table-column label="机构等级" prop="hospitalLevel" width="100">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.INSTITUTION_LEVEL" :value="scope.row.hospitalLevel" />
          </template>
        </el-table-column>
        <el-table-column label="联络员" prop="contactPerson" width="100" />
        <el-table-column label="联络员手机" prop="contactPhone" width="120" />
      </el-table>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import {dateFormatter, dateFormatter2} from '@/utils/formatTime'
import { ReportTaskApi, ReportTaskVO } from '@/api/drug/reporttask'
import ReportTaskForm from './ReportTaskForm.vue'
import { getProgressColor } from '@/utils/progressColor'

/** 填报任务设置 列表 */
defineOptions({ name: 'ReportTask' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<ReportTaskVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
// 下拉菜单展开状态（用于动态切换图标）
const dropdownStates = ref<Record<number, boolean>>({})
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskName: undefined,
  startDate: [],
  endDate: [],
  status: undefined,
  description: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ReportTaskApi.getReportTaskPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
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

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ReportTaskApi.deleteReportTask(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 启用任务 */
const handleActivate = async (id: number) => {
  try {
    await message.confirm('是否启用该任务？', '启用确认')
    await ReportTaskApi.activateTask(id)
    message.success('启用成功')
    await getList()
  } catch {}
}

/** 停用任务 */
const handleDeactivate = async (id: number) => {
  try {
    await message.confirm('是否停用该任务？', '停用确认')
    await ReportTaskApi.deactivateTask(id)
    message.success('停用成功')
    await getList()
  } catch {}
}

/** 处理下拉菜单可见性变化（用于切换图标） */
const handleDropdownVisibleChange = (rowId: number, visible: boolean) => {
  dropdownStates.value[rowId] = visible
}

/** 处理下拉菜单命令 */
const handleCommand = (command: string, row: any) => {
  switch (command) {
    case 'activate':
      handleActivate(row.id)
      break
    case 'deactivate':
      handleDeactivate(row.id)
      break
    case 'delete':
      handleDelete(row.id)
      break
  }
}

/** 表格行样式 */
const getRowClassName = ({ row }) => {
  return row.status === 2 ? 'active-row' : ''
}

/**
 * 计算任务剩余时间或逾期时间
 * @param endDate 截止时间字符串
 * @returns 剩余/逾期时间描述
 */
function calculateRemainingTime(endDate?: string): string {
  if (!endDate) return '-'
  const now = new Date()
  const deadline = new Date(endDate)
  const diff = deadline.getTime() - now.getTime()
  if (diff <= 0) {
    const overdue = Math.abs(diff)
    const days = Math.floor(overdue / (1000 * 60 * 60 * 24))
    const hours = Math.floor((overdue % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return days > 0 ? `逾期${days}天` : `逾期${hours}小时`
  } else {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return days > 0 ? `剩余${days}天` : `剩余${hours}小时`
  }
}

/**
 * 获取剩余时间样式
 * @param endDate 截止时间
 * @returns 颜色 class
 */
function getRemainingTimeClass(endDate?: string): string {
  if (!endDate) return ''
  const diff = new Date(endDate).getTime() - Date.now()
  if (diff <= 0) return 'text-red-500' // 逾期
  if (diff <= 24 * 60 * 60 * 1000) return 'text-orange-500' // 24小时内
  return 'text-green-500'
}

/** 任务详情/机构-查看弹窗相关逻辑 */
const viewDialogVisible = ref(false)
const viewDetail = ref<any>({})

async function handleView(row: any) {
  // 假设 getReportTask 返回 orgs 字段，否则此处需适配
  const res = await ReportTaskApi.getReportTask(row.id)
  // 兼容：如果接口未返 orgs 但返 reportableOrgs，可自行查组织、或做TODO提醒
  viewDetail.value = res
  viewDialogVisible.value = true
}
/**
 * 兼容填报进度百分比算法
 * 优先使用后端 progressPercent 字段
 */
function calcCompletionRate(row: any) {
  // 后端返回的字段是 progressPercent
  if (typeof row.progressPercent === 'number') return row.progressPercent
  // 兼容旧字段名 completionRate
  if (typeof row.completionRate === 'number') return row.completionRate
  // 如果都没有，返回0
  return 0
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

<style scoped>
/* 启用任务行样式 */
:deep(.active-row) {
  background-color: var(--el-color-success-light-9) !important;
}

:deep(.active-row:hover) {
  background-color: var(--el-color-success-light-8) !important;
}

/* 时间选择器容器 */
.date-range-container .flex {
  width: 100%;
}
</style>
