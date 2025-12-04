<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="auto"
    >
      <el-form-item prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          placeholder="搜索机构名称、机构代码..."
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="不上报模块" prop="moduleCode">
        <el-select
          v-model="queryParams.moduleCode"
          placeholder="全部"
          clearable
          class="!w-150px"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.BUSINESS_MODULE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          @click="openForm('create')"
          v-hasPermi="['system:monitoring-unable-report:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增配置
        </el-button>
        <el-button
          plain
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
      <el-table-column type="selection" width="50" />
      <el-table-column label="机构名称" align="left" prop="deptName" min-width="180" />
      <el-table-column label="机构代码" align="center" prop="orgCode" width="140" />
      <el-table-column label="行政区划" align="center" prop="regionName" width="120" />
      <el-table-column label="机构类别" align="center" prop="institutionCategory" width="150">
        <template #default="scope">
          {{ getDictLabel(DICT_TYPE.INSTITUTION_CATEGORY, scope.row.institutionCategory) || scope.row.institutionCategory }}
        </template>
      </el-table-column>
      <el-table-column label="不上报模块" align="center" prop="moduleCode" width="120">
        <template #default="scope">
          <el-tag :type="getDictColorType(DICT_TYPE.BUSINESS_MODULE, scope.row.moduleCode)">
            {{ getDictLabel(DICT_TYPE.BUSINESS_MODULE, scope.row.moduleCode) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="无法上报原因" align="left" prop="unableReportReason" min-width="220">
        <template #default="scope">
          <div>{{ getDictLabel(DICT_TYPE.UNABLE_REPORT_REASON, scope.row.unableReportReason) || scope.row.unableReportReason }}</div>
          <div v-if="scope.row.remark" class="text-gray-400 text-xs mt-1">备注：{{ scope.row.remark }}</div>
        </template>
      </el-table-column>
      <el-table-column label="设置人" align="center" prop="creator" width="100" />
      <el-table-column
        label="设置时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="操作" align="center" width="120" fixed="right">
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
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { DICT_TYPE, getStrDictOptions, getDictLabel, getDictColorType } from '@/utils/dict'
import {
  MonitoringUnableReportApi,
  MonitoringUnableReportVO
} from '@/api/system/monitoringunablereport'
import MonitoringUnableReportForm from './MonitoringUnableReportForm.vue'

/** 无法上报机构 列表 */
defineOptions({ name: 'MonitoringUnableReport' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<MonitoringUnableReportVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: undefined,
  moduleCode: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
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
    await MonitoringUnableReportApi.deleteMonitoringUnableReport(id)
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
    const data = await MonitoringUnableReportApi.exportMonitoringUnableReport(queryParams)
    download.excel(data, '无法上报机构.xls')
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
