<template>
  <div class="region-tree-container" :class="{ 'is-collapsed': isCollapsed }">
    <!-- 现代化头部栏 -->
    <div class="region-header" v-show="!isCollapsed">
      <div class="header-title">
        <Icon icon="material-symbols:public" class="title-icon" />
        <span class="title-text">地区</span>
      </div>
      <el-input
        v-model="regionName"
        size="small"
        placeholder="搜索地区"
        clearable
        class="header-search"
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <Icon icon="ep:search" />
        </template>
      </el-input>
      <!-- 折叠按钮放在搜索框后面 -->
      <el-tooltip v-if="showCollapseButton" :content="'收起地区树'" placement="bottom">
        <el-button
          text
          circle
          size="small"
          @click="toggleCollapse"
          class="collapse-btn"
        >
          <Icon icon="ep:d-arrow-left" :size="16" />
        </el-button>
      </el-tooltip>
    </div>

    <!-- 折叠状态下只显示展开按钮 -->
    <div v-show="isCollapsed" class="collapsed-state">
      <el-tooltip content="展开地区树" placement="right">
        <el-button
          text
          circle
          size="small"
          @click="toggleCollapse"
          class="expand-btn"
        >
          <Icon icon="ep:d-arrow-right" :size="20" />
        </el-button>
      </el-tooltip>
    </div>

    <!-- 树形区域 -->
    <div v-show="!isCollapsed" class="region-body">
      <el-skeleton :loading="loading" animated :count="6" v-if="loading" />
      <el-tree
        v-else
        ref="treeRef"
        :data="regionList"
        :expand-on-click-node="false"
        :filter-node-method="filterNode"
        :props="areaTreeProps"
        :default-expanded-keys="defaultExpandedKeys"
        highlight-current
        node-key="code"
        class="region-tree"
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <span
            class="region-node"
            :class="{
              'is-special': data.nodeType === 'SPECIAL',
              'is-active': node.key === activeCode
            }"
          >
            <DictIcon
              :dict-type="DICT_TYPE.REGION_LEVEL"
              :value="data.level ?? ''"
              :size="16"
              :default-color="data.nodeType === 'SPECIAL' ? '#f59e0b' : '#2563eb'"
              class="region-icon"
            />
            <span class="region-label" :title="node.label">{{ node.label }}</span>
            <template v-if="showOrgCount">
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
            </template>
          </span>
        </template>
      </el-tree>
    </div>

    <!-- 底部固定区域 - 显示当前选中的地区信息 -->
    <div v-show="!isCollapsed" class="region-footer">
      <div class="selected-region-info">
        <Icon icon="ep:location" class="location-icon" />
        <span class="region-text">
          {{ selectedRegionData ? selectedRegionData.name : '全部地区' }}
        </span>
        <span v-if="selectedRegionData" class="region-level-tag">
          {{ getRegionLevelLabel(selectedRegionData.level) }}
        </span>
      </div>
      <el-tooltip v-if="selectedRegionData" content="清除选择" placement="top">
        <span class="clear-btn" @click="handleClear">
          <Icon icon="ep:close" />
        </span>
      </el-tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { ElTree } from 'element-plus'
import * as AreaOrgApi from '@/api/system/areaOrg'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import DictIcon from '@/components/DictIcon'
import { Icon } from '@/components/Icon'

defineOptions({ name: 'SystemUserRegionTree' })

interface Tree {
  code: string
  name: string
  level?: number
  nodeType?: string
  directOrgCount?: number
  totalOrgCount?: number
  children?: Tree[]
  [key: string]: any
}

// 接收props
const props = withDefaults(
  defineProps<{
    autoSelectFirst?: boolean // 是否自动选中第一个节点
    showOrgCount?: boolean // 是否显示机构数量标签
    showCollapseButton?: boolean // 是否显示内部的收起按钮
    selectedRegionData?: any // 当前选中的地区数据（用于底部显示）
  }>(),
  {
    autoSelectFirst: true, // 默认自动选中
    showOrgCount: false, // 默认不显示机构数量
    showCollapseButton: false, // 默认不显示，交由外部控制
    selectedRegionData: null // 默认无选中
  }
)

