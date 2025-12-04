<!--无法上报机构-->
<template>
  <div>
    <!-- 搜索工作栏 -->
    <ContentWrap>
      <el-form
        class="-mb-15px"
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="auto"
      >
        <el-form-item label="关键字" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索机构名称、机构代码..."
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="不上报模块" prop="moduleCode">
          <el-select v-model="queryParams.moduleCode" placeholder="全部" clearable class="!w-150px">
            <el-option
              v-for="dict in getStrDictOptions(DICT_TYPE.BUSINESS_MODULE)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="机构分类" prop="deptClass">
          <el-tree-select
            v-model="queryParams.deptClass"
            :data="deptCategoryTree"
            :props="{ label: 'name', value: 'code', children: 'children' }"
            check-strictly
            filterable
            clearable
            placeholder="请选择"
            class="!w-180px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <Icon icon="ep:search" class="mr-5px" /> 搜索
          </el-button>
          <el-button @click="resetQuery">
            <Icon icon="ep:refresh" class="mr-5px" /> 重置
          </el-button>
          <el-button
            type="success"
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
      <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
        <el-table-column type="selection" width="50" />
        <el-table-column label="机构名称" align="left" prop="deptName" min-width="180">
          <template #default="scope">
            <span class="institution-name-text font-bold">{{ scope.row.deptName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="机构代码" align="center" prop="orgCode" width="140" />
        <el-table-column label="行政区划" align="center" prop="regionName" width="120" />
        <el-table-column
          label="机构类别"
          align="center"
          prop="deptClassName"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column label="不上报模块" align="center" prop="moduleCode" width="120">
          <template #default="scope">
            <el-tag :type="getDictColorType(DICT_TYPE.BUSINESS_MODULE, scope.row.moduleCode)">
              {{ getDictLabel(DICT_TYPE.BUSINESS_MODULE, scope.row.moduleCode) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="无法上报原因"
          align="left"
          prop="unableReportReason"
          min-width="220"
        >
          <template #default="scope">
            <div>{{
              getDictLabel(DICT_TYPE.UNABLE_REPORT_REASON, scope.row.unableReportReason) ||
              scope.row.unableReportReason
            }}</div>
            <div v-if="scope.row.remark" class="text-gray-400 text-xs mt-1"
              >备注：{{ scope.row.remark }}</div
            >
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
        <el-table-column label="操作" align="center" width="180" fixed="right">
          <template #default="scope">
            <el-button
              type="success"
              size="small"
              @click="openForm('update', scope.row.id)"
              v-hasPermi="['system:monitoring-unable-report:update']"
            >
              <Icon icon="ep:edit" class="mr-1" />
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['system:monitoring-unable-report:delete']"
            >
              <Icon icon="ep:delete" class="mr-1" />
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
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { DICT_TYPE, getDictColorType, getDictLabel, getStrDictOptions } from '@/utils/dict'
import {
  MonitoringUnableReportApi,
  MonitoringUnableReportVO
} from '@/api/system/monitoringunablereport'
import MonitoringUnableReportForm from '../monitoringunablereport/MonitoringUnableReportForm.vue'
import { Icon } from '@/components/Icon'
import { DeptCategoryApi } from '@/api/system/deptcategory'
import { handleTree } from '@/utils/tree'

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
  keyword: undefined,
  moduleCode: undefined,
  deptClass: undefined,
  areaCode: undefined as string | undefined
})
const queryFormRef = ref()
const exportLoading = ref(false)
const deptCategoryTree = ref<any[]>([]) // 机构分类树

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
  queryParams.keyword = undefined
  queryParams.moduleCode = undefined
  queryParams.deptClass = undefined
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 获取机构分类树 */
const getDeptCategoryTree = async () => {
  const data = await DeptCategoryApi.getDeptCategoryList({})
  deptCategoryTree.value = handleTree(data, 'id', 'parentId')
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
    download.excel(data, '无法上报机构.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 监听地区变化 */
watch(
  () => props.areaCode,
  () => {
    // 无论 areaCode 是否为空都调用 getList
    // 为空时查询所有数据，有值时查询对应地区数据
    getList()
  },
  { immediate: true }
) // immediate: true 会在组件初始化时立即执行一次

/** 初始化 */
onMounted(() => {
  getDeptCategoryTree()
})
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
