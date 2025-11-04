<!--数据管理页面-->
<template>
  <div class="flex h-full">
    <!-- 左侧地区树选择器 -->
    <div
      ref="selectorPanel"
      class="selector-panel"
      :style="{ width: selectorWidth + 'px' }"
    >
      <ContentWrap class="h-full selector-card" title="地区">
        <RegionTree @node-click="handleRegionSelect" />
      </ContentWrap>
    </div>

    <!-- 拖拽分隔条 -->
    <div
      class="resize-handle"
      @mousedown="startResize"
    ></div>

    <!-- 右侧内容区域 -->
    <div class="flex-1 ml-5 main-content">
      <ContentWrap>
        <!-- 搜索工作栏 -->
        <el-form
            class="-mb-15px"
            :model="queryParams"
            ref="queryFormRef"
            :inline="true"
            label-width="80px"
        >
          <el-form-item label="填报任务" prop="reportTaskId">
            <el-select
                v-model="queryParams.reportTaskId"
                placeholder="请选择填报任务"
                clearable
                class="!w-200px"
            >
              <el-option
                  v-for="task in reportTaskList"
                  :key="task.id"
                  :label="task.taskName"
                  :value="task.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="机构名称" prop="deptName">
            <el-input
                v-model="queryParams.deptName"
                placeholder="请输入机构名称"
                clearable
                class="!w-200px"
            />
          </el-form-item>
          <el-form-item label="联系人" prop="contactPerson">
            <el-input
                v-model="queryParams.contactPerson"
                placeholder="请输入联系人"
                clearable
                class="!w-160px"
            />
          </el-form-item>
          <el-form-item label="上报状态" prop="reportStatus">
            <el-select
                v-model="queryParams.reportStatus"
                placeholder="请选择上报状态"
                clearable
                class="!w-180px"
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

        <!-- 批量操作按钮 -->
        <div class="mb-10px mt-15px">
          <el-button
              type="warning"
              plain
              @click="handleBatchPostQc"
              :disabled="multipleSelection.length === 0"
          >
            <Icon icon="ep:check" class="mr-5px" /> 批量后置质控
          </el-button>
          <el-button
              type="danger"
              plain
              @click="handleBatchReject"
              :disabled="multipleSelection.length === 0"
          >
            <Icon icon="ep:close" class="mr-5px" /> 批量驳回
          </el-button>
          <el-button
              type="success"
              plain
              @click="handleBatchApprove"
              :disabled="multipleSelection.length === 0"
          >
            <Icon icon="ep:circle-check" class="mr-5px" /> 批量通过
          </el-button>
          <el-text type="info" class="ml-10px">
            已选择 {{ multipleSelection.length }} 项
          </el-text>
        </div>
      </ContentWrap>

      <!-- 列表 -->
      <ContentWrap>
        <!-- 当前选择的地区信息 -->
        <div v-if="selectedRegion" class="mb-15px">
          <el-tag type="info" size="large">
            <Icon icon="ep:location" class="mr-5px" />
            当前地区：{{ getRegionDisplayName(selectedRegion) }}
          </el-tag>
        </div>

        <el-table
          v-loading="loading"
          :data="list"
          :show-overflow-tooltip="true"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="任务编号" align="center" prop="taskNo" width="180" />
          <el-table-column label="任务名称" align="center" prop="taskName" width="150">
            <template #default="scope">
              <span class="font-bold">{{ scope.row.taskName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="所属市" align="center" prop="cityName" width="100" />
          <el-table-column label="所属区县" align="center" prop="districtName" width="100" />
          <el-table-column label="机构名称" align="center" prop="deptName" width="150" />
          <el-table-column label="联系人" align="center" prop="contactPerson" width="100" />
          <el-table-column label="联系人电话" align="center" prop="contactPhone" width="120" />
          <el-table-column label="文件数量" align="center" prop="totalFiles" width="80" />
          <el-table-column label="总记录数" align="center" prop="totalRecords" width="100" />
          <el-table-column label="上报状态" align="center" prop="reportStatus" width="100">
            <template #default="scope">
              <dict-tag :type="DICT_TYPE.REPORT_STATUS" :value="scope.row.reportStatus" />
            </template>
          </el-table-column>
          <el-table-column label="备注说明" align="center" prop="description" min-width="120" />
          <el-table-column label="操作" align="center" min-width="520px" fixed="right">
            <template #default="scope">
              <el-button
                  type="primary"
                  @click="handleViewData(scope.row)"
                  size="small"
              >
                <Icon icon="ep:view" class="mr-5px" />
                查看数据
              </el-button>
              <el-button
                  type="info"
                  @click="handleViewLog(scope.row)"
                  size="small"
              >
                <Icon icon="ep:document" class="mr-5px" />
                上报日志
              </el-button>
              <!-- 后置质控按钮：只在状态为1(已上报,审核中)、5(已重报,审核中)时显示 -->
              <el-button
                  v-if="canShowPostQcButton(scope.row.reportStatus)"
                  type="warning"
                  @click="handlePostQc(scope.row)"
                  size="small"
              >
                <Icon icon="ep:check" class="mr-5px" />
                后置质控
              </el-button>
              <!-- 驳回按钮：只在状态为1(已上报,审核中)、5(已重报,审核中)时显示 -->
              <el-button
                  v-if="canShowRejectButton(scope.row.reportStatus)"
                  type="danger"
                  @click="handleReject(scope.row)"
                  size="small"
              >
                <Icon icon="ep:close" class="mr-5px" />
                驳回
              </el-button>
              <!-- 通过按钮：只在状态为1(已上报,审核中)、5(已重报,审核中)时显示 -->
              <el-button
                  v-if="canShowApproveButton(scope.row.reportStatus)"
                  type="success"
                  @click="handleApprove(scope.row)"
                  size="small"
              >
                <Icon icon="ep:circle-check" class="mr-5px" />
                通过
              </el-button>
              <el-button
                  type="primary"
                  plain
                  @click="openForm('update', scope.row.id)"
                  v-hasPermi="['drug:import-task:update']"
                  size="small"
              >
                <Icon icon="ep:edit" class="mr-5px" />
                编辑
              </el-button>
              <el-button
                  type="danger"
                  plain
                  @click="handleDelete(scope.row.id)"
                  v-hasPermi="['drug:import-task:delete']"
                  size="small"
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
    </div>
  </div>

  <!-- 表单弹窗：添加/修改 -->
  <ImportTaskForm ref="formRef" @success="getList" />

  <!-- 日志弹窗 -->
  <ReportLogDialog ref="reportLogRef" />
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import download from '@/utils/download'
import { getDataManageImportTaskPage, exportDataManageImportTask, DataManageImportTaskVO, getReportTaskList, ReportTaskVO, executePostQc, rejectTask, approveTask, batchExecutePostQc, batchRejectTask, batchApproveTask } from '@/api/drug/dataManage'
import { ImportTaskApi } from '@/api/drug/batch'
import ImportTaskForm from './ImportTaskForm.vue'
import RegionTree from '@/views/system/user/RegionTree.vue'
import ReportLogDialog from './ReportLogDialog.vue'
import { ElMessageBox } from 'element-plus'

/** 药品数据导入任务 列表 */
defineOptions({ name: 'ImportTask' })

const message = useMessage() // 消息弹窗
const router = useRouter() // 路由对象
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<DataManageImportTaskVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const selectedRegion = ref<any>(null) // 选中的地区节点
const reportTaskList = ref<ReportTaskVO[]>([]) // 填报任务列表
const multipleSelection = ref<DataManageImportTaskVO[]>([]) // 多选数据

// 面板拖拽相关
const selectorPanel = ref<HTMLElement>()
const selectorWidth = ref(250) // 默认宽度
const isResizing = ref(false)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  reportTaskId: undefined, // 填报任务ID
  deptName: undefined,
  contactPerson: undefined,
  reportStatus: undefined,
  regionCode: undefined, // 地区代码
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 开始拖拽调整大小 */
const startResize = (e: MouseEvent) => {
  isResizing.value = true
  const startX = e.clientX
  const startWidth = selectorWidth.value

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!isResizing.value) return
    const diff = moveEvent.clientX - startX
    const newWidth = Math.max(250, Math.min(600, startWidth + diff)) // 限制最小250px，最大600px
    selectorWidth.value = newWidth
  }

  const onMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
  e.preventDefault()
}

