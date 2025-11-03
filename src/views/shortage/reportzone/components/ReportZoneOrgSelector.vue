<template>
  <Dialog
    v-model="innerVisible"
    title="配置可填报机构"
    width="1080px"
    class="report-zone-org-selector"
  >
    <div class="selector-body">
      <div class="selector-row">
        <!-- 左侧：地区选择 -->
        <div class="selector-panel area-panel">
          <div class="panel-header theme-blue">
            <div class="panel-title">
              <Icon icon="material-symbols:public" class="panel-icon" style="color: #2563eb" />
              <span class="panel-title-text">地区选择</span>
            </div>
            <el-input
              v-model="areaKeyword"
              size="small"
              placeholder="搜索地区"
              clearable
              style="width: 180px"
              @clear="handleAreaSearch"
              @keyup.enter="handleAreaSearch"
            >
              <template #prefix>
                <Icon icon="ep:search" />
              </template>
            </el-input>
          </div>
          <div class="panel-body">
            <el-skeleton :loading="areaTreeLoading" animated :count="6" v-if="areaTreeLoading" />
            <el-tree
              v-else
              ref="areaTreeRef"
              :data="filteredAreaTree"
              :props="areaTreeProps"
              node-key="code"
              highlight-current
              :expand-on-click-node="false"
              :default-expanded-keys="defaultExpandedAreaCodes"
              class="area-tree"
              @node-click="handleAreaClick"
            >
              <template #default="{ node, data }">
                <span
                  class="area-node"
                  :class="{
                    'is-special': data.nodeType === 'SPECIAL',
                    'is-active': node.key === activeAreaCode
                  }"
                >
                  <DictIcon
                    :dict-type="DICT_TYPE.REGION_LEVEL"
                    :value="data.level ?? ''"
                    :size="16"
                    :default-color="data.nodeType === 'SPECIAL' ? '#f59e0b' : '#2563eb'"
                    class="area-icon"
                  />
                  <span class="area-label" :title="node.label">{{ node.label }}</span>
                  <el-tooltip
                    v-if="hasDirectCount(data)"
                    content="该地区直属机构数量"
                    placement="top"
                  >
                    <span class="count-chip direct">
                      <Icon icon="ep:office-building" class="mr-4px" />
                      {{ data.directOrgCount }}
                    </span>
                  </el-tooltip>
                  <el-tooltip
                    v-if="hasTotalCount(data)"
                    content="该地区及子地区机构总数"
                    placement="top"
                  >
                    <span class="count-chip total">
                      <Icon icon="ph:tree-structure-bold" class="mr-4px" />
                      {{ data.totalOrgCount }}
                    </span>
                  </el-tooltip>
                </span>
              </template>
            </el-tree>
          </div>
        </div>

        <!-- 右侧：机构选择 -->
        <div class="selector-panel org-panel">
          <div class="panel-header panel-header-vertical theme-green">
            <div class="org-header-row">
              <div class="panel-title">
                <Icon icon="ep:office-building" class="panel-icon" style="color: #16a34a" />
                <span class="panel-title-text">机构选择</span>
              </div>
              <el-input
                v-model="orgKeyword"
                size="small"
                placeholder="搜索机构名称"
                clearable
                style="width: 200px"
                @clear="refreshOrgFilter"
                @keyup.enter="refreshOrgFilter"
              >
                <template #prefix>
                  <Icon icon="ep:search" class="text-16px text-gray-500" />
                </template>
              </el-input>
            </div>
            <div class="org-filter-row">
              <el-checkbox
                v-model="selectAll"
                size="small"
                @change="handleSelectAllChange"
              >
                全选当前机构
              </el-checkbox>
              <el-checkbox-group
                v-model="selectedLevels"
                size="small"
                class="level-checkbox-group"
                @change="handleLevelChange"
              >
                <el-checkbox-button
                  v-for="level in levelOptions"
                  :key="level.value"
                  :value="level.value"
                >
                  {{ level.label }}
                </el-checkbox-button>
              </el-checkbox-group>
            </div>
          </div>
          <div class="panel-body">
            <div v-if="!activeAreaCode" class="org-empty-state">
              <Icon icon="ep:pointer" class="empty-icon" />
              <p>请先从左侧选择地区</p>
            </div>

            <el-skeleton
              :loading="deptTreeLoading"
              animated
              :count="6"
              v-else-if="deptTreeLoading"
            />

            <el-tree
              v-else
              ref="deptTreeRef"
              :data="filteredDeptTree"
              :props="defaultProps"
              node-key="id"
              show-checkbox
              :check-strictly="true"
              :default-checked-keys="checkedIds"
              :expand-on-click-node="false"
              empty-text="该地区暂无机构"
              class="dept-tree"
              @check="handleOrgCheck"
              @node-click="handleNodeClick"
            >
              <template #default="{ node, data }">
                <div class="dept-node">
                  <el-tooltip
                    :content="getInstitutionCategoryLabel(data.institutionCategory)"
                    placement="top"
                  >
                    <DictIcon
                      :dict-type="DICT_TYPE.INSTITUTION_CATEGORY"
                      :value="data.institutionCategory ?? ''"
                      :size="16"
                      default-color="#5b8def"
                      class="dept-icon"
                    />
                  </el-tooltip>
                  <span class="dept-name" :title="node.label">{{ node.label }}</span>
                  <dict-tag
                    v-if="data.hospitalLevel != null"
                    :type="DICT_TYPE.INSTITUTION_LEVEL"
                    :value="data.hospitalLevel"
                    class="ml-8px"
                    size="small"
                  />
                </div>
              </template>
            </el-tree>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="selection-summary">
          <Icon icon="ep:collection" class="summary-icon" />
          已选择 <span class="count">{{ checkedIds.length }}</span> 个机构
        </div>
        <div class="footer-actions">
          <el-button @click="handleCancel">取 消</el-button>
          <el-button type="primary" :disabled="checkedIds.length === 0" @click="handleConfirm">
            确 定
          </el-button>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, nextTick, ref, watch } from 'vue'
