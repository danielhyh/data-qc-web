<!--监测内无法上报机构-->
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
        <el-table-column label="机构名称" align="center" prop="deptName" min-width="200">
          <template #default="scope">
            <div class="institution-name-cell">
              <Icon icon="ep:office-building" class="institution-icon" />
              <span class="institution-name-text font-bold">{{ scope.row.deptName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="无法上报原因" align="center" prop="unableReportReason" min-width="200" />
        <el-table-column label="备注说明" align="center" prop="remark" min-width="150" />
        <el-table-column label="状态" align="center" prop="status" width="80">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="0"
              :inactive-value="1"
              @change="handleStatusChange(scope.row)"
              v-hasPermi="['system:monitoring-unable-report:update']"
            />
          </template>
        </el-table-column>
        <el-table-column
          label="创建时间"
          align="center"
          prop="createTime"
          :formatter="dateFormatter"
          width="180px"
        />
        <el-table-column label="操作" align="center" width="180px" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              plain
              size="small"
              @click="openForm('update', scope.row.id)"
              v-hasPermi="['system:monitoring-unable-report:update']"
            >
              <Icon icon="ep:edit" class="mr-5px" />
              修改
            </el-button>
            <el-button
              type="danger"
              plain
              size="small"
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['system:monitoring-unable-report:delete']"
            >
              <Icon icon="ep:delete" class="mr-5px" />
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
import { Icon } from '@/components/Icon'

interface Props {
  areaCode?: string
  selectedRegionId?: number
}

const props = defineProps<Props>()

// 定义事件
const emit = defineEmits<{
  countUpdated: [count: number]
}>()

const message = useMessage()
const { t } = useI18n()

const loading = ref(false) // 初始不加载，等待数据请求
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
    
    // 发射总数更新事件，通知父组件更新徽标
    emit('countUpdated', data.total)
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

/** 状态开关操作 */
const handleStatusChange = async (row: MonitoringUnableReportVO) => {
  try {
    const statusText = row.status === 0 ? '启用' : '禁用'
    await message.confirm(`确认要${statusText}"${row.deptName}"吗?`)
    await MonitoringUnableReportApi.updateMonitoringUnableReportStatus(row.id, row.status)
    message.success(`${statusText}成功`)
  } catch {
    // 操作失败或取消，恢复状态
    row.status = row.status === 0 ? 1 : 0
  }
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
watch(() => props.areaCode, () => {
  // 无论 areaCode 是否为空都调用 getList
  // 为空时查询所有数据，有值时查询对应地区数据
  getList()
}, { immediate: true }) // immediate: true 会在组件初始化时立即执行一次
</script>

<style scoped lang="scss">
.institution-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.institution-icon {
  font-size: 18px;
  color: #5b8def;
}

.institution-name-text {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
