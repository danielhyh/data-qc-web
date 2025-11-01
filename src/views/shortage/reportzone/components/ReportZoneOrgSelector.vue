<template>
  <Dialog
    v-model="innerVisible"
    title="配置可填报机构"
    width="1080px"
    :scroll="true"
    :append-to-body="true"
    :fullscreen="true"
    class="report-zone-org-selector"
  >
    <div class="selector-body">
      <el-row :gutter="16">
        <el-col :span="10">
          <ReportZonePanel
            title="地区选择"
            icon="material-symbols:public"
            icon-color="#2563eb"
            class="selector-card"
          >
            <template #header>
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
            </template>

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
                  <Icon
                    :icon="getAreaIconMeta(data).icon"
                    class="area-icon"
                    :style="{ color: getAreaIconMeta(data).color }"
                  />
                  <span class="area-label" :title="node.label">{{ node.label }}</span>
                  <span v-if="hasDirectCount(data)" class="count-chip direct">
                    <Icon icon="ep:office-building" class="mr-4px" />
                    {{ data.directOrgCount }}
                  </span>
                  <span v-if="hasTotalCount(data)" class="count-chip total">
                    <Icon icon="ph:tree-structure-bold" class="mr-4px" />
                    {{ data.totalOrgCount }}
                  </span>
                </span>
              </template>
            </el-tree>
          </ReportZonePanel>
        </el-col>

        <el-col :span="14">
          <ReportZonePanel
            title="机构选择"
            icon="ep:office-building"
            icon-color="#16a34a"
            class="selector-card"
          >
            <template #header>
              <div class="org-header">
                <el-input
                  v-model="orgKeyword"
                  size="small"
                  placeholder="搜索机构名称"
                  clearable
                  class="w-1/3 min-w-200px"
                  @clear="refreshOrgFilter"
                  @keyup.enter="refreshOrgFilter"
                >
                  <template #prefix>
                    <Icon icon="ep:search" class="text-16px text-gray-500" />
                  </template>
                </el-input>
                <el-checkbox-group
                  v-model="selectedLevels"
                  size="small"
                  class="level-checkbox-group"
                  @change="refreshOrgFilter"
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
            </template>

            <div v-if="!activeAreaCode" class="org-empty-state">
              <Icon icon="ep:pointer" class="empty-icon" />
              <p>请先从左侧选择地区</p>
            </div>

            <el-skeleton :loading="deptTreeLoading" animated :count="6" v-else-if="deptTreeLoading" />

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
            >
              <template #default="{ node, data }">
                <div class="dept-node">
                  <span class="dept-name" :title="node.label">{{ node.label }}</span>
                  <dict-tag
                    :type="DICT_TYPE.INSTITUTION_LEVEL"
                    :value="data.hospitalLevel"
                    class="ml-8px"
                    size="small"
                  />
                </div>
              </template>
            </el-tree>
          </ReportZonePanel>
        </el-col>
      </el-row>
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
import { Icon } from '../../../../components/Icon'
import { DICT_TYPE, getIntDictOptions } from '../../../../utils/dict'
import { defaultProps, handleTree } from '../../../../utils/tree'
import { RegionsApi } from '../../../../api/system/regions'
import * as DeptApi from '../../../../api/system/dept'
import ReportZonePanel from './ReportZonePanel'

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
const selectedLevels = ref<(number | string)[]>(['ALL'])
const ALL_LEVEL = 'ALL'

const areaTree = ref<RegionTreeNode[]>([])
const activeAreaCode = ref<string>('')
const defaultExpandedAreaCodes = ref<string[]>([])
const deptTree = ref<DeptTreeNode[]>([])
const filteredDeptTree = ref<DeptTreeNode[]>([])
const checkedIds = ref<number[]>([])