import { Dialog } from '@/components/Dialog'
import { Icon } from '@/components/Icon'
import DictIcon from '@/components/DictIcon'
import { DICT_TYPE, getDictObj, getIntDictOptions } from '@/utils/dict'
import { defaultProps, handleTree } from '@/utils/tree'
import { RegionsApi } from '@/api/system/regions'
import * as DeptApi from '@/api/system/dept'

defineOptions({ name: 'ReportZoneOrgSelector' })

type RegionTreeNode = {
  code: string
  name: string
  level?: number
  nodeType?: string
  directOrgCount?: number
  totalOrgCount?: number
  children?: RegionTreeNode[]
}

type DeptTreeNode = {
  id: number
  name: string
  hospitalLevel?: number | string
  institutionCategory?: number | string
  regionName?: string
  areaName?: string
  regionPath?: string
  parentId?: number
  children?: DeptTreeNode[]
  [key: string]: any
}

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  selectedIds: { type: Array as PropType<number[]>, default: () => [] },
  selectedDetails: { type: Array as PropType<any[]>, default: () => [] }
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'update:selectedIds', value: number[]): void
  (event: 'update:selectedDetails', value: any[]): void
  (event: 'confirm', payload: { ids: number[]; details: any[] }): void
}>()

const innerVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const areaTreeRef = ref()
const deptTreeRef = ref()

const areaTreeLoading = ref(false)
const deptTreeLoading = ref(false)

const areaKeyword = ref('')
const orgKeyword = ref('')
const selectedLevels = ref<(number | string)[]>([])
const selectAll = ref(false)

const areaTree = ref<RegionTreeNode[]>([])
const activeAreaCode = ref<string>('')
const defaultExpandedAreaCodes = ref<string[]>([])
const deptTree = ref<DeptTreeNode[]>([])
const filteredDeptTree = ref<DeptTreeNode[]>([])
const checkedIds = ref<number[]>([])

const levelOptions = computed(() => {
  return getIntDictOptions(DICT_TYPE.INSTITUTION_LEVEL) || []
})

// 获取机构类别标签
const getInstitutionCategoryLabel = (value: string | number | boolean | undefined) => {
  return getDictObj(DICT_TYPE.INSTITUTION_CATEGORY, value)?.label ?? '机构分类'
}

const areaTreeProps = {
  label: 'name',
  children: 'children'
}

