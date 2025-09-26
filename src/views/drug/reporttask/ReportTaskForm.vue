<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
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
        <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入任务描述" />
      </el-form-item>
    </el-form>

    <!-- 可填报机构选择器 -->
    <el-card shadow="never" class="org-selector-card">
      <template #header>
        <div class="card-header">
          <span>可填报机构</span>
          <div class="header-actions">
            <el-button size="small" @click="openOrgSelector">
              <Icon icon="ep:setting" class="mr-1" />
              配置机构
            </el-button>
            <el-button size="small" @click="clearAllOrgs" :disabled="selectedOrgCount === 0">
              <Icon icon="ep:delete" class="mr-1" />
              清空选择
            </el-button>
          </div>
        </div>
      </template>

      <div class="org-summary">
        <div v-if="selectedOrgCount === 0" class="empty-org-state">
          <Icon icon="ep:office-building" class="empty-icon" />
          <p>暂未选择任何机构</p>
          <p class="hint">点击"配置机构"按钮选择可填报的医疗机构</p>
        </div>
        <div v-else class="selected-orgs-list">
          <div class="org-summary-header">
            <el-tag type="success" size="large" class="org-count-tag">
              已选择 {{ selectedOrgCount }} 个机构
            </el-tag>
            <el-link type="primary" @click="openOrgSelector" class="view-detail">
              重新配置 <Icon icon="ep:edit" />
            </el-link>
          </div>

          <!-- 简化的机构列表 -->
          <div class="org-list-container">
            <div class="org-grid">
              <div
                v-for="org in selectedOrgsDetail.slice(0, 12)"
                :key="org.id"
                class="org-card"
              >
                <div class="org-header">
                  <span class="org-name" :title="org.name">{{ org.name }}</span>
                  <dict-tag
                    :type="DICT_TYPE.INSTITUTION_LEVEL"
                    :value="org.hospitalLevel"
                    size="small"
                  />
                </div>
              </div>
            </div>

            <!-- 如果选中机构超过12个，显示"更多"提示 -->
            <div v-if="selectedOrgsDetail.length > 12" class="more-orgs-tip">
              <Icon icon="ep:more" />
              还有 {{ selectedOrgsDetail.length - 12 }} 个机构，点击"重新配置"查看全部
            </div>
          </div>
        </div>
      </div>
    </el-card>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>

  <!-- 机构选择器弹窗 -->
  <el-dialog
    v-model="orgSelectorVisible"
    title="选择可填报机构"
    width="1200px"
    :close-on-click-modal="false"
  >
    <div class="org-selector-container">
      <el-row :gutter="12">
        <!-- 左侧：地区树 -->
        <el-col :span="10">
          <el-card shadow="never" class="selector-card">
            <template #header>
              <div class="card-header">
                <span>选择地区</span>
              </div>
            </template>
            <el-tree
              ref="areaTreeRef"
              :data="areaTreeData"
              :props="areaTreeProps"
              node-key="code"
              highlight-current
              default-expand-all
              @node-click="handleAreaNodeClick"
            >
              <template #default="{ node, data }">
                <span class="tree-node">
                  <Icon :icon="getAreaIcon(data.level)" class="node-icon" />
                  <span class="node-label">
                    {{ node.label }}
                    <span v-if="data.orgCount !== undefined" class="org-count">({{ data.orgCount }})</span>
                  </span>
                </span>
              </template>
            </el-tree>
          </el-card>
        </el-col>

        <!-- 右侧：机构树 -->
        <el-col :span="14">
          <el-card shadow="never" class="selector-card">
            <template #header>
              <div class="card-header">
                <span>选择机构</span>
                <div class="header-actions">
                  全选/全不选:
                  <el-switch
                    v-model="treeNodeAll"
                    active-text="是"
                    inactive-text="否"
                    inline-prompt
                    @change="handleCheckedTreeNodeAll()"
                    :disabled="!selectedArea"
                  />
                  全部展开/折叠:
                  <el-switch
                    v-model="deptExpand"
                    active-text="展开"
                    inactive-text="折叠"
                    inline-prompt
                    @change="handleCheckedTreeExpand"
                    :disabled="!selectedArea"
                  />
                  父子联动:
                  <el-switch
                    v-model="checkStrictly"
                    active-text="是"
                    inactive-text="否"
                    inline-prompt
                    :disabled="!selectedArea"
                  />
                </div>
              </div>
            </template>

            <!-- 机构等级多选框 -->
            <div v-if="selectedArea" class="institution-level-filter">
              <span class="filter-label">机构等级筛选：</span>
              <el-checkbox-group v-model="selectedInstitutionLevels" @change="handleInstitutionLevelChange">
                <el-checkbox
                  v-for="dict in getIntDictOptions(DICT_TYPE.INSTITUTION_LEVEL)"
                  :key="dict.value"
                  :value="dict.value"
                  border
                  size="small"
                  class="level-checkbox"
                >
                  {{ dict.label }}
                </el-checkbox>
              </el-checkbox-group>
            </div>

            <div v-if="!selectedArea" class="empty-state">
              <Icon icon="ep:pointer" class="empty-icon" />
              <p>请先选择左侧地区</p>
            </div>

            <el-tree
              v-else
              ref="treeRef"
              :check-strictly="!checkStrictly"
              :data="filteredDeptOptions"
              :props="defaultProps"
              :default-expand-all="deptExpand"
              empty-text="该地区暂无机构"
              node-key="id"
              show-checkbox
            >
              <template #default="{ node, data }">
                <div class="dept-node">
                  <span>{{ node.label }}</span>
                  <dict-tag
                    :type="DICT_TYPE.INSTITUTION_LEVEL"
                    :value="data.hospitalLevel"
                    class="ml-2"
                  />
                </div>
              </template>
            </el-tree>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <template #footer>
      <el-button @click="confirmOrgSelection" type="primary">确定选择</el-button>
      <el-button @click="orgSelectorVisible = false">取消</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { ReportTaskApi, ReportTaskVO } from '@/api/drug/reporttask'