const regionName = ref('')
const regionList = ref<Tree[]>([]) // 树形结构
const treeRef = ref<InstanceType<typeof ElTree>>()
const loading = ref(false)
const activeCode = ref<string>('')
const defaultExpandedKeys = ref<string[]>([]) // 默认展开的节点

// 折叠状态 - 从 localStorage 读取
const STORAGE_KEY = 'region-tree-collapsed'
const isCollapsed = ref<boolean>(localStorage.getItem(STORAGE_KEY) === 'true')

// 地区树属性配置
const areaTreeProps = {
  label: 'name',
  children: 'children'
}

/** 收集默认展开的节点（只展开省级，显示到市级） */
const collectExpandKeys = (nodes: Tree[]): string[] => {
  const keys: string[] = []
  nodes.forEach((item) => {
    // 只展开省级节点（level 1），这样市级节点可见但不展开
    if (item.level === 1) {
      keys.push(item.code)
    }
  })
  return keys
}

/** 获得地区树 */
const getTree = async () => {
  loading.value = true
  try {
    // 使用带机构数量的地区树API
    const res = await AreaOrgApi.getAreaTree()
    regionList.value = res || []

    // 收集默认展开的节点（展开到市级）
    defaultExpandedKeys.value = collectExpandKeys(regionList.value)

    // 只有在autoSelectFirst为true时才默认选择第一个顶级节点
    if (props.autoSelectFirst) {
      nextTick(() => {
        if (regionList.value.length > 0) {
          const firstNode = regionList.value[0]
          activeCode.value = firstNode.code
          treeRef.value?.setCurrentKey(firstNode.code) // 使用code作为key
          handleNodeClick(firstNode)
        }
      })
    }
  } catch (error) {
    console.error('获取地区树失败:', error)
    regionList.value = []
  } finally {
    loading.value = false
  }
}

/** 基于名字过滤 */
const filterNode = (name: string, data: Tree) => {
  if (!name) return true
  return data.name.includes(name)
}

/** 搜索处理 */
const handleSearch = () => {
  treeRef.value?.filter(regionName.value)
}

/** 处理地区被点击 */
const handleNodeClick = async (row: { [key: string]: any }) => {
  activeCode.value = row.code
  emits('node-click', row)
}
const emits = defineEmits(['node-click', 'clear'])

/** 清除选中状态 */
const clearSelection = () => {
  activeCode.value = ''
  treeRef.value?.setCurrentKey(undefined)
}

/** 切换折叠状态 */
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  // 持久化到 localStorage
  localStorage.setItem(STORAGE_KEY, String(isCollapsed.value))
}

/** 判断是否显示直属机构数量 */
const hasDirectCount = (node: Tree) => (node.directOrgCount ?? 0) > 0

/** 判断是否显示总机构数量 */
const hasTotalCount = (node: Tree) => {
  if (!node.children || node.children.length === 0) return false
  const total = node.totalOrgCount ?? 0
  const direct = node.directOrgCount ?? 0
  return total > direct
}

/** 获取地区级别的文字标签 */
const getRegionLevelLabel = (level: number | undefined) => {
  if (level === undefined || level === null) return ''
  return getDictLabel(DICT_TYPE.REGION_LEVEL, level) || ''
}

/** 清除选中并通知父组件 */
const handleClear = () => {
  clearSelection()
  emits('clear')
}

/** 暴露方法给父组件 */
defineExpose({
  clearSelection,
  toggleCollapse,
  isCollapsed
})

/** 监听regionName */
watch(regionName, (val) => {
  treeRef.value!.filter(val)
})

/** 初始化 */
onMounted(async () => {
  await getTree()
})
</script>

