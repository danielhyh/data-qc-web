<template>
  <Dialog
    v-model="innerVisible"
    title="配置可填报机构"
    width="1280px"
    class="report-zone-org-selector"
  >
    <div class="selector-body">
      <div class="selector-row">
        <!-- 左侧：地区选择 -->
        <div class="selector-panel area-panel">
          <div class="panel-header theme-blue">
            <div class="panel-title">
              <Icon icon="material-symbols:public" class="panel-icon" style="color: #2563eb" />
              <span class="panel-title-text">地区</span>
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
          <el-tabs v-model="activeTab" class="org-tabs">
            <!-- Tab 1: 可选机构 -->
            <el-tab-pane name="available">
              <template #label>
                <span class="tab-label">
                  <Icon icon="ep:office-building" class="mr-4px" />
                  可选机构
                </span>
              </template>

              <div class="panel-header panel-header-vertical theme-green">
                <div class="org-header-row">
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
                  <span class="filter-label">机构等级:</span>
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

                <div v-else class="table-container">
                  <el-table
                    ref="deptTableRef"
                    :data="filteredDeptTree"
                    row-key="id"
                    empty-text="该地区暂无机构"
                    class="dept-table"
                    height="400"
                    @selection-change="handleSelectionChange"
                  >
                    <el-table-column type="selection" width="55" />
              <el-table-column prop="name" label="机构名称" min-width="200">
                <template #default="{ row }">
                  <div class="dept-node">
                    <el-tooltip
                      :content="getInstitutionCategoryLabel(row.institutionCategory)"
                      placement="top"
                    >
                      <DictIcon
                        :dict-type="DICT_TYPE.INSTITUTION_CATEGORY"
                        :value="row.institutionCategory ?? ''"
                        :size="16"
                        default-color="#5b8def"
                        class="dept-icon"
                      />
                    </el-tooltip>
                    <span class="dept-name">{{ row.name }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="hospitalLevel" label="机构等级" width="100">
                <template #default="{ row }">
                  <dict-tag
                    v-if="row.hospitalLevel != null"
                    :type="DICT_TYPE.INSTITUTION_LEVEL"
                    :value="row.hospitalLevel"
                    size="small"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="regionPathName" label="所在地区" min-width="180" show-overflow-tooltip />
            </el-table>
            <!-- 分页组件 -->
            <div class="pagination-wrapper">
              <el-pagination
                v-if="total > 0"
                v-model:current-page="pageNo"
                v-model:page-size="pageSize"
                :total="total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                small
                @size-change="handleSizeChange"
                @current-change="handlePageChange"
              />
            </div>
            </div>
              </div>
            </el-tab-pane>

            <!-- Tab 2: 已选机构 -->
            <el-tab-pane name="selected">
              <template #label>
                <span class="tab-label">
                  <Icon icon="ep:collection" class="mr-4px" />
                  已选机构 ({{ checkedIds.length }})
                </span>
              </template>

              <div class="panel-header theme-green">
                <el-input
                  v-model="selectedKeyword"
                  size="small"
                  placeholder="搜索已选机构"
                  clearable
                  style="width: 300px"
                >
                  <template #prefix>
                    <Icon icon="ep:search" class="text-16px text-gray-500" />
                  </template>
                </el-input>
              </div>

              <div class="panel-body">
                <div v-if="checkedIds.length === 0" class="org-empty-state">
                  <Icon icon="ep:collection" class="empty-icon" />
                  <p>暂未选择任何机构</p>
                </div>

                <div v-else class="selected-org-container">
                  <el-table
                    :data="selectedOrgList"
                    height="400"
                    empty-text="未找到匹配的机构"
                    class="selected-org-table"
                  >
                    <el-table-column prop="name" label="机构名称" min-width="200" show-overflow-tooltip />
                    <el-table-column prop="hospitalLevel" label="机构等级" width="100">
                      <template #default="{ row }">
                        <dict-tag
                          v-if="row.hospitalLevel != null"
                          :type="DICT_TYPE.INSTITUTION_LEVEL"
                          :value="row.hospitalLevel"
                          size="small"
                        />
                      </template>
                    </el-table-column>
                    <el-table-column prop="regionPathName" label="所在地区" min-width="180" show-overflow-tooltip />
                    <el-table-column label="操作" width="80" fixed="right">
                      <template #default="{ row }">
                        <el-button link type="danger" size="small" @click="removeSelected(row.id)">
                          移除
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>

                  <div class="selected-actions">
                    <el-button type="danger" plain size="small" @click="clearAllSelected">
                      <Icon icon="ep:delete" class="mr-4px" />
                      清空所有
                    </el-button>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
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
  hasChildren?: boolean
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
const deptTableRef = ref()

const areaTreeLoading = ref(false)
const deptTreeLoading = ref(false)

const areaKeyword = ref('')
const orgKeyword = ref('')
const selectedLevels = ref<(number | string)[]>([])

// Tab切换状态
const activeTab = ref('available')
const selectedKeyword = ref('') // 已选机构搜索关键词

const areaTree = ref<RegionTreeNode[]>([])
const activeAreaCode = ref<string>('')
const defaultExpandedAreaCodes = ref<string[]>([])
const deptTree = ref<DeptTreeNode[]>([])
const filteredDeptTree = ref<DeptTreeNode[]>([])
const checkedIds = ref<number[]>([])

// 内部维护的已选机构详情缓存
const selectedDetailsCache = ref<Map<number, any>>(new Map())

// 分页相关
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(0)

const levelOptions = computed(() => {
  return getIntDictOptions(DICT_TYPE.INSTITUTION_LEVEL) || []
})

// 已选机构列表(用于"已选机构"Tab显示)
const selectedOrgList = computed(() => {
  // 根据 checkedIds 从缓存中获取详情
  let list = checkedIds.value
    .map(id => selectedDetailsCache.value.get(id))
    .filter(Boolean) // 过滤掉undefined

  // 如果有搜索关键词,进行筛选
  if (selectedKeyword.value.trim()) {
    const keyword = selectedKeyword.value.trim().toLowerCase()
    list = list.filter(item =>
      item.name?.toLowerCase().includes(keyword) ||
      item.regionPathName?.toLowerCase().includes(keyword)
    )
  }

  return list
})

// 获取机构类别标签
const getInstitutionCategoryLabel = (value: string | number | boolean | undefined) => {
  return getDictObj(DICT_TYPE.INSTITUTION_CATEGORY, value)?.label ?? '机构分类'
}

const areaTreeProps = {
  label: 'name',
  children: 'children'
}

const deptTreeProps = {
  label: 'name',
  children: 'children',
  isLeaf: (data: DeptTreeNode) => !data.hasChildren
}

// 是否使用懒加载（无筛选条件时使用懒加载）- 分页模式下不使用懒加载
const useLazyLoad = computed(() => {
  return false
})

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
  } catch (error) {
    console.error('加载地区树失败:', error)
    areaTree.value = []
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
    return
  }
  deptTreeLoading.value = true
  try {
    // 构建分页查询参数
    const params: DeptApi.DeptPageParam = {
      areaCode,
      pageNo: pageNo.value,
      pageSize: pageSize.value
    }

    // 添加搜索条件
    if (orgKeyword.value.trim()) {
      params.name = orgKeyword.value.trim()
    }

    // 添加等级筛选 - 支持多个等级
    if (selectedLevels.value.length > 0) {
      // 如果后端支持数组,直接传数组;如果只支持单个,这里传逗号分隔的字符串
      params.hospitalLevels = selectedLevels.value.map(String)
    }

    // 查询分页数据
    const response = await DeptApi.getDeptPage(params)

    console.log('Page response:', response)

    // 处理响应数据
    const list: DeptTreeNode[] = response.list || []
    total.value = response.total || 0

    deptTree.value = list
    filteredDeptTree.value = list
    console.log('filteredDeptTree', filteredDeptTree.value)

    // 将当前页数据添加到缓存
    list.forEach(item => {
      selectedDetailsCache.value.set(item.id, {
        id: item.id,
        name: item.name,
        hospitalLevel: item.hospitalLevel,
        institutionCategory: item.institutionCategory,
        regionName: item.regionName,
        areaName: item.areaName,
        regionPath: item.regionPath,
        regionPathName: item.regionPathName || ''
      })
    })

    await nextTick()
    syncCheckedKeys()
  } finally {
    deptTreeLoading.value = false
  }
}

