<!--机构管理页面-->
<template>
  <div class="system-dept-page">
    <div class="flex dept-container">
    <!-- 左侧地区树选择器 -->
    <RegionTree
      ref="regionTreeRef"
      :style="{ width: selectorWidth + 'px', flexShrink: 0, height: '100%' }"
      :auto-select-first="false"
      :show-org-count="true"
      :show-collapse-button="true"
      @node-click="handleRegionNodeClick"
    />

    <!-- 拖拽分隔条 -->
    <div class="resize-handle" @mousedown="startResize"></div>

    <!-- 右侧机构管理内容区域 -->
    <div class="flex-1 ml-5 main-content">
      <!-- 当前选择的地区信息 -->
      <div v-if="selectedRegion" class="mb-15px">
        <el-tag type="primary" size="large" class="region-tag" :closable="true" @close="handleClearRegion">
          <Icon icon="ep:location" class="mr-5px" />
          当前地区：{{ getRegionDisplayName(selectedRegion) }}
        </el-tag>
      </div>

      <!-- Tab 标签页 -->
      <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
        <!-- 机构管理 Tab -->
        <el-tab-pane name="dept">
          <template #label>
            <span class="tab-label-wrapper">
              <Icon icon="ep:office-building" class="tab-icon" />
              <span>机构管理</span>
            </span>
          </template>
          <!-- 搜索工作栏 -->
          <ContentWrap>
            <el-form
              class="-mb-15px"
              :model="queryParams"
              ref="queryFormRef"
              :inline="true"
              label-width="68px"
            >
              <el-form-item label="机构名称" prop="name">
                <el-input
                  v-model="queryParams.name"
                  placeholder="请输入机构名称"
                  clearable
                  @keyup.enter="handleQuery"
                  class="!w-240px"
                />
              </el-form-item>
              <el-form-item label="机构状态" prop="status">
                <el-select
                  v-model="queryParams.status"
                  placeholder="请选择机构状态"
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
                <el-button @click="handleQuery"
                ><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button
                >
                <el-button @click="resetQuery"
                ><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button
                >
                <el-button
                  type="primary"
                  @click="openForm('create')"
                  v-hasPermi="['system:dept:create']"
                >
                  <Icon icon="ep:plus" class="mr-5px" /> 新增
                </el-button>
                <el-button
                  type="warning"
                  plain
                  @click="handleImport"
                >
                  <Icon icon="ep:upload" class="mr-5px" /> 导入
                </el-button>
                <el-button
                  type="info"
                  plain
                  @click="handleDownloadTemplate"
                >
                  <Icon icon="ep:document" class="mr-5px" /> 模板
                </el-button>
                <el-button type="danger" @click="toggleExpandAll">
                  <Icon icon="ep:sort" class="mr-5px" /> 展开/折叠
                </el-button>
                <el-button type="success" @click="openSyncModal">
                  <Icon icon="ep:download" class="mr-5px" /> 从标准库同步
                </el-button>
              </el-form-item>
            </el-form>
          </ContentWrap>

          <!-- 机构列表 -->
          <ContentWrap>
            <el-table
              v-if="refreshTable"
              v-loading="loading"
              :data="list"
              row-key="id"
              :default-expand-all="isExpandAll"
            >
              <el-table-column prop="name" label="机构名称" min-width="230">
                <template #default="scope">
                  <div class="institution-name-cell">
                    <el-tooltip
                      :content="getInstitutionCategoryLabel(scope.row.institutionCategory)"
                      placement="top"
                    >
                      <DictIcon
                        :dict-type="DICT_TYPE.INSTITUTION_CATEGORY"
                        :value="scope.row.institutionCategory ?? ''"
                        :size="18"
                        default-color="#5b8def"
                      />
                    </el-tooltip>
                    <span class="institution-name-text font-bold">{{ scope.row.name }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="externalId" label="外部机构代码" width="180" show-overflow-tooltip />
              <el-table-column prop="regionPathName" label="所在地区" min-width="220" show-overflow-tooltip />
              <el-table-column prop="deptAddressCode" label="行政区划代码" width="140" show-overflow-tooltip />
              <el-table-column prop="institutionCategory" label="机构类别" width="120">
                <template #default="scope">
                  <dict-tag
                    :type="DICT_TYPE.INSTITUTION_CATEGORY"
                    :value="scope.row.institutionCategory ?? ''"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="hospitalLevel" label="机构等级" width="100">
                <template #default="scope">
                  <dict-tag :type="DICT_TYPE.INSTITUTION_LEVEL" :value="scope.row.hospitalLevel ?? ''" />
                </template>
              </el-table-column>
              <el-table-column prop="adminCategory" label="行政归属" width="110" show-overflow-tooltip />
              <el-table-column prop="orgCode" label="组织机构代码" width="160" show-overflow-tooltip />
              <el-table-column prop="socialCreditCode" label="社会信用代码" width="190" show-overflow-tooltip />
              <el-table-column prop="contactPerson" label="联络员" width="100" />
              <el-table-column prop="contactPhone" label="联络员手机" width="120" />
              <el-table-column prop="address" label="联系地址" min-width="220" show-overflow-tooltip />
              <el-table-column prop="grassrootsInstitution" label="基层机构" width="100">
                <template #default="scope">
                  <el-tag :type="getBooleanTagType(scope.row.grassrootsInstitution)">
                    {{ getBooleanLabel(scope.row.grassrootsInstitution) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="isMonitoringRequired" label="监测对象" width="110">
                <template #default="scope">
                  <el-tag :type="getBooleanTagType(scope.row.isMonitoringRequired)">
                    {{ getBooleanLabel(scope.row.isMonitoringRequired) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="sort" label="排序" width="140">
                <template #default="scope">
                  <div class="sort-input-wrapper">
                    <el-input-number
                      :model-value="getSortInputValue(scope.row)"
                      :min="0"
                      :max="9999"
                      :controls="false"
                      size="small"
                      class="sort-input"
                      :disabled="updatingSortId === scope.row.id"
                      @update:model-value="(value) => handleSortInputChange(scope.row, value)"
                      @blur="() => handleSortCommit(scope.row)"
                      @keydown.enter.prevent="() => handleSortCommit(scope.row)"
                    />
                    <Icon
                      v-if="updatingSortId === scope.row.id"
                      icon="line-md:loading-twotone-loop"
                      class="sort-loading"
                    />
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="80">
                <template #default="scope">
                  <el-switch
                    v-model="scope.row.status"
                    :active-value="0"
                    :inactive-value="1"
                    @change="handleStatusChange(scope.row)"
                    v-hasPermi="['system:dept:update']"
                  />
                </template>
              </el-table-column>
              <el-table-column
                label="创建时间"
                align="center"
                prop="createTime"
                width="180"
                :formatter="dateFormatter"
              />
              <el-table-column label="操作" align="center" width="180px" fixed="right">
                <template #default="scope">
                  <el-button
                    type="primary"
                    plain
                    size="small"
                    @click="openForm('update', scope.row.id)"
                    v-hasPermi="['system:dept:update']"
                  >
                    <Icon icon="ep:edit" class="mr-5px" />
                    修改
                  </el-button>
                  <el-button
                    type="danger"
                    plain
                    size="small"
                    @click="handleDelete(scope.row.id)"
                    v-hasPermi="['system:dept:delete']"
                  >
                    <Icon icon="ep:delete" class="mr-5px" />
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </ContentWrap>
        </el-tab-pane>

        <!-- 监测内无法上报机构 Tab -->
        <el-tab-pane name="monitoring">
          <template #label>
            <span class="tab-label-wrapper">
              <Icon icon="ep:warning" class="tab-icon" />
              <span>监测内无法上报机构</span>
              <el-badge
                v-if="unableReportCount > 0"
                :value="unableReportCount"
                class="tab-badge tab-badge-danger"
              />
            </span>
          </template>
          <!-- 监测内无法上报机构组件 - 始终渲染以便初始化加载数据 -->
          <MonitoringUnableReportTab
            :area-code="selectedRegionCode"
            :selected-region-id="selectedRegionIdForMonitor"
            @count-updated="handleUnableReportCountUpdate"
          />
        </el-tab-pane>

        <!-- 委直委管配置 Tab -->
        <el-tab-pane name="categoryConfig">
          <template #label>
            <span class="tab-label-wrapper">
              <Icon icon="ep:setting" class="tab-icon" />
              <span>委直委管配置</span>
            </span>
          </template>
          <!-- 委直委管配置组件 -->
          <InstitutionCategoryConfigTab />
        </el-tab-pane>
      </el-tabs>
    </div>
    </div>

    <!-- 表单弹窗：添加/修改 -->
    <DeptForm ref="formRef" @success="getList" />

    <!-- 同步弹窗：从标准库同步 -->
    <InstitutionSyncModal ref="syncModalRef" @success="getList" />
  </div>
</template>
<script lang="ts" setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { DICT_TYPE, getDictObj, getIntDictOptions, getDictLabel } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { handleTree } from '@/utils/tree'
import * as DeptApi from '@/api/system/dept'
import DeptForm from './DeptForm.vue'
import InstitutionSyncModal from './InstitutionSyncModal.vue'
import * as UserApi from '@/api/system/user'
import RegionTree from '../user/RegionTree.vue'
import MonitoringUnableReportTab from './MonitoringUnableReportTab.vue'
import InstitutionCategoryConfigTab from './InstitutionCategoryConfigTab.vue'
import DictIcon from '@/components/DictIcon'
import { Icon } from '@/components/Icon'
import { ElMessage } from 'element-plus'
import { useMessage } from '@/hooks/web/useMessage'
import { useI18n } from '@/hooks/web/useI18n'

defineOptions({ name: 'SystemDept' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<any[]>([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: -1,
  name: undefined,
  status: undefined,
  areaCode: undefined // 使用areaCode匹配后端接口
})
const queryFormRef = ref() // 搜索的表单
const isExpandAll = ref(false) // 是否展开，默认不全部展开，避免一次性渲染过多节点
const refreshTable = ref(true) // 重新渲染表格状态
const userList = ref<UserApi.UserVO[]>([]) // 用户列表
const selectedRegionId = ref<string | undefined>() // 选中的地区Code
const selectedRegionCode = ref<string | undefined>() // 选中的地区代码
const selectedRegion = ref<any>(null) // 选中的地区节点（用于显示标签）
const activeTab = ref('dept') // 当前激活的标签页
const unableReportCount = ref(0) // 无法上报机构数量（用于徽标显示）

const editingSortCache = reactive(new Map<number, number>())
const updatingSortId = ref<number | null>(null)

const selectedRegionIdForMonitor = computed(() => {
  if (!selectedRegionId.value) {
    return undefined
  }
  const parsed = Number(selectedRegionId.value)
  return Number.isNaN(parsed) ? undefined : parsed
})

const getInstitutionCategoryLabel = (value: string | number | boolean | undefined) => {
  return getDictObj(DICT_TYPE.INSTITUTION_CATEGORY, value)?.label ?? '机构分类'
}

const getBooleanLabel = (value: number | undefined | null) => {
  if (value === 0) return '是'
  if (value === 1) return '否'
  return '-'
}

const getBooleanTagType = (value: number | undefined | null) => {
  if (value === 0) return 'success'
  if (value === 1) return 'info'
  return 'info'
}

const getSortInputValue = (row: any) => {
  const cached = editingSortCache.get(row.id)
  return cached !== undefined ? cached : Number(row.sort ?? 0)
}

const handleSortInputChange = (row: any, value: number | undefined) => {
  const numericValue = Number(value ?? 0)
  editingSortCache.set(row.id, numericValue)
}

const handleSortCommit = async (row: any) => {
  if (updatingSortId.value === row.id) {
    return
  }
  const cached = editingSortCache.get(row.id)
  if (cached === undefined) {
    return
  }
  const original = Number(row.sort ?? 0)
  const sanitizedSource = typeof cached === 'number' && Number.isFinite(cached) ? cached : original
  const sanitized = Math.max(0, Math.floor(sanitizedSource))
  if (sanitized === original) {
    editingSortCache.delete(row.id)
    return
  }
  updatingSortId.value = row.id
  try {
    await DeptApi.updateDeptSort(row.id, sanitized)
    message.success('排序已更新')
    editingSortCache.delete(row.id)
    await getList()
  } catch (error: any) {
    console.error('更新排序失败:', error)
    const errorMsg = error?.data?.msg || error?.message || '排序更新失败'
    message.error(errorMsg)
    editingSortCache.set(row.id, sanitized)
  } finally {
    updatingSortId.value = null
  }
}

// 面板拖拽相关
const regionTreeRef = ref<InstanceType<typeof RegionTree>>()
const selectorWidth = ref(250) // 默认宽度设为最小宽度
const isResizing = ref(false)

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

/** 查询部门列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DeptApi.getDeptPage(queryParams)
    const treeData = handleTree(data)
    refreshTable.value = false
    await nextTick()
    list.value = treeData
    editingSortCache.clear()
    refreshTable.value = true
  } finally {
    refreshTable.value = true
    loading.value = false
  }
}

/** 处理地区被点击 */
const handleRegionNodeClick = async (row) => {
  // 使用 code 作为 selectedRegionId，因为新的地区树API返回的是code
  selectedRegionId.value = row.code
  selectedRegionCode.value = row.code
  selectedRegion.value = row
  queryParams.areaCode = row.code

  // 重置无法上报机构数量（切换地区时清零，等待子组件重新加载）
  unableReportCount.value = 0

  // 刷新机构列表
  await getList()
}

/** 清除地区选择 */
const handleClearRegion = () => {
  selectedRegion.value = null
  selectedRegionId.value = undefined
  selectedRegionCode.value = undefined
  queryParams.areaCode = undefined
  queryParams.pageNo = 1
  // 清除树的选中状态
  regionTreeRef.value?.clearSelection()
  // 重置无法上报机构数量
  unableReportCount.value = 0
  // 刷新机构列表（查询所有机构）
  getList()
}

/** 获取地区显示名称 */
const getRegionDisplayName = (region: any) => {
  if (!region) return ''
  // 使用字典获取地区级别的文字
  const levelLabel = getDictLabel(DICT_TYPE.REGION_LEVEL, region.level)
  return `${region.name}(${levelLabel || ''})`
}

/** 处理无法上报机构数量更新 */
const handleUnableReportCountUpdate = (count: number) => {
  unableReportCount.value = count
}

/** Tab切换处理 */
const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
}

/** 展开/折叠操作 */
const toggleExpandAll = () => {
  refreshTable.value = false
  isExpandAll.value = !isExpandAll.value
  nextTick(() => {
    refreshTable.value = true
  })
}

/** 搜索按钮操作 */
const handleQuery = () => {
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  // 重置不清除地区选择，保持地区筛选条件
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 打开同步弹窗 */
const syncModalRef = ref()
const openSyncModal = () => {
  syncModalRef.value.open()
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await DeptApi.deleteDept(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 状态开关操作 */
const handleStatusChange = async (row: any) => {
  try {
    const statusText = row.status === 0 ? '启用' : '禁用'
    await message.confirm(`确认要${statusText}"${row.name}"吗?`)
    await DeptApi.updateDeptStatus(row.id, row.status)
    message.success(`${statusText}成功`)
  } catch {
    // 操作失败或取消，恢复状态
    row.status = row.status === 0 ? 1 : 0
  }
}

/** 导入按钮操作 */
const handleImport = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xls,.xlsx,.csv'
  input.onchange = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return

    const fileName = file.name.toLowerCase()
    const isSupported = fileName.endsWith('.xls') || fileName.endsWith('.xlsx') || fileName.endsWith('.csv')
    if (!isSupported) {
      message.error('仅支持上传 xls、xlsx 或 csv 格式文件')
      return
    }

    // 添加 Loading 提示
    const loadingMsg = ElMessage({
      message: '正在导入数据，请稍候...',
      type: 'info',
      duration: 0 // 不自动关闭
    })

    try {
      // 调用后端接口
      await DeptApi.importDept(file)
      loadingMsg.close()
      message.success('数据导入成功！')
      // 刷新列表
      await getList()
    } catch (error: any) {
      loadingMsg.close()
      console.error('导入失败:', error)

      // 显示详细错误信息
      const errorMsg = error.data?.msg || error.message || '导入失败，请检查文件格式和内容'
      message.error(errorMsg)
    }
  }
  input.click()
}

/** 打开模板下载 */
const handleDownloadTemplate = async () => {
  try {
    // 调用后端接口下载模板
    await DeptApi.importTemplate()
  } catch (error: any) {
    console.error('模板下载失败:', error)
    message.error('模板下载失败，请稍后重试')
  }
}

/** 初始化 **/
onMounted(async () => {
  // 获取用户列表
  userList.value = await UserApi.getSimpleUserList()
  // 默认加载所有机构
  getList()
})
</script>

<style scoped lang="scss">
/* 容器高度自适应 */
.dept-container {
  height: calc(100vh - 140px); /* 减去头部导航和边距 */
  min-height: 600px; /* 最小高度保证内容可见 */
  overflow: hidden;
}

/* Tab 标签图标优化 */
.tab-label-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  .tab-icon {
    font-size: 16px;
    transition: all 0.3s ease;
  }

  .tab-badge {
    margin-left: 4px;
  }

  /* 警告徽标 - 红色样式 */
  .tab-badge-danger {
    :deep(.el-badge__content) {
      background: linear-gradient(135deg, #ef4444, #dc2626) !important;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4) !important;
      color: white;
      font-weight: 600;
    }
  }
}

/* Tab 激活状态时图标动画 */
:deep(.el-tabs__item.is-active) {
  .tab-icon {
    color: #5b8def;
    transform: scale(1.1);
    filter: drop-shadow(0 2px 4px rgba(91, 141, 239, 0.3));
  }

  /* 激活状态时警告徽标脉动动画 */
  .tab-badge-danger :deep(.el-badge__content) {
    animation: badge-pulse-danger 1.5s ease-in-out infinite;
  }
}

/* Tab 悬停状态时图标动画 */
:deep(.el-tabs__item:hover:not(.is-active)) {
  .tab-icon {
    transform: translateY(-1px);
  }
}

/* 红色徽标脉动动画 */
@keyframes badge-pulse-danger {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 4px 16px rgba(239, 68, 68, 0.6);
  }
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

  // 折叠状态下禁用拖拽（通过父组件判断）
  &:has(~ .main-content) {
    &:hover {
      cursor: ew-resize;
    }
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

// 地区标签美化
.region-tag {
  padding: 10px 18px;
  font-size: 14px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.25);
    transform: translateY(-1px);
  }

  :deep(.el-icon) {
    font-size: 16px;
  }
}

.empty-state {
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

.institution-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.institution-name-text {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.sort-input-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.sort-input {
  width: 110px;
}

.sort-loading {
  color: var(--el-color-primary);
  font-size: 16px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 右侧内容区域 - 关键：限制宽度避免被表格撑开
.main-content {
  min-width: 0; // flex子元素必须设置，否则默认min-width: auto会导致内容溢出
  overflow-x: auto; // 横向滚动
}
</style>