/** 获取填报任务列表 */
const getReportTaskListData = async () => {
  try {
    const data = await getReportTaskList()
    reportTaskList.value = data
  } catch (error) {
    console.error('获取填报任务列表失败:', error)
  }
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await getDataManageImportTaskPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 地区选择处理 */
const handleRegionSelect = (region: any) => {
  selectedRegion.value = region
  queryParams.regionCode = region?.code
  queryParams.pageNo = 1
  getList()
}

/** 获取地区显示名称 */
const getRegionDisplayName = (region: any) => {
  if (!region) return ''
  const levelNames = { 1: '省', 2: '市', 3: '区县' }
  return `${region.name}(${levelNames[region.level] || ''})`
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
const reportLogRef = ref() // 日志弹窗ref
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
    const data = await exportDataManageImportTask(queryParams)
    download.excel(data, '药品数据导入任务_机构信息.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 多选处理 */
const handleSelectionChange = (selection: DataManageImportTaskVO[]) => {
  multipleSelection.value = selection
}

/** 查看数据 */
const handleViewData = (row: DataManageImportTaskVO) => {
  router.push({
    name: 'DrugReportViewData',
    query: {
      taskId: row.id
    }
  })
}

/** 上报日志 */
const handleViewLog = (row: DataManageImportTaskVO) => {
  // 打开日志弹窗
  reportLogRef.value.open(row.id, row.taskName)
}

/** 单个后置质控 */
const handlePostQc = async (row: DataManageImportTaskVO) => {
  try {
    await message.confirm('确认对此任务执行后置质控吗？')
    await executePostQc(row.id!)
    message.success('后置质控执行成功')
    await getList()
  } catch {}
}

/** 单个驳回 */
const handleReject = async (row: DataManageImportTaskVO) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入驳回原因（可选）', '驳回任务', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入驳回原因...'
    })
    await rejectTask(row.id!, reason || undefined)
    message.success('任务驳回成功')
    await getList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('驳回任务失败:', error)
    }
  }
}

