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
      <el-form-item label="区划代码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入区划代码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="地区名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入地区名称"
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
            :columns="columns"
            :data="treeList"
            :width="width"
            :height="height"
            :expand-column-key="expandColumnKey"
          />
        </template>
      </el-auto-resizer>
    </div>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <RegionsForm ref="formRef" @success="getList" />
</template>

<script setup lang="tsx">
import { Column } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { defaultProps, handleTree } from '@/utils/tree'
import download from '@/utils/download'
import { RegionsApi, RegionsVO } from '@/api/system/regions'
import RegionsForm from './RegionsForm.vue'

/** 地区 列表 */
defineOptions({ name: 'Regions' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

// 表格的 column 字段
const columns: Column[] = [
  {
    dataKey: 'code',
    title: '区划代码',
    width: 150,
    fixed: true,
    key: 'id'
  },
  {
    dataKey: 'name',
    title: '地区名称',
    width: 200
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
    dataKey: 'actions',
    title: '操作',
    width: 150,
    fixed: 'right',
    cellRenderer: ({ rowData }: any) => (
      <div>
        <el-button
          link
          type="primary"
          onClick={() => openForm('update', rowData.id)}
        >
          编辑
        </el-button>
        <el-button
          link
          type="danger"
          onClick={() => handleDelete(rowData.id)}
        >
          删除
        </el-button>
      </div>
    )
  }
]

const loading = ref(true) // 列表的加载中
const list = ref<RegionsVO[]>([]) // 列表的数据
const treeList = ref<Tree[]>([]) // 树形列表数据
const total = ref(0) // 列表的总页数
const expandColumnKey = ref('id') // 展开列的key
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

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    // 获取树状数据用于虚拟化表格展示
    const { pageNo, pageSize, ...params } = queryParams
    const data = await RegionsApi.getRegionsPage({ ...params, pageNo: 1, pageSize: -1 })
    list.value = data.list
    treeList.value = handleTree(data.list)
    total.value = data.list.length
  } finally {
    loading.value = false
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

/** 添加/修改操作 */
const formRef = ref()
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