const loadAreaTree = async () => {
  if (areaTreeLoading.value) return
  areaTreeLoading.value = true
  try {
    const data = await RegionsApi.getRegionsTreeWithOrgCount()
    areaTree.value = Array.isArray(data) ? data : []
    defaultExpandedAreaCodes.value = areaTree.value.slice(0, 3).map((item) => item.code)
    if (!activeAreaCode.value && areaTree.value.length > 0) {
      const defaultNode = findDefaultArea(areaTree.value)
      if (defaultNode) {
        activeAreaCode.value = defaultNode.code
        await loadDeptTree(defaultNode.code)
        await nextTick()
        areaTreeRef.value?.setCurrentKey(defaultNode.code)
      }
    }
  } finally {
    areaTreeLoading.value = false
  }
}

const findDefaultArea = (nodes: RegionTreeNode[]): RegionTreeNode | null => {
  for (const node of nodes) {
    if (node.code === '610000') {
      return node
    }
    if (node.children && node.children.length > 0) {
      const child = findDefaultArea(node.children)
      if (child) {
        return child
      }
    }
  }
  return nodes[0] ?? null
}

const filterAreaTree = (nodes: RegionTreeNode[], keyword: string): RegionTreeNode[] => {
  if (!keyword) return nodes
  const lower = keyword.trim().toLowerCase()
  const traverse = (items: RegionTreeNode[]): RegionTreeNode[] => {
    const result: RegionTreeNode[] = []
    items.forEach((item) => {
      const nameMatch = item.name?.toLowerCase().includes(lower)
      const children = item.children ? traverse(item.children) : []
      if (nameMatch || children.length > 0) {
        result.push({ ...item, children })
      }
    })
    return result
  }
  return traverse(nodes)
}

// 收集所有匹配节点及其祖先节点的code
const collectExpandedKeys = (nodes: RegionTreeNode[], keyword: string): string[] => {
  if (!keyword) return defaultExpandedAreaCodes.value
  const lower = keyword.trim().toLowerCase()
  const keys = new Set<string>()

  const traverse = (items: RegionTreeNode[], ancestors: string[] = []): boolean => {
    let hasMatch = false
    items.forEach((item) => {
      const currentPath = [...ancestors, item.code]
      const nameMatch = item.name?.toLowerCase().includes(lower)
      const childMatch = item.children ? traverse(item.children, currentPath) : false

      if (nameMatch || childMatch) {
        // 添加所有祖先节点和当前节点
        currentPath.forEach((code) => keys.add(code))
        hasMatch = true
      }
    })
    return hasMatch
  }

  traverse(nodes)
  return Array.from(keys)
}

const filteredAreaTree = computed(() => filterAreaTree(areaTree.value, areaKeyword.value))

const handleAreaSearch = () => {
  // 更新展开的节点
  const expandKeys = collectExpandedKeys(areaTree.value, areaKeyword.value)
  defaultExpandedAreaCodes.value = expandKeys

  nextTick(() => {
    if (!areaKeyword.value) {
      areaTreeRef.value?.setCurrentKey(activeAreaCode.value)
    }
  })
}

const handleAreaClick = async (data: RegionTreeNode) => {
  if (!data || data.code === activeAreaCode.value) return
  activeAreaCode.value = data.code
  await loadDeptTree(data.code)
}

const loadDeptTree = async (areaCode: string) => {
  if (!areaCode) {
    deptTree.value = []
    filteredDeptTree.value = []
    selectAll.value = false
    return
  }
  deptTreeLoading.value = true
  try {
    const response = await DeptApi.getDeptPage({
      areaCode,
      pageSize: -1
    } as DeptApi.DeptPageParam)
    const list: DeptTreeNode[] = Array.isArray(response?.list) ? response.list : response || []
    const tree = handleTree(list)
    deptTree.value = tree
    filteredDeptTree.value = applyDeptFilters(tree)
    await nextTick()
    syncCheckedKeys()
    updateSelectAllState()
  } finally {
    deptTreeLoading.value = false
  }
}

