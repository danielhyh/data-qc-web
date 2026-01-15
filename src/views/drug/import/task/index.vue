<!--数据管理页面-->
<template>
  <div class="flex h-full task-container">
    <!-- 左侧地区树选择器（排除监测无法上报机构，只统计医疗机构，底部自带当前地区显示） -->
    <RegionTree
      ref="regionTreeRef"
      :style="{ width: selectorWidth + 'px', flexShrink: 0, height: '100%' }"
      :auto-select-first="false"
      :show-org-count="true"
      :show-collapse-button="true"
      :only-medical="true"
      :selected-region-data="selectedRegion"
      exclude-module-code="MONITOR"
      @node-click="handleRegionSelect"
      @clear="handleClearRegion"
    />

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
            label-width="68px"
            @submit.prevent
        >
          <el-form-item label="填报任务" prop="reportTaskId">
            <el-select
                v-model="queryParams.reportTaskId"
                placeholder="请选择填报任务"
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
          <el-form-item label="关键字" prop="keyword">
            <el-input
                v-model="queryParams.keyword"
                placeholder="机构名称/代码/联络员/电话"
                clearable
                class="!w-240px"
                @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="上报状态" prop="reportStatus">
            <el-select
                v-model="queryParams.reportStatus"
                placeholder="请选择上报状态"
                clearable
                class="!w-150px"
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

        <!-- 操作按钮 -->
        <div class="mb-10px mt-15px flex items-center">
          <!-- 后置质控按钮（针对整个报送任务） -->
          <el-button
              type="warning"
              @click="handleStartPostQc"
              :disabled="!queryParams.reportTaskId"
              :loading="postQcLoading"
              v-if="canShowPostQcButton"
          >
            <Icon icon="ep:checked" class="mr-5px" /> 启动后置质控
          </el-button>
          <!-- 批量退回 -->
          <el-button
              type="danger"
              plain
              @click="handleBatchReject"
              :disabled="!canBatchReject"
              v-if="canShowRejectButton"
          >
            <Icon icon="ep:close" class="mr-5px" /> 批量退回
          </el-button>
          <!-- 批量通过 -->
          <el-button
              type="success"
              plain
              @click="handleBatchApprove"
              :disabled="!canBatchApprove"
              v-if="canShowApproveButton"
          >
            <Icon icon="ep:circle-check" class="mr-5px" /> 批量通过
          </el-button>
          <el-text type="info" class="ml-10px">
            <span v-if="isLoadingAll">正在加载全部数据...</span>
            <span v-else-if="multipleSelection.length > 0">已选择 {{ multipleSelection.length }} 项</span>
          </el-text>
        </div>
      </ContentWrap>

      <!-- 列表 -->
      <ContentWrap>
        <el-table
          ref="tableRef"
          v-loading="loading"
          :data="list"
          :show-overflow-tooltip="true"
          @selection-change="handleSelectionChange"
          @select-all="handleSelectAll"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="机构名称" prop="deptName" min-width="180">
            <template #default="scope">
              <span class="font-bold">{{ scope.row.deptName }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="orgCode" label="机构代码" width="130" show-overflow-tooltip />
          <el-table-column label="所属市" align="center" prop="cityName" width="100" />
          <el-table-column prop="districtName" label="行政区划" width="100" show-overflow-tooltip />
          <el-table-column prop="hospitalLevelJ" label="等级" width="70" align="center">
            <template #default="scope">
              <dict-tag
                v-if="scope.row.hospitalLevelJ"
                :type="DICT_TYPE.INSTITUTION_LEVEL"
                :value="scope.row.hospitalLevelJ"
              />
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="hospitalGrade" label="等次" width="70" align="center">
            <template #default="scope">
              <dict-tag
                v-if="scope.row.hospitalGrade"
                :type="DICT_TYPE.HOSPITAL_GRADE"
                :value="scope.row.hospitalGrade"
              />
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column label="联系人" align="center" prop="contactPerson" width="90" />
          <el-table-column label="联系电话" align="center" prop="contactPhone" width="120" />
          <el-table-column label="文件/记录" align="center" width="100">
            <template #default="scope">
              <span>{{ scope.row.totalFiles || 0 }}/{{ scope.row.totalRecords || 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column label="上报进度" align="center" width="160">
            <template #default="scope">
              <div class="flex items-center gap-2">
                <el-progress
                  :percentage="scope.row.reportProgress || 0"
                  :color="getProgressColor(scope.row.reportProgress)"
                  :stroke-width="8"
                  style="flex: 1"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="上报状态" align="center" prop="reportStatus" width="100">
            <template #default="scope">
              <dict-tag :type="DICT_TYPE.REPORT_STATUS" :value="scope.row.reportStatus" />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="200" fixed="right">
            <template #default="scope">
              <el-button
                  type="primary"
                  @click="handleViewData(scope.row)"
                  size="small"
              >
                <Icon icon="ep:view" />
                查看数据
              </el-button>
              <el-dropdown
                  trigger="click"
                  @command="(cmd) => handleCommand(cmd, scope.row)"
                  @visible-change="(visible) => handleDropdownVisibleChange(scope.row.id, visible)"
              >
                <el-button type="info" size="small" class="more-btn">
                  <Icon :icon="dropdownStates[scope.row.id] ? 'ep:arrow-up' : 'ep:arrow-down'" />
                  更多
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <!-- 日志 -->
                    <el-dropdown-item command="log">
                      <Icon icon="ep:tickets" class="mr-5px" />日志
                    </el-dropdown-item>
                    <!-- 退回：只在状态为1(已上报,审核中)、5(已重报,审核中)、6(后置质控通过)时显示，基于权限控制 -->
                    <el-dropdown-item
                        v-if="canShowRejectButton && canShowRejectButtonForUser(scope.row.reportStatus)"
                        command="reject"
                        divided
                    >
                      <Icon icon="ep:close" class="mr-5px" />退回
                    </el-dropdown-item>
                    <!-- 通过：只在状态为6(后置质控通过)时显示，基于权限控制 -->
                    <el-dropdown-item
                        v-if="canShowApproveButtonForUser(scope.row.reportStatus)"
                        command="approve"
                    >
                      <Icon icon="ep:circle-check" class="mr-5px" />通过
                    </el-dropdown-item>
                    <!-- 删除：仅超级管理员可见 -->
                    <el-dropdown-item
                        command="delete"
                        v-if="isSuperAdmin"
                    >
                      <Icon icon="ep:delete" class="mr-5px" />删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
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
import { getIntDictOptions, DICT_TYPE, getDictLabel } from '@/utils/dict'
import { checkPermi } from '@/utils/permission'
import download from '@/utils/download'
import { getDataManageImportTaskPage, exportDataManageImportTask, DataManageImportTaskVO, getReportTaskList, ReportTaskVO, rejectTask, approveTask, batchRejectTask, batchApproveTask } from '@/api/drug/dataManage'
import { ImportTaskApi } from '@/api/drug/batch'
import { startPostQc } from '@/api/drug/postqc'
import ImportTaskForm from './ImportTaskForm.vue'
import RegionTree from '@/views/system/user/RegionTree.vue'
import ReportLogDialog from './ReportLogDialog.vue'
import { ElMessageBox } from 'element-plus'
import { getProgressColor } from '@/utils/progressColor'
import { useUserStore } from '@/store/modules/user'

/** 药品数据导入任务 列表 */
defineOptions({ name: 'ImportTask' })

const message = useMessage() // 消息弹窗
const router = useRouter() // 路由对象
const { t } = useI18n() // 国际化
const userStore = useUserStore() // 用户信息

const loading = ref(true) // 列表的加载中
const list = ref<DataManageImportTaskVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const selectedRegion = ref<any>(null) // 选中的地区节点
const reportTaskList = ref<ReportTaskVO[]>([]) // 填报任务列表
const multipleSelection = ref<DataManageImportTaskVO[]>([]) // 多选数据
const allSelectedIds = ref<number[]>([]) // 全选时存储所有ID（跨页）
const isSelectAll = ref(false) // 是否处于全选状态
const isLoadingAll = ref(false) // 是否正在加载全部数据

// 下拉菜单展开状态
const dropdownStates = reactive<Record<number, boolean>>({})
const handleDropdownVisibleChange = (id: number, visible: boolean) => {
  dropdownStates[id] = visible
}

// 面板拖拽相关
const regionTreeRef = ref<InstanceType<typeof RegionTree>>()
const tableRef = ref() // 表格ref
const selectorWidth = ref(250) // 默认宽度设为最小宽度
const isResizing = ref(false)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  reportTaskId: undefined, // 填报任务ID
  keyword: undefined, // 关键字（机构名称/代码/联络员/电话）
  reportStatus: undefined,
  regionCode: undefined // 地区代码
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中
const postQcLoading = ref(false) // 后置质控的加载中

/** 开始拖拽调整大小 */
const startResize = (e: MouseEvent) => {
  // 如果地区树处于折叠状态，禁用拖拽
  if (regionTreeRef.value?.isCollapsed) {
    return
  }

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

/** 监听地区树折叠状态，自动调整宽度 */
watch(
  () => regionTreeRef.value?.isCollapsed,
  (collapsed) => {
    if (collapsed) {
      selectorWidth.value = 50 // 折叠状态宽度 - 只显示展开按钮
    } else if (selectorWidth.value === 50) {
      selectorWidth.value = 250 // 恢复默认宽度
    }
  }
)

/** 获取填报任务列表 */
const getReportTaskListData = async () => {
  try {
    const data = await getReportTaskList()
    reportTaskList.value = data
    // 默认选中最新的任务（第一条）
    if (data && data.length > 0 && !queryParams.reportTaskId) {
      queryParams.reportTaskId = data[0].id
    }
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

/** 清除地区选择 */
const handleClearRegion = () => {
  selectedRegion.value = null
  queryParams.regionCode = undefined
  queryParams.pageNo = 1
  // 清除树的选中状态
  regionTreeRef.value?.clearSelection()
  getList()
}

/** 获取地区显示名称 */
const getRegionDisplayName = (region: any) => {
  if (!region) return ''
  // 使用字典获取地区级别的文字
  const levelLabel = getDictLabel(DICT_TYPE.REGION_LEVEL, region.level)
  return `${region.name}(${levelLabel || ''})`
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  // 保存当前的填报任务ID（不能被重置）
  const currentTaskId = queryParams.reportTaskId
  queryFormRef.value.resetFields()
  // 恢复填报任务ID
  queryParams.reportTaskId = currentTaskId
  // 清除全选状态
  isSelectAll.value = false
  allSelectedIds.value = []
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
  // 如果不是全选状态，正常处理
  if (!isSelectAll.value) {
    multipleSelection.value = selection
  }
}

/** 全选处理 - 选择所有数据（跨页） */
const handleSelectAll = async (selection: DataManageImportTaskVO[]) => {
  if (selection.length > 0) {
    // 点击全选，获取所有符合条件的数据ID
    isSelectAll.value = true
    isLoadingAll.value = true
    // 先清空，避免显示当前页数量
    multipleSelection.value = []
    try {
      // 查询所有数据（不分页）
      const data = await getDataManageImportTaskPage({
        ...queryParams,
        pageNo: 1,
        pageSize: -1
      })
      allSelectedIds.value = data.list.map((item: DataManageImportTaskVO) => item.id!)
      multipleSelection.value = data.list
    } catch (error) {
      console.error('获取全部数据失败:', error)
      // 失败时回退到当前页选择
      multipleSelection.value = selection
      isSelectAll.value = false
    } finally {
      isLoadingAll.value = false
    }
  } else {
    // 取消全选
    isSelectAll.value = false
    isLoadingAll.value = false
    allSelectedIds.value = []
    multipleSelection.value = []
  }
}

/** 批量通过/驳回是否可用（只有后置质控通过的才能批量通过或驳回） */
const canBatchApprove = computed(() => {
  if (multipleSelection.value.length === 0) return false
  // 检查所有选中的任务是否都是后置质控通过状态（状态为6-后置质控通过）
  return multipleSelection.value.every(item => item.reportStatus === 6)
})

/** 批量退回是否可用（状态为1、5、6的才能批量退回） */
const canBatchReject = computed(() => {
  if (multipleSelection.value.length === 0) return false
  // 检查所有选中的任务是否都是可退回状态（状态为1、5、6）
  return multipleSelection.value.every(item => 
    item.reportStatus === 1 || item.reportStatus === 5 || item.reportStatus === 6
  )
})

/** 权限判断 - 是否为超级管理员 */
const isSuperAdmin = computed(() => {
  const roles = userStore.getRoles || []
  return roles.includes('super_admin')
})

/** 批量按钮显示逻辑 - 后置质控按钮（基于权限） */
const canShowPostQcButton = computed(() => {
  return checkPermi(['drug:import-task:post-qc'])
})

/** 批量按钮显示逻辑 - 退回按钮（基于权限） */
const canShowRejectButton = computed(() => {
  return checkPermi(['drug:import-task:reject'])
})

/** 批量按钮显示逻辑 - 通过按钮（基于权限） */
const canShowApproveButton = computed(() => {
  return checkPermi(['drug:import-task:approve'])
})

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

/** 启动后置质控（针对整个报送任务） */
const handleStartPostQc = async () => {
  if (!queryParams.reportTaskId) {
    message.warning('请先选择填报任务')
    return
  }
  try {
    await message.confirm('确认对当前报送任务启动后置质控吗？这将对所有已提交的机构数据执行后置质控检查。')
    postQcLoading.value = true
    const result = await startPostQc(queryParams.reportTaskId)
    // 显示执行结果
    ElMessageBox.alert(
      `后置质控执行完成！<br/>
      <br/>总机构数：${result.totalOrgs}
      <br/>通过：${result.passedOrgs}
      <br/>待审核：${result.pendingReviewOrgs}
      <br/>自动退回：${result.autoReturnOrgs}
      <br/>标尺YPID数：${result.benchmarkYpidCount}
      <br/>耗时：${result.executionTime}ms`,
      '后置质控结果',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确定'
      }
    )
    await getList()
  } catch (error) {
    console.error('后置质控执行失败:', error)
  } finally {
    postQcLoading.value = false
  }
}

/** 单个驳回 */
const handleReject = async (row: DataManageImportTaskVO) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入退回原因（可选）', '退回任务', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入退回原因...'
    })
    await rejectTask(row.id!, reason || undefined)
    message.success('任务退回成功')
    await getList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('退回任务失败:', error)
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

/** 批量驳回 */
const handleBatchReject = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入退回原因（可选）', `批量退回 ${multipleSelection.value.length} 个任务`, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入退回原因...'
    })
    const ids = multipleSelection.value.map(item => item.id!)
    await batchRejectTask(ids, reason || undefined)
    message.success('批量退回成功')
    clearSelection()
    await getList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量退回失败:', error)
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
    clearSelection()
    await getList()
  } catch {}
}

