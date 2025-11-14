<template>
  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="药品名称" prop="drugName">
        <el-input
          v-model="queryParams.drugName"
          placeholder="请输入药品名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" />
          重置
        </el-button>
        <el-button type="primary" @click="openForm('create')">
          <Icon icon="ep:plus" class="mr-5px" />
          新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <!-- Tab 标签页 -->
  <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
    <el-tab-pane label="全部" name="all" />
    <el-tab-pane
      v-for="category in categoryTabs"
      :key="category"
      :label="category"
      :name="category"
    />

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
      <el-table-column label="序号" type="index" width="80" align="center" />
      <el-table-column
        label="药品名称"
        align="center"
        prop="drugName"
        min-width="150"
        show-overflow-tooltip
      >
        <template #default="scope">
          <span class="font-bold">{{ scope.row.drugName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="剂型规格"
        align="center"
        prop="dosageCategory"
        width="150"
        show-overflow-tooltip
      >
        <template #default="scope">
          {{ scope.row.dosageCategory || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="统计单位" align="center" prop="dosageForm" width="150">
        <template #default="scope">
          <el-tag v-if="scope.row.dosageForm" size="small">{{ scope.row.dosageForm }}</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="0"
            :inactive-value="1"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="sortOrder" width="140">
        <template #default="scope">
          <el-input-number
            v-model="scope.row.sortOrder"
            :min="0"
            :max="999"
            :controls="false"
            size="small"
            @change="handleSortOrderChange(scope.row)"
            style="width: 100px"
          />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="180px">
        <template #default="scope">
          <el-button type="success" size="small" @click="openForm('update', scope.row.id)">
            <Icon icon="ep:edit" class="mr-1" />
            编辑
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(scope.row.id)">
            <Icon icon="ep:delete" class="mr-1" />
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </el-tabs>
  <!-- 表单弹窗：添加/修改 -->
  <DrugCategoryForm ref="formRef" @success="handleFormSuccess" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { DrugCategoryApi, type DrugCategoryVO } from '@/api/shortage/drugcategory'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import DrugCategoryForm from './DrugCategoryForm.vue'

/** 组件名称 */
defineOptions({ name: 'DrugCategoryManagement' })

const message = useMessage()

const loading = ref(true)
const list = ref<DrugCategoryVO[]>([])
const total = ref(0)
const activeTab = ref('all') // 当前激活的tab
const categoryTabs = ref<string[]>([]) // 分类标签列表

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  categoryName: '', // 由 activeTab 控制，不在搜索框显示
  drugName: '',
  status: undefined
})

const queryFormRef = ref()

/** 加载分类标签 */
const loadCategoryTabs = async () => {
  try {
    categoryTabs.value = await DrugCategoryApi.getCategoryNames()
  } catch (error) {
    console.error('加载分类标签失败:', error)
  }
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    // 根据当前 Tab 设置分类筛选条件
    if (activeTab.value === 'all') {
      queryParams.categoryName = ''
    } else {
      queryParams.categoryName = activeTab.value
    }

    const data = await DrugCategoryApi.getPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** Tab切换处理 */
const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
  queryParams.pageNo = 1
  getList()
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryParams.drugName = ''
  queryParams.status = undefined
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id, activeTab.value === 'all' ? '' : activeTab.value)
}

/** 表单提交成功回调 */
const handleFormSuccess = async () => {
  await getList()
  // 重新加载分类标签（可能新增了新分类）
  await loadCategoryTabs()
}

/** 修改状态 */
const handleStatusChange = async (row: DrugCategoryVO) => {
  try {
    const text = row.status === 0 ? '启用' : '停用'
    await message.confirm('确认要"' + text + '""' + row.categoryName + '"吗?')
    await DrugCategoryApi.updateStatus(row.id, row.status)
    message.success('修改成功')
    await getList()
  } catch {
    // 取消后，恢复状态
    row.status = row.status === 0 ? 1 : 0
  }
}

/** 修改排序 */
const handleSortOrderChange = async (row: DrugCategoryVO) => {
  try {
    await DrugCategoryApi.updateSortOrder(row.id, row.sortOrder)
    message.success('排序修改成功')
  } catch (error) {
    message.error('排序修改失败')
    await getList()
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await DrugCategoryApi.delete(id)
    message.success('删除成功')
    await getList()
    // 重新加载分类标签（可能删除后某个分类为空了）
    await loadCategoryTabs()
  } catch {}
}

/** 初始化 **/
onMounted(async () => {
  await loadCategoryTabs()
  await getList()
})
</script>