const applyDeptFilters = (nodes: DeptTreeNode[]): DeptTreeNode[] => {
  const keyword = orgKeyword.value.trim().toLowerCase()
  const levelFilters = new Set(selectedLevels.value)
  const useAll = levelFilters.size === 0

  const matchesLevel = (level: any) => {
    if (useAll) return true
    if (level === undefined || level === null || level === '') return false
    return Array.from(levelFilters).some((item) => String(item) === String(level))
  }

  const traverse = (items: DeptTreeNode[]): DeptTreeNode[] => {
    const result: DeptTreeNode[] = []
    items.forEach((item) => {
      const nameMatch = keyword ? item.name?.toLowerCase().includes(keyword) : true
      const levelMatch = matchesLevel(item.hospitalLevel)
      const children = item.children ? traverse(item.children) : []
      if ((nameMatch && levelMatch) || children.length > 0) {
        result.push({ ...item, children })
      }
    })
    return result
  }
  return traverse(nodes)
}

// 收集树中所有节点的ID
const collectAllDeptIds = (nodes: DeptTreeNode[]): number[] => {
  const ids: number[] = []
  const traverse = (items: DeptTreeNode[]) => {
    items.forEach((item) => {
      ids.push(item.id)
      if (item.children && item.children.length > 0) {
        traverse(item.children)
      }
    })
  }
  traverse(nodes)
  return ids
}

const handleSelectAllChange = (checked: boolean) => {
  const allIds = collectAllDeptIds(filteredDeptTree.value)
  if (checked) {
    // 全选：合并当前所有机构ID
    const newChecked = new Set([...checkedIds.value, ...allIds])
    checkedIds.value = Array.from(newChecked)
  } else {
    // 取消全选：移除当前所有机构ID
    const idsToRemove = new Set(allIds)
    checkedIds.value = checkedIds.value.filter((id) => !idsToRemove.has(id))
  }
  nextTick(() => {
    syncCheckedKeys()
    // 确保状态同步
    updateSelectAllState()
  })
}

const handleLevelChange = () => {
  refreshOrgFilter()
}

// 更新全选框状态
const updateSelectAllState = () => {
  const allIds = collectAllDeptIds(filteredDeptTree.value)
  // 没有机构或选中列表为空时，取消全选
  if (allIds.length === 0) {
    selectAll.value = false
    return
  }
  // 检查当前显示的所有机构是否都被选中
  const checkedSet = new Set(checkedIds.value)
  selectAll.value = allIds.length > 0 && allIds.every((id) => checkedSet.has(id))
}

const refreshOrgFilter = () => {
  filteredDeptTree.value = applyDeptFilters(deptTree.value)
  nextTick(() => {
    syncCheckedKeys()
    updateSelectAllState()
  })
}

const syncCheckedKeys = () => {
  deptTreeRef.value?.setCheckedKeys(checkedIds.value ?? [])
}

