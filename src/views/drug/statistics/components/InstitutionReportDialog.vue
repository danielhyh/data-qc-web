<template>
  <Dialog v-model="dialogVisible" title="机构上报详情" width="1400px" maxHeight="80vh">
    <div class="flex h-600px">
      <!-- 左侧地区树选择器 -->
      <div
        ref="selectorPanel"
        class="selector-panel"
        :style="{ width: selectorWidth + 'px' }"
      >
        <div class="selector-card">
          <div class="card-header">
            <span class="card-title">地区选择</span>
          </div>
          <div class="card-body">
            <RegionTree @node-click="handleRegionSelect" />
          </div>
        </div>
      </div>

      <!-- 拖拽分隔条 -->
      <div
        class="resize-handle"
        @mousedown="startResize"
      ></div>

      <!-- 右侧内容区域 -->
      <div class="flex-1 ml-5 content-area">
        <div class="search-section">
          <!-- 搜索工作栏 -->
          <el-form
              class="-mb-15px"
              :model="queryParams"
              ref="queryFormRef"
              :inline="true"
              label-width="80px"
          >
            <el-form-item label="机构类型" prop="institutionType">
              <el-select
                  v-model="queryParams.institutionType"
                  placeholder="请选择机构类型"
                  clearable
                  class="!w-180px"
              >
                <el-option label="应监测机构" value="monitoring" />
                <el-option label="已上报机构" value="reported" />
                <el-option label="未上报机构" value="unreported" />
              </el-select>
            </el-form-item>
            <el-form-item label="医院等级" prop="hospitalLevel">
              <el-select
                  v-model="queryParams.hospitalLevel"
                  placeholder="请选择医院等级"
                  clearable
                  class="!w-160px"
              >
                <el-option label="三级医院" value="3" />
                <el-option label="二级医院" value="2" />
                <el-option label="基层医院" value="base" />
              </el-select>
            </el-form-item>
            <el-form-item label="上报状态" prop="reportStatus">
              <el-select
                  v-model="queryParams.reportStatus"
                  placeholder="请选择上报状态"
                  clearable
                  class="!w-160px"
              >
                <el-option
                  v-for="dict in getIntDictOptions(DICT_TYPE.REPORT_STATUS)"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="机构名称" prop="deptName">
              <el-input
                  v-model="queryParams.deptName"
                  placeholder="请输入机构名称"
                  clearable
                  class="!w-200px"
              />
            </el-form-item>
            <el-form-item label="联系人" prop="contactPerson">
              <el-input
                  v-model="queryParams.contactPerson"
                  placeholder="请输入联系人"
                  clearable
                  class="!w-160px"
              />
            </el-form-item>
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input
                  v-model="queryParams.contactPhone"
                  placeholder="请输入联系电话"
                  clearable
                  class="!w-160px"
              />
            </el-form-item>
            <el-form-item>
              <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
              <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
              <el-button @click="handleExport" type="primary" plain><Icon icon="ep:download" class="mr-5px" /> 导出Excel</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 列表区域 -->
        <div class="list-section">
          <!-- 当前选择的地区信息 -->
          <div v-if="selectedRegion" class="mb-15px">
            <el-tag type="info" size="large">
              <Icon icon="ep:location" class="mr-5px" />
              当前地区：{{ getRegionDisplayName(selectedRegion) }}
            </el-tag>
          </div>

          <div class="table-container">
            <el-table
              v-loading="loading"
              :data="list"
              :show-overflow-tooltip="true"
            >
              <el-table-column label="机构名称" align="center" prop="deptName" width="200" />
              <el-table-column label="所属市" align="center" prop="cityName" width="120" />
              <el-table-column label="所属区县" align="center" prop="districtName" width="120" />
              <el-table-column label="医院等级" align="center" prop="hospitalLevelDesc" width="120" />
              <el-table-column label="上报状态" align="center" prop="reportStatus" width="100">
                <template #default="scope">
                  <dict-tag :type="DICT_TYPE.REPORT_STATUS" :value="scope.row.reportStatus" />
                </template>
              </el-table-column>
              <el-table-column label="联系人" align="center" prop="contactPerson" width="100" />
              <el-table-column label="联系电话" align="center" prop="contactPhone" width="130" />
              <el-table-column label="是否应监测" align="center" width="100">
                <template #default="scope">
                  <el-tag
                    :type="scope.row.isMonitoringRequired ? 'success' : 'info'"
                    size="small"
                  >
                    {{ scope.row.isMonitoringRequired ? '是' : '否' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="地区路径" align="center" prop="regionPath" min-width="200" />
            </el-table>
          </div>

          <!-- 分页 -->
          <div class="pagination-section">
            <Pagination
                :total="total"
                v-model:page="queryParams.pageNo"
                v-model:limit="queryParams.pageSize"
                @pagination="getList"
            />
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { InstitutionReportApi, InstitutionReportItemVO, InstitutionReportPageReqVO } from '@/api/drug/statistics'
import RegionTree from '@/views/system/user/RegionTree.vue'
import Pagination from '@/components/Pagination/index.vue'
import { ElMessage } from 'element-plus'

/** 机构上报详情弹框 */
defineOptions({ name: 'InstitutionReportDialog' })

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(true) // 列表的加载中
const list = ref<InstitutionReportItemVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const selectedRegion = ref<any>(null) // 选中的地区节点
const reportId = ref<number>() // 当前报告ID

// 面板拖拽相关
const selectorPanel = ref<HTMLElement>()
const selectorWidth = ref(250) // 默认宽度
const isResizing = ref(false)

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  reportId: undefined, // 填报任务ID
  regionCode: undefined, // 地区代码
  institutionType: undefined, // 机构类型
  hospitalLevel: undefined, // 医院等级
  reportStatus: undefined, // 上报状态
  deptName: undefined, // 机构名称
  contactPerson: undefined, // 联系人
  contactPhone: undefined, // 联系电话
})
const queryFormRef = ref() // 搜索的表单