// 收集所有节点的ID(支持列表数据)
const collectAllDeptIds = (nodes: DeptTreeNode[]): number[] => {
  return nodes.map(item => item.id)
}

// 处理表格选择变化(单选、全选、取消全选)
const handleSelectionChange = async (rows: DeptTreeNode[]) => {
  // 如果正在同步状态,不处理(避免翻页时错误清空选中状态)
  if (isSyncing.value) {
    return
  }

  const currentPageIds = filteredDeptTree.value.map(item => item.id)
  const selectedIds = rows.map(row => row.id)

  // 判断是否是全选/取消全选操作
  const isSelectAll = selectedIds.length === filteredDeptTree.value.length && filteredDeptTree.value.length > 0
  const isUnselectAll = selectedIds.length === 0 && currentPageIds.length > 0

  if (isSelectAll || isUnselectAll) {
    // 全选/取消全选:获取所有符合当前筛选条件的机构ID
    const params: DeptApi.DeptPageParam = {
      areaCode: activeAreaCode.value,
      pageNo: 1,
      pageSize: 10
    }

    // 添加搜索条件
    if (orgKeyword.value.trim()) {
      params.name = orgKeyword.value.trim()
    }

    // 添加等级筛选 - 支持多个等级
    if (selectedLevels.value.length > 0) {
      params.hospitalLevels = selectedLevels.value.map(String)
    }

    try {
      const allIds = await DeptApi.getAllDeptIds(params)
      const allIdsSet = new Set(allIds)

      if (isSelectAll) {
        // 全选:合并ID(使用Set自动去重)
        const newIdsSet = new Set([...checkedIds.value, ...allIds])
        checkedIds.value = Array.from(newIdsSet)
      } else {
        // 取消全选:移除符合条件的所有ID
        checkedIds.value = checkedIds.value.filter(id => !allIdsSet.has(id))
      }
    } catch (error) {
      console.error('全选操作失败:', error)
      // 如果API调用失败,至少处理当前页
      if (isSelectAll) {
        const newIdsSet = new Set([...checkedIds.value, ...currentPageIds])
        checkedIds.value = Array.from(newIdsSet)
      } else {
        checkedIds.value = checkedIds.value.filter(id => !currentPageIds.includes(id))
      }
    }

    // 重新同步表格状态
    await nextTick()
    syncCheckedKeys()
  } else {
    // 单选/部分选择:只更新当前页
    const otherPageIds = checkedIds.value.filter(id => !currentPageIds.includes(id))
    checkedIds.value = [...otherPageIds, ...selectedIds]
  }
}

