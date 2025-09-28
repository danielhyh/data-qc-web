<template>
  <div class="flex h-full">
    <!-- 左侧地区树选择器 -->
    <div
      ref="selectorPanel"
      class="selector-panel"
      :style="{ width: selectorWidth + 'px' }"
    >
      <ContentWrap class="h-full selector-card" title="地区">
        <RegionTree @node-click="handleRegionNodeClick" />
      </ContentWrap>
    </div>

    <!-- 拖拽分隔条 -->
    <div
      class="resize-handle"
      @mousedown="startResize"
    ></div>

    <!-- 右侧机构管理内容区域 -->
    <div class="flex-1 ml-5">
      <!-- Tab 标签页 -->
      <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
        <el-tab-pane label="机构管理" name="dept">
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
                <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
                <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
                <el-button
                  type="primary"
                  @click="openForm('create')"
                  v-hasPermi="['system:dept:create']"
                >
                  <Icon icon="ep:plus" class="mr-5px" /> 新增
                </el-button>
                <el-button type="danger" @click="toggleExpandAll">
                  <Icon icon="ep:sort" class="mr-5px" /> 展开/折叠
                </el-button>
                <el-button
                  type="success"
                  @click="openSyncModal"
                >
                  <Icon icon="ep:download" class="mr-5px" /> 从标准库同步
                </el-button>
              </el-form-item>
            </el-form>
          </ContentWrap>

          <!-- 机构列表 -->
          <ContentWrap>
            <div v-if="!selectedRegionId" class="empty-state">
              <Icon icon="ep:pointer" class="empty-icon" />
              <p>请先选择左侧地区查看机构列表</p>
            </div>

            <el-table
              v-else-if="refreshTable && selectedRegionId"
              v-loading="loading"
              :data="list"
              row-key="id"
              :default-expand-all="isExpandAll"
            >
              <el-table-column prop="name" label="机构名称" />
              <el-table-column prop="institutionCategory" label="机构类别" width="120">
                <template #default="scope">
                  <dict-tag :type="DICT_TYPE.INSTITUTION_CATEGORY" :value="scope.row.institutionCategory" />
                </template>
              </el-table-column>
              <el-table-column prop="hospitalLevel" label="机构等级" width="100">
                <template #default="scope">
                  <dict-tag :type="DICT_TYPE.INSTITUTION_LEVEL" :value="scope.row.hospitalLevel" />
                </template>
              </el-table-column>
              <el-table-column prop="contactPerson" label="联络员" width="100"/>
              <el-table-column prop="contactPhone" label="联络员手机" width="120"/>
              <el-table-column prop="sort" label="排序" />
              <el-table-column prop="status" label="状态">
                <template #default="scope">
                  <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
                </template>
              </el-table-column>
              <el-table-column
                label="创建时间"
                align="center"
                prop="createTime"
                width="180"
                :formatter="dateFormatter"
              />
              <el-table-column label="操作" align="center">
                <template #default="scope">
                  <el-button
                    link
                    type="primary"
                    @click="openForm('update', scope.row.id)"
                    v-hasPermi="['system:dept:update']"
                  >
                    修改
                  </el-button>
                  <el-button
                    link
                    type="danger"
                    @click="handleDelete(scope.row.id)"
                    v-hasPermi="['system:dept:delete']"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </ContentWrap>
        </el-tab-pane>

        <el-tab-pane label="监测内无法上报机构" name="monitoring">
          <!-- 监测内无法上报机构组件 -->
          <MonitoringUnableReportTab
            v-if="selectedRegionId"
            :area-code="selectedRegionCode"
            :selected-region-id="selectedRegionId"
          />
          <div v-else class="empty-state">
            <Icon icon="ep:pointer" class="empty-icon" />
            <p>请先选择左侧地区查看监测内无法上报机构</p>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>

  <!-- 表单弹窗：添加/修改 -->
  <DeptForm ref="formRef" @success="getList" />

  <!-- 同步弹窗：从标准库同步 -->
  <InstitutionSyncModal ref="syncModalRef" @success="getList" />
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions ,getDictLabel} from '@/utils/dict'

// 确保字典类型包含机构类别和医院等级
DICT_TYPE.INSTITUTION_CATEGORY = 'institution_category'
DICT_TYPE.INSTITUTION_LEVEL = 'institution_level'

import { dateFormatter } from '@/utils/formatTime'
import { handleTree } from '@/utils/tree'
import * as DeptApi from '@/api/system/dept'
import DeptForm from './DeptForm.vue'
import InstitutionSyncModal from './InstitutionSyncModal.vue'
import * as UserApi from '@/api/system/user'
import RegionTree from '../user/RegionTree.vue'
import MonitoringUnableReportTab from './MonitoringUnableReportTab.vue'

defineOptions({ name: 'SystemDept' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref() // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: -1,
  name: undefined,
  status: undefined,
  areaCode: undefined // 使用areaCode匹配后端接口
})
const queryFormRef = ref() // 搜索的表单
const isExpandAll = ref(true) // 是否展开，默认全部展开
const refreshTable = ref(true) // 重新渲染表格状态
const userList = ref<UserApi.UserVO[]>([]) // 用户列表
const selectedRegionId = ref<string | undefined>() // 选中的地区Code
const selectedRegionCode = ref<string | undefined>() // 选中的地区代码
const activeTab = ref('dept') // 当前激活的标签页

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

/** 查询部门列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DeptApi.getDeptPage(queryParams)
    console.log('原始数据:', data)
    const treeData = handleTree(data)
    console.log('处理后的树形数据:', treeData)
    list.value = treeData
  } finally {
    loading.value = false
  }
}

/** 处理地区被点击 */
const handleRegionNodeClick = async (row) => {
  // 使用 code 作为 selectedRegionId，因为新的地区树API返回的是code
  selectedRegionId.value = row.code
  selectedRegionCode.value = row.code
  queryParams.areaCode = row.code
  // 刷新机构列表
  await getList()
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
  queryParams.pageNo = 1
  queryParams.areaCode = undefined
  selectedRegionId.value = undefined
  selectedRegionCode.value = undefined
  queryFormRef.value.resetFields()
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

/** 初始化 **/
onMounted(async () => {
  // 获取用户列表
  userList.value = await UserApi.getSimpleUserList()
  // 不再默认加载机构列表，等待地区选择
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

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
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
</style>
