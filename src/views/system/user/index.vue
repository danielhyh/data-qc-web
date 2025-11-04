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
                  <div class="org-user-count">
                    <Icon icon="ep:user" class="user-icon" />
                    {{ org.userCount || 0 }}
                  </div>
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
    <div class="flex-1 ml-5 main-content">
      <!-- 搜索 -->
      <ContentWrap>
        <el-form
          class="-mb-15px"
          :model="queryParams"
          ref="queryFormRef"
          :inline="true"
          label-width="68px"
        >
          <el-form-item label="用户名称" prop="username">
            <el-input
              v-model="queryParams.username"
              placeholder="请输入用户名称"
              clearable
              @keyup.enter="handleQuery"
              class="!w-240px"
            />
          </el-form-item>
          <el-form-item label="手机号码" prop="mobile">
            <el-input
              v-model="queryParams.mobile"
              placeholder="请输入手机号码"
              clearable
              @keyup.enter="handleQuery"
              class="!w-240px"
            />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select
              v-model="queryParams.status"
              placeholder="请选择用户状态"
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
          <el-form-item label="创建时间" prop="createTime">
            <el-date-picker
              v-model="queryParams.createTime"
              value-format="YYYY-MM-DD HH:mm:ss"
              type="datetimerange"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              class="!w-240px"
            />
          </el-form-item>
          <el-form-item>
            <el-button @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
            <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
            <el-button
              type="primary"
              @click="openForm('create')"
              v-hasPermi="['system:user:create']"
            >
              <Icon icon="ep:plus" /> 新增
            </el-button>
            <el-button
              type="warning"
              @click="handleImport"
              v-hasPermi="['system:user:import']"
            >
              <Icon icon="ep:upload" /> 导入
            </el-button>
            <el-button
              type="success"
              @click="handleExport"
              :loading="exportLoading"
              v-hasPermi="['system:user:export']"
            >
              <Icon icon="ep:download" />导出
            </el-button>
          </el-form-item>
        </el-form>
      </ContentWrap>
      <ContentWrap>
        <el-table v-loading="loading" :data="list">
          <el-table-column label="用户编号" align="center" key="id" prop="id" />
          <el-table-column
            label="用户名称"
            align="center"
            prop="username"
            :show-overflow-tooltip="true"
          >
            <template #default="scope">
              <span class="font-bold">{{ scope.row.username }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="用户昵称"
            align="center"
            prop="nickname"
            :show-overflow-tooltip="true"
          />
          <el-table-column
            label="部门"
            align="center"
            key="deptName"
            prop="deptName"
            :show-overflow-tooltip="true"
          />
          <el-table-column label="手机号码" align="center" prop="mobile" width="120" />
          <el-table-column label="状态" key="status">
            <template #default="scope">
              <el-switch
                v-model="scope.row.status"
                :active-value="0"
                :inactive-value="1"
                @change="handleStatusChange(scope.row)"
                :disabled="!checkPermi(['system:user:update'])"
              />
            </template>
          </el-table-column>
          <el-table-column
            label="创建时间"
            align="center"
            prop="createTime"
            :formatter="dateFormatter"
            width="180"
          />
          <el-table-column label="操作" align="center" width="200" fixed="right">
            <template #default="scope">
              <div class="flex items-center justify-center gap-2">
                <el-button
                  type="primary"
                  plain
                  size="small"
                  @click="openForm('update', scope.row.id)"
                  v-hasPermi="['system:user:update']"
                >
                  <Icon icon="ep:edit" class="mr-5px" />
                  修改
                </el-button>
                <el-dropdown
                  @command="(command) => handleCommand(command, scope.row)"
                  v-hasPermi="[
                    'system:user:delete',
                    'system:user:update-password',
                    'system:permission:assign-user-role'
                  ]"
                >
                  <el-button type="info" size="small">
                    <Icon icon="ep:arrow-down" class="mr-5px" />
                    更多
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        command="handleDelete"
                        v-if="checkPermi(['system:user:delete'])"
                      >
                        <Icon icon="ep:delete" class="mr-5px" />
                        删除
                      </el-dropdown-item>
                      <el-dropdown-item
                        command="handleResetPwd"
                        v-if="checkPermi(['system:user:update-password'])"
                      >
                        <Icon icon="ep:key" class="mr-5px" />
                        重置密码
                      </el-dropdown-item>
                      <el-dropdown-item
                        command="handleRole"
                        v-if="checkPermi(['system:permission:assign-user-role'])"
                      >
                        <Icon icon="ep:circle-check" class="mr-5px" />
                        分配角色
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <Pagination
          :total="total"
          v-model:page="queryParams.pageNo"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
        />
      </ContentWrap>
    </div>
  </div>

  <!-- 添加或修改用户对话框 -->
  <UserForm ref="formRef" @success="getList" />
  <!-- 用户导入对话框 -->
  <UserImportForm ref="importFormRef" @success="getList" />
  <!-- 分配角色 -->
  <UserAssignRoleForm ref="assignRoleFormRef" @success="getList" />
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { checkPermi } from '@/utils/permission'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { CommonStatusEnum } from '@/utils/constants'
import * as UserApi from '@/api/system/user'
import * as AreaOrgApi from '@/api/system/areaOrg'
import UserForm from './UserForm.vue'
import UserImportForm from './UserImportForm.vue'
import UserAssignRoleForm from './UserAssignRoleForm.vue'
import RegionTree from './RegionTree.vue'