/** 单个通过 */
const handleApprove = async (row: DataManageImportTaskVO) => {
  try {
    await message.confirm('确认通过此任务吗？')
    await approveTask(row.id!)
    message.success('任务通过成功')
    await getList()
  } catch {}
}

/** 批量后置质控 */
const handleBatchPostQc = async () => {
  try {
    await message.confirm(`确认对选中的 ${multipleSelection.value.length} 个任务执行后置质控吗？`)
    const ids = multipleSelection.value.map(item => item.id!)
    await batchExecutePostQc(ids)
    message.success('批量后置质控执行成功')
    multipleSelection.value = []
    await getList()
  } catch {}
}

/** 批量驳回 */
const handleBatchReject = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入驳回原因（可选）', `批量驳回 ${multipleSelection.value.length} 个任务`, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入驳回原因...'
    })
    const ids = multipleSelection.value.map(item => item.id!)
    await batchRejectTask(ids, reason || undefined)
    message.success('批量驳回成功')
    multipleSelection.value = []
    await getList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量驳回失败:', error)
    }
  }
}

/** 批量通过 */
const handleBatchApprove = async () => {
  try {
    await message.confirm(`确认通过选中的 ${multipleSelection.value.length} 个任务吗？`)
    const ids = multipleSelection.value.map(item => item.id!)
    await batchApproveTask(ids)
    message.success('批量通过成功')
    multipleSelection.value = []
    await getList()
  } catch {}
}

/** 按钮显示逻辑 - 后置质控 */
const canShowPostQcButton = (reportStatus: number) => {
  // 只在状态为1(已上报,审核中)、5(已重报,审核中)时显示
  return reportStatus === 1 || reportStatus === 5
}

/** 按钮显示逻辑 - 驳回 */
const canShowRejectButton = (reportStatus: number) => {
  // 只在状态为1(已上报,审核中)、5(已重报,审核中)时显示
  return reportStatus === 1 || reportStatus === 5
}

/** 按钮显示逻辑 - 通过 */
const canShowApproveButton = (reportStatus: number) => {
  // 只在状态为1(已上报,审核中)、5(已重报,审核中)时显示
  return reportStatus === 1 || reportStatus === 5
}

/** 初始化 **/
onMounted(async () => {
  await getReportTaskListData()
  getList()
})
</script>
<style scoped lang="scss">
.selector-panel {
  flex-shrink: 0;
  min-width: 250px;
  max-width: 600px;
  height: 100vh;
  overflow: hidden;
}

.selector-card {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px;
  }
}

.resize-handle {
  width: 5px;
  background: var(--el-border-color-light);
  cursor: ew-resize;
  flex-shrink: 0;
  transition: background-color 0.2s;

  &:hover {
    background: var(--el-color-primary);
  }
}

// 右侧内容区域 - 关键：限制宽度避免被表格撑开
.main-content {
  min-width: 0; // flex子元素必须设置，否则默认min-width: auto会导致内容溢出
  overflow-x: auto; // 横向滚动
}
</style>
