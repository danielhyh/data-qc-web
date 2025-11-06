<!--委直委管配置页面-->
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
      <el-form-item label="机构名称" prop="institutionName">
        <el-input
          v-model="queryParams.institutionName"
          placeholder="请输入机构名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="行政归属" prop="category">
        <el-select
          v-model="queryParams.category"
          placeholder="请选择"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.ADMINISTRATIVE_AFFILIATION)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="机构级别" prop="level">
        <el-input
          v-model="queryParams.level"
          placeholder="请输入机构级别"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="医疗类别" prop="medicalCategory">
        <el-input
          v-model="queryParams.medicalCategory"
          placeholder="请输入医疗类别"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择状态"
          clearable
          class="!w-240px"
        >
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
          plain
          @click="openForm('create')"
          v-hasPermi="['system:institution-category-config:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="warning"
          plain
          @click="handleImport"
          v-hasPermi="['system:institution-category-config:import']"
        >
          <Icon icon="ep:upload" class="mr-5px" /> 导入
        </el-button>
        <el-button
          type="info"
          plain
          @click="handleDownloadTemplate"
        >
          <Icon icon="ep:document" class="mr-5px" /> 模板
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['system:institution-category-config:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
      <el-table-column label="机构名称" align="center" prop="institutionName" min-width="250">
        <template #default="scope">
          <div class="institution-name-cell">
            <Icon icon="ep:office-building" class="institution-icon" />
            <span class="institution-name-text font-bold">{{ scope.row.institutionName }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="行政归属" align="center" prop="category" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.ADMINISTRATIVE_AFFILIATION" :value="scope.row.category" />
        </template>
      </el-table-column>
      <el-table-column label="机构级别" align="center" prop="level" width="100" />
      <el-table-column label="医疗类别" align="center" prop="medicalCategory" width="120" />
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="0"
            :inactive-value="1"
            @change="handleStatusChange(scope.row)"
            v-hasPermi="['system:institution-category-config:update']"
          />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="150" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="180px" fixed="right">
        <template #default="scope">
          <el-button
            type="primary"
            plain
            size="small"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['system:institution-category-config:update']"
          >
            <Icon icon="ep:edit" class="mr-5px" />
            修改
          </el-button>
          <el-button
            type="danger"
            plain
            size="small"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['system:institution-category-config:delete']"
          >
            <Icon icon="ep:delete" class="mr-5px" />
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
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <InstitutionCategoryConfigForm ref="formRef" @success="getList" />
  
  <!-- Excel预览弹窗 -->
  <ExcelPreviewDialog ref="excelPreviewRef" />
</template>

<script setup lang="ts">
import { getIntDictOptions, getStrDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { InstitutionCategoryConfigApi, InstitutionCategoryConfigVO } from '@/api/system/institutioncategoryconfig'
import InstitutionCategoryConfigForm from '../institutioncategoryconfig/InstitutionCategoryConfigForm.vue'
import ExcelPreviewDialog from '@/views/drug/import/batch/components/ExcelPreviewDialog.vue'
import { Icon } from '@/components/Icon'
import { ElMessage } from 'element-plus'

/** 机构行政归属配置 Tab */
defineOptions({ name: 'InstitutionCategoryConfigTab' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<InstitutionCategoryConfigVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  institutionName: undefined,
  category: undefined,
  level: undefined,
  medicalCategory: undefined,
  status: undefined,
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中
const excelPreviewRef = ref() // Excel预览对话框引用

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await InstitutionCategoryConfigApi.getInstitutionCategoryConfigPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
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
    await InstitutionCategoryConfigApi.deleteInstitutionCategoryConfig(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 状态开关操作 */
const handleStatusChange = async (row: InstitutionCategoryConfigVO) => {
  try {
    const statusText = row.status === 0 ? '启用' : '禁用'
    await message.confirm(`确认要${statusText}"${row.institutionName}"吗?`)
    await InstitutionCategoryConfigApi.updateInstitutionCategoryConfigStatus(row.id, row.status)
    message.success(`${statusText}成功`)
  } catch {
    // 操作失败或取消，恢复状态
    row.status = row.status === 0 ? 1 : 0
  }
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await InstitutionCategoryConfigApi.exportInstitutionCategoryConfig(queryParams)
    download.excel(data, '机构行政归属配置.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 导入按钮操作 */
const handleImport = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xls,.xlsx'
  input.onchange = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    
    // 添加 Loading 提示
    const loadingMsg = ElMessage({
      message: '正在导入数据，请稍候...',
      type: 'info',
      duration: 0 // 不自动关闭
    })
    
    try {
      // 调用后端接口（使用模板校验方式）
      await InstitutionCategoryConfigApi.importInstitutionCategoryConfig(file)
      loadingMsg.close()
      message.success('数据导入成功！')
      // 刷新列表
      await getList()
    } catch (error: any) {
      loadingMsg.close()
      console.error('导入失败:', error)
      
      // 显示详细错误信息
      const errorMsg = error.data?.msg || error.message || '导入失败，请检查文件格式和内容'
      message.error(errorMsg)
    }
  }
  input.click()
}

/** 打开模板预览 */
const handleDownloadTemplate = () => {
  // 直接通过 code 打开预览对话框
  excelPreviewRef.value?.openByCode('ADMINISTRATIVE_AFFILIATION')
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
.institution-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.institution-icon {
  font-size: 18px;
  color: #5b8def;
}

.institution-name-text {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>

