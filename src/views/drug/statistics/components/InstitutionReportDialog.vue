<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="1400px" maxHeight="80vh">
    <div class="flex h-600px">
      <!-- 左侧地区树选择器（显示机构数量） -->
      <RegionTree
        ref="regionTreeRef"
        :style="{ width: selectorWidth + 'px', flexShrink: 0, height: '100%' }"
        :auto-select-first="false"
        :show-org-count="true"
        :show-collapse-button="true"
        :only-medical="true"
        :selected-region-data="selectedRegion"
        exclude-module-code="MONITOR"
        @node-click="handleRegionSelect"
        @clear="handleClearRegion"
      />

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
              label-width="68px"
              @submit.prevent
          >
            <el-form-item label="关键字" prop="keyword">
              <el-input
                  v-model="queryParams.keyword"
                  placeholder="机构名称/代码/联络员/电话"
                  clearable
                  class="!w-220px"
                  @keyup.enter="handleQuery"
              />
            </el-form-item>
            <el-form-item label="是否上报" prop="isReported">
              <el-select
                  v-model="queryParams.isReported"
                  placeholder="请选择"
                  clearable
                  class="!w-100px"
              >
                <el-option label="已上报" value="reported" />
                <el-option label="未上报" value="unreported" />
              </el-select>
            </el-form-item>
            <el-form-item label="上报状态" prop="reportStatus">
              <el-select
                  v-model="queryParams.reportStatus"
                  placeholder="请选择"
                  clearable
                  class="!w-120px"
              >
                <el-option
                  v-for="dict in getIntDictOptions(DICT_TYPE.REPORT_STATUS)"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="等级" prop="hospitalLevelJ">
              <el-select
                  v-model="queryParams.hospitalLevelJ"
                  placeholder="请选择"
                  clearable
                  class="!w-100px"
              >
                <el-option
                  v-for="dict in getStrDictOptions(DICT_TYPE.INSTITUTION_LEVEL)"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="等次" prop="hospitalGrade">
              <el-select
                  v-model="queryParams.hospitalGrade"
                  placeholder="请选择"
                  clearable
                  class="!w-100px"
              >
                <el-option
                  v-for="dict in getStrDictOptions(DICT_TYPE.HOSPITAL_GRADE)"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
              <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
              <el-button @click="handleExport" type="primary" plain><Icon icon="ep:download" class="mr-5px" /> 导出</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 列表区域 -->
        <div class="list-section">
          <div class="table-container">
            <el-table
              v-loading="loading"
              :data="list"
              :show-overflow-tooltip="true"
            >
              <el-table-column label="机构名称" prop="deptName" min-width="180">
                <template #default="scope">
                  <span class="font-bold">{{ scope.row.deptName }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="orgCode" label="机构代码" width="130" show-overflow-tooltip />
              <el-table-column label="所属市" align="center" prop="cityName" width="100" />
              <el-table-column prop="districtName" label="行政区划" width="100" show-overflow-tooltip />
              <el-table-column prop="hospitalLevelJ" label="等级" width="70" align="center">
                <template #default="scope">
                  <dict-tag
                    v-if="scope.row.hospitalLevelJ"
                    :type="DICT_TYPE.INSTITUTION_LEVEL"
                    :value="scope.row.hospitalLevelJ"
                  />
                  <span v-else class="text-gray-400">-</span>
                </template>
              </el-table-column>
              <el-table-column prop="hospitalGrade" label="等次" width="70" align="center">
                <template #default="scope">
                  <dict-tag
                    v-if="scope.row.hospitalGrade"
                    :type="DICT_TYPE.HOSPITAL_GRADE"
                    :value="scope.row.hospitalGrade"
                  />
                  <span v-else class="text-gray-400">-</span>
                </template>
              </el-table-column>
              <el-table-column label="联系人" align="center" prop="contactPerson" width="90" />
              <el-table-column label="联系电话" align="center" prop="contactPhone" width="120" />
              <el-table-column label="上报状态" align="center" prop="reportStatus" width="120">
                <template #default="scope">
                  <dict-tag :type="DICT_TYPE.REPORT_STATUS" :value="scope.row.reportStatus" />
                </template>
              </el-table-column>
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
import { getIntDictOptions, getStrDictOptions, DICT_TYPE } from '@/utils/dict'
import { InstitutionReportApi, InstitutionReportItemVO } from '@/api/drug/statistics'
import RegionTree from '@/views/system/user/RegionTree.vue'
import Pagination from '@/components/Pagination/index.vue'
import { ElMessage } from 'element-plus'

/** 机构上报详情弹框 */
defineOptions({ name: 'InstitutionReportDialog' })

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('机构上报详情') // 弹窗标题
const loading = ref(false) // 列表的加载中
const list = ref<InstitutionReportItemVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const selectedRegion = ref<any>(null) // 选中的地区节点

// 面板拖拽相关
const regionTreeRef = ref<InstanceType<typeof RegionTree>>()
const selectorWidth = ref(250) // 默认宽度
const isResizing = ref(false)

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  reportId: undefined as number | undefined, // 填报任务ID
  regionCode: undefined as string | undefined, // 地区代码
  institutionType: undefined as string | undefined, // 机构类型
  keyword: undefined as string | undefined, // 关键字
  isReported: undefined as string | undefined, // 是否上报
  reportStatus: undefined as number | undefined, // 上报状态
  hospitalLevelJ: undefined as string | undefined, // 等级
  hospitalGrade: undefined as string | undefined, // 等次
})
const queryFormRef = ref() // 搜索的表单