const handleLevelChange = () => {
  // 等级筛选变化时,重置页码并重新加载数据
  pageNo.value = 1
  if (activeAreaCode.value) {
    loadDeptTree(activeAreaCode.value)
  }
}

const refreshOrgFilter = () => {
  // 搜索关键词或等级筛选变化时，重置页码并重新加载数据
  pageNo.value = 1
  if (activeAreaCode.value) {
    loadDeptTree(activeAreaCode.value)
  }
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  pageNo.value = 1
  if (activeAreaCode.value) {
    loadDeptTree(activeAreaCode.value)
  }
}

const handlePageChange = (val: number) => {
  pageNo.value = val
  if (activeAreaCode.value) {
    loadDeptTree(activeAreaCode.value)
  }
}

// 防止在同步选中状态时触发selection-change
const isSyncing = ref(false)

const syncCheckedKeys = async () => {
  // 同步表格选中状态
  if (!deptTableRef.value) return

  isSyncing.value = true

  // 等待DOM完全渲染
  await nextTick()
  await nextTick() // 双重确保

  // 完全清空选中状态,避免状态累积
  deptTableRef.value.clearSelection()

  // 重新设置选中状态
  filteredDeptTree.value.forEach(row => {
    if (checkedIds.value.includes(row.id)) {
      deptTableRef.value.toggleRowSelection(row, true)
    }
  })

  // 延迟重置标志,确保所有事件处理完毕
  setTimeout(() => {
    isSyncing.value = false
  }, 150)
}

