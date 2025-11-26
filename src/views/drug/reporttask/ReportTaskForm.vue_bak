<template>
  <div>
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="1000px">
      <div v-loading="formLoading" class="report-task-form-container">
      <!-- 基本信息卡片 -->
      <ContentWrap
        title="基本信息"
        header-icon="ep:info-filled"
        :collapsible="true"
        :default-collapsed="false"
        shadow="hover"
        class="config-section"
      >
        <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
          <el-form-item label="任务名称" prop="taskName">
            <el-input v-model="formData.taskName" placeholder="请输入任务名称" />
          </el-form-item>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="上报开始时间" prop="startDate">
                <el-date-picker
                  v-model="formData.startDate"
                  type="date"
                  value-format="x"
                  placeholder="选择开始时间"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="上报截止时间" prop="endDate">
                <el-date-picker
                  v-model="formData.endDate"
                  type="date"
                  value-format="x"
                  placeholder="选择截止时间"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="任务描述" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="请输入任务描述"
            />
          </el-form-item>
        </el-form>
      </ContentWrap>

      <!-- 可填报机构选择器 -->
      <ContentWrap
        :title="`可填报机构（已选机构 ${selectedOrgCount} 个）`"
        header-icon="ep:office-building"
        :collapsible="true"
        :default-collapsed="false"
        shadow="hover"
        class="config-section"
      >
        <template #header>
          <div class="org-header-actions">
            <el-button size="small" type="primary" @click.stop="openOrgSelector">
              <Icon icon="ep:setting" class="mr-1" />
              配置机构
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click.stop="clearAllOrgs"
              :disabled="selectedOrgCount === 0"
            >
              <Icon icon="ep:delete" class="mr-1" />
              清空选择
            </el-button>
          </div>
        </template>

        <div class="org-summary">
          <!-- 搜索栏 -->
          <div v-if="selectedOrgCount > 0" class="org-search-bar">
            <el-input
              v-model="orgSearchKeyword"
              placeholder="搜索机构名称、地区..."
              clearable
              prefix-icon="ep:search"
              size="default"
              class="org-search-input"
            />
          </div>

          <div class="selected-orgs-table-wrapper">
            <el-table
              :data="filteredOrgDetails"
              border
              size="small"
              row-key="id"
              class="selected-orgs-table"
              height="320"
            >
              <el-table-column
                prop="name"
                label="机构名称"
                min-width="220"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <span class="org-name-bold">{{ row.name }}</span>
                </template>
              </el-table-column>
              <el-table-column label="所属地区" min-width="200">
                <template #default="{ row }">
                  {{ row.regionPathName || row.regionName || row.areaName || '—' }}
                </template>
              </el-table-column>
              <el-table-column label="等级" min-width="120" align="center">
                <template #default="{ row }">
                  <dict-tag
                    :type="DICT_TYPE.INSTITUTION_LEVEL"
                    :value="row.hospitalLevel"
                    size="small"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button type="danger" size="small" @click="handleRemoveOrg(row.id)">
                    <Icon icon="ep:delete" class="mr-1" />
                    移除
                  </el-button>
                </template>
              </el-table-column>
              <template #empty>
                <div class="empty-org-state">
                  <Icon icon="ep:office-building" class="empty-icon" />
                  <p v-if="orgSearchKeyword">未找到匹配的机构</p>
                  <p v-else>暂未选择任何机构</p>
                  <p v-if="!orgSearchKeyword" class="hint">
                    点击「配置机构」按钮选择可填报的医疗机构
                  </p>
                </div>
              </template>
            </el-table>
          </div>

          <!-- 统计信息 -->
          <div v-if="selectedOrgCount > 0 && orgSearchKeyword" class="org-search-result">
            <el-tag size="small" type="info">
              显示 {{ filteredOrgDetails.length }} / {{ selectedOrgCount }} 个机构
            </el-tag>
          </div>
        </div>
        </ContentWrap>
      </div>
      <template #footer>
        <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
        <el-button @click="dialogVisible = false">取 消</el-button>
      </template>
    </Dialog>

    <ReportTaskOrgSelector
      v-model="orgSelectorVisible"
      :selected-ids="selectedOrgIds"
      :selected-details="selectedOrgsDetail"
      @confirm="handleOrgSelectorConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, reactive, ref } from 'vue'
import { DICT_TYPE } from '@/utils/dict'
import type { ReportTaskVO } from '@/api/drug/reporttask'
import { ReportTaskApi } from '@/api/drug/reporttask'
import { Icon } from '@/components/Icon'
import { ContentWrap } from '@/components/ContentWrap'
import * as DeptApi from '@/api/system/dept'
import { useMessage } from '@/hooks/web/useMessage'

