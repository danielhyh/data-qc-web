<!--地区管理页面-->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="地区名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入地区名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="节点编码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入节点编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="地区等级" prop="level">
        <el-select v-model="queryParams.level" placeholder="请选择地区等级" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.REGION_LEVEL)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          @click="openForm('create')"
          v-hasPermi="['system:regions:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button plain type="danger" @click="toggleExpandAll">
          <Icon icon="ep:sort" class="mr-5px" /> 展开/折叠
        </el-button>
        <el-button
          type="success"
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['system:regions:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <div style="width: 100%; height: 700px">
      <!-- AutoResizer 自动调节大小 -->
      <el-auto-resizer>
        <template #default="{ height, width }">
          <!-- Virtualized Table 虚拟化表格：高性能，解决表格在大数据量下的卡顿问题 -->
          <el-table-v2
            v-loading="loading"
            v-model:expanded-row-keys="expandedRowKeys"
            :columns="columns"
            :data="treeList"
            :width="width"
            :height="height"
            :expand-column-key="expandColumnKey"
            :row-class="getRowClass"
            row-key="id"
          />
        </template>
      </el-auto-resizer>
    </div>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <RegionsForm ref="formRef" @success="getList" />
</template>

<script setup lang="tsx">
import { resolveComponent } from 'vue'
import { Column, ElInputNumber, TableV2FixedDir } from 'element-plus'
import { DICT_TYPE, getDictObj, getIntDictOptions } from '@/utils/dict'
import { handleTree } from '@/utils/tree'
import download from '@/utils/download'
import { RegionsApi, RegionsVO } from '@/api/system/regions'
import RegionsForm from './RegionsForm.vue'
import DictIcon from '@/components/DictIcon'

/** 地区 列表 */
defineOptions({ name: 'Regions' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const Icon = resolveComponent('Icon') as any

const sortRegions = (data: RegionsVO[]): RegionsVO[] => {
  return [...data].sort((a, b) => {
    const orderA = Number(a.sortOrder ?? 0)
    const orderB = Number(b.sortOrder ?? 0)
    if (orderA !== orderB) {
      return orderA - orderB
    }
    const levelA = Number(a.level ?? 0)
    const levelB = Number(b.level ?? 0)
    if (levelA !== levelB) {
      return levelA - levelB
    }
    return Number(a.id ?? 0) - Number(b.id ?? 0)
  })
}

const list = ref<RegionsVO[]>([])
const treeList = ref<any[]>([])
const updatingSortId = ref<number | null>(null)
const editingSortCache = ref<Map<number, number>>(new Map())
const expandedRowKeys = ref<number[]>([])
const isExpandAll = ref(false)

/** 获取行的 class，特殊节点使用金色主题 */
const getRowClass = ({ rowData }: { rowData: RegionsVO }) => {
  return rowData.nodeType === 'SPECIAL' ? 'special-node-row' : ''
}

const renderNameCell = ({ rowData }: { rowData: RegionsVO }) => {
  const dict = getDictObj(DICT_TYPE.REGION_LEVEL, rowData.level)
  const tooltip = dict?.label || (rowData.nodeType === 'SPECIAL' ? '特殊节点' : '行政区划')
  const defaultColor = rowData.nodeType === 'SPECIAL' ? '#f59e0b' : '#2563eb'
  return (
    <div class="flex items-center gap-6px">
      <el-tooltip content={tooltip} placement="top">
        <DictIcon dictType={DICT_TYPE.REGION_LEVEL} value={rowData.level ?? ''} size={16} defaultColor={defaultColor} />
      </el-tooltip>
      <span class="font-bold">{rowData.name}</span>
    </div>
  )
}

const renderNodeTypeCell = ({ rowData }: { rowData: RegionsVO }) => {
  const isSpecial = rowData.nodeType === 'SPECIAL'
  return <span>{isSpecial ? '特殊节点' : '行政区划'}</span>
}

const renderSortOrderCell = ({ rowData }: { rowData: RegionsVO }) => {
  const isUpdating = updatingSortId.value === rowData.id
  const currentValue = editingSortCache.value.get(rowData.id) ?? rowData.sortOrder ?? 0
  
  return (
    <div class="sort-order-cell">
      <ElInputNumber
        modelValue={currentValue}
        min={0}
        max={9999}
        step={1}
        controls={false}
        size="small"
        class={`sort-order-input ${isUpdating ? 'is-updating' : ''}`}
        disabled={isUpdating}
        onUpdate:modelValue={(value) => {
          editingSortCache.value.set(rowData.id, Number(value ?? 0))
        }}
        onBlur={() => handleSortOrderSave(rowData)}
        onKeydown={(e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            ;(e.target as HTMLInputElement)?.blur()
          }
        }}
      />
      {isUpdating && (
        <Icon icon="line-md:loading-twotone-loop" class="sort-order-loading" />
      )}
    </div>
  )
}

// 表格的 column 字段
const columns: Column[] = [
  {
    dataKey: 'name',
    title: '地区名称',
    width: 220,
    fixed: true,
    key: 'name',
    cellRenderer: renderNameCell
  },
  {
    dataKey: 'code',
    title: '节点编码',
    width: 160
  },
  {
    dataKey: 'level',
    title: '地区等级',
    width: 120,
    cellRenderer: ({ cellData }: any) => {
      const dictOptions = getIntDictOptions(DICT_TYPE.REGION_LEVEL)
      const dict = dictOptions.find(item => item.value === cellData)
      return dict ? dict.label : cellData
    }
  },
  {
    dataKey: 'nodeType',
    title: '节点类型',
    width: 160,
    cellRenderer: renderNodeTypeCell
  },
  {
    dataKey: 'sortOrder',
    title: '排序号',
    width: 140,
    cellRenderer: renderSortOrderCell
  },
  {
    dataKey: 'actions',
    title: '操作',
    width: 220,
    fixed: TableV2FixedDir.RIGHT,
    cellRenderer: ({ rowData }: { rowData: RegionsVO }) => (
      <div class="action-links">
        <el-button type="success" size="small" onClick={() => openForm('update', rowData.id)}>
          <Icon icon="ep:edit" class="mr-1" />
          编辑
        </el-button>
        <el-button type="danger" size="small" onClick={() => handleDelete(rowData.id)}>
          <Icon icon="ep:delete" class="mr-1" />
          删除
        </el-button>
      </div>
    )
  }
]

const loading = ref(true) // 列表的加载中
const expandColumnKey = ref('name') // 展开列的key
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  parentId: undefined,
  code: undefined,
  name: undefined,
  level: undefined,
  createTime: [],
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中
const formRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const { pageNo, pageSize, ...params } = queryParams
    const data = await RegionsApi.getRegionsPage({ ...params, pageNo: 1, pageSize: -1 })
    const normalizedList = (data.list ?? []).map(item => ({
      ...item,
      nodeType: item.nodeType || 'NORMAL',
      sortOrder: Number(item.sortOrder ?? 0)
    }))
    list.value = sortRegions(normalizedList)
    treeList.value = handleTree(list.value)
    // 清空编辑缓存
    editingSortCache.value.clear()
  } finally {
    loading.value = false
  }
}

