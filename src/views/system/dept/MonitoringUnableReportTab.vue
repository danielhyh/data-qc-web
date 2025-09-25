<template>
  <div>
    <!-- 搜索工作栏 -->
    <ContentWrap>
      <el-form
        class="-mb-15px"
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="100px"
      >
        <el-form-item label="机构名称" prop="deptName">
          <el-input
            v-model="queryParams.deptName"
            placeholder="请输入机构名称"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="无法上报原因" prop="unableReportReason">
          <el-input
            v-model="queryParams.unableReportReason"
            placeholder="请输入无法上报原因"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            clearable
            class="!w-240px"
          >
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
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
            @click="openForm('create')"
            v-hasPermi="['system:monitoring-unable-report:create']"
          >
            <Icon icon="ep:plus" class="mr-5px" /> 新增
          </el-button>
          <el-button
            type="success"
            @click="handleExport"
            :loading="exportLoading"
            v-hasPermi="['system:monitoring-unable-report:export']"
          >
            <Icon icon="ep:download" class="mr-5px" /> 导出
          </el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 列表 -->
    <ContentWrap>
      <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
        <el-table-column label="机构名称" align="center" prop="deptName" min-width="150" />
        <el-table-column label="无法上报原因" align="center" prop="unableReportReason" min-width="200" />
        <el-table-column label="备注说明" align="center" prop="remark" min-width="150" />
        <el-table-column label="状态" align="center" prop="status" width="100">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
          </template>
        </el-table-column>
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
              v-hasPermi="['system:monitoring-unable-report:update']"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['system:monitoring-unable-report:delete']"
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
    <MonitoringUnableReportForm ref="formRef" @success="getList" />
  </div>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { MonitoringUnableReportApi, MonitoringUnableReportVO } from '@/api/system/monitoringunablereport'
import MonitoringUnableReportForm from '../monitoringunablereport/MonitoringUnableReportForm.vue'

interface Props {
  areaCode?: string
  selectedRegionId?: number
}

const props = defineProps<Props>()

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const list = ref<MonitoringUnableReportVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  deptName: undefined,
  unableReportReason: undefined,
  remark: undefined,
  status: undefined,
  createTime: [],
  areaCode: undefined as string | undefined
})
const queryFormRef = ref()
const exportLoading = ref(false)

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    queryParams.areaCode = props.areaCode
    const data = await MonitoringUnableReportApi.getMonitoringUnableReportPage(queryParams)
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
  queryParams.deptName = undefined
  queryParams.unableReportReason = undefined
  queryParams.remark = undefined
  queryParams.status = undefined
  queryParams.createTime = []
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id, props.selectedRegionId, props.areaCode)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await MonitoringUnableReportApi.deleteMonitoringUnableReport(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await MonitoringUnableReportApi.exportMonitoringUnableReport(queryParams)
    download.excel(data, '监测内无法上报机构.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 监听地区变化 */
watch(() => props.areaCode, (newAreaCode) => {
  if (newAreaCode) {
    getList()
  }
}, { immediate: true })

/** 初始化 **/
onMounted(() => {
  if (props.areaCode) {
    getList()
  }
})
</script>