/** 监听地区树折叠状态，自动调整宽度 */
watch(
  () => regionTreeRef.value?.isCollapsed,
  (collapsed) => {
    if (collapsed) {
      selectorWidth.value = 50
    } else if (selectorWidth.value === 50) {
      selectorWidth.value = 250
    }
  }
)

/** 开始拖拽调整大小 */
const startResize = (e: MouseEvent) => {
  if (regionTreeRef.value?.isCollapsed) return

  isResizing.value = true
  const startX = e.clientX
  const startWidth = selectorWidth.value

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!isResizing.value) return
    const diff = moveEvent.clientX - startX
    const newWidth = Math.max(250, Math.min(500, startWidth + diff))
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
    const params: any = {
      pageNo: queryParams.pageNo,
      pageSize: queryParams.pageSize,
      reportId: queryParams.reportId,
      regionCode: queryParams.regionCode,
      keyword: queryParams.keyword,
      reportStatus: queryParams.reportStatus,
      hospitalLevel: queryParams.hospitalLevelJ,
      hospitalGrade: queryParams.hospitalGrade,
    }
    
    // 处理 isReported 和 institutionType 的优先级
    if (queryParams.isReported) {
      params.institutionType = queryParams.isReported
    } else if (queryParams.institutionType) {
      params.institutionType = queryParams.institutionType
    }
    
    const data = await InstitutionReportApi.getInstitutionReportPage(params)
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

/** 清除地区选择 */
const handleClearRegion = () => {
  selectedRegion.value = null
  queryParams.regionCode = undefined
  queryParams.pageNo = 1
  regionTreeRef.value?.clearSelection()
  getList()
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  queryParams.keyword = undefined
  queryParams.isReported = undefined
  queryParams.reportStatus = undefined
  queryParams.hospitalLevelJ = undefined
  queryParams.hospitalGrade = undefined
  handleQuery()
}

/** 导出Excel */
const handleExport = async () => {
  try {
    const exportParams: any = {
      reportId: queryParams.reportId,
      regionCode: queryParams.regionCode,
      keyword: queryParams.keyword,
      reportStatus: queryParams.reportStatus,
      hospitalLevel: queryParams.hospitalLevelJ,
      hospitalGrade: queryParams.hospitalGrade,
    }
    
    if (queryParams.isReported) {
      exportParams.institutionType = queryParams.isReported
    } else if (queryParams.institutionType) {
      exportParams.institutionType = queryParams.institutionType
    }
    
    const response = await InstitutionReportApi.exportInstitutionReportExcel(exportParams)
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const downloadUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `机构上报列表_${new Date().toLocaleDateString()}.xlsx`
    a.click()
    URL.revokeObjectURL(downloadUrl)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

/** 打开弹窗 */
const open = async (id: number, type: string, regionId?: number) => {
  // 重置所有查询参数
  queryParams.reportId = id
  queryParams.institutionType = type
  queryParams.keyword = undefined
  queryParams.reportStatus = undefined
  queryParams.hospitalLevelJ = undefined
  queryParams.hospitalGrade = undefined
  queryParams.pageNo = 1
  
  // 根据 type 设置 isReported 的初始值
  if (type === 'reported') {
    queryParams.isReported = 'reported'
  } else if (type === 'unreported') {
    queryParams.isReported = 'unreported'
  } else {
    queryParams.isReported = undefined
  }
  
  // 设置弹窗标题
  const titleMap: Record<string, string> = {
    'monitoring': '应监测机构列表',
    'reported': '已上报机构列表',
    'unreported': '未上报机构列表'
  }
  dialogTitle.value = titleMap[type] || '机构上报详情'
  
  // 重置地区选择
  selectedRegion.value = null
  queryParams.regionCode = undefined
  
  // 显示弹窗
  dialogVisible.value = true
  
  // 等待 DOM 更新后选中树节点
  if (regionId !== undefined) {
    await nextTick()
    // 等待树组件加载完成后选中节点（轮询检查树是否加载完成）
    const waitForTreeLoaded = () => {
      return new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          // 检查树组件是否存在且不在加载状态
          if (regionTreeRef.value && !regionTreeRef.value.loading) {
            clearInterval(checkInterval)
            resolve()
          }
        }, 100)
        // 最多等待 3 秒
        setTimeout(() => {
          clearInterval(checkInterval)
          resolve()
        }, 3000)
      })
    }
    
    await waitForTreeLoaded()
    
    // 选中节点，selectByRegionId 会触发 node-click 事件
    const node = await regionTreeRef.value?.selectByRegionId(regionId)
    if (!node) {
      // 节点未找到，直接加载数据
      await getList()
    }
    // 如果节点找到，handleRegionSelect 会被触发并加载数据
  } else {
    // 无地区参数，直接加载数据
    await getList()
  }
}

/** 关闭弹窗 */
const close = () => {
  dialogVisible.value = false
}

defineExpose({ open, close })
</script>

<style scoped lang="scss">
.resize-handle {
  width: 5px;
  background: var(--el-border-color-light);
  cursor: ew-resize;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: var(--el-color-primary);
    width: 6px;
  }
}

.content-area {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  min-width: 0;
}

.search-section {
  flex-shrink: 0;
  background: #fff;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 12px;
}

.list-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 16px;
  overflow: hidden;
}

.table-container {
  flex: 1;
  overflow: auto;
  min-height: 300px;
  max-height: 400px;
}

.pagination-section {
  flex-shrink: 0;
  padding-top: 12px;
  display: flex;
  justify-content: center;
}
</style>