/** 开始拖拽调整大小 */
const startResize = (e: MouseEvent) => {
  isResizing.value = true
  const startX = e.clientX
  const startWidth = selectorWidth.value

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!isResizing.value) return
    const diff = moveEvent.clientX - startX
    const newWidth = Math.max(250, Math.min(500, startWidth + diff)) // 限制最小250px，最大500px
    selectorWidth.value = newWidth
  }

  const onMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
  e.preventDefault()
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await InstitutionReportApi.getInstitutionReportPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 地区选择处理 */
const handleRegionSelect = (region: any) => {
  selectedRegion.value = region
  queryParams.regionCode = region?.code
  queryParams.pageNo = 1
  getList()
}

/** 获取地区显示名称 */
const getRegionDisplayName = (region: any) => {
  if (!region) return ''
  const levelNames = { 1: '省', 2: '市', 3: '区县' }
  return `${region.name}(${levelNames[region.level] || ''})`
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  selectedRegion.value = null
  queryParams.regionCode = undefined
  handleQuery()
}

/** 导出Excel */
const handleExport = async () => {
  try {
    // 创建临时参数对象，排除分页参数
    const { pageNo, pageSize, ...exportParams } = queryParams as Omit<InstitutionReportPageReqVO, 'pageNo' | 'pageSize'> & {
      pageNo: number
      pageSize: number
    }
    
    // 调用导出API，获取blob数据
    const response = await InstitutionReportApi.exportInstitutionReportExcel(exportParams)
    
    // 创建 Blob 对象并下载
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const downloadUrl = URL.createObjectURL(blob)
    
    // 创建临时链接并触发下载
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `机构上报列表_${new Date().toLocaleDateString()}.xlsx`
    a.click()
    
    // 释放资源
    URL.revokeObjectURL(downloadUrl)
    
    ElMessage.success('导出Excel成功')
  } catch (error) {
    console.error('导出Excel失败:', error)
    ElMessage.error('导出Excel失败')
  }
}

/** 打开弹窗 */
const open = (id: number, type: string, regionId?: number) => {
  reportId.value = id
  queryParams.reportId = id
  queryParams.institutionType = type
  dialogVisible.value = true

  // 重置页码
  selectedRegion.value = null
  queryParams.regionCode = undefined
  queryParams.pageNo = 1
  
  if (regionId !== undefined) {
    selectedRegion.value = { code: String(regionId), name: '' }
    queryParams.regionCode = String(regionId)
    handleRegionSelect({ code: String(regionId), name: '' })
  }
  // 立即加载一次数据
  //getList()

}

/** 关闭弹窗 */
const close = () => {
  dialogVisible.value = false
}

defineExpose({ open, close })
</script>

<style scoped lang="scss">
.selector-panel {
  flex-shrink: 0;
  min-width: 250px;
  max-width: 500px;
  height: 100%;
  overflow: hidden;
}

.selector-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;

  .card-header {
    flex-shrink: 0;
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: #fafafa;
    border-radius: 6px 6px 0 0;

    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
  }

  .card-body {
    flex: 1;
    padding: 20px;
    overflow: hidden;
  }
}

.resize-handle {
  width: 5px;
  background: var(--el-border-color-light);
  cursor: ew-resize;
  flex-shrink: 0;
  transition: background-color 0.2s;

  &:hover {
    background: var(--el-color-primary);
  }
}

// 右侧内容区域样式
.content-area {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.search-section {
  flex-shrink: 0;
  background: #fff;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 16px;
}

.list-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 20px;
  overflow: hidden;
}

.table-container {
  flex: 1;
  overflow: auto;
  min-height: 300px;
  max-height: 400px;

  :deep(.el-table) {
    width: 100%;
    min-width: 1200px; // 确保表格有足够宽度触发横向滚动

    .el-table__header-wrapper {
      overflow: hidden; // 禁用头部滚动条
    }

    .el-table__body-wrapper {
      overflow: auto; // 只在数据区域显示滚动条
    }
  }
}

.pagination-section {
  flex-shrink: 0;
  padding-top: 16px;
  display: flex;
  justify-content: center;
}

// 调整表单项的布局，避免换行导致高度过高
.search-section {
  :deep(.el-form) {
    .el-form-item {
      margin-bottom: 18px;
      margin-right: 16px;
    }

    .el-form-item:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
