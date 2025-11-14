<template>

  <div class="flex h-full">
    <!-- 左侧地区/机构树选择器 -->
<!--    <RegionOrgTree
      ref="regionOrgTreeRef"
      :style="{ width: selectorWidth + 'px', flexShrink: 0, height: '100%' }"
      :auto-select-first="false"
      :show-collapse-button="true"
      @node-click="handleNodeClick"
    />

    &lt;!&ndash; 拖拽分隔条 &ndash;&gt;
    <div
      class="resize-handle"
      @mousedown="startResize"
    ></div>-->

    <!-- 右侧内容区域 -->
    <div class="flex-1 ml-5 main-content">
      <!-- 当前选择的地区/机构信息 - 始终显示 -->
      <div class="mb-15px">
        <el-tag
          type="primary"
          size="large"
          class="selection-tag"
          :closable="!!selectedNode"
          @close="handleClearSelection"
        >
          <Icon
            :icon="selectedNode?.nodeType === 'org' ? 'ep:office-building' : 'ep:location'"
            class="mr-5px"
          />
          {{ getSelectionLabel() }}
        </el-tag>
      </div>
      <!-- 搜索 -->
      <ContentWrap>
        <el-form
          class="-mb-15px"
          :model="queryParams"
          ref="queryFormRef"
          :inline="true"
          label-width="68px"
        >
          <el-form-item label="用户身份" prop="nickname">
            <el-input
              v-model="queryParams.nickname"
              placeholder="请输入用户身份"
              clearable
              @keyup.enter="handleQuery"
              class="!w-240px"
            />
          </el-form-item>
          <el-form-item label="真实姓名" prop="realName">
            <el-input
              v-model="queryParams.realName"
              placeholder="请输入真实姓名"
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
              type="info"
              plain
              @click="handleDownloadTemplate"
            >
              <Icon icon="ep:document" /> 模板
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
            label="用户账号"
            align="center"
            prop="username"
            :show-overflow-tooltip="true"
          >
            <template #default="scope">
              <span class="font-bold">{{ scope.row.username }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="用户身份"
            align="center"
            prop="nickname"
            :show-overflow-tooltip="true"
          />
          <el-table-column
            label="真实姓名"
            align="center"
            prop="realName"
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
  <!-- 分配角色 -->
  <UserAssignRoleForm ref="assignRoleFormRef" @success="getList" />
  <!-- Excel预览弹窗 -->
  <ExcelPreviewDialog ref="excelPreviewRef" />
</template>
<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { DICT_TYPE, getIntDictOptions, getDictLabel } from '@/utils/dict'
import { checkPermi } from '@/utils/permission'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { CommonStatusEnum } from '@/utils/constants'
import * as UserApi from '@/api/system/user'
import UserForm from './UserForm.vue'
import UserAssignRoleForm from './UserAssignRoleForm.vue'
import RegionOrgTree from './RegionOrgTree.vue'
import ExcelPreviewDialog from '@/views/drug/import/batch/components/ExcelPreviewDialog.vue'

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
  nickname: undefined,
  mobile: undefined,
  status: undefined,
  deptIds: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const selectedNode = ref<any>(null) // 选中的节点（地区或机构）
const excelPreviewRef = ref() // Excel预览对话框引用

// 面板拖拽相关
const regionOrgTreeRef = ref()
const selectorWidth = ref(250) // 默认宽度设为最小宽度
const isResizing = ref(false)

/** 开始拖拽调整大小 */
const startResize = (e: MouseEvent) => {
  // 如果树处于折叠状态，禁用拖拽
  if (regionOrgTreeRef.value?.isCollapsed) {
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

/** 监听树折叠状态，自动调整宽度 */
watch(
  () => regionOrgTreeRef.value?.isCollapsed,
  (collapsed) => {
    if (collapsed) {
      selectorWidth.value = 50 // 折叠状态宽度 - 只显示展开按钮
    } else if (selectorWidth.value === 50) {
      selectorWidth.value = 250 // 恢复默认宽度
    }
  }
)

/** 获取选择标签文本 */
const getSelectionLabel = () => {
  if (!selectedNode.value) {
    return '全部用户'
  }

  if (selectedNode.value.nodeType === 'region') {
    // 地区节点
    const levelLabel = getDictLabel(DICT_TYPE.REGION_LEVEL, selectedNode.value.level)
    return `当前地区：${selectedNode.value.name}(${levelLabel || ''})`
  } else {
    // 机构节点
    return `当前机构：${selectedNode.value.name}`
  }
}

/** 处理节点被点击 */
const handleNodeClick = async (node: any) => {
  selectedNode.value = node

  if (node.nodeType === 'region') {
    // 点击地区节点：查询该地区下所有机构的用户
    // 这里需要获取该地区下所有机构的ID列表
    // 暂时使用 areaCode 查询（如果后端支持的话）
    queryParams.deptIds = undefined
    // TODO: 可以考虑添加 areaCode 参数到 queryParams
  } else if (node.nodeType === 'org') {
    // 点击机构节点：查询该机构的用户
    queryParams.deptIds = String(node.id)
  }

  // 刷新用户列表
  await getList()
}

/** 清除选择 */
const handleClearSelection = () => {
  selectedNode.value = null
  queryParams.deptIds = undefined
  // 清除树的选中状态
  regionOrgTreeRef.value?.clearSelection()
  // 刷新用户列表（查询所有用户）
  getList()
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
  // 重置选择
  selectedNode.value = null
  queryParams.deptIds = undefined
  // 清除树的选中状态
  regionOrgTreeRef.value?.clearSelection()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 用户导入：直接调起文件选择并上传 */
const handleImport = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xls,.xlsx,.csv'
  input.onchange = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) {
      return
    }

    const fileName = file.name.toLowerCase()
    const isSupported = fileName.endsWith('.xls') || fileName.endsWith('.xlsx') || fileName.endsWith('.csv')
    if (!isSupported) {
      message.error('仅支持上传 xls、xlsx 或 csv 格式文件')
      return
    }

    const loadingMsg = ElMessage({
      message: '正在导入用户数据，请稍候...',
      type: 'info',
      duration: 0
    })

    try {
      // 默认允许覆盖已有用户，保证重复导入不会直接失败
      const response = await UserApi.importUser(file, true)
      loadingMsg.close()

      const payload = response.data?.data ?? {}
      const successCount = payload.userSuccessCount ?? 0
      const failCount = payload.userFailCount ?? 0
      message.success(`用户导入完成：成功 ${successCount} 条，失败 ${failCount} 条`)

      if (
        failCount > 0 &&
        Array.isArray(payload.userFailMessages) &&
        payload.userFailMessages.length > 0
      ) {
        message.alert(payload.userFailMessages.join('\n'), '导入失败明细')
      }

      await getList()
    } catch (error: any) {
      loadingMsg.close()
      console.error('用户导入失败:', error)
      const errorMsg = error?.data?.msg || error?.message || '导入失败，请检查文件格式和内容'
      message.error(errorMsg)
    } finally {
      target.value = ''
    }
  }
  input.click()
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

/** 打开模板预览 */
const handleDownloadTemplate = () => {
  // 直接通过 code 打开预览对话框
  excelPreviewRef.value?.openByCode('USER_IMPORT_001')
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
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

// 选择标签美化
.selection-tag {
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

// 右侧内容区域 - 关键：限制宽度避免被表格撑开
.main-content {
  min-width: 0; // flex子元素必须设置，否则默认min-width: auto会导致内容溢出
  overflow-x: auto; // 横向滚动
}
</style>