defineOptions({ name: 'SystemUser' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  username: undefined,
  mobile: undefined,
  status: undefined,
  deptIds: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const selectedRegionId = ref<number | undefined>() // 选中的地区ID
const selectedOrgIds = ref<number[]>([]) // 选中的机构ID列表
const orgList = ref<AreaOrgApi.OrgItem[]>([]) // 机构列表
const orgLoading = ref(false) // 机构加载状态
const orgSearchText = ref('') // 机构搜索文本
const filteredOrgList = ref<AreaOrgApi.OrgItem[]>([]) // 过滤后的机构列表

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

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await UserApi.getUserPage(queryParams)
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
  return text.length > 3
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
  // 刷新用户列表
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

  // 刷新用户列表
  getList()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 用户导入 */
const importFormRef = ref()
const handleImport = () => {
  importFormRef.value.open()
}

/** 修改用户状态 */
const handleStatusChange = async (row: UserApi.UserVO) => {
  try {
    // 修改状态的二次确认
    const text = row.status === CommonStatusEnum.ENABLE ? '启用' : '停用'
    await message.confirm('确认要"' + text + '""' + row.username + '"用户吗?')
    // 发起修改状态
    await UserApi.updateUserStatus(row.id, row.status)
    // 刷新列表
    await getList()
  } catch {
    // 取消后，进行恢复按钮
    row.status =
      row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  }
}

/** 导出按钮操作 */
const exportLoading = ref(false)
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await UserApi.exportUser(queryParams)
    download.excel(data, '用户数据.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 操作分发 */
const handleCommand = (command: string, row: UserApi.UserVO) => {
  switch (command) {
    case 'handleDelete':
      handleDelete(row.id)
      break
    case 'handleResetPwd':
      handleResetPwd(row)
      break
    case 'handleRole':
      handleRole(row)
      break
    default:
      break
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await UserApi.deleteUser(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 重置密码 */
const handleResetPwd = async (row: UserApi.UserVO) => {
  try {
    // 重置的二次确认
    const result = await message.prompt(
      '请输入"' + row.username + '"的新密码',
      t('common.reminder')
    )
    const password = result.value
    // 发起重置
    await UserApi.resetUserPassword(row.id, password)
    message.success('修改成功，新密码是：' + password)
  } catch {}
}

/** 分配角色 */
const assignRoleFormRef = ref()
const handleRole = (row: UserApi.UserVO) => {
  assignRoleFormRef.value.open(row)
}

/** 初始化 */
onMounted(() => {
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
    overflow: hidden; // 添加溢出隐藏
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
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

    .org-user-count {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      flex-shrink: 0;

      .user-icon {
        font-size: 14px;
      }
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

// 右侧内容区域 - 关键：限制宽度避免被表格撑开
.main-content {
  min-width: 0; // flex子元素必须设置，否则默认min-width: auto会导致内容溢出
  overflow-x: auto; // 横向滚动
}
</style>
