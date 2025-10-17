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
      <el-form-item label="任务编号（格式：DRUG_YYYYMMDD_XXXXXX）" prop="taskNo">
        <el-input
          v-model="queryParams.taskNo"
          placeholder="请输入任务编号（格式：DRUG_YYYYMMDD_XXXXXX）"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="任务名称" prop="taskName">
        <el-input
          v-model="queryParams.taskName"
          placeholder="请输入任务名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="导入类型:1-单文件,2-压缩包" prop="importType">
        <el-select
          v-model="queryParams.importType"
          placeholder="请选择导入类型:1-单文件,2-压缩包"
          clearable
          class="!w-240px"
        >
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="原始文件名称" prop="fileName">
        <el-input
          v-model="queryParams.fileName"
          placeholder="请输入原始文件名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="文件存储路径" prop="filePath">
        <el-input
          v-model="queryParams.filePath"
          placeholder="请输入文件存储路径"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="文件大小(字节)" prop="fileSize">
        <el-input
          v-model="queryParams.fileSize"
          placeholder="请输入文件大小(字节)"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="解压后的文件列表(JSON格式)" prop="extractedFiles">
        <el-input
          v-model="queryParams.extractedFiles"
          placeholder="请输入解压后的文件列表(JSON格式)"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="任务状态:0-待处理,1-解压中,2-数据导入中,3-质控中,4-完成,5-失败,6-部分成功" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择任务状态:0-待处理,1-解压中,2-数据导入中,3-质控中,4-完成,5-失败,6-部分成功"
          clearable
          class="!w-240px"
        >
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="解压状态:0-未开始,1-进行中,2-成功,3-失败" prop="extractStatus">
        <el-select
          v-model="queryParams.extractStatus"
          placeholder="请选择解压状态:0-未开始,1-进行中,2-成功,3-失败"
          clearable
          class="!w-240px"
        >
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="导入状态:0-未开始,1-进行中,2-成功,3-失败" prop="importStatus">
        <el-select
          v-model="queryParams.importStatus"
          placeholder="请选择导入状态:0-未开始,1-进行中,2-成功,3-失败"
          clearable
          class="!w-240px"
        >
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="质控状态:0-未开始,1-进行中,2-成功,3-失败" prop="qcStatus">
        <el-select
          v-model="queryParams.qcStatus"
          placeholder="请选择质控状态:0-未开始,1-进行中,2-成功,3-失败"
          clearable
          class="!w-240px"
        >
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="预期文件数量" prop="totalFiles">
        <el-input
          v-model="queryParams.totalFiles"
          placeholder="请输入预期文件数量"
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
      <el-form-item label="失败记录数" prop="failedRecords">
        <el-input
          v-model="queryParams.failedRecords"
          placeholder="请输入失败记录数"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="整体进度百分比" prop="progressPercent">
        <el-input
          v-model="queryParams.progressPercent"
          placeholder="请输入整体进度百分比"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="各表处理进度(JSON格式)" prop="tableProgress">
        <el-input
          v-model="queryParams.tableProgress"
          placeholder="请输入各表处理进度(JSON格式)"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="开始处理时间" prop="startTime">
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
      <el-form-item label="解压完成时间" prop="extractEndTime">
        <el-date-picker
          v-model="queryParams.extractEndTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="导入完成时间" prop="importEndTime">
        <el-date-picker
          v-model="queryParams.importEndTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="质控完成时间" prop="qcEndTime">
        <el-date-picker
          v-model="queryParams.qcEndTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="任务结束时间" prop="endTime">
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
      <el-form-item label="错误信息" prop="errorMessage">
        <el-input
          v-model="queryParams.errorMessage"
          placeholder="请输入错误信息"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="详细错误信息(JSON格式)" prop="errorDetail">
        <el-input
          v-model="queryParams.errorDetail"
          placeholder="请输入详细错误信息(JSON格式)"
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
          @click="openForm('create')"
          v-hasPermi="['drug:import-task:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
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
      <el-table-column label="任务ID" align="center" prop="id" />
      <el-table-column label="任务编号（格式：DRUG_YYYYMMDD_XXXXXX）" align="center" prop="taskNo" />
      <el-table-column label="任务名称" align="center" prop="taskName" />
      <el-table-column label="导入类型:1-单文件,2-压缩包" align="center" prop="importType" />
      <el-table-column label="原始文件名称" align="center" prop="fileName" />
      <el-table-column label="文件存储路径" align="center" prop="filePath" />
      <el-table-column label="文件大小(字节)" align="center" prop="fileSize" />
      <el-table-column label="解压后的文件列表(JSON格式)" align="center" prop="extractedFiles" />
      <el-table-column label="任务状态:0-待处理,1-解压中,2-数据导入中,3-质控中,4-完成,5-失败,6-部分成功" align="center" prop="status" />
      <el-table-column label="解压状态:0-未开始,1-进行中,2-成功,3-失败" align="center" prop="extractStatus" />
      <el-table-column label="导入状态:0-未开始,1-进行中,2-成功,3-失败" align="center" prop="importStatus" />
      <el-table-column label="质控状态:0-未开始,1-进行中,2-成功,3-失败" align="center" prop="qcStatus" />
      <el-table-column label="预期文件数量" align="center" prop="totalFiles" />
      <el-table-column label="成功文件数" align="center" prop="successFiles" />
      <el-table-column label="失败文件数" align="center" prop="failedFiles" />
      <el-table-column label="总记录数" align="center" prop="totalRecords" />
      <el-table-column label="成功记录数" align="center" prop="successRecords" />
      <el-table-column label="失败记录数" align="center" prop="failedRecords" />
      <el-table-column label="整体进度百分比" align="center" prop="progressPercent" />
      <el-table-column label="各表处理进度(JSON格式)" align="center" prop="tableProgress" />
      <el-table-column
        label="开始处理时间"
        align="center"
        prop="startTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="解压完成时间"
        align="center"
        prop="extractEndTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="导入完成时间"
        align="center"
        prop="importEndTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="质控完成时间"
        align="center"
        prop="qcEndTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="任务结束时间"
        align="center"
        prop="endTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="错误信息" align="center" prop="errorMessage" />
      <el-table-column label="详细错误信息(JSON格式)" align="center" prop="errorDetail" />
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
            v-hasPermi="['drug:import-task:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['drug:import-task:delete']"
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
  <ImportTaskForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { ImportTaskApi, ImportTaskVO } from '@/api/drug/batch'
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
  taskNo: undefined,
  taskName: undefined,
  importType: undefined,
  fileName: undefined,
  filePath: undefined,
  fileSize: undefined,
  extractedFiles: undefined,
  status: undefined,
  extractStatus: undefined,
  importStatus: undefined,
  qcStatus: undefined,
  totalFiles: undefined,
  successFiles: undefined,
  failedFiles: undefined,
  totalRecords: undefined,
  successRecords: undefined,
  failedRecords: undefined,
  progressPercent: undefined,
  tableProgress: undefined,
  startTime: [],
  extractEndTime: [],
  importEndTime: [],
  qcEndTime: [],
  endTime: [],
  errorMessage: undefined,
  errorDetail: undefined,
  createTime: [],
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ImportTaskApi.getImportTaskPage(queryParams)
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

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
