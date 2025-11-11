<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <PageHeader
      title="药品标准库管理"
      :content="pageHeaderContent"
      :tag="currentVersion ? `版本: ${currentVersion.versionCode}` : undefined"
      :tag-type="currentVersion ? getVersionStatusType(currentVersion.status) : 'info'"
      :meta="versionMeta"
    >
      <!-- 版本选择器和操作按钮 -->
      <template #extra>
        <div class="version-management">
          <!-- 头部操作按钮 -->
          <div class="header-actions-section">
            <el-button
              type="primary"
              @click="openImportDialog"
              v-hasPermi="['drug:ypid-version:import']"
            >
              <Icon icon="ep:upload" class="mr-5px" />
              导入标准库
            </el-button>
            <el-button @click="downloadTemplate">
              <Icon icon="ep:download" class="mr-5px" />
              下载模板
            </el-button>
          </div>

          <!-- 版本选择器 -->
          <div class="version-selector">
            <label>当前版本：</label>
            <el-select
              v-model="currentVersionId"
              placeholder="请选择版本"
              @change="handleVersionChange"
              style="width: 280px"
            >
              <el-option
                v-for="version in versionList"
                :key="version.id"
                :label="`${version.versionCode} - ${version.versionName}`"
                :value="version.id"
              >
                <div class="version-option">
                  <span>{{ version.versionCode }} - {{ version.versionName }}</span>
                  <el-tag :type="getVersionStatusType(version.status)" size="small" class="ml-2">
                    {{ getVersionStatusText(version.status) }}
                  </el-tag>
                </div>
              </el-option>
            </el-select>
          </div>

          <!-- 版本操作按钮 -->
          <div class="version-actions" v-if="currentVersion">
            <el-button
              v-if="currentVersion.status !== 4"
              type="success"
              size="small"
              @click="publishVersion"
            >
              发布版本
            </el-button>
            <el-button
              v-if="currentVersion.status !== 4"
              size="small"
              @click="importToCurrentVersion"
            >
              继续导入
            </el-button>
          </div>
        </div>
      </template>
    </PageHeader>

    <!-- 数据查询区域 -->
    <ContentWrap>
      <el-form
        class="-mb-15px"
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="100px"
      >
        <el-form-item label="YPID" prop="ypid">
          <el-input
            v-model="queryParams.ypid"
            placeholder="请输入YPID"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="产品名称" prop="productName">
          <el-input
            v-model="queryParams.productName"
            placeholder="请输入产品名称"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="通用名" prop="genericNameCn">
          <el-input
            v-model="queryParams.genericNameCn"
            placeholder="请输入通用名"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="生产企业" prop="manufacturerName">
          <el-input
            v-model="queryParams.manufacturerName"
            placeholder="请输入生产企业"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="药品类别" prop="drugCategory">
          <el-select
            v-model="queryParams.drugCategory"
            placeholder="请选择药品类别"
            clearable
            class="!w-240px"
          >
            <el-option
              v-for="category in drugCategoryList"
              :key="category"
              :label="category"
              :value="category"
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
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
          <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
          <el-button
            type="primary"
            @click="openForm('create')"
            v-hasPermi="['drug:standard-library:create']"
          >
            <Icon icon="ep:plus" class="mr-5px" /> 新增
          </el-button>
          <el-button
            type="success"
            @click="handleExport"
            :loading="exportLoading"
            v-hasPermi="['drug:standard-library:export']"
          >
            <Icon icon="ep:download" class="mr-5px" /> 导出
          </el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 数据列表 -->
    <ContentWrap>
      <!-- 导入进度条 -->
      <div v-if="isImporting" class="import-progress-container mb-4">
        <div class="progress-header">
          <div class="progress-info">
            <span class="progress-title">{{
              importProgressInfo.currentMessage || '正在导入数据...'
            }}</span>
            <div class="progress-meta">
              <span v-if="currentVersion?.importType" class="meta-item">
                <Icon icon="ep:upload" class="mr-1" />
                {{ currentVersion.importType === 1 ? '全量导入' : '增量导入' }}
              </span>
              <span v-if="currentVersion?.totalRecords" class="meta-item">
                <Icon icon="ep:collection-tag" class="mr-1" />
                共{{ formatNumber(currentVersion.totalRecords) }}条记录
              </span>
              <span v-if="currentVersion?.importStartTime" class="meta-item">
                <Icon icon="ep:clock" class="mr-1" />
                {{ formatDateTime(currentVersion.importStartTime) }}
              </span>
            </div>
          </div>
          <span class="progress-percentage">{{ importProgressInfo.overallProgress || 0 }}%</span>
        </div>
        <el-progress
          :percentage="importProgressInfo.overallProgress || 0"
          :status="getProgressStatus(importProgressInfo.overallStatus)"
          :stroke-width="8"
        />
        <div class="progress-details" v-if="importProgressInfo.totalRecords">
          已处理 {{ importProgressInfo.successRecords || 0 }} /
          {{ importProgressInfo.totalRecords }} 条记录
          <span v-if="importProgressInfo.currentStage" class="ml-4">
            当前阶段：{{ importProgressInfo.currentStage }}
          </span>
        </div>
      </div>

      <el-table
        v-loading="loading && !isImporting"
        :data="list"
        :stripe="true"
        :show-overflow-tooltip="true"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="YPID" prop="ypid" width="120" fixed="left" />
        <el-table-column label="产品名称" prop="productName" width="200" show-overflow-tooltip />
        <el-table-column
          label="标化产品名称"
          prop="standardProductName"
          width="200"
          show-overflow-tooltip
        />
        <el-table-column label="通用名" prop="genericNameCn" width="150" />
        <el-table-column label="商品名" prop="tradeName" width="150" />
        <el-table-column
          label="生产企业"
          prop="manufacturerName"
          width="200"
          show-overflow-tooltip
        />
        <el-table-column label="规格" prop="specification" width="120" />
        <el-table-column label="规格标化" prop="standardSpecification" width="120" />
        <el-table-column label="制剂单位" prop="dosageUnit" width="100" />
        <el-table-column label="最小包装单位" prop="minPackageUnit" width="120" />
        <el-table-column label="包装材质" prop="packagingMaterial" width="100" />
        <el-table-column label="转换系数" prop="conversionFactor" width="100" />
        <el-table-column label="药品类别" prop="drugCategory" width="100" />
        <el-table-column
          label="通用名（英文）"
          prop="genericNameEn"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column label="批准文号" prop="approvalNumber" width="150" show-overflow-tooltip />
        <el-table-column label="剂型规格" prop="dosageForm" width="100" />
        <el-table-column
          label="药理/功效分类"
          prop="pharmacologyCategory"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column label="国家医保药品编码" prop="medicalInsuranceCode" width="150" />
        <el-table-column label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="small">
              {{ scope.row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="创建时间"
          prop="createTime"
          :formatter="dateFormatter"
          width="180px"
        />
        <el-table-column label="操作" align="center" width="150" fixed="right">
          <template #default="scope">
            <el-button
              link
              type="primary"
              @click="openForm('update', scope.row.id)"
              v-hasPermi="['drug:standard-library:update']"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['drug:standard-library:delete']"
            >
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

    <!-- 导入对话框 -->
    <ImportDialog ref="importDialogRef" @success="handleImportSuccess" />

    <!-- 表单弹窗：添加/修改 -->
    <StandardLibraryForm ref="formRef" @success="getList" />
  </div>
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import dayjs from 'dayjs'
import { StandardLibraryApi, StandardLibraryVO } from '@/api/drug/standardlibrary/ypid'
import { YpidVersionApi, StandardVersionVO } from '@/api/drug/standardlibrary/version'
import StandardLibraryForm from './StandardLibraryForm.vue'
import ImportDialog from './ImportDialog.vue'
import PageHeader from '@/components/PageHeader/index.vue'

defineOptions({ name: 'StandardLibraryIndex' })

const message = useMessage()
const { t } = useI18n()

// 数据状态
const loading = ref(true)
const list = ref<StandardLibraryVO[]>([])
const total = ref(0)
const exportLoading = ref(false)
const selectedRows = ref<StandardLibraryVO[]>([])
const drugCategoryList = ref<string[]>([])

// 版本相关
const versionList = ref<StandardVersionVO[]>([])
const currentVersionId = ref<number>()
const currentVersion = ref<StandardVersionVO>()

// 导入进度相关
const isImporting = ref(false)
const importProgressInfo = ref<any>({})
const progressTimer = ref<NodeJS.Timeout | null>(null)

// PageHeader相关数据
const pageHeaderContent = computed(() => {
  const baseContent = '管理和维护YPID标准库数据，包括版本管理、数据导入和质量控制'
  if (currentVersion.value?.versionDescription) {
    return `${baseContent} | ${currentVersion.value.versionDescription}`
  }
  return baseContent
})

const versionMeta = computed(() => {
  if (!currentVersion.value) return []
  const meta = [
    {
      label: '总记录数',
      value: formatNumber(currentVersion.value.totalRecords),
      icon: 'ep:collection-tag'
    },
    {
      label: '新增记录',
      value: formatNumber(currentVersion.value.newRecords),
      icon: 'ep:plus'
    },
    {
      label: '更新记录',
      value: formatNumber(currentVersion.value.updatedRecords),
      icon: 'ep:edit'
    },
    {
      label: '导入类型',
      value: currentVersion.value.importType === 1 ? '全量导入' : '增量导入',
      icon: 'ep:upload'
    },
    {
      label: '创建时间',
      value: formatDateTime(currentVersion.value.createTime),
      icon: 'ep:calendar'
    }
  ]

  // 如果已发布，显示发布时间
  if (currentVersion.value.publishTime) {
    meta.push({
      label: '发布时间',
      value: formatDateTime(currentVersion.value.publishTime),
      icon: 'ep:check'
    })
  }

  return meta
})

// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  versionId: undefined,
  ypid: undefined,
  productName: undefined,
  genericNameCn: undefined,
  manufacturerName: undefined,
  drugCategory: undefined,
  status: undefined
})