import { Icon } from '@/components/Icon'
import * as DeptApi from '@/api/system/dept'
import * as RegionsApi from '@/api/system/regions'
import { defaultProps, handleTree } from '@/utils/tree'

/** 填报任务设置 表单 */
defineOptions({ name: 'ReportTaskForm' })

const { t } = useI18n() // 国际化
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
  reportableOrgs: undefined,
})
const formRules = reactive({
  taskName: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
  startDate: [{ required: true, message: '上报开始时间不能为空', trigger: 'blur' }],
  endDate: [{ required: true, message: '上报截止时间不能为空', trigger: 'blur' }],
})

// 部门树相关
const deptOptions = ref<any[]>([]) // 原始部门树形结构
const filteredDeptOptions = ref<any[]>([]) // 过滤后的部门树形结构
const deptExpand = ref(true) // 展开/折叠
const treeRef = ref() // 部门树组件 Ref
const treeNodeAll = ref(false) // 全选/全不选
const checkStrictly = ref(true) // 是否严格模式，即父子不关联

// 地区树相关
const areaTreeRef = ref() // 地区树组件 Ref
const areaTreeData = ref<any[]>([]) // 地区树形结构
const selectedArea = ref<any>(null) // 选中的地区

const areaTreeProps = {
  label: 'name',
  children: 'children'
}

// 机构等级筛选相关
const selectedInstitutionLevels = ref<number[]>([]) // 选中的机构等级

// 机构选择器弹窗相关
const orgSelectorVisible = ref(false) // 机构选择器弹窗是否显示
const selectedOrgIds = ref<number[]>([]) // 当前选中的机构ID列表

// 计算属性：已选择机构数量
const selectedOrgCount = computed(() => selectedOrgIds.value.length)

// 用于存储已选中机构的详细信息（用于编辑状态下的回显）
const selectedOrgsCache = ref<any[]>([])