const collectDetailsFromTree = (ids: number[]): any[] => {
  const details: any[] = []
  const idSet = new Set(ids)

  // 从列表中收集数据
  deptTree.value.forEach((node) => {
    if (idSet.has(node.id)) {
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
  })

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
}

// 移除单个已选机构
const removeSelected = async (id: number) => {
  checkedIds.value = checkedIds.value.filter(checkedId => checkedId !== id)

  // 如果当前在"可选机构"Tab,需要同步表格状态
  if (activeTab.value === 'available') {
    await nextTick()
    syncCheckedKeys()
  }
}

// 清空所有已选机构
const clearAllSelected = async () => {
  checkedIds.value = []

  // 如果当前在"可选机构"Tab,需要同步表格状态
  if (activeTab.value === 'available') {
    await nextTick()
    syncCheckedKeys()
  }
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
      selectedLevels.value = []  // 重置等级筛选
      orgKeyword.value = ''      // 重置搜索关键词
      selectedKeyword.value = '' // 重置已选机构搜索
      activeTab.value = 'available' // 重置到"可选机构"Tab
      pageNo.value = 1           // 重置页码
      pageSize.value = 10        // 重置每页条数

      // 初始化缓存:从 props.selectedDetails 中加载已选机构详情
      selectedDetailsCache.value = new Map()
      props.selectedDetails.forEach(item => {
        if (item && typeof item.id === 'number') {
          selectedDetailsCache.value.set(item.id, item)
        }
      })

      // 加载区域树(内部会自动加载机构树)
      await loadAreaTree()

      // 确保选中状态正确同步
      await nextTick()
      syncCheckedKeys()
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
      flex: 0 0 35%;
      max-height: 100%;
    }

    &.org-panel {
      flex: 1 1 65%;
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

  .filter-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    white-space: nowrap;
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
    padding: 12px;
    min-height: 0;
    max-height: 100%;
    display: flex;
    flex-direction: column;
  }

  .table-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .pagination-wrapper {
    padding: 12px 0;
    display: flex;
    justify-content: center;
    border-top: 1px solid #ebeef5;
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

  // Tab相关样式
  .org-tabs {
    height: 100%;
    display: flex;
    flex-direction: column;

    :deep(.el-tabs__header) {
      margin: 0;
      padding: 12px 20px 0;
      background: linear-gradient(
        135deg,
        rgba(22, 163, 74, 0.08) 0%,
        rgba(134, 239, 172, 0.06) 50%,
        rgba(240, 253, 244, 0.04) 100%
      );
    }

    :deep(.el-tabs__content) {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    :deep(.el-tab-pane) {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .tab-label {
      display: flex;
      align-items: center;
      font-weight: 500;
    }
  }

  .selected-org-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .selected-org-table {
    flex: 1;
  }

  .selected-actions {
    padding: 12px;
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #ebeef5;
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

// 机构表格样式
.dept-table {
  :deep(.el-table__header) {
    th {
      background-color: #f5f7fa;
    }
  }

  .dept-node {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .dept-icon {
    flex-shrink: 0;
  }

  .dept-name {
    font-weight: 500;
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
  
  // 特殊节点的整行样式 - 轻量化，不那么像选中状态
  :deep(.el-tree-node__content:has(.area-node.is-special)) {
    background: rgba(251, 191, 36, 0.06);
    border-left: 2px solid rgba(245, 158, 11, 0.4);
    padding-left: 10px;
    
    &:hover {
      background: rgba(251, 191, 36, 0.1);
      border-left-color: rgba(245, 158, 11, 0.6);
    }
    
    // 特殊节点的文字颜色
    .area-label {
      color: #b45309;
      font-weight: 600;
    }
  }
  
  // 特殊节点且选中的样式（优先级最高）- 明显区分
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
