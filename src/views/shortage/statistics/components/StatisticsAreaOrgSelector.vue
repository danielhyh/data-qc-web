<template>
  <Dialog
    v-model="innerVisible"
    title="选择区域和机构"
    width="1080px"
    class="statistics-area-org-selector"
  >
    <div class="selector-body">
      <!-- 选择模式切换 -->
      <div class="mode-switch">
        <el-radio-group v-model="selectMode" size="default" @change="handleModeChange">
          <el-radio-button value="area">
            <Icon icon="material-symbols:public" class="mr-4px" />
            按地区查询
          </el-radio-button>
          <el-radio-button value="org">
            <Icon icon="ep:office-building" class="mr-4px" />
            按机构查询
          </el-radio-button>
        </el-radio-group>
        <div class="mode-tip">
          <Icon icon="ep:info-filled" class="tip-icon" />
          <span v-if="selectMode === 'area'">选择地区后，将查询该地区及子地区的所有机构数据</span>
          <span v-else>选择特定机构后，仅查询这些机构的数据</span>
        </div>
      </div>

      <div class="selector-row">
        <!-- 左侧：地区树 -->
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
                    'is-active': isAreaActive(data.code)
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
                  <!-- 地区模式下显示选中标记 -->
                  <Icon
                    v-if="selectMode === 'area' && isAreaActive(data.code)"
                    icon="ep:select"
                    class="selected-icon"
                  />
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
                <span class="panel-title-text">机构列表</span>
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
            <div class="org-filter-row" v-if="selectMode === 'org'">
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
              :show-checkbox="selectMode === 'org'"
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
          <span v-if="selectMode === 'area'">
            已选择地区: <span class="count">{{ selectedAreaName || '未选择' }}</span>
          </span>
          <span v-else>
            已选择 <span class="count">{{ checkedIds.length }}</span> 个机构
          </span>
        </div>
        <div class="footer-actions">
          <el-button @click="handleCancel">取 消</el-button>
          <el-button
            type="primary"
            :disabled="!canConfirm"
            @click="handleConfirm"
          >
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

defineOptions({ name: 'StatisticsAreaOrgSelector' })

type SelectMode = 'area' | 'org'

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
  // 初始选择模式
  defaultMode: { type: String as PropType<SelectMode>, default: 'area' },
  // 初始地区代码
  defaultAreaCode: { type: String, default: '' },
  // 初始机构ID列表
  defaultOrgIds: { type: Array as PropType<number[]>, default: () => [] }
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'confirm', payload: { mode: SelectMode; areaCode?: string; areaName?: string; orgIds?: number[]; orgDetails?: any[] }): void
}>()

const innerVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

// 选择模式
const selectMode = ref<SelectMode>(props.defaultMode)

const areaTreeRef = ref()
const deptTreeRef = ref()

const areaTreeLoading = ref(false)
const deptTreeLoading = ref(false)

const areaKeyword = ref('')
const orgKeyword = ref('')
const selectedLevels = ref<(number | string)[]>([])
const selectAll = ref(false)

const areaTree = ref<RegionTreeNode[]>([])
const activeAreaCode = ref<string>(props.defaultAreaCode || '')
const selectedAreaName = ref<string>('')
const defaultExpandedAreaCodes = ref<string[]>([])
const deptTree = ref<DeptTreeNode[]>([])
const filteredDeptTree = ref<DeptTreeNode[]>([])
const checkedIds = ref<number[]>([...props.defaultOrgIds])

const levelOptions = computed(() => {
  return getIntDictOptions(DICT_TYPE.INSTITUTION_LEVEL) || []
})

const getInstitutionCategoryLabel = (value: string | number | boolean | undefined) => {
  return getDictObj(DICT_TYPE.INSTITUTION_CATEGORY, value)?.label ?? '机构分类'
}

const areaTreeProps = {
  label: 'name',
  children: 'children'
}

// 判断地区是否激活
const isAreaActive = (code: string) => {
  return selectMode.value === 'area' && activeAreaCode.value === code
}