<style scoped lang="scss">
.region-tree-container {
  height: 100%; // 自适应父容器高度
  min-width: 250px;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(229, 231, 235, 0.8);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  // 折叠状态 - 只显示展开按钮
  &.is-collapsed {
    min-width: 50px;
    max-width: 50px;
  }
}

// 折叠状态下只显示展开按钮
.collapsed-state {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 16px 0;
  height: 100%;

  .expand-btn {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.08) 100%);
    border: 1px solid rgba(59, 130, 246, 0.2);
    transition: all 0.3s ease;

    &:hover {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 197, 253, 0.12) 100%);
      border-color: rgba(59, 130, 246, 0.4);
      color: #2563eb;
      transform: scale(1.15);
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

.region-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.08) 0%,
    rgba(147, 197, 253, 0.06) 50%,
    rgba(239, 246, 255, 0.04) 100%
  );
  box-shadow: 0 1px 0 rgba(37, 99, 235, 0.1);
  border-radius: 12px 12px 0 0;

  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    flex-shrink: 0;

    .title-icon {
      font-size: 18px;
      color: #2563eb;
    }

    .title-text {
      white-space: nowrap;
    }
  }

  .header-search {
    width: 180px;
  }
}

.region-body {
  flex: 1 1 0%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
  min-height: 0;
  max-height: 100%;
}

.region-node {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  transition: all 0.2s ease;

  .region-icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  .region-label {
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
    font-size: 11px;
    gap: 2px;
    font-weight: 500;
    flex-shrink: 0;

    &.direct {
      background: rgba(59, 130, 246, 0.1);
      color: #2563eb;
    }

    &.total {
      background: rgba(56, 189, 248, 0.12);
      color: #0ea5e9;
    }
  }
}

// 树节点样式
.region-tree {
  background: transparent;

  :deep(.el-tree-node__content) {
    border-radius: 8px;
    margin: 4px 0;
    padding: 10px 14px;
    min-height: 35px;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: rgba(59, 130, 246, 0.06);
      transform: translateX(2px);
    }
  }

  // 选中节点的整行样式
  :deep(.el-tree-node__content:has(.region-node.is-active)) {
    background: linear-gradient(
      135deg,
      rgba(59, 130, 246, 0.15) 0%,
      rgba(147, 197, 253, 0.1) 50%,
      rgba(59, 130, 246, 0.08) 100%
    );
    box-shadow: inset 3px 0 0 0 rgba(59, 130, 246, 0.6), 0 2px 8px rgba(59, 130, 246, 0.15);
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
  :deep(.el-tree-node__content:has(.region-node.is-special)) {
    background: rgba(251, 191, 36, 0.06);
    border-left: 2px solid rgba(245, 158, 11, 0.4);
    padding-left: 12px;

    &:hover {
      background: rgba(251, 191, 36, 0.1);
      border-left-color: rgba(245, 158, 11, 0.6);
    }

    // 特殊节点的文字颜色
    .region-label {
      color: #b45309;
      font-weight: 600;
    }
  }

  // 特殊节点且选中的样式（优先级最高）- 明显区分
  :deep(.el-tree-node__content:has(.region-node.is-special.is-active)) {
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

:deep(.el-skeleton) {
  flex: 1;
  padding: 0;
}

:deep(.el-skeleton__item) {
  margin: 6px 0;
}

// 折叠按钮样式（仅当showCollapseButton为true时显示）
.collapse-btn {
  flex-shrink: 0;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #2563eb;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
}

// 底部固定区域
.region-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(59, 130, 246, 0.04);
  border-top: 1px solid var(--el-border-color-lighter);

  .selected-region-info {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;

    .location-icon {
      font-size: 14px;
      color: #2563eb;
    }

    .region-text {
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .region-level-tag {
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 11px;
      background: rgba(59, 130, 246, 0.08);
      color: #3b82f6;
    }
  }

  .clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.2s;

    &:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }
  }
}
</style>