const queryFormRef = ref()
const formRef = ref()
const importDialogRef = ref()

/** 初始化 */
onMounted(async () => {
  await loadVersionList()
  if (versionList.value.length > 0) {
    // 默认选择已发布的版本，如果没有则选择第一个
    const publishedVersion = versionList.value.find((v) => v.status === 4)
    currentVersionId.value = publishedVersion?.id || versionList.value[0].id
    await handleVersionChange(currentVersionId.value)
  } else {
    // 如果没有版本，也加载药品类别列表
    await loadDrugCategories()
  }
})

/** 加载版本列表 */
const loadVersionList = async () => {
  try {
    versionList.value = await YpidVersionApi.getYpidVersionList()
  } catch (error) {
    console.error('加载版本列表失败:', error)
  }
}

/** 版本切换 */
const handleVersionChange = async (versionId: number) => {
  if (!versionId) return

  try {
    // 获取版本详情
    currentVersion.value = await YpidVersionApi.getYpidVersion(versionId)

    // 更新查询参数
    queryParams.versionId = versionId

    // 加载药品类别列表
    await loadDrugCategories(versionId)

    // 刷新数据列表
    await getList()

    // 如果版本正在导入中，开始轮询进度
    if (currentVersion.value?.status === 1) {
      startProgressPolling(versionId)
    }
  } catch (error) {
    console.error('获取版本详情失败:', error)
  }
}