// 计算属性：选中的机构详情列表
const selectedOrgsDetail = computed(() => {
  if (selectedOrgIds.value.length === 0) return []

  // 从树形数据中递归查找选中的机构详情
  const findOrgInTree = (nodes: any[], targetIds: number[]): any[] => {
    const result: any[] = []

    for (const node of nodes) {
      if (targetIds.includes(node.id)) {
        result.push({
          id: node.id,
          name: node.name,
          hospitalLevel: node.hospitalLevel,
          address: node.address || '',
          contactPerson: node.contactPerson || '',
          contactPhone: node.contactPhone || ''
        })
      }

      // 递归查找子节点
      if (node.children && node.children.length > 0) {
        const childResults = findOrgInTree(node.children, targetIds)
        result.push(...childResults)
      }
    }

    return result
  }

  // 优先从deptOptions中查找，如果找不到则使用缓存数据
  const foundOrgs = findOrgInTree(deptOptions.value, selectedOrgIds.value)
  if (foundOrgs.length > 0) {
    return foundOrgs
  }

  // 如果没有在当前树中找到，使用缓存的机构信息（编辑状态下的回显）
  return selectedOrgsCache.value.filter(org => selectedOrgIds.value.includes(org.id))
})
const formRef = ref() // 表单 Ref

// 获取区域图标
const getAreaIcon = (level: number) => {
  const icons = {
    1: 'ep:location',     // 省
    2: 'ep:map-location', // 市
    3: 'ep:place'         // 区
  }
  return icons[level] || 'ep:location'
}

// 处理地区节点点击
const handleAreaNodeClick = async (data: any) => {
  selectedArea.value = data

  // 切换地区时，重置相关状态
  selectedInstitutionLevels.value = []
  treeNodeAll.value = false

  // 加载该地区的机构数据
  await loadDeptData(data.code)

  // 在数据加载完成后，设置已选中的机构状态
  setTimeout(() => {
    if (selectedOrgIds.value.length > 0 && treeRef.value) {
      treeRef.value.setCheckedKeys(selectedOrgIds.value)
    }
  }, 200)
}

// 加载机构数据
const loadDeptData = async (areaCode: string) => {
  try {
    // 根据地区代码查询该地区下的机构数据
    const data = await DeptApi.getDeptPage({ areaCode, pageSize: 1000 })
    deptOptions.value = handleTree(data.list || data)

    // 应用机构等级筛选
    applyInstitutionLevelFilter()
  } catch (error) {
    console.error('加载机构数据失败:', error)
    deptOptions.value = []
    filteredDeptOptions.value = []
  }
}

// 处理机构等级变化
const handleInstitutionLevelChange = () => {
  applyInstitutionLevelFilter()
}

// 应用机构等级筛选
const applyInstitutionLevelFilter = () => {
  if (selectedInstitutionLevels.value.length === 0) {
    // 如果没有选择等级，显示所有机构
    filteredDeptOptions.value = deptOptions.value
  } else {
    // 筛选指定等级的机构
    filteredDeptOptions.value = filterTreeByLevel(deptOptions.value, selectedInstitutionLevels.value)
  }

  // 筛选后重新设置选中状态
  nextTick(() => {
    if (selectedOrgIds.value.length > 0 && treeRef.value) {
      treeRef.value.setCheckedKeys(selectedOrgIds.value)
    }
  })
}

// 递归筛选树节点
const filterTreeByLevel = (nodes: any[], levels: number[]): any[] => {
  const levelStrings = levels.map(l => l.toString()) // 转换为字符串数组进行比较

  return nodes.filter(node => {
    // 如果当前节点匹配等级条件，保留
    const nodeLevel = node.hospitalLevel
    if (nodeLevel !== undefined && nodeLevel !== null) {
      // 支持数字和字符串类型的hospitalLevel比较
      const nodeLevelStr = nodeLevel.toString()
      if (levels.includes(nodeLevel) || levelStrings.includes(nodeLevelStr)) {
        return true
      }
    }

    // 如果有子节点，递归筛选子节点
    if (node.children && node.children.length > 0) {
      const filteredChildren = filterTreeByLevel(node.children, levels)
      if (filteredChildren.length > 0) {
        // 如果有符合条件的子节点，保留当前节点但更新子节点
        return { ...node, children: filteredChildren }
      }
    }

    return false
  }).map(node => {
    if (node.children && node.children.length > 0) {
      return { ...node, children: filterTreeByLevel(node.children, levels) }
    }
    return node
  })
}

// 根据机构ID列表获取机构详情（用于编辑状态下的回显）
const loadOrgDetailsByIds = async (orgIds: number[]) => {
  if (!orgIds || orgIds.length === 0) {
    selectedOrgsCache.value = []
    return
  }

  try {
    // 批量查询机构详情
    const promises = orgIds.map(async (id) => {
      try {
        const orgDetail = await DeptApi.getDept(id)
        return {
          id: orgDetail.id,
          name: orgDetail.name,
          hospitalLevel: orgDetail.hospitalLevel,
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
          address: '',
          contactPerson: '',
          contactPhone: ''
        }
      }
    })

    const orgDetails = await Promise.all(promises)
    selectedOrgsCache.value = orgDetails.filter(org => org !== null)
  } catch (error) {
    console.error('批量获取机构详情失败:', error)
    selectedOrgsCache.value = []
  }
}

// 初始化地区树数据
const initAreaTree = async () => {
  try {
    // 调用真实的地区树API
    const data = await RegionsApi.RegionsApi.getRegionsTreeWithOrgCount()
    areaTreeData.value = data || []
  } catch (error) {
    console.error('初始化地区树失败:', error)
    areaTreeData.value = []
  }
}

// 打开机构选择器弹窗
const openOrgSelector = async () => {
  orgSelectorVisible.value = true

  // 初始化地区树（如果还没有加载）
  if (areaTreeData.value.length === 0) {
    await initAreaTree()
  }

  // 默认选择顶级节点(610000)并加载所有机构数据
  if (areaTreeData.value.length > 0) {
    // 查找陕西省节点 (610000)
    const findTopLevelNode = (nodes: any[]): any => {
      for (const node of nodes) {
        if (node.code === '610000') {
          return node
        }
        if (node.children && node.children.length > 0) {
          const found = findTopLevelNode(node.children)
          if (found) return found
        }
      }
      return nodes[0] // 如果找不到610000，使用第一个节点
    }

    const topLevelNode = findTopLevelNode(areaTreeData.value)
    if (topLevelNode) {
      selectedArea.value = topLevelNode
      // 加载该地区的机构数据
      await loadDeptData(topLevelNode.code)

      // 在地区树中高亮选中的节点
      nextTick(() => {
        if (areaTreeRef.value) {
          areaTreeRef.value.setCurrentKey(topLevelNode.code)
        }
      })
    }
  }

  // 如果当前有选中的机构，需要在树组件中设置选中状态
  // 使用更长的延迟确保树组件完全渲染
  setTimeout(() => {
    if (selectedOrgIds.value.length > 0 && treeRef.value) {
      // 先清除已有的选中状态
      treeRef.value.setCheckedKeys([])
      // 再设置新的选中状态
      treeRef.value.setCheckedKeys(selectedOrgIds.value)
      console.log('设置选中机构ID:', selectedOrgIds.value)
    }
  }, 800) // 增加延迟时间确保数据加载完成
}

// 清空所有机构选择
const clearAllOrgs = () => {
  selectedOrgIds.value = []
  treeRef.value?.setCheckedNodes([])
  treeNodeAll.value = false
}

// 确认机构选择
const confirmOrgSelection = () => {
  // 获取当前选中的机构ID列表
  const checkedKeys = treeRef.value?.getCheckedKeys(false) || []
  selectedOrgIds.value = [...checkedKeys]

  // 关闭弹窗
  orgSelectorVisible.value = false

  // 显示选择结果提示
  if (checkedKeys.length > 0) {
    message.success(`成功选择 ${checkedKeys.length} 个机构`)
  }
}

/** 全选/全不选 */
const handleCheckedTreeNodeAll = () => {
  if (!selectedArea.value) return
  treeRef.value.setCheckedNodes(treeNodeAll.value ? filteredDeptOptions.value : [])
}