const ReportTaskOrgSelector = defineAsyncComponent(
  () => import('./components/ReportTaskOrgSelector.vue') as Promise<any>
)

/** 填报任务设置 表单 */
defineOptions({ name: 'ReportTaskForm' })
const emit = defineEmits(['success'])
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  taskName: undefined,
  startDate: undefined,
  endDate: undefined,
  description: undefined,
  reportableOrgs: undefined
})
const formRules = reactive({
  taskName: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
  startDate: [{ required: true, message: '上报开始时间不能为空', trigger: 'blur' }],
  endDate: [{ required: true, message: '上报截止时间不能为空', trigger: 'blur' }]
})

const formRef = ref() // 表单 Ref

// 机构选择器弹窗相关
const orgSelectorVisible = ref(false) // 机构选择器弹窗是否显示
const selectedOrgIds = ref<number[]>([]) // 当前选中的机构ID列表
const selectedOrgsDetail = ref<any[]>([]) // 当前选中的机构详情
const orgSearchKeyword = ref('') // 机构搜索关键字

// 计算属性：已选择机构数量
const selectedOrgCount = computed(() => selectedOrgIds.value.length)

// 计算属性：根据搜索关键字过滤机构列表
const filteredOrgDetails = computed(() => {
  if (!orgSearchKeyword.value) {
    return selectedOrgsDetail.value
  }
  const keyword = orgSearchKeyword.value.toLowerCase()
  return selectedOrgsDetail.value.filter((org) => {
    const name = org.name?.toLowerCase() || ''
    const regionName = org.regionName?.toLowerCase() || ''
    const areaName = org.areaName?.toLowerCase() || ''
    const regionPath = org.regionPath?.toLowerCase() || ''
    const regionPathName = org.regionPathName?.toLowerCase() || ''
    return (
      name.includes(keyword) ||
      regionName.includes(keyword) ||
      areaName.includes(keyword) ||
      regionPath.includes(keyword) ||
      regionPathName.includes(keyword)
    )
  })
})

const mergeOrgDetails = (ids: number[], details: any[] = []) => {
  const detailMap = new Map<number, any>()
  // 先放入新的详情
  details.forEach((item) => {
    if (item && typeof item.id === 'number') {
      detailMap.set(item.id, item)
    }
  })
  // 再补充旧的详情，避免丢失
  selectedOrgsDetail.value.forEach((item) => {
    if (item && typeof item.id === 'number' && !detailMap.has(item.id)) {
      detailMap.set(item.id, item)
    }
  })

  return ids.map((id) => detailMap.get(id)).filter(Boolean)
}

const handleRemoveOrg = (orgId: number) => {
  selectedOrgIds.value = selectedOrgIds.value.filter((id) => id !== orgId)
  selectedOrgsDetail.value = selectedOrgsDetail.value.filter((item) => item.id !== orgId)
}

const clearAllOrgs = () => {
  if (selectedOrgIds.value.length === 0) {
    return
  }
  selectedOrgIds.value = []
  selectedOrgsDetail.value = []
  message.success('已清空所有选定机构')
}

const openOrgSelector = () => {
  orgSelectorVisible.value = true
}

type OrgSelectorConfirmPayload = {
  ids: number[]
  details: any[]
}

const handleOrgSelectorConfirm = (payload: OrgSelectorConfirmPayload) => {
  const { ids, details } = payload
  selectedOrgIds.value = [...ids]
  selectedOrgsDetail.value = mergeOrgDetails(ids, details)
  orgSelectorVisible.value = false
  if (ids.length > 0) {
    message.success(`成功选择 ${ids.length} 个机构`)
  }
}

