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
      <el-form-item label="关联任务ID" prop="taskId">
        <el-input
          v-model="queryParams.taskId"
          placeholder="请输入关联任务ID"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="步骤类型：1上传/2质控/3提交/4国家平台" prop="stepType">
        <el-select
          v-model="queryParams.stepType"
          placeholder="请选择步骤类型：1上传/2质控/3提交/4国家平台"
          clearable
          class="!w-240px"
        >
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="处理状态：0处理中/1已完成/2部分失败/3全部失败" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择处理状态：0处理中/1已完成/2部分失败/3全部失败"
          clearable
          class="!w-240px"
        >
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="总文件数" prop="totalFiles">
        <el-input
          v-model="queryParams.totalFiles"
          placeholder="请输入总文件数"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="成功文件数" prop="successFiles">
        <el-input
          v-model="queryParams.successFiles"
          placeholder="请输入成功文件数"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="失败文件数" prop="failedFiles">
        <el-input
          v-model="queryParams.failedFiles"
          placeholder="请输入失败文件数"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="警告文件数" prop="warningFiles">
        <el-input
          v-model="queryParams.warningFiles"
          placeholder="请输入警告文件数"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="总记录数" prop="totalRecords">
        <el-input
          v-model="queryParams.totalRecords"
          placeholder="请输入总记录数"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="成功记录数" prop="successRecords">
        <el-input
          v-model="queryParams.successRecords"
          placeholder="请输入成功记录数"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="错误记录数" prop="errorRecords">
        <el-input
          v-model="queryParams.errorRecords"
          placeholder="请输入错误记录数"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="警告记录数" prop="warningRecords">
        <el-input
          v-model="queryParams.warningRecords"
          placeholder="请输入警告记录数"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="开始时间" prop="startTime">
        <el-date-picker
          v-model="queryParams.startTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="结束时间" prop="endTime">
        <el-date-picker
          v-model="queryParams.endTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="处理耗时（秒）" prop="duration">
        <el-input
          v-model="queryParams.duration"
          placeholder="请输入处理耗时（秒）"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="步骤特有数据（JSON格式）" prop="summaryData">
        <el-input
          v-model="queryParams.summaryData"
          placeholder="请输入步骤特有数据（JSON格式）"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="错误汇总信息" prop="errorSummary">
        <el-input
          v-model="queryParams.errorSummary"
          placeholder="请输入错误汇总信息"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['drug:report-step-summary:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['drug:report-step-summary:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="主键ID" align="center" prop="id" />
      <el-table-column label="关联任务ID" align="center" prop="taskId" />
      <el-table-column label="步骤类型：1上传/2质控/3提交/4国家平台" align="center" prop="stepType" />
      <el-table-column label="处理状态：0处理中/1已完成/2部分失败/3全部失败" align="center" prop="status" />
      <el-table-column label="总文件数" align="center" prop="totalFiles" />
      <el-table-column label="成功文件数" align="center" prop="successFiles" />
      <el-table-column label="失败文件数" align="center" prop="failedFiles" />
      <el-table-column label="警告文件数" align="center" prop="warningFiles" />
      <el-table-column label="总记录数" align="center" prop="totalRecords" />
      <el-table-column label="成功记录数" align="center" prop="successRecords" />
      <el-table-column label="错误记录数" align="center" prop="errorRecords" />
      <el-table-column label="警告记录数" align="center" prop="warningRecords" />
      <el-table-column
        label="开始时间"
        align="center"
        prop="startTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="结束时间"
        align="center"
        prop="endTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="处理耗时（秒）" align="center" prop="duration" />
      <el-table-column label="步骤特有数据（JSON格式）" align="center" prop="summaryData" />
      <el-table-column label="错误汇总信息" align="center" prop="errorSummary" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['drug:report-step-summary:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['drug:report-step-summary:delete']"
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
  <ReportStepSummaryForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { ReportStepSummaryApi, ReportStepSummaryVO } from '@/api/drug/reportstepsummary'
import ReportStepSummaryForm from './ReportStepSummaryForm.vue'

/** 上报步骤总览 列表 */
defineOptions({ name: 'ReportStepSummary' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<ReportStepSummaryVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskId: undefined,
  stepType: undefined,
  status: undefined,
  totalFiles: undefined,
  successFiles: undefined,
  failedFiles: undefined,
  warningFiles: undefined,
  totalRecords: undefined,
  successRecords: undefined,
  errorRecords: undefined,
  warningRecords: undefined,
  startTime: [],
  endTime: [],
  duration: undefined,
  summaryData: undefined,
  errorSummary: undefined,
  createTime: [],
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ReportStepSummaryApi.getReportStepSummaryPage(queryParams)
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
    await ReportStepSummaryApi.deleteReportStepSummary(id)
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
    const data = await ReportStepSummaryApi.exportReportStepSummary(queryParams)
    download.excel(data, '上报步骤总览.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>