/** 展开/折叠全部 */
const handleCheckedTreeExpand = () => {
  const nodes = treeRef.value?.store.nodesMap
  for (let node in nodes) {
    if (nodes[node].expanded === deptExpand.value) {
      continue
    }
    nodes[node].expanded = deptExpand.value
  }
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()

  // 初始化地区树数据
  await initAreaTree()

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await ReportTaskApi.getReportTask(id)
      Object.assign(formData.value, data)

      // 如果有选择的机构，设置到selectedOrgIds中并加载详情
      if (data.reportableOrgs) {
        const deptIds = data.reportableOrgs.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
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
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => {})
  if (!valid) return

  // 提交请求
  formLoading.value = true
  try {
    const data = { ...formData.value } as ReportTaskVO

    // 处理可填报机构ID列表
    data.reportableOrgs = selectedOrgIds.value.join(',')

    if (formType.value === 'create') {
      await ReportTaskApi.createReportTask(data)
      message.success(t('common.createSuccess'))
    } else {
      await ReportTaskApi.updateReportTask(data)
      message.success(t('common.updateSuccess'))
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
    reportableOrgs: undefined,
  }

  // 重置地区和机构相关状态
  selectedArea.value = null
  selectedInstitutionLevels.value = []
  selectedOrgIds.value = []
  selectedOrgsCache.value = [] // 清空缓存
  deptOptions.value = []
  filteredDeptOptions.value = []

  // 重置机构选择器弹窗状态
  orgSelectorVisible.value = false

  // 重置部门树状态
  treeNodeAll.value = false
  deptExpand.value = true
  checkStrictly.value = true
  treeRef.value?.setCheckedNodes([])

  formRef.value?.resetFields()
}
</script>

<style scoped lang="scss">
// 机构选择器卡片样式
.org-selector-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .org-summary {
    min-height: 120px;

    .empty-org-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: var(--el-text-color-secondary);
      padding: 40px 0;

      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        color: var(--el-border-color-darker);
      }

      p {
        margin: 8px 0;

        &.hint {
          font-size: 14px;
          color: var(--el-text-color-placeholder);
        }
      }
    }

    .selected-orgs-list {
      .org-summary-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--el-border-color-lighter);

        .org-count-tag {
          padding: 12px 16px;
          font-size: 16px;
        }

        .view-detail {
          font-size: 14px;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .org-list-container {
        max-height: 300px;
        overflow-y: auto;

        .org-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 8px;
          margin-bottom: 12px;
        }

        .org-card {
          padding: 8px 12px;
          background: var(--el-bg-color-page);
          border: 1px solid var(--el-border-color-lighter);
          border-radius: 4px;
          transition: all 0.2s ease;
          min-height: 40px;
          display: flex;
          align-items: center;

          &:hover {
            border-color: var(--el-color-primary-light-5);
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          }

          .org-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;

            .org-name {
              font-size: 14px;
              color: var(--el-text-color-primary);
              flex: 1;
              margin-right: 8px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
        }

        .more-orgs-tip {
          text-align: center;
          padding: 12px;
          color: var(--el-text-color-secondary);
          font-size: 13px;
          background: var(--el-bg-color);
          border: 1px dashed var(--el-border-color);
          border-radius: 4px;

          .ep-more {
            margin-right: 4px;
          }
        }
      }
    }
  }
}

// 机构选择器弹窗内的样式
.org-selector-container {
  .selector-card {
    height: 500px;
    display: flex;
    flex-direction: column;

    :deep(.el-card__header) {
      padding: 12px 16px;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    :deep(.el-card__body) {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-actions {
      display: flex;
      gap: 16px;
      align-items: center;
      font-size: 14px;
    }
  }

  .tree-node {
    display: flex;
    align-items: center;
    flex: 1;

    .node-icon {
      margin-right: 6px;
      color: var(--el-color-primary);
    }

    .node-label {
      display: flex;
      align-items: center;
      gap: 4px;

      .org-count {
        color: var(--el-text-color-secondary);
        font-size: 12px;
        font-weight: normal;
      }
    }
  }

  .institution-level-filter {
    padding: 12px 0;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .filter-label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      color: var(--el-text-color-regular);
      font-weight: 500;
    }

    :deep(.el-checkbox-group) {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .el-checkbox.is-bordered {
        margin-right: 0;
        border-radius: 4px;

        &.is-checked {
          border-color: var(--el-color-primary);
          background-color: var(--el-color-primary-light-9);
        }
      }
    }
  }

  .dept-node {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 8px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
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
}
</style>
