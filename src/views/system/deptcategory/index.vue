<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="80px"
    >
      <el-form-item label="分类名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入分类名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="分类编码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入分类编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable class="!w-120px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
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
          v-hasPermi="['system:dept-category:create']"
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
          v-hasPermi="['system:dept-category:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      :show-overflow-tooltip="true"
      row-key="id"
      :default-expand-all="isExpandAll"
      v-if="refreshTable"
    >
      <el-table-column label="分类名称" align="left" prop="name" min-width="200">
        <template #default="scope">
          <span class="font-bold">{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="分类编码" align="center" prop="code" width="150" />
      <el-table-column label="层级" align="center" prop="level" width="80" />
      <el-table-column label="排序号" align="center" prop="sortOrder" width="140">
        <template #default="scope">
          <el-input-number
            v-model="scope.row.sortOrder"
            :min="0"
            :max="9999"
            controls-position="right"
            class="!w-100px"
            @change="handleSortChange(scope.row)"
            v-hasPermi="['system:dept-category:update']"
          />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="0"
            :inactive-value="1"
            @change="handleStatusChange(scope.row)"
            v-hasPermi="['system:dept-category:update']"
          />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="操作" align="center" width="270" fixed="right">
        <template #default="scope">
          <el-button
            type="primary"
            size="small"
            @click="openForm('create', undefined, scope.row.id)"
            v-hasPermi="['system:dept-category:create']"
          >
            <Icon icon="ep:plus" class="mr-1" />
            新增
          </el-button>
          <el-button
            type="success"
            size="small"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['system:dept-category:update']"
          >
            <Icon icon="ep:edit" class="mr-1" />
            编辑
          </el-button>
          <el-button
            type="danger"
            size="small"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['system:dept-category:delete']"
          >
            <Icon icon="ep:delete" class="mr-1" />
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <DeptCategoryForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { handleTree } from '@/utils/tree'
import download from '@/utils/download'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { DeptCategoryApi, DeptCategoryVO } from '@/api/system/deptcategory'
import DeptCategoryForm from './DeptCategoryForm.vue'

/** 机构分类字典 列表 */
defineOptions({ name: 'DeptCategory' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<DeptCategoryVO[]>([]) // 列表的数据
const queryParams = reactive({
  code: undefined,
  name: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DeptCategoryApi.getDeptCategoryList(queryParams)
    list.value = handleTree(data, 'id', 'parentId')
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
const openForm = (type: string, id?: number, parentId?: number) => {
  formRef.value.open(type, id, parentId)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await DeptCategoryApi.deleteDeptCategory(id)
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
    const data = await DeptCategoryApi.exportDeptCategory(queryParams)
    download.excel(data, '机构分类字典.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 展开/折叠操作 */
const isExpandAll = ref(true) // 是否展开，默认全部展开
const refreshTable = ref(true) // 重新渲染表格状态
const toggleExpandAll = async () => {
  refreshTable.value = false
  isExpandAll.value = !isExpandAll.value
  await nextTick()
  refreshTable.value = true
}

/** 状态开关操作 */
const handleStatusChange = async (row: DeptCategoryVO) => {
  try {
    const statusText = row.status === 0 ? '启用' : '禁用'
    await message.confirm(`确认要${statusText}"${row.name}"吗?`)
    await DeptCategoryApi.updateDeptCategoryStatus(row.id, row.status)
    message.success(`${statusText}成功`)
  } catch {
    // 取消时恢复状态
    row.status = row.status === 0 ? 1 : 0
  }
}

/** 排序号修改操作 */
const handleSortChange = async (row: DeptCategoryVO) => {
  try {
    await DeptCategoryApi.updateDeptCategorySort(row.id, row.sortOrder)
    message.success('排序更新成功')
  } catch {
    message.error('排序更新失败')
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