/** 清除选择状态 */
const clearSelection = () => {
  multipleSelection.value = []
  allSelectedIds.value = []
  isSelectAll.value = false
  tableRef.value?.clearSelection()
}

/** 单个操作按钮显示逻辑 - 退回（状态1、5、6可显示，且需要市级/区县级管理员权限） */
const canShowRejectButtonForUser = (reportStatus: number) => {
  // 只在状态为1(已上报,审核中)、5(已重报,审核中)、6(后置质控通过)时显示
  return reportStatus === 1 || reportStatus === 5 || reportStatus === 6
}

/** 单个操作按钮显示逻辑 - 通过（状态6可显示） */
const canShowApproveButtonForUser = (reportStatus: number) => {
  // 只在状态为6(后置质控通过)时显示
  return reportStatus === 6
}

/** 操作下拉菜单命令处理 */
const handleCommand = async (command: string, row: DataManageImportTaskVO) => {
  switch (command) {
    case 'log':
      handleViewLog(row)
      break
    case 'reject':
      handleReject(row)
      break
    case 'approve':
      handleApprove(row)
      break
    case 'edit':
      openForm('update', row.id)
      break
    case 'delete':
      handleDelete(row.id!)
      break
  }
}

/** 初始化 **/
onMounted(async () => {
  await getReportTaskListData()
  getList()
})
</script>
<style scoped lang="scss">
/* 容器高度自适应 */
.task-container {
  height: calc(100vh - 120px); /* 减去头部导航和边距 */
  min-height: 500px; /* 最小高度保证内容可见 */
  overflow: hidden;
}

.resize-handle {
  width: 5px;
  background: var(--el-border-color-light);
  cursor: ew-resize;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: var(--el-color-primary);
    width: 6px;
  }
}

// 右侧内容区域 - 关键：限制宽度避免被表格撑开
.main-content {
  min-width: 0; // flex子元素必须设置，否则默认min-width: auto会导致内容溢出
  overflow-x: auto; // 横向滚动
}

/* 更多按钮样式 */
.more-btn {
  margin-left: 8px;
}
</style>