const collectDetailsFromTree = (ids: number[]): any[] => {
  const details: any[] = []
  const traverse = (nodes: DeptTreeNode[]) => {
    nodes.forEach((node) => {
      if (ids.includes(node.id)) {
        details.push({
          id: node.id,
          name: node.name,
          hospitalLevel: node.hospitalLevel,
          regionName: node.regionName,
          areaName: node.areaName,
          regionPath: node.regionPath,
          regionPathName: node.regionPathName || '' // 区域路径中文名称
        })
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }
  traverse(deptTree.value)
  return details
}

const mergeDetails = (ids: number[], source: any[]) => {
  const map = new Map<number, any>()
  source.forEach((item) => {
    if (item && typeof item.id === 'number') {
      map.set(item.id, item)
    }
  })
  props.selectedDetails.forEach((item) => {
    if (item && typeof item.id === 'number' && !map.has(item.id)) {
      map.set(item.id, item)
    }
  })
  return ids.map((id) => map.get(id)).filter(Boolean)
}

const updateSelection = (ids: number[]) => {
  checkedIds.value = ids
  updateSelectAllState()
}

const handleOrgCheck = (_: any, data: { checkedKeys: number[] }) => {
  updateSelection(data.checkedKeys ?? [])
}

// 处理节点点击，切换选中状态
const handleNodeClick = (data: DeptTreeNode) => {
  const isChecked = checkedIds.value.includes(data.id)
  if (isChecked) {
    // 当前已选中，取消选中
    deptTreeRef.value?.setChecked(data.id, false)
    checkedIds.value = checkedIds.value.filter(id => id !== data.id)
  } else {
    // 当前未选中，选中
    deptTreeRef.value?.setChecked(data.id, true)
    checkedIds.value = [...checkedIds.value, data.id]
  }
  updateSelectAllState()
}

const handleCancel = () => {
  innerVisible.value = false
}

const handleConfirm = () => {
  const ids = [...checkedIds.value]
  const details = mergeDetails(ids, collectDetailsFromTree(ids))
  emit('update:selectedIds', ids)
  emit('update:selectedDetails', details)
  emit('confirm', { ids, details })
  innerVisible.value = false
}

const hasDirectCount = (node: RegionTreeNode) => (node.directOrgCount ?? 0) > 0
const hasTotalCount = (node: RegionTreeNode) => {
  if (!node.children || node.children.length === 0) return false
  const total = node.totalOrgCount ?? 0
  const direct = node.directOrgCount ?? 0
  return total > direct
}

watch(
  () => props.modelValue,
  async (visible) => {
    if (visible) {
      // 先重置状态
      checkedIds.value = [...(props.selectedIds ?? [])]
      selectAll.value = false
      // 加载区域树（内部会自动加载机构树）
      await loadAreaTree()
      // 确保选中状态正确同步
      await nextTick()
      syncCheckedKeys()
      updateSelectAllState()
    }
  }
)

watch(
  () => props.selectedIds,
  (ids) => {
    checkedIds.value = [...(ids ?? [])]
    nextTick(syncCheckedKeys)
  },
  { deep: true }
)

watch(orgKeyword, () => {
  refreshOrgFilter()
})

watch(areaKeyword, () => {
  handleAreaSearch()
})
</script>

<style lang="scss">
// 全局样式，确保高度约束生效
.el-dialog.report-zone-org-selector {
  height: 85vh !important;
  min-height: 85vh !important;
  max-height: 85vh !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;

  .el-dialog__header {
    flex-shrink: 0 !important;
    flex-grow: 0 !important;
  }

  .el-dialog__body {
    flex: 1 1 0% !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    min-height: 0 !important;
    max-height: 100% !important;
    padding: 20px;
  }

  .el-dialog__footer {
    flex-shrink: 0 !important;
    flex-grow: 0 !important;
  }
}
</style>

<style scoped lang="scss">
.report-zone-org-selector {
  .selector-body {
    flex: 1 1 0%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
    max-height: 100%;
  }

  .selector-row {
    flex: 1 1 0%;
    display: flex;
    gap: 16px;
    overflow: hidden;
    min-height: 0;
    max-height: 100%;
  }

  .selector-panel {
    flex: 1 1 0%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
    max-height: 100%;
    border: 1px solid rgba(229, 231, 235, 0.8);
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

    &.area-panel {
      flex: 0 0 40%;
      max-height: 100%;
    }

    &.org-panel {
      flex: 1 1 0%;
      max-height: 100%;
    }
  }

  .panel-header {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    border-radius: 12px 12px 0 0;

    &.theme-blue {
      background: linear-gradient(
        135deg,
        rgba(59, 130, 246, 0.08) 0%,
        rgba(147, 197, 253, 0.06) 50%,
        rgba(239, 246, 255, 0.04) 100%
      );
      box-shadow: 0 1px 0 rgba(37, 99, 235, 0.1);
    }

    &.theme-green {
      background: linear-gradient(
        135deg,
        rgba(22, 163, 74, 0.08) 0%,
        rgba(134, 239, 172, 0.06) 50%,
        rgba(240, 253, 244, 0.04) 100%
      );
      box-shadow: 0 1px 0 rgba(22, 163, 74, 0.1);
    }

    &.panel-header-vertical {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }
  }

  .org-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .org-filter-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    flex-shrink: 0;
  }

  .panel-icon {
    font-size: 20px;
  }

  .panel-title-text {
    white-space: nowrap;
  }

  .panel-body {
    flex: 1 1 0%;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px;
    min-height: 0;
    max-height: 100%;
  }

  .area-node {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    transition: all 0.2s ease;
  }

  .area-icon {
    font-size: 18px;
  }

  .area-label {
    font-weight: 600;
    color: var(--el-text-color-primary);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .count-chip {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    border-radius: 999px;
    font-size: 12px;
    gap: 2px;

    &.direct {
      background: rgba(59, 130, 246, 0.1);
      color: #2563eb;
    }

    &.total {
      background: rgba(56, 189, 248, 0.12);
      color: #0ea5e9;
    }
  }

  .level-checkbox-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .dept-node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 6px;
  }

  .dept-icon {
    flex-shrink: 0;
  }

  .dept-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }

  .org-empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);
    padding: 40px 20px;

    .empty-icon {
      font-size: 42px;
      margin-bottom: 8px;
      color: var(--el-color-primary-light-3);
    }
  }

  :deep(.el-skeleton) {
    flex: 1;
    padding: 0;
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .selection-summary {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;

    .summary-icon {
      font-size: 18px;
      color: var(--el-color-primary);
    }

    .count {
      font-weight: 600;
      color: var(--el-color-primary);
    }
  }
}

