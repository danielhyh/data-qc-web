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
      <el-form-item label="同步类型" prop="syncType">
        <el-select
          v-model="queryParams.syncType"
          placeholder="请选择同步类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.SYNC_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="外部ID" prop="externalId">
        <el-input
          v-model="queryParams.externalId"
          placeholder="请输入外部ID"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="操作类型" prop="operation">
        <el-select
          v-model="queryParams.operation"
          placeholder="请选择操作类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.OPERATION_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="处理状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择处理状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.PROCESS_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="推送时间" prop="pushTime">
        <el-date-picker
          v-model="queryParams.pushTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="处理时间" prop="processTime">
        <el-date-picker
          v-model="queryParams.processTime"
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
          v-hasPermi="['system:sync-log:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['system:sync-log:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="同步类型" align="center" prop="syncType">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SYNC_TYPE" :value="scope.row.syncType" />
        </template>
      </el-table-column>
      <el-table-column label="外部ID" align="center" prop="externalId" />
      <el-table-column label="操作类型" align="center" prop="operation">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.OPERATION_TYPE" :value="scope.row.operation" />
        </template>
      </el-table-column>
      <el-table-column label="处理状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PROCESS_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="请求数据" align="center" prop="requestData" />
      <el-table-column label="错误信息" align="center" prop="errorMsg" />
      <el-table-column
        label="推送时间"
        align="center"
        prop="pushTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="处理时间"
        align="center"
        prop="processTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="100px">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openDetail(scope.row)"
          >
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

  <!-- 表单弹窗：添加/修改 -->
  <SyncLogForm ref="formRef" @success="getList" />

  <!-- 详情弹窗 -->
  <el-dialog v-model="detailVisible" title="同步日志详情" width="800px" append-to-body>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="同步类型">
        <dict-tag :type="DICT_TYPE.SYNC_TYPE" :value="detailData.syncType" />
      </el-descriptions-item>
      <el-descriptions-item label="外部ID">
        {{ detailData.externalId }}
      </el-descriptions-item>
      <el-descriptions-item label="操作类型">
        <dict-tag :type="DICT_TYPE.OPERATION_TYPE" :value="detailData.operation" />
      </el-descriptions-item>
      <el-descriptions-item label="处理状态">
        <dict-tag :type="DICT_TYPE.PROCESS_STATUS" :value="detailData.status" />
      </el-descriptions-item>
      <el-descriptions-item label="推送时间">
        {{ formatDate(detailData.pushTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="处理时间">
        {{ formatDate(detailData.processTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间" :span="2">
        {{ formatDate(detailData.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="请求数据" :span="2">
        <el-input
          v-model="detailData.requestData"
          type="textarea"
          :rows="4"
          readonly
        />
      </el-descriptions-item>
      <el-descriptions-item label="错误信息" :span="2">
        <el-input
          v-model="detailData.errorMsg"
          type="textarea"
          :rows="3"
          readonly
        />
      </el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <el-button @click="detailVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { getIntDictOptions, getStrDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { SyncLogApi, SyncLogVO } from '@/api/system/sync'
import SyncLogForm from './SyncLogForm.vue'

/** 直报系统同步日志 列表 */
defineOptions({ name: 'SyncLog' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<SyncLogVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  syncType: undefined,
  externalId: undefined,
  operation: undefined,
  status: undefined,
  requestData: undefined,
  errorMsg: undefined,
  pushTime: [],
  processTime: [],
  createTime: [],
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

// 详情弹窗相关
const detailVisible = ref(false)
const detailData = ref<SyncLogVO>({} as SyncLogVO)

/** 打开详情弹窗 */
const openDetail = (row: SyncLogVO) => {
  detailData.value = { ...row }
  detailVisible.value = true
}

/** 格式化日期 */
const formatDate = (date: any) => {
  return dateFormatter(null, null, date)
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await SyncLogApi.getSyncLogPage(queryParams)
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
    await SyncLogApi.deleteSyncLog(id)
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
    const data = await SyncLogApi.exportSyncLog(queryParams)
    download.excel(data, '直报系统同步日志.xls')
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