/** 加载药品类别列表 */
const loadDrugCategories = async (versionId?: number) => {
  try {
    drugCategoryList.value = await StandardLibraryApi.getDrugCategories(versionId)
  } catch (error) {
    console.error('加载药品类别列表失败:', error)
  }
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await StandardLibraryApi.getStandardLibraryPage(queryParams)
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

/** 开始进度轮询 */
const startProgressPolling = (versionId: number) => {
  isImporting.value = true
  importProgressInfo.value = { overallProgress: 5, currentMessage: '开始导入...' }

  progressTimer.value = setInterval(async () => {
    try {
      const progress = await YpidVersionApi.getImportProgress(versionId.toString())
      importProgressInfo.value = progress

      // 如果完成或失败，停止轮询
      if (progress.overallStatus === 2 || progress.overallStatus === 3) {
        stopProgressPolling()
        if (progress.overallStatus === 2) {
          message.success('数据导入完成')
        } else {
          message.error('数据导入失败: ' + progress.errorMessage)
        }
        // 刷新数据
        // await getList()
        await handleVersionChange(versionId)
        // await loadVersionDetails(versionId)
      }
    } catch (error) {
      console.error('查询进度失败:', error)
    }
  }, 1000)
}

/** 停止进度轮询 */
const stopProgressPolling = () => {
  isImporting.value = false
  if (progressTimer.value) {
    clearInterval(progressTimer.value)
    progressTimer.value = null
  }
}

/** 获取进度状态 */
const getProgressStatus = (status: number) => {
  switch (status) {
    case 2:
      return 'success'
    case 3:
      return 'exception'
    default:
      return undefined
  }
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  queryParams.versionId = currentVersionId.value
  handleQuery()
}

/** 多选 */
const handleSelectionChange = (selection: StandardLibraryVO[]) => {
  selectedRows.value = selection
}

/** 新增/修改操作 */
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id, currentVersionId.value)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await StandardLibraryApi.deleteStandardLibrary(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await StandardLibraryApi.exportStandardLibrary(queryParams)
    download.excel(data, `药品标准库_${currentVersion.value?.versionCode}.xls`)
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 打开导入对话框 */
const openImportDialog = () => {
  importDialogRef.value.open()
}

/** 导入成功回调 */
const handleImportSuccess = async (result: StandardVersionVO) => {
  await loadVersionList()

  // 如果是新创建的版本，切换到该版本
  if (result && result.id) {
    currentVersionId.value = result.id
    await handleVersionChange(result.id)

    // 开始轮询进度
    startProgressPolling(result.id)
  } else {
    await getList()
  }
}

/** 继续导入到当前版本 */
const importToCurrentVersion = () => {
  importDialogRef.value.openForVersion(currentVersionId.value)
}

/** 发布版本 */
const publishVersion = async () => {
  try {
    await message.confirm('确认发布此版本？发布后将成为当前有效版本。')
    await YpidVersionApi.publishVersion(currentVersionId.value!)
    message.success('版本发布成功')
    await loadVersionList()
    await handleVersionChange(currentVersionId.value!)
  } catch {}
}

/** 下载模板 */
const downloadTemplate = async () => {
  try {
    const data = await YpidVersionApi.getImportTemplate()
    download.excel(data, 'YPID标准库导入模板.xls')
  } catch {
    message.error('下载模板失败')
  }
}

/** 工具方法 */
const getVersionStatusType = (status: number) => {
  const statusMap = {
    1: 'warning', // 导入中
    2: 'success', // 导入成功
    3: 'danger', // 导入失败
    4: 'primary', // 已发布
    5: 'info' // 已停用
  }
  return statusMap[status] || 'info'
}

const getVersionStatusText = (status: number) => {
  const statusMap = {
    1: '导入中',
    2: '导入成功',
    3: '导入失败',
    4: '已发布',
    5: '已停用'
  }
  return statusMap[status] || '未知'
}

const formatNumber = (num: number) => {
  return num ? num.toLocaleString() : 0
}

const formatDateTime = (dateTime: string | Date) => {
  if (!dateTime) return '-'
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss')
}

// 页面卸载时清理定时器
onUnmounted(() => {
  stopProgressPolling()
})
</script>

<style scoped>
.import-progress-container {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.progress-info {
  flex: 1;
}

.progress-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.progress-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.meta-item {
  display: inline-flex;
  align-items: center;
}

.progress-percentage {
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
  flex-shrink: 0;
}

.progress-details {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
  text-align: center;
}

.version-management {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}

.header-actions-section {
  display: flex;
  gap: 8px;
  align-items: center;
}

.version-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-selector label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.version-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.version-actions {
  display: flex;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .version-management {
    align-items: stretch;
  }

  .header-actions-section {
    width: 100%;
    justify-content: space-between;
  }

  .version-selector {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }

  .version-selector label {
    text-align: left;
  }

  .version-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