// 是否可以确认
const canConfirm = computed(() => {
  if (selectMode.value === 'area') {
    return !!activeAreaCode.value
  } else {
    return checkedIds.value.length > 0
  }
})

const loadAreaTree = async () => {
  if (areaTreeLoading.value) return
  areaTreeLoading.value = true
  try {
    const data = await RegionsApi.getRegionsTreeWithOrgCount()
    areaTree.value = Array.isArray(data) ? data : []
    defaultExpandedAreaCodes.value = areaTree.value.slice(0, 3).map((item) => item.code)
    
    // 如果有默认地区代码，设置为激活状态
    if (props.defaultAreaCode && areaTree.value.length > 0) {
      activeAreaCode.value = props.defaultAreaCode
      // 查找并设置地区名称
      const areaNode = findAreaNode(areaTree.value, props.defaultAreaCode)
      if (areaNode) {
        selectedAreaName.value = areaNode.name
        await loadDeptTree(props.defaultAreaCode)
        await nextTick()
        areaTreeRef.value?.setCurrentKey(props.defaultAreaCode)
      }
    } else if (!activeAreaCode.value && areaTree.value.length > 0) {
      // 没有默认值，使用陕西省
      const defaultNode = findDefaultArea(areaTree.value)
      if (defaultNode) {
        activeAreaCode.value = defaultNode.code
        selectedAreaName.value = defaultNode.name
        await loadDeptTree(defaultNode.code)
        await nextTick()
        areaTreeRef.value?.setCurrentKey(defaultNode.code)
      }
    }
  } finally {
    areaTreeLoading.value = false
  }
}

const findAreaNode = (nodes: RegionTreeNode[], code: string): RegionTreeNode | null => {
  for (const node of nodes) {
    if (node.code === code) {
      return node
    }
    if (node.children && node.children.length > 0) {
      const child = findAreaNode(node.children, code)
      if (child) {
        return child
      }
    }
  }
  return null
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
  const expandKeys = collectExpandedKeys(areaTree.value, areaKeyword.value)
  defaultExpandedAreaCodes.value = expandKeys

  nextTick(() => {
    if (!areaKeyword.value) {
      areaTreeRef.value?.setCurrentKey(activeAreaCode.value)
    }
  })
}

const handleAreaClick = async (data: RegionTreeNode) => {
  if (!data) return
  
  // 地区模式下，点击即选中
  if (selectMode.value === 'area') {
    activeAreaCode.value = data.code
    selectedAreaName.value = data.name
    await loadDeptTree(data.code)
  } else {
    // 机构模式下，点击只是切换查看的地区，不选中
    if (data.code !== activeAreaCode.value) {
      activeAreaCode.value = data.code
      selectedAreaName.value = data.name
      await loadDeptTree(data.code)
    }
  }
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
    if (selectMode.value === 'org') {
      syncCheckedKeys()
      updateSelectAllState()
    }
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
    const newChecked = new Set([...checkedIds.value, ...allIds])
    checkedIds.value = Array.from(newChecked)
  } else {
    const idsToRemove = new Set(allIds)
    checkedIds.value = checkedIds.value.filter((id) => !idsToRemove.has(id))
  }
  nextTick(() => {
    syncCheckedKeys()
    updateSelectAllState()
  })
}

const handleLevelChange = () => {
  refreshOrgFilter()
}

const updateSelectAllState = () => {
  const allIds = collectAllDeptIds(filteredDeptTree.value)
  if (allIds.length === 0) {
    selectAll.value = false
    return
  }
  const checkedSet = new Set(checkedIds.value)
  selectAll.value = allIds.length > 0 && allIds.every((id) => checkedSet.has(id))
}

