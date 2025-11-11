<template>
  <div class="region-org-tree-container" :class="{ 'is-collapsed': isCollapsed }">
    <!-- 现代化头部栏 -->
    <div class="tree-header" v-show="!isCollapsed">
      <div class="header-title">
        <Icon icon="material-symbols:account-tree-rounded" class="title-icon" />
        <span class="title-text">地区/机构</span>
      </div>
      <el-input
        v-model="searchText"
        size="small"
        placeholder="搜索地区或机构"
        clearable
        class="header-search"
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <Icon icon="ep:search" />
        </template>
      </el-input>
      <!-- 折叠按钮 -->
      <el-tooltip v-if="showCollapseButton" :content="'收起'" placement="bottom">
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
      <el-tooltip content="展开" placement="right">
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
    <div v-show="!isCollapsed" class="tree-body">
      <el-skeleton :loading="loading" animated :count="6" v-if="loading" />
      <el-tree
        v-else
        ref="treeRef"
        :data="rootNodes"
        :expand-on-click-node="false"
        :filter-node-method="filterNode"
        :props="defaultProps"
        :load="loadNode"
        :default-expanded-keys="defaultExpandedKeys"
        lazy
        highlight-current
        node-key="id"
        class="region-org-tree"
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <span
            class="tree-node"
            :class="{
              'is-region': data.type === 'region',
              'is-org': data.type === 'org',
              'is-active': node.key === activeNodeKey
            }"
          >
            <!-- 地区节点图标 -->
            <DictIcon
              v-if="data.type === 'region'"
              :dict-type="DICT_TYPE.REGION_LEVEL"
              :value="data.level ?? ''"
              :size="16"
              default-color="#2563eb"
              class="node-icon"
            />
            <!-- 机构节点图标 -->
            <DictIcon
              v-else-if="data.type === 'org'"
              :dict-type="DICT_TYPE.INSTITUTION_CATEGORY"
              :value="data.institutionCategory ?? ''"
              :size="16"
              default-color="#5b8def"
              class="node-icon"
            />
            <span class="node-label" :title="data.name">{{ data.name }}</span>
            <!-- 用户数量标签（仅机构节点） -->
            <span v-if="data.type === 'org' && data.userCount !== undefined" class="count-chip">
              <Icon icon="ep:user" class="mr-4px" />
              {{ data.userCount }}
            </span>
            <!-- 机构数量标签（仅地区节点） -->
            <template v-if="data.type === 'region'">
              <el-tooltip
                v-if="data.directOrgCount > 0"
                content="该地区直属机构数量"
                placement="top"
              >
                <span class="count-chip direct">
                  <Icon icon="ep:office-building" class="mr-4px" />
                  {{ data.directOrgCount }}
                </span>
              </el-tooltip>
              <el-tooltip
                v-if="data.totalOrgCount > data.directOrgCount"
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
        <template #empty>
          <div class="empty-state">
            <Icon icon="ep:document-delete" class="empty-icon" />
            <p>暂无数据</p>
          </div>
        </template>
      </el-tree>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { ElTree } from 'element-plus'
import * as AreaOrgApi from '@/api/system/areaOrg'
import * as DeptApi from '@/api/system/dept'
import { DICT_TYPE } from '@/utils/dict'
import DictIcon from '@/components/DictIcon'
import { Icon } from '@/components/Icon'

defineOptions({ name: 'SystemUserRegionOrgTree' })

interface TreeNode {
  nodeKey: string
  name: string
  label: string
  nodeType: 'region' | 'org'
  code?: string // 地区代码
  level?: number // 地区级别
  directOrgCount?: number
  totalOrgCount?: number
  id?: number // 机构ID
  institutionCategory?: string // 机构类别
  userCount?: number // 用户数量
  children?: TreeNode[]
  hasChildren?: boolean // 是否有子节点（用于懒加载）
  [key: string]: any
}

// 接收props
const props = withDefaults(
  defineProps<{
    autoSelectFirst?: boolean // 是否自动选中第一个节点
    showCollapseButton?: boolean // 是否显示内部的收起按钮
  }>(),
  {
    autoSelectFirst: false, // 默认不自动选中
    showCollapseButton: false // 默认不显示，交由外部控制
  }
)