// 根据机构ID列表获取机构详情（用于编辑状态下的回显）
const loadOrgDetailsByIds = async (orgIds: number[]) => {
  if (!orgIds || orgIds.length === 0) {
    selectedOrgsDetail.value = []
    return
  }

  try {
    const tasks = orgIds.map(async (id) => {
      try {
        const orgDetail = await DeptApi.getDept(id)
        return {
          id: orgDetail.id,
          name: orgDetail.name,
          hospitalLevel: orgDetail.hospitalLevel,
          regionName: orgDetail.regionName,
          areaName: orgDetail.areaName,
          regionPath: orgDetail.regionPath,
          regionPathName: orgDetail.regionPathName || '', // 区域路径中文名称
          address: orgDetail.address || '',
          contactPerson: orgDetail.contactPerson || '',
          contactPhone: orgDetail.contactPhone || ''
        }
      } catch (error) {
        console.warn(`获取机构 ${id} 详情失败:`, error)
        return {
          id,
          name: `机构ID: ${id}`,
          hospitalLevel: '',
          regionName: '',
          areaName: '',
          regionPath: '',
          regionPathName: '',
          address: '',
          contactPerson: '',
          contactPhone: ''
        }
      }
    })

    const details = await Promise.all(tasks)
    selectedOrgsDetail.value = mergeOrgDetails(orgIds, details)
  } catch (error) {
    console.error('批量获取机构详情失败:', error)
    selectedOrgsDetail.value = mergeOrgDetails(orgIds)
  }
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增填报任务' : '编辑填报任务'
  formType.value = type
  resetForm()

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await ReportTaskApi.getReportTask(id)
      Object.assign(formData.value, data)

      // 如果有选择的机构，设置到selectedOrgIds中并加载详情
      if (data.reportableOrgs) {
        const deptIds = data.reportableOrgs
          .split(',')
          .map((id) => parseInt(id.trim()))
          .filter((id) => !isNaN(id))
        selectedOrgIds.value = [...deptIds]
        // 加载选中机构的详细信息用于回显
        await loadOrgDetailsByIds(deptIds)
      }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const submitForm = async () => {
  // 先保证有机构已配置
  if (selectedOrgCount.value === 0) {
    message.warning('请先配置可填报机构！')
    return
  }

  // 二次确认对话
  const confirmed = await message
    .confirm('确认后将会给配置的机构新增填报任务，且不可再修改。是否继续？', '提示')
    .catch(() => false)
  if (!confirmed) return

  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => {})
  if (!valid) return

  // 提交请求
  formLoading.value = true
  try {
    const data: Partial<ReportTaskVO> = { ...formData.value }

    // 处理可填报机构ID列表
    data.reportableOrgs = selectedOrgIds.value.join(',')

    if (formType.value === 'create') {
      await ReportTaskApi.createReportTask(data as ReportTaskVO)
      message.success('创建成功')
    } else {
      await ReportTaskApi.updateReportTask(data as ReportTaskVO)
      message.success('更新成功')
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    taskName: undefined,
    startDate: undefined,
    endDate: undefined,
    description: undefined,
    reportableOrgs: undefined
  }

  // 重置机构相关状态
  selectedOrgIds.value = []
  selectedOrgsDetail.value = []
  orgSearchKeyword.value = '' // 重置搜索关键字

  // 重置机构选择器弹窗状态
  orgSelectorVisible.value = false

  formRef.value?.resetFields()
}
</script>

<style scoped lang="scss">
// 表单容器
.report-task-form-container {
  max-height: 75vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 4px;
  // 预留滚动条空间，避免内容挤压
  scrollbar-gutter: stable;

  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 0, 0, 0.2);
    }
  }
}

// 配置区块样式 - ContentWrap 组件
.config-section {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.org-header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.org-summary {
  min-height: 160px;

  // 搜索栏样式
  .org-search-bar {
    margin-bottom: 12px;

    .org-search-input {
      :deep(.el-input__wrapper) {
        border-radius: 8px;
        transition: all 0.3s ease;

        &:hover,
        &.is-focus {
          box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.3) inset;
        }
      }
    }
  }

  // 搜索结果统计
  .org-search-result {
    margin-top: 8px;
    text-align: right;
  }

  .empty-org-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--el-text-color-secondary);
    padding: 48px 0;

    .empty-icon {
      font-size: 52px;
      margin-bottom: 16px;
      color: var(--el-border-color-darker);
    }

    .hint {
      font-size: 14px;
      color: var(--el-text-color-placeholder);
    }
  }

  .selected-orgs-table-wrapper {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
    background: var(--el-bg-color);

    :deep(.el-table__inner-wrapper) {
      border-radius: 0;
    }

    :deep(.el-table__header) {
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.08), rgba(99, 102, 241, 0.08));
    }

    // 表格主体区域 - 固定高度，自动滚动
    :deep(.el-table__body-wrapper) {
      overflow-y: auto !important;

      // 自定义滚动条样式
      &::-webkit-scrollbar {
        width: 8px;
      }

      &::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.15);
        border-radius: 4px;

        &:hover {
          background: rgba(0, 0, 0, 0.25);
        }
      }
    }

    :deep(.el-table__row) {
      transition: background 0.2s ease;

      &:hover > td.el-table__cell {
        background: rgba(59, 130, 246, 0.08) !important;
      }
    }

    :deep(.el-table__cell) {
      padding: 12px 16px;
    }

    :deep(.el-table__empty-block) {
      min-height: 160px;
    }
  }
}

// 表单样式优化
:deep(.el-input__wrapper) {
  border-radius: 6px;
  transition: all 0.3s ease;
}

:deep(.el-textarea__inner) {
  border-radius: 6px;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 6px;
}

// 按钮样式
:deep(.el-button) {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

// 标签样式
:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
}

// 加载遮罩
:deep(.el-loading-mask) {
  border-radius: 8px;
  backdrop-filter: blur(2px);
}

// 机构名称加粗
.org-name-bold {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