const refreshOrgFilter = () => {
  filteredDeptTree.value = applyDeptFilters(deptTree.value)
  nextTick(() => {
    if (selectMode.value === 'org') {
      syncCheckedKeys()
      updateSelectAllState()
    }
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
          regionPathName: node.regionPathName || ''
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

const updateSelection = (ids: number[]) => {
  checkedIds.value = ids
  updateSelectAllState()
}

const handleOrgCheck = (_: any, data: { checkedKeys: number[] }) => {
  updateSelection(data.checkedKeys ?? [])
}

const handleNodeClick = (data: DeptTreeNode) => {
  if (selectMode.value === 'org') {
    const isChecked = checkedIds.value.includes(data.id)
    if (isChecked) {
      deptTreeRef.value?.setChecked(data.id, false)
      checkedIds.value = checkedIds.value.filter(id => id !== data.id)
    } else {
      deptTreeRef.value?.setChecked(data.id, true)
      checkedIds.value = [...checkedIds.value, data.id]
    }
    updateSelectAllState()
  }
}

const handleModeChange = (mode: SelectMode) => {
  // 切换模式时，重置选择
  if (mode === 'area') {
    // 切换到地区模式，清空机构选择
    checkedIds.value = []
    selectAll.value = false
  } else {
    // 切换到机构模式，保持当前地区，但允许选择机构
    // 不清空 activeAreaCode，以便显示机构列表
  }
  
  nextTick(() => {
    if (mode === 'org' && activeAreaCode.value) {
      syncCheckedKeys()
      updateSelectAllState()
    }
  })
}

const handleCancel = () => {
  innerVisible.value = false
}

const handleConfirm = () => {
  if (selectMode.value === 'area') {
    // 地区模式：返回地区代码和名称
    emit('confirm', {
      mode: 'area',
      areaCode: activeAreaCode.value,
      areaName: selectedAreaName.value
    })
  } else {
    // 机构模式：返回机构ID列表和详情
    const ids = [...checkedIds.value]
    const details = collectDetailsFromTree(ids)
    emit('confirm', {
      mode: 'org',
      orgIds: ids,
      orgDetails: details
    })
  }
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
      // 重置为初始状态
      selectMode.value = props.defaultMode
      activeAreaCode.value = props.defaultAreaCode || ''
      checkedIds.value = [...props.defaultOrgIds]
      selectAll.value = false
      
      // 加载区域树
      await loadAreaTree()
      
      await nextTick()
      if (selectMode.value === 'org') {
        syncCheckedKeys()
        updateSelectAllState()
      }
    }
  }
)

watch(orgKeyword, () => {
  refreshOrgFilter()
})

watch(areaKeyword, () => {
  handleAreaSearch()
})
</script>

<style lang="scss">
.el-dialog.statistics-area-org-selector {
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
.statistics-area-org-selector {
  .selector-body {
    flex: 1 1 0%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
    max-height: 100%;
    gap: 16px;
  }

  // 模式切换区域
  .mode-switch {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-radius: 12px;
    border: 1px solid #bae6fd;

    :deep(.el-radio-group) {
      flex-shrink: 0;
    }

    :deep(.el-radio-button__inner) {
      border-radius: 8px !important;
      padding: 8px 16px;
      font-weight: 500;
    }
  }

  .mode-tip {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #0369a1;

    .tip-icon {
      font-size: 16px;
      color: #0ea5e9;
      flex-shrink: 0;
    }
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

  .selected-icon {
    font-size: 18px;
    color: #2563eb;
    animation: scaleIn 0.3s ease;
  }

  @keyframes scaleIn {
    from {
      transform: scale(0);
    }
    to {
      transform: scale(1);
    }
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
  }
  
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
  
  :deep(.el-tree-node__content:has(.area-node.is-special)) {
    background: rgba(251, 191, 36, 0.06);
    border-left: 2px solid rgba(245, 158, 11, 0.4);
    padding-left: 10px;
    
    &:hover {
      background: rgba(251, 191, 36, 0.1);
      border-left-color: rgba(245, 158, 11, 0.6);
    }
    
    .area-label {
      color: #b45309;
      font-weight: 600;
    }
  }
  
  :deep(.el-tree-node__content:has(.area-node.is-special.is-active)) {
    background: linear-gradient(
      135deg,
      rgba(251, 191, 36, 0.2) 0%,
      rgba(254, 243, 199, 0.25) 50%,
      rgba(252, 211, 77, 0.15) 100%
    );
    border-left: 3px solid rgba(245, 158, 11, 0.9);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
  }
}
</style>

