<template>
  <div class="region-tree-wrapper">
    <div class="head-container">
      <el-input v-model="regionName" class="mb-20px" clearable placeholder="请输入地区名称">
        <template #prefix>
          <Icon icon="ep:search" />
        </template>
      </el-input>
    </div>
    <div class="tree-scroll-container">
      <el-scrollbar max-height="1000px">
        <el-tree
          ref="treeRef"
          :data="regionList"
          :expand-on-click-node="false"
          :filter-node-method="filterNode"
          :props="defaultProps"
          default-expand-all
          highlight-current
          node-key="id"
          @node-click="handleNodeClick"
        >
          <template #default="{ node, data }">
            <span class="tree-node">
              <Icon :icon="getRegionIcon(data.level)" class="node-icon" />
              <span>{{ node.label }}</span>
            </span>
          </template>
        </el-tree>
      </el-scrollbar>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElTree } from 'element-plus'
import { RegionsApi } from '@/api/system/regions'
import * as AreaOrgApi from '@/api/system/areaOrg'
import { defaultProps, handleTree } from '@/utils/tree'

defineOptions({ name: 'SystemUserRegionTree' })

const regionName = ref('')
const regionList = ref<Tree[]>([]) // 树形结构
const treeRef = ref<InstanceType<typeof ElTree>>()

/** 获得地区树 */
const getTree = async () => {
  try {
    // 直接使用简单列表API
    const res = await RegionsApi.getSimpleRegionsList()
    regionList.value = handleTree(res)

    // 默认选择第一个顶级节点（陕西省）
    nextTick(() => {
      if (regionList.value.length > 0) {
        const firstNode = regionList.value[0]
        treeRef.value?.setCurrentKey(firstNode.id)
        handleNodeClick(firstNode)
      }
    })
  } catch (error) {
    console.error('获取地区树失败:', error)
    regionList.value = []
  }
}

/** 获取地区图标 */
const getRegionIcon = (level: number) => {
  const icons = {
    1: 'ep:location', // 省
    2: 'ep:map-location', // 市
    3: 'ep:place' // 区
  }
  return icons[level] || 'ep:location'
}

/** 基于名字过滤 */
const filterNode = (name: string, data: Tree) => {
  if (!name) return true
  return data.name.includes(name)
}

/** 处理地区被点击 */
const handleNodeClick = async (row: { [key: string]: any }) => {
  emits('node-click', row)
}
const emits = defineEmits(['node-click'])

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
.region-tree-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.head-container {
  flex-shrink: 0;
}

.tree-scroll-container {
  /* 简化样式，让el-scrollbar自己处理滚动 */
}

.tree-node {
  display: flex;
  align-items: center;
  flex: 1;

  .node-icon {
    margin-right: 6px;
    color: var(--el-color-primary);
  }
}
</style>
