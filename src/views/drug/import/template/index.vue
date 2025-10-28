<template>
  <div class="template-container">
    <!-- 统计概览卡片 -->
<!--
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :lg="6" :md="6" :sm="6" :xl="6" :xs="12">
          <StatCard
            :value="statistics.totalCount"
            color="#409eff"
            icon="Document"
            title="模板总数"
          />
        </el-col>
        <el-col :lg="6" :md="6" :sm="6" :xl="6" :xs="12">
          <StatCard
            :value="statistics.activeCount"
            color="#67c23a"
            icon="CircleCheck"
            title="启用模板"
          />
        </el-col>
        <el-col :lg="6" :md="6" :sm="6" :xl="6" :xs="12">
          <StatCard :value="statistics.defaultCount" color="#e6a23c" icon="Star" title="默认模板" />
        </el-col>
        <el-col :lg="6" :md="6" :sm="6" :xl="6" :xs="12">
          <StatCard
            :value="formatNumber(statistics.totalDownloads)"
            color="#909399"
            icon="Download"
            title="总下载次数"
          />
        </el-col>
      </el-row>
    </div>
-->

    <!-- 搜索和操作区域 -->
    <ContentWrap>
      <el-form
        class="-mb-15px"
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="68px"
      >
        <el-form-item label="模板名称" prop="templateName">
          <el-input
            v-model="queryParams.templateName"
            placeholder="请输入模板名称"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="模板编码" prop="templateCode">
          <el-input
            v-model="queryParams.templateCode"
            placeholder="请输入模板编码"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="表类型" prop="tableType">
          <el-select
            v-model="queryParams.tableType"
            placeholder="请选择表类型"
            clearable
            class="!w-240px"
          >
            <el-option label="全部" value="" />
            <el-option
              v-for="dict in getStrDictOptions(DICT_TYPE.IMPORT_TABLE_TYPE)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            clearable
            class="!w-240px"
          >
            <el-option label="全部" value="" />
            <el-option :value="1" label="启用" />
            <el-option :value="0" label="禁用" />
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
          <el-button
            type="primary"
            @click="openForm('create')"
            v-hasPermi="['drug:import-template:create']"
          >
            <Icon icon="ep:plus" class="mr-5px" />
            新增
          </el-button>
          <el-button
            type="success"
            @click="handleExport"
            :loading="exportLoading"
            v-hasPermi="['drug:import-template:export']"
          >
            <Icon icon="ep:download" class="mr-5px" />
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 列表 -->
    <ContentWrap>
      <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
        <el-table-column label="模板名称" align="center" prop="templateName" min-width="200px">
          <template #default="{ row }">
            <div class="template-info">
              <div class="template-name">
                {{ row.templateName }}
              </div>
              <div class="template-code">{{ row.templateCode }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="表类型" align="center" prop="tableType" min-width="120px">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.IMPORT_TABLE_TYPE" :value="scope.row.tableType" />
          </template>
        </el-table-column>
        <el-table-column label="表类型" align="center" prop="tableType" min-width="120px">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.IMPORT_TABLE_TYPE" :value="scope.row.tableType" />
          </template>
        </el-table-column>
        <el-table-column label="表类型" align="center" prop="tableType" min-width="120px">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.IMPORT_TABLE_TYPE" :value="scope.row.tableType" />
          </template>
        </el-table-column>
        <el-table-column label="表类型" align="center" prop="tableType" min-width="120px">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.IMPORT_TABLE_TYPE" :value="scope.row.tableType" />
          </template>
        </el-table-column>
        <el-table-column label="字段数量" align="center" prop="fieldCount">
          <template #default="{ row }">
            <el-badge :value="row.fieldCount" class="field-badge" type="primary" />
          </template>
        </el-table-column>
        <el-table-column label="下载次数" align="center" prop="downloadCount">
          <template #default="{ row }">
            <el-badge :value="formatNumber(row.downloadCount)" class="field-badge" type="success" />
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="true"
              :inactive-value="false"
              @change="handleStatusChange(row)"
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
        <el-table-column label="创建人" align="center" prop="creator" />
        <el-table-column label="操作" align="center" width="240px" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              @click="handlePreview(row.id)"
              v-hasPermi="['drug:import-template:query']"
            >
              <Icon icon="ep:view" />
              预览
            </el-button>
            <el-button
              size="small"
              type="success"
              @click="handleDownload(row.id)"
              v-hasPermi="['drug:import-template:query']"
            >
              <Icon icon="ep:download" />
              下载
            </el-button>
            <el-dropdown 
              @command="(command) => handleCommand(command, row)" 
              @visible-change="(visible) => handleDropdownVisibleChange(row.id, visible)"
              trigger="click"
            >
              <el-button size="small" type="info" class="more-btn">
                <Icon :icon="dropdownStates[row.id] ? 'ep:arrow-up' : 'ep:arrow-down'" />
                更多
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    command="edit"
                    v-if="checkPermi(['drug:import-template:update'])"
                  >
                    <Icon icon="ep:edit" class="mr-5px" />
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="copy"
                    v-if="checkPermi(['drug:import-template:create'])"
                  >
                    <Icon icon="ep:document-copy" class="mr-5px" />
                    复制
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="delete"
                    v-if="checkPermi(['drug:import-template:delete'])"
                  >
                    <Icon icon="ep:delete" class="mr-5px" />
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
      <Pagination
        :total="total"
        :page="queryParams.pageNo"
        :limit="queryParams.pageSize"
        @update:page="queryParams.pageNo = $event"
        @update:limit="queryParams.pageSize = $event"
        @pagination="getList"
      />
    </ContentWrap>

    <!-- 表单弹窗：添加/修改 -->
    <ImportTemplateForm ref="formRef" @success="handleFormSuccess" />

    <!-- 预览弹窗 -->
    <TemplatePreviewDialog ref="previewRef" />

    <!-- 下载配置弹窗 -->
    <TemplateDownloadDialog ref="downloadRef" />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import { checkPermi } from '@/utils/permission'
import {
  ImportTemplateApi,
  ImportTemplatePageReqVO,
  ImportTemplateRespVO,
  TemplateStatisticsVO
} from '@/api/drug/task/template'
// 导入组件
import ImportTemplateForm from './ImportTemplateForm.vue'
import TemplatePreviewDialog from './components/TemplatePreviewDialog.vue'
import TemplateDownloadDialog from './components/TemplateDownloadDialog.vue'
import DictTag from '../../../../components/DictTag/src/DictTag.vue'

defineOptions({ name: 'ImportTemplate' })

const message = useMessage()
const { t } = useI18n()

// ========================= 响应式数据 =========================
const loading = ref(true)
const list = ref<ImportTemplateRespVO[]>([])
const total = ref(0)
const exportLoading = ref(false)
// 下拉菜单展开状态（用于动态切换图标）
const dropdownStates = ref<Record<number, boolean>>({})

const queryParams = reactive<ImportTemplatePageReqVO>({
  pageNo: 1,
  pageSize: 10,
  templateName: undefined,
  templateCode: undefined,
  tableType: undefined,
  status: undefined,
  isDefault: undefined
})

const queryFormRef = ref()

// 统计数据
const statistics = reactive<TemplateStatisticsVO>({
  totalCount: 0,
  activeCount: 0,
  defaultCount: 0,
  customCount: 0,
  totalDownloads: 0,
  mostUsedTemplate: {
    templateName: '',
    downloadCount: 0
  }
})

// ========================= 生命周期 =========================
onMounted(() => {
  getList()
  loadStatistics()
})

// ========================= 核心方法 =========================

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ImportTemplateApi.getImportTemplatePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 加载统计数据 */
const loadStatistics = async () => {
  try {
    const data = await ImportTemplateApi.getImportTemplateStatistics()
    Object.assign(statistics, data)
  } catch (error) {
    console.error('加载统计数据失败:', error)
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

/** 状态切换 */
const handleStatusChange = async (row: ImportTemplateRespVO) => {
  const action = row.status ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确认要${action}模板"${row.templateName}"吗？`, '系统提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await ImportTemplateApi.toggleImportTemplateStatus(row.id)
    message.success(`${action}成功`)
    await getList()
    await loadStatistics()
  } catch (error) {
    // 恢复状态
    row.status = !row.status
  }
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 表单成功回调 */
const handleFormSuccess = () => {
  getList()
  loadStatistics()
}

/** 预览模板 */
const previewRef = ref()
const handlePreview = (id: number) => {
  previewRef.value.open(id)
}

/** 下载模板 */
const downloadRef = ref()
const handleDownload = (id: number) => {
  downloadRef.value.open(id)
}

/** 复制模板 */
const handleCopy = async (id: number) => {
  try {
    await ElMessageBox.confirm('确认要复制该模板吗？', '系统提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })

    const newId = await ImportTemplateApi.copyImportTemplate(id)
    message.success('复制成功')
    await getList()
    await loadStatistics()

    // 可选：跳转到编辑页面
    openForm('update', newId)
  } catch (error) {
    if (error !== 'cancel') {
      message.error('复制失败')
    }
  }
}

/** 处理下拉菜单可见性变化（用于切换图标） */
const handleDropdownVisibleChange = (rowId: number, visible: boolean) => {
  dropdownStates.value[rowId] = visible
}

/** 处理下拉菜单命令 */
const handleCommand = (command: string, row: ImportTemplateRespVO) => {
  switch (command) {
    case 'edit':
      openForm('update', row.id)
      break
    case 'copy':
      handleCopy(row.id)
      break
    case 'delete':
      handleDelete(row.id)
      break
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ImportTemplateApi.deleteImportTemplate(id)
    message.success(t('common.delSuccess'))
    await getList()
    await loadStatistics()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await ImportTemplateApi.exportImportTemplateExcel(queryParams)
    download.excel(data, '导入模板列表.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

// ========================= 工具方法 =========================

/** 格式化数字 */
const formatNumber = (num: number | undefined): string => {
  if (!num) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toLocaleString()
}
</script>

<style scoped>
.template-container {
  padding: 20px;
  min-height: calc(100vh - 50px);
}

.stats-overview {
  margin-bottom: 20px;
}

/* 表格内容样式 */
.template-info {
  text-align: left;
}

.template-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.template-code {
  font-size: 12px;
  color: #909399;
}

.field-badge {
  margin-right: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .template-container {
    padding: 10px;
  }
}
</style>