const searchText = ref('')
const rootNodes = ref<any[]>([])
const treeRef = ref<InstanceType<typeof ElTree>>()
const loading = ref(false)
const activeNodeKey = ref<string>('')
const defaultExpandedKeys = ref<string[]>([])

// 折叠状态
const STORAGE_KEY = 'region-org-tree-collapsed'
const isCollapsed = ref<boolean>(localStorage.getItem(STORAGE_KEY) === 'true')

// 树属性配置
const defaultProps = {
  label: 'name',
  isLeaf: 'leaf'
}

/** 获得地区树顶级节点 */
const getTree = async () => {
  loading.value = true
  try {
    const res = await AreaOrgApi.getAreaTreeLazy()
    // 直接使用后端返回的数据，添加唯一 id
    rootNodes.value = (res || []).map((region, index) => ({
      ...region,
      id: `region_${region.code}`,
      type: 'region',
      leaf: false // 地区节点不是叶子
    }))

    // 默认展开所有根节点
    defaultExpandedKeys.value = rootNodes.value.map(node => node.id)
  } catch (error) {
    console.error('获取地区树失败:', error)
    rootNodes.value = []
  } finally {
    loading.value = false
  }
}

/** 懒加载节点 */
const loadNode = async (node: any, resolve: any) => {
  // 根节点不需要加载
  if (node.level === 0) {
    resolve([])
    return
  }

  const data = node.data
  if (!data || !data.code) {
    resolve([])
    return
  }

  try {
    const children: any[] = []

    // 1. 加载子地区
    const subRegions = await AreaOrgApi.getAreaChildren(data.code)
    const regionNodes = (subRegions || []).map(region => ({
      ...region,
      id: `region_${region.code}`,
      type: 'region',
      leaf: false
    }))
    children.push(...regionNodes)

    // 2. 加载该地区的机构
    const orgList = await DeptApi.getDeptPage({
      pageNo: 1,
      pageSize: -1,
      areaCode: data.code
    })
    const orgNodes = (orgList || []).map(org => ({
      ...org,
      id: `org_${org.id}`,
      type: 'org',
      leaf: true,
      institutionCategory: org.institutionCategory
    }))
    children.push(...orgNodes)

    resolve(children)
  } catch (error) {
    console.error('加载子节点失败:', error)
    resolve([])
  }
}

/** 处理节点被点击 */
const handleNodeClick = async (data: TreeNode) => {
  activeNodeKey.value = data.nodeKey
  emits('node-click', data)
}
const emits = defineEmits(['node-click'])

/** 清除选中状态 */
const clearSelection = () => {
  activeNodeKey.value = ''
  treeRef.value?.setCurrentKey(undefined)
}

/** 切换折叠状态 */
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  // 持久化到 localStorage
  localStorage.setItem(STORAGE_KEY, String(isCollapsed.value))
}

/** 基于名字过滤 */
const filterNode = (value: string, data: any) => {
  if (!value) return true
  return data.name.includes(value)
}

/** 搜索处理 */
const handleSearch = () => {
  treeRef.value?.filter(searchText.value)
}

/** 暴露方法给父组件 */
defineExpose({
  clearSelection,
  toggleCollapse,
  isCollapsed
})

/** 监听searchText */
watch(searchText, (val) => {
  treeRef.value!.filter(val)
})

/** 初始化 */
onMounted(async () => {
  await getTree()
})
</script>

<style scoped lang="scss">
.region-org-tree-container {
  height: 100%;
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

.tree-header {
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

.tree-body {
  flex: 1 1 0%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
  min-height: 0;
  max-height: 100%;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  transition: all 0.2s ease;

  .node-icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  .node-label {
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
    background: rgba(59, 130, 246, 0.1);
    color: #2563eb;

    &.direct {
      background: rgba(59, 130, 246, 0.1);
      color: #2563eb;
    }

    &.total {
      background: rgba(56, 189, 248, 0.12);
      color: #0ea5e9;
    }
  }

  // 机构节点样式调整
  &.is-org {
    .node-label {
      font-weight: 500;
    }
  }
}

// 树节点样式
.region-org-tree {
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
  :deep(.el-tree-node__content:has(.tree-node.is-active)) {
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
}

:deep(.el-skeleton) {
  flex: 1;
  padding: 0;
}

:deep(.el-skeleton__item) {
  margin: 6px 0;
}

// 空状态样式
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
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
</style>