/** 保存排序号（失焦/回车时触发） */
async function handleSortOrderSave(rowData: RegionsVO) {
  const newValue = editingSortCache.value.get(rowData.id)
  // 没有编辑过或值未变化，不触发保存
  if (newValue === undefined || newValue === rowData.sortOrder) {
    editingSortCache.value.delete(rowData.id)
    return
  }
  
  const sanitized = Math.max(0, Math.floor(newValue))
  updatingSortId.value = rowData.id
  
  try {
    const payload = { ...rowData, sortOrder: sanitized }
    await RegionsApi.updateRegions(payload)
    
    // 更新本地数据
    const target = list.value.find(item => item.id === rowData.id)
    if (target) {
      target.sortOrder = sanitized
    }
    
    // 重新排序和构建树
    list.value = sortRegions(list.value)
    treeList.value = handleTree(list.value)
    
    editingSortCache.value.delete(rowData.id)
    message.success('排序已更新')
  } catch (error) {
    message.error('排序更新失败')
    // 失败时恢复缓存，让用户看到刚才输入的值
    editingSortCache.value.set(rowData.id, newValue)
  } finally {
    updatingSortId.value = null
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 展开/折叠操作 */
const toggleExpandAll = () => {
  if (!isExpandAll.value) {
    // 展开所有：收集所有节点 ID
    const allIds: number[] = []
    const collectIds = (items: any[]) => {
      items.forEach(item => {
        allIds.push(item.id)
        if (item.children && item.children.length > 0) {
          collectIds(item.children)
        }
      })
    }
    collectIds(treeList.value)
    expandedRowKeys.value = allIds
  } else {
    // 折叠所有
    expandedRowKeys.value = []
  }
  isExpandAll.value = !isExpandAll.value
}

/** 添加/修改操作 */
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await RegionsApi.deleteRegions(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await RegionsApi.exportRegions(queryParams)
    download.excel(data, '地区.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

<style lang="scss">
// 特殊节点整行金色主题（不使用 scoped，让样式能应用到虚拟表格）
.special-node-row {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%) !important;
  border-left: 3px solid #f59e0b !important;
  
  // 所有单元格统一样式
  .el-table-v2__row-cell {
    background: transparent !important;
    color: #78350f !important;
    font-weight: 500 !important;
  }
}
</style>

<style scoped lang="scss">
.sort-order-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-order-input {
  width: 110px;
  transition: all 0.2s ease;
  
  &:focus-within {
    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }
  }
  
  &.is-updating {
    opacity: 0.6;
  }
}

.sort-order-loading {
  color: var(--el-color-primary);
  font-size: 16px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
