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
        <div class="flex items-center space-x-2">
          <el-date-picker
            v-model="queryParams.startDate"
            value-format="YYYY-MM-DD HH:mm:ss"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
            class="!w-180px"
          />
          <span class="text-gray-400 mx-2">至</span>
          <el-date-picker
            v-model="queryParams.endDate"
            value-format="YYYY-MM-DD HH:mm:ss"
            type="daterange"
            start-placeholder="截止开始"
            end-placeholder="截止结束"
            :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
            class="!w-180px"
          />
        </div>
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
  <ContentWrap :title="listTitle">
    <el-table
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      :row-class-name="getRowClassName"
    >
      <el-table-column label="任务名称" align="center" prop="taskName" min-width="120px" />
      <el-table-column label="年份" align="center" prop="reportYear" width="80px" />
      <el-table-column
        label="上报开始时间"
        align="center"
        prop="startDate"
        :formatter="dateFormatter"
        width="160px"
      />
      <el-table-column
        label="上报截止时间"
        align="center"
        prop="endDate"
        :formatter="dateFormatter"
        width="160px"
      />
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
      <el-table-column label="操作" align="center" width="180px" fixed="right">
        <template #default="scope">
<!--          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['drug:report-task:update']"
          >
            编辑
          </el-button>-->

          <el-button
            v-if="scope.row.status !== 2"
            link
            type="success"
            @click="handleActivate(scope.row.id)"
            v-hasPermi="['drug:report-task:update']"
          >
            激活
          </el-button>

          <el-button
            v-if="scope.row.status === 2"
            link
            type="warning"
            @click="handleDeactivate(scope.row.id)"
            v-hasPermi="['drug:report-task:update']"
          >
            停用
          </el-button>

          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['drug:report-task:delete']"
          >
            删除
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

  <!-- 表单弹窗：添加/修改 -->
  <ReportTaskForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { ReportTaskApi, ReportTaskVO } from '@/api/drug/reporttask'
import ReportTaskForm from './ReportTaskForm.vue'

/** 填报任务设置 列表 */
defineOptions({ name: 'ReportTask' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<ReportTaskVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
// 动态列表标题
const listTitle = computed(() => {
  return '填报任务列表'
})
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
const exportLoading = ref(false) // 导出的加载中

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

/** 激活任务 */
const handleActivate = async (id: number) => {
  try {
    await message.confirm('激活后将自动停用其他激活任务，是否继续？', '激活确认')
    await ReportTaskApi.activateTask(id)
    message.success('激活成功')
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

/** 表格行样式 */
const getRowClassName = ({ row }) => {
  return row.status === 2 ? 'active-row' : ''
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

<style scoped>
/* 激活任务行样式 */
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
