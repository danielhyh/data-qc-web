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
      <el-form-item label="上报状态：0未上报、1审核中,2已退回、3已通过,4已上报" prop="reportStatus">
        <el-select
          v-model="queryParams.reportStatus"
          placeholder="请选择上报状态：0未上报、1审核中,2已退回、3已通过,4已上报"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.REPORT_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['drug:import-task:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['drug:import-task:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="序号" width="60" type="index" />
      <el-table-column label="任务名称" align="center" prop="taskName" />
      <el-table-column label="任务描述" align="center" prop="description" />
      <el-table-column label="开始日期" align="center">
        <template #default="scope">
          {{ getCurrentDate(scope.row.startDate) }}
        </template>
      </el-table-column>
      <el-table-column label="结束日期" align="center">
        <template #default="scope">
          {{ getCurrentDate(scope.row.endDate) }}
        </template>
      </el-table-column>
      <el-table-column label="上报状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.REPORT_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="剩余时间" align="center">
        <template #default="scope">
          {{ getRemainingTime(scope) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button
            v-if="scope.row.status === 1"
            link
            @click="handleReport(scope)"
            type="primary"
          >
            上报
          </el-button>
          <el-button
            link
            @click="handleResubmit(scope)"
            type="primary"
          >
            重新上报
          </el-button>
          <el-button
            link
            @click="handleCheckStatus(scope)"
            type="primary"
          >
            查看状态
          </el-button>
          <el-button
            v-if="scope.row.status === 1"
            link
            @click="handleReportLogs(scope)"
            type="danger"
          >
            上报日志
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
  <ImportTaskForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import download from '@/utils/download'
import dayjs from 'dayjs'
import { ImportTaskApi, ImportTaskVO } from '@/api/drug/batch'
import {
  ReportDataApi
} from '@/api/drug/reportdata'
import ImportTaskForm from './ImportTaskForm.vue'

/** 药品数据导入任务 列表 */
defineOptions({ name: 'ImportTask' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<ImportTaskVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  reportYear: '',
  reportStatus: undefined,
  taskName: '',

})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ReportDataApi.getHistoricalFilingTaskList(queryParams)
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
    await ImportTaskApi.deleteImportTask(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await ImportTaskApi.exportImportTask(queryParams)
    download.excel(data, '药品数据导入任务.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

const getCurrentDate = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD')
}

const getRemainingTime =  ({ row }) => {
  if (row.endDate - Date.now() > 0) {
    return dayjs(row.endDate).diff(dayjs(), 'day') + '天'
  } else {
    return '已逾期' + dayjs().diff(dayjs(row.endDate), 'day') + '天'
  }
}

const handleReport = ({ row }) => {
  console.log(row)
}

const handleResubmit = ({ row }) => {
  console.log(row)
}

const handleCheckStatus = ({ row }) => {
  console.log(row)
}

const handleReportLogs = ({ row }) => {
  console.log(row)
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>