<template>
  <div class="dept-community-page">
    <div class="flex dept-community-container">
      <!-- 左侧地区树选择器 -->
      <RegionTree
        ref="regionTreeRef"
        :style="{ width: selectorWidth + 'px', flexShrink: 0, height: '100%' }"
        :auto-select-first="true"
        :show-org-count="true"
        :show-collapse-button="true"
        @node-click="handleRegionNodeClick"
        @clear="handleClearRegion"
      />

      <!-- 拖拽分隔条 -->
      <div class="resize-handle" @mousedown="startResize"></div>

      <!-- 中间机构列表区域 -->
      <div class="flex-1 mx-5 center-content">
        <ContentWrap>
          <h3>机构列表</h3>
          <el-table v-loading="deptLoading" :data="deptList" :stripe="true" :show-overflow-tooltip="true" @row-click="handleDeptRowClick">
            <el-table-column label="机构名称" align="center" prop="name" width="200">
              <template #default="scope">
                <div class="dept-name-cell">
                  <Icon icon="ep:office-building" class="mr-5px" />
                  <span>{{ scope.row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="机构代码" align="center" prop="orgCode" width="150" />
            <el-table-column label="行政区划" align="center" prop="regionPathName" width="150" />
            <el-table-column label="机构类别" align="center" prop="deptClassName" width="120" />
            <el-table-column label="联络员" align="center" prop="contactPerson" width="100" />
            <el-table-column label="联络电话" align="center" prop="contactPhone" width="130" />
          </el-table>
        </ContentWrap>
      </div>

      <!-- 拖拽分隔条 -->
      <div class="resize-handle" @mousedown="startResizeRight"></div>

      <!-- 右侧成员机构列表区域 -->
      <div class="flex-1 mr-5 right-content">
        <!-- 搜索工作栏 -->
        <el-form
          class="-mb-15px"
          :model="queryParams"
          ref="queryFormRef"
          :inline="true"
          label-width="68px"
        >
          <!-- 只有当没有通过点击中间机构选择牵头单位时，才显示牵头单位输入框 -->
          <el-form-item v-if="!selectedMasterId" label="牵头单位" prop="masterId">
            <el-input
              v-model="queryParams.masterId"
              placeholder="请输入牵头单位"
              clearable
              @keyup.enter="handleQuery"
              class="!w-240px"
            />
          </el-form-item>
          <el-form-item v-if="!selectedMasterId" label="成员单位" prop="memberId">
            <el-input
              v-model="queryParams.memberId"
              placeholder="请输入成员单位"
              clearable
              @keyup.enter="handleQuery"
              class="!w-240px"
            />
          </el-form-item>
          <el-form-item v-if="!selectedMasterId" label="排序" prop="sortNum">
            <el-input
              v-model="queryParams.sortNum"
              placeholder="请输入排序"
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
              v-hasPermi="['drug:dept-community:create']"
            >
              <Icon icon="ep:plus" class="mr-5px" /> 新增
            </el-button>
            <el-button
              type="success"
              plain
              @click="handleExport"
              :loading="exportLoading"
              v-hasPermi="['drug:dept-community:export']"
            >
              <Icon icon="ep:download" class="mr-5px" /> 导出
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 成员机构列表 -->
        <ContentWrap>
          <div class="flex justify-between items-center mb-10px">
            <h3 v-if="selectedMasterDeptName">成员机构列表 - {{ selectedMasterDeptName }}</h3>
            <h3 v-else>成员机构列表</h3>
            <el-button
              v-if="selectedMasterId"
              type="info"
              plain
              size="small"
              @click="clearSelectedMaster"
            >
              <Icon icon="ep:close" class="mr-5px" />取消选择
            </el-button>
          </div>
          <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
            <el-table-column label="主键" align="center" prop="id" />
            <el-table-column label="牵头单位" align="center" prop="masterId" />
            <el-table-column label="成员单位" align="center" prop="memberId" />
            <el-table-column label="排序" align="center" prop="sortNum" />
            <el-table-column label="操作" align="center" min-width="120px">
              <template #default="scope">
                <el-button
                  link
                  type="primary"
                  @click="openForm('update', scope.row.id)"
                  v-hasPermi="['drug:dept-community:update']"
                >
                  编辑
                </el-button>
                <el-button
                  link
                  type="danger"
                  @click="handleDelete(scope.row.id)"
                  v-hasPermi="['drug:dept-community:delete']"
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
    <DeptCommunityForm ref="formRef" @success="getList" />
  </div>
</template>

<script setup lang="ts">
import download from '@/utils/download'
import { DeptCommunityApi, DeptCommunityVO } from '@/api/drug/deptcommunity'
import DeptCommunityForm from './DeptCommunityForm.vue'
import RegionTree from '@/views/system/user/RegionTree.vue' // 引入地区树组件
import { DeptVO, getDeptPage, DeptPageParam } from '@/api/system/dept' // 引入机构API
import { Icon } from '@/components/Icon'

/** 紧密医疗共同体 列表 */
defineOptions({ name: 'DeptCommunity' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

// 添加机构相关变量
const deptLoading = ref(true) // 机构列表的加载中
const deptList = ref<DeptVO[]>([]) // 机构列表的数据
const selectedRegionId = ref<string | undefined>() // 选中的地区Code
const selectedRegionCode = ref<string | undefined>() // 选中的地区代码
const selectedMasterId = ref<number | undefined>() // 选中的牵头单位ID
const selectedMasterDeptName = ref<string>('') // 选中的牵头单位名称，用于显示

// 原有紧密医疗共同体相关变量
const loading = ref(true) // 成员机构列表的加载中
const list = ref<DeptCommunityVO[]>([]) // 成员机构列表的数据
const total = ref(0) // 成员机构列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  masterId: undefined,
  memberId: undefined,
  sortNum: undefined,
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

// 面板拖拽相关
const regionTreeRef = ref<InstanceType<typeof RegionTree>>()
const selectorWidth = ref(250) // 默认宽度设为最小宽度
const isResizing = ref(false)

// 面板拖拽相关（右侧）
const isResizingRight = ref(false)

/** 开始拖拽调整左侧大小 */
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

/** 开始拖拽调整右侧大小 */
const startResizeRight = (e: MouseEvent) => {
  isResizingRight.value = true
  const startX = e.clientX
  const container = document.querySelector('.dept-community-container') as HTMLElement
  if (!container) return

  const containerRect = container.getBoundingClientRect()
  const initialCenterWidth = (containerRect.width - selectorWidth.value - 20) / 2 // 20是两个分隔条的宽度

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!isResizingRight.value) return
    const diff = moveEvent.clientX - startX
    const newCenterWidth = Math.max(300, initialCenterWidth + diff) // 最小300px
    const newRightWidth = Math.max(300, initialCenterWidth - diff) // 最小300px
    
    // 这里我们使用CSS变量来控制宽度，需要在CSS中实现
    // 简单的方法是调整左侧区域的宽度来间接控制
    const totalWidth = containerRect.width
    const newLeftWidth = totalWidth - newCenterWidth - newRightWidth - 20 // 20是两个分隔条的宽度
    selectorWidth.value = newLeftWidth
  }

  const onMouseUp = () => {
    isResizingRight.value = false
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

/** 获取机构列表 */
const getDeptList = async () => {
  deptLoading.value = true
  try {
    // 根据选中的地区获取机构列表
    const params: DeptPageParam = {
      pageNo: 1,
      pageSize: 100, // 获取所有机构
    }
    if (selectedRegionCode.value) {
      params.areaCode = selectedRegionCode.value
    }
    const data = await getDeptPage(params)
    deptList.value = data.list
  } finally {
    deptLoading.value = false
  }
}

/** 查询成员机构列表 */
const getList = async () => {
  loading.value = true
  try {
    // 如果有选中的牵头单位，则查询该单位的成员机构
    if (selectedMasterId.value) {
      queryParams.masterId = selectedMasterId.value
    }
    const data = await DeptCommunityApi.getDeptCommunityPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 处理地区被点击 */
const handleRegionNodeClick = async (row) => {
  // 使用 code 作为 selectedRegionId，因为新的地区树API返回的是code
  selectedRegionId.value = row.code
  selectedRegionCode.value = row.code
  queryParams.pageNo = 1 // 切换地区时重置为第一页

  // 刷新机构列表
  await getDeptList()
  // 清空选中的牵头单位和成员机构列表
  selectedMasterId.value = undefined
  selectedMasterDeptName.value = ''
  list.value = []
}

/** 清除地区选择 */
const handleClearRegion = () => {
  selectedRegionId.value = undefined
  selectedRegionCode.value = undefined
  queryParams.pageNo = 1
  // 清除树的选中状态
  regionTreeRef.value?.clearSelection()
  // 刷新机构列表（查询所有机构）
  getDeptList()
  // 清空选中的牵头单位和成员机构列表
  selectedMasterId.value = undefined
  selectedMasterDeptName.value = ''
  list.value = []
}

/** 处理机构行点击 */
const handleDeptRowClick = (row: DeptVO) => {
  selectedMasterId.value = row.id
  selectedMasterDeptName.value = row.name // 记录牵头单位名称用于显示
  // 重置查询参数并获取该机构的成员机构
  queryParams.pageNo = 1
  queryParams.masterId = row.id
  queryParams.memberId = undefined
  queryParams.sortNum = undefined
  getList()
}

/** 清除选中的牵头单位 */
const clearSelectedMaster = () => {
  selectedMasterId.value = undefined
  selectedMasterDeptName.value = ''
  // 重置查询参数
  queryParams.masterId = undefined
  queryParams.memberId = undefined
  queryParams.sortNum = undefined
  // 重新加载列表
  getList()
}

/** 搜索按钮操作 */
const handleQuery = () => {
  // 如果用户手动输入了牵头单位ID，取消选中的牵头单位
  if (queryParams.masterId) {
    selectedMasterId.value = undefined
    selectedMasterDeptName.value = ''
  }
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  // 如果有选中的牵头单位，保留它
  if (selectedMasterId.value) {
    queryParams.masterId = selectedMasterId.value
  } else {
    queryParams.masterId = undefined
  }
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
    await DeptCommunityApi.deleteDeptCommunity(id)
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
    const data = await DeptCommunityApi.exportDeptCommunity(queryParams)
    download.excel(data, '紧密医疗共同体.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getDeptList()
  // 初始加载成员机构列表
  getList()
})
</script>

<style scoped lang="scss">
.dept-community-page {
  height: calc(100vh - 140px); /* 减去头部导航和边距 */
  min-height: 600px; /* 最小高度保证内容可见 */
  overflow: hidden;
}

.dept-community-container {
  height: 100%;
  min-height: 600px;
  overflow: hidden;
}

.resize-handle {
  width: 4px;
  cursor: ew-resize;
  background: #e6e6e6;
  transition: background 0.3s;
  flex-shrink: 0;

  &:hover {
    background: #3399ff;
  }
}

.dept-name-cell {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
</style>