const levelOptions = computed(() => {
  const dict = getIntDictOptions(DICT_TYPE.INSTITUTION_LEVEL) || []
  return [{ label: '全部', value: ALL_LEVEL }, ...dict]
})

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
    defaultExpandedAreaCodes.value = areaTree.value.slice(0, 3).map(item => item.code)
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
    items.forEach(item => {
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
    items.forEach(item => {
      const currentPath = [...ancestors, item.code]
      const nameMatch = item.name?.toLowerCase().includes(lower)
      const childMatch = item.children ? traverse(item.children, currentPath) : false
      
      if (nameMatch || childMatch) {
        // 添加所有祖先节点和当前节点
        currentPath.forEach(code => keys.add(code))
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
    return
  }
  deptTreeLoading.value = true
  try {
    const response = await DeptApi.getDeptPage({ areaCode, pageSize: 1000 } as DeptApi.DeptPageParam)
    const list: DeptTreeNode[] = Array.isArray(response?.list) ? response.list : response || []
    const tree = handleTree(list)
    deptTree.value = tree
    normalizeLevelFilters()
    filteredDeptTree.value = applyDeptFilters(tree)
    await nextTick()
    syncCheckedKeys()
  } finally {
    deptTreeLoading.value = false
  }
}

const applyDeptFilters = (nodes: DeptTreeNode[]): DeptTreeNode[] => {
  const keyword = orgKeyword.value.trim().toLowerCase()
  const levelFilters = new Set(selectedLevels.value)
  const useAll = levelFilters.has(ALL_LEVEL) || levelFilters.size === 0

  const matchesLevel = (level: any) => {
    if (useAll) return true
    if (level === undefined || level === null || level === '') return false
    return Array.from(levelFilters).some(item => String(item) === String(level))
  }

  const traverse = (items: DeptTreeNode[]): DeptTreeNode[] => {
    const result: DeptTreeNode[] = []
    items.forEach(item => {
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

const normalizeLevelFilters = () => {
  const levels = selectedLevels.value
  if (levels.length === 0) {
    selectedLevels.value = [ALL_LEVEL]
    return
  }

  const hasAll = levels.includes(ALL_LEVEL)
  if (hasAll && levels.length > 1) {
    selectedLevels.value = levels.filter(item => item !== ALL_LEVEL)
  }
}

const refreshOrgFilter = () => {
  normalizeLevelFilters()
  filteredDeptTree.value = applyDeptFilters(deptTree.value)
  nextTick(syncCheckedKeys)
}

const syncCheckedKeys = () => {
  deptTreeRef.value?.setCheckedKeys(checkedIds.value ?? [])
}

const collectDetailsFromTree = (ids: number[]): any[] => {
  const details: any[] = []
  const traverse = (nodes: DeptTreeNode[]) => {
    nodes.forEach(node => {
      if (ids.includes(node.id)) {
        details.push({
          id: node.id,
          name: node.name,
          hospitalLevel: node.hospitalLevel,
          regionName: node.regionName,
          areaName: node.areaName,
          regionPath: node.regionPath
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
  source.forEach(item => {
    if (item && typeof item.id === 'number') {
      map.set(item.id, item)
    }
  })
  props.selectedDetails.forEach(item => {
    if (item && typeof item.id === 'number' && !map.has(item.id)) {
      map.set(item.id, item)
    }
  })
  return ids.map(id => map.get(id)).filter(Boolean)
}

const updateSelection = (ids: number[]) => {
  checkedIds.value = ids
}

const handleOrgCheck = (_: any, data: { checkedKeys: number[] }) => {
  updateSelection(data.checkedKeys ?? [])
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

const AREA_ICON_CONFIG: Record<number, { icon: string; color: string }> = {
  1: { icon: 'material-symbols:public', color: '#2563eb' },
  2: { icon: 'mdi:office-building', color: '#16a34a' },
  3: { icon: 'mdi:home-city', color: '#f97316' }
}

const SPECIAL_NODE_ICON = { icon: 'ep:star-filled', color: '#f59e0b' }

const getAreaIconMeta = (node: RegionTreeNode) => {
  if (node.nodeType === 'SPECIAL') return SPECIAL_NODE_ICON
  return AREA_ICON_CONFIG[node.level ?? 0] ?? { icon: 'mdi:map-marker', color: '#2563eb' }
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      loadAreaTree()
      checkedIds.value = [...(props.selectedIds ?? [])]
      nextTick(syncCheckedKeys)
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

<style scoped lang="scss">
.report-zone-org-selector {
  :deep(.el-dialog) {
    height: 85vh;
    max-height: 900px;
    display: flex;
    flex-direction: column;
  }

  :deep(.el-dialog__body) {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .selector-body {
    min-height: 700px;
    flex: 1;
    overflow: hidden;
  }

  .selector-card {
    height: 100%;
    display: flex;
    flex-direction: column;

    :deep(.panel-body) {
      flex: 1;
      min-height: 680px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
  }

  .area-tree,
  .dept-tree {
    flex: 1;
    overflow: auto;
    padding: 12px;
    border-radius: 6px;
    background: rgba(244, 247, 255, 0.6);
  }

  .area-node {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 6px;
    transition: all 0.2s ease;

    &.is-active {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.05));
      box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.35);
    }

    &.is-special {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(254, 243, 199, 0.3));
      border-left: 3px solid rgba(245, 158, 11, 0.8);
    }
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

  .org-header {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .level-checkbox-group {
    display: flex;
    gap: 8px;
  }

  .dept-node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .dept-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .org-empty-state {
    height: 100%;
    min-height: 360px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);

    .empty-icon {
      font-size: 42px;
      margin-bottom: 8px;
      color: var(--el-color-primary-light-3);
    }
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

</style>