:deep(.el-checkbox-button__inner) {
  border-radius: 6px !important;
  font-size: 12px;
  padding: 6px 12px;
}

:deep(.el-tree) {
  background: transparent;
}

:deep(.el-tree-node__content) {
  height: auto;
  padding: 4px 6px;
}

:deep(.el-skeleton__item) {
  margin: 6px 0;
}

:deep(.el-tree-node) {
  white-space: nowrap;
}

:deep(.el-tree-node > .el-tree-node__children) {
  overflow: hidden;
}

// 机构树节点样式
.dept-tree {
  :deep(.el-tree-node__content) {
    border-radius: 6px;
    margin: 2px 0;
    padding: 6px 8px;
    transition: all 0.2s ease;
    cursor: pointer;
    
    &:hover {
      background: rgba(22, 163, 74, 0.06);
      transform: translateX(2px);
    }
  }
}

// 地区树节点的选中和特殊节点样式（整行效果）
.area-tree {
  :deep(.el-tree-node__content) {
    border-radius: 8px;
    margin: 2px 0;
    padding: 8px 12px;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      background: rgba(59, 130, 246, 0.06);
      transform: translateX(2px);
    }
    
    // 选中状态 - 通过 .is-active 类判断
    .area-node.is-active {
      // 让父节点有背景
      & {
        width: 100%;
      }
    }
  }
  
  // 选中节点的整行样式
  :deep(.el-tree-node__content:has(.area-node.is-active)) {
    background: linear-gradient(
      135deg,
      rgba(59, 130, 246, 0.15) 0%,
      rgba(147, 197, 253, 0.1) 50%,
      rgba(59, 130, 246, 0.08) 100%
    );
    box-shadow: 
      inset 3px 0 0 0 rgba(59, 130, 246, 0.6),
      0 2px 8px rgba(59, 130, 246, 0.15);
    transform: translateX(0);
    
    &:hover {
      background: linear-gradient(
        135deg,
        rgba(59, 130, 246, 0.18) 0%,
        rgba(147, 197, 253, 0.13) 50%,
        rgba(59, 130, 246, 0.1) 100%
      );
    }
  }
  
  // 特殊节点的整行样式
  :deep(.el-tree-node__content:has(.area-node.is-special)) {
    background: linear-gradient(
      135deg,
      rgba(251, 191, 36, 0.18) 0%,
      rgba(254, 243, 199, 0.25) 50%,
      rgba(252, 211, 77, 0.15) 100%
    );
    box-shadow: 
      inset 3px 0 0 0 rgba(245, 158, 11, 0.8),
      0 2px 8px rgba(245, 158, 11, 0.12);
    
    &:hover {
      background: linear-gradient(
        135deg,
        rgba(251, 191, 36, 0.22) 0%,
        rgba(254, 243, 199, 0.3) 50%,
        rgba(252, 211, 77, 0.18) 100%
      );
    }
    
    // 特殊节点的文字颜色
    .area-label {
      color: #78350f;
      font-weight: 600;
    }
  }
  
  // 特殊节点且选中的样式（优先级最高）
  :deep(.el-tree-node__content:has(.area-node.is-special.is-active)) {
    background: linear-gradient(
      135deg,
      rgba(251, 191, 36, 0.25) 0%,
      rgba(254, 243, 199, 0.35) 50%,
      rgba(252, 211, 77, 0.2) 100%
    );
    box-shadow: 
      inset 3px 0 0 0 rgba(245, 158, 11, 1),
      0 3px 12px rgba(245, 158, 11, 0.25);
  }
}
</style>
