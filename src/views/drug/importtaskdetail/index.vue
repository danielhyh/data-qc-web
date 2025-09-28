<template>
  <div class="flex h-full">
    <!-- 左侧地区和机构选择器 -->
    <div
      ref="selectorPanel"
      class="selector-panel"
      :style="{ width: selectorWidth + 'px' }"
    >
      <ContentWrap
        class="h-full selector-card">
        <el-row :gutter="12" class="selector-content">
          <!-- 左侧：地区树 -->
          <el-col :span="12">
            <div class="section-title">地区</div>
            <RegionTree @node-click="handleRegionNodeClick" />
          </el-col>

          <!-- 右侧：机构列表 -->
          <el-col :span="12">
            <div class="section-title">机构</div>

            <!-- 机构搜索框 -->
            <div v-if="selectedRegionId" class="org-search-box">
              <el-input
                v-model="orgSearchText"
                placeholder="搜索机构名称"
                clearable
                size="small"
                @input="handleOrgSearch"
              >
                <template #prefix>
                  <Icon icon="ep:search" />
                </template>
              </el-input>
            </div>

            <div v-if="!selectedRegionId && orgList.length === 0 && !orgLoading" class="empty-state">
              <Icon icon="ep:pointer" class="empty-icon" />
              <p>请先选择左侧地区</p>
            </div>

            <div v-else-if="orgLoading" class="loading-state">
              <el-skeleton :rows="3" animated />
            </div>

            <div v-else-if="selectedRegionId && orgList.length === 0" class="empty-state">
              <Icon icon="ep:document-delete" class="empty-icon" />
              <p>该地区暂无机构</p>
            </div>

            <div v-else-if="orgList.length > 0" class="org-list">
              <div
                v-for="org in filteredOrgList"
                :key="org.id"
                class="org-item"
                :class="{ active: selectedOrgIds.includes(org.id) }"
                @click="handleOrgClick(org)"
              >
                <div class="org-item-content">
                  <el-tooltip
                    :content="org.name"
                    placement="top"
                    :disabled="!isTextOverflow(org.name)"
                  >
                    <div class="org-name">{{ org.name }}</div>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </ContentWrap>
    </div>

    <!-- 拖拽分隔条 -->
    <div
      class="resize-handle"
      @mousedown="startResize"
    ></div>

    <!-- 右侧内容区域 -->
    <div class="flex-1 ml-5">
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
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
      <el-form-item label="文件名" prop="fileName">
        <el-input
          v-model="queryParams.fileName"
          placeholder="请输入文件名"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['drug:import-task-detail:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['drug:import-task-detail:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="任务ID" align="center" prop="taskId" />
      <el-table-column label="任务编号" align="center" prop="taskNo" />
      <el-table-column label="部门名称" align="center" prop="deptName" />
      <el-table-column label="所属市" align="center" prop="cityName" />
      <el-table-column label="所属区县" align="center" prop="districtName" />
      <el-table-column label="文件类型:HOSPITAL_INFO,DRUG_CATALOG,DRUG_INBOUND,DRUG_OUTBOUND,DRUG_USAGE" align="center" prop="fileType">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.IMPORT_TABLE_TYPE" :value="scope.row.fileType" />
        </template>
      </el-table-column>
      <el-table-column label="文件名" align="center" prop="fileName" />
      <el-table-column label="总行数" align="center" prop="totalRows" />
      <el-table-column label="文件大小" align="center" prop="fileSize" />
      <el-table-column
        label="提交时间"
        align="center"
        prop="submitTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['drug:import-task-detail:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['drug:import-task-detail:delete']"
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
    </div>
  </div>

  <!-- 表单弹窗：添加/修改 -->
  <ImportTaskDetailForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { getStrDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { DataArchiveApi, DataArchiveVO } from '@/api/drug/dataArchive'
import * as AreaOrgApi from '@/api/system/areaOrg'
import { getReportTaskList, ReportTaskVO } from '@/api/drug/dataManage'
import ImportTaskDetailForm from './ImportTaskDetailForm.vue'
import RegionTree from '@/views/system/user/RegionTree.vue'

/** 数据档案 列表 */
defineOptions({ name: 'ImportTaskDetail' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<DataArchiveVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskId: undefined,
  fileType: undefined,
  fileName: undefined,
  totalRows: undefined,
  fileSize: undefined,
  submitTime: [],
  reportTaskId: undefined, // 填报任务ID
  deptIds: undefined, // 部门ID列表
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

// 地区机构筛选相关
const selectedRegionId = ref<number | undefined>() // 选中的地区ID
const selectedOrgIds = ref<number[]>([]) // 选中的机构ID列表
const orgList = ref<AreaOrgApi.OrgItem[]>([]) // 机构列表
const orgLoading = ref(false) // 机构加载状态
const orgSearchText = ref('') // 机构搜索文本
const filteredOrgList = ref<AreaOrgApi.OrgItem[]>([]) // 过滤后的机构列表
const reportTaskList = ref<ReportTaskVO[]>([]) // 填报任务列表

// 面板拖拽相关
const selectorPanel = ref<HTMLElement>()
const selectorWidth = ref(320) // 默认宽度
const isResizing = ref(false)

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

/** 加载机构列表 */
const loadOrgList = async (areaCode: string) => {
  orgLoading.value = true
  try {
    const res = await AreaOrgApi.getOrgListByArea(areaCode)
    orgList.value = res || []
    // 重置搜索和过滤
    orgSearchText.value = ''
    filteredOrgList.value = orgList.value
    // 重置选中的机构
    selectedOrgIds.value = []
    queryParams.deptIds = undefined
  } catch (error) {
    console.error('加载机构列表失败:', error)
    orgList.value = []
    filteredOrgList.value = []
  } finally {
    orgLoading.value = false
  }
}

/** 处理机构搜索 */
const handleOrgSearch = () => {
  if (!orgSearchText.value.trim()) {
    filteredOrgList.value = orgList.value
  } else {
    filteredOrgList.value = orgList.value.filter(org =>
      org.name.toLowerCase().includes(orgSearchText.value.toLowerCase())
    )
  }
}

/** 判断文本是否溢出 - 简单的长度判断 */
const isTextOverflow = (text: string) => {
  // 简单的长度判断，可根据实际容器宽度调整
  return text.length > 15
}

/** 处理地区被点击 */
const handleRegionNodeClick = async (row) => {
  // 更robust的ID设置逻辑
  selectedRegionId.value = row.id || row.code || row.value || 'selected'

  // 加载该地区下的机构列表
  if (row.code) {
    await loadOrgList(row.code)
    // 点击区域时，直接将该区域下的所有机构ids传递给查询接口
    if (orgList.value.length > 0) {
      const allOrgIds = orgList.value.map(org => org.id)
      selectedOrgIds.value = allOrgIds
      queryParams.deptIds = allOrgIds.join(',')
    } else {
      // 如果该地区下没有机构，传递一个不存在的ID，避免查询所有用户
      selectedOrgIds.value = []
      queryParams.deptIds = '-1'
    }
  } else {
    selectedOrgIds.value = []
    queryParams.deptIds = undefined
  }
  // 刷新列表
  await getList()
}

/** 处理机构被点击 */
const handleOrgClick = (org: AreaOrgApi.OrgItem) => {
  const index = selectedOrgIds.value.indexOf(org.id)
  if (index > -1) {
    // 取消选中
    selectedOrgIds.value.splice(index, 1)
  } else {
    // 选中
    selectedOrgIds.value.push(org.id)
  }

  // 更新查询参数
  if (selectedOrgIds.value.length > 0) {
    queryParams.deptIds = selectedOrgIds.value.join(',')
  } else {
    queryParams.deptIds = undefined
  }

  // 刷新列表
  getList()
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DataArchiveApi.getDataArchivePage(queryParams)
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
  queryFormRef.value?.resetFields()
  // 重置地区和机构选择
  selectedRegionId.value = undefined
  selectedOrgIds.value = []
  orgList.value = []
  filteredOrgList.value = []
  orgSearchText.value = ''
  queryParams.deptIds = undefined
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
    await DataArchiveApi.deleteDataArchive(id)
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
    const data = await DataArchiveApi.exportDataArchive(queryParams)
    download.excel(data, '数据档案.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
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

.selector-content {
  height: 100%;

  .el-col {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.org-search-box {
  margin-bottom: 12px;
}

.org-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;

  .org-item {
    padding: 12px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 13px;
    color: var(--el-text-color-regular);
    line-height: 1.4;

    &:hover {
      background-color: var(--el-fill-color-light);
      border-color: var(--el-color-primary-light-7);
    }

    &.active {
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
    }

    .org-item-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .org-name {
      flex: 1;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.empty-state,
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--el-text-color-secondary);

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    color: var(--el-border-color-darker);
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}
</style>
