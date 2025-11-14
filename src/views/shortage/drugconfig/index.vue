<template>
  <div class="app-container">
    <!-- 固定头部卡片（含返回按钮） -->
    <ContentWrap class="header-card">
      <div class="header-content">
        <div class="header-left">
          <el-button class="back-button" @click="handleBackToZone" text>
            <el-icon class="back-icon">
              <ArrowLeft />
            </el-icon>
            <span>返回</span>
          </el-button>
          <div class="header-divider"></div>
          <div class="header-info">
            <h2 class="page-title">{{ zoneInfo?.zoneName || '药品配置管理' }}</h2>
            <p class="page-subtitle">配置专区内的药品信息</p>
          </div>
        </div>
        <div class="header-right" v-if="zoneInfo">
          <div class="meta-item">
            <span class="meta-label">统计时间范围：</span>
            <el-tag type="success" effect="plain" v-if="zoneInfo.currentPeriodRange">
              <Icon icon="ep:calendar" class="mr-1" />
              {{ zoneInfo.currentPeriodRange }}
            </el-tag>
            <span v-else class="meta-value text-gray-400">未配置</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item">
            <span class="meta-label">状态：</span>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="zoneInfo.status" />
          </div>
        </div>
      </div>
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
          <el-form-item label="统计单位" prop="dosageForm">
            <el-input
              v-model="queryParams.dosageForm"
              placeholder="请输入统计单位"
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
              v-hasPermi="['shortage:drug-config:create']"
            >
              <Icon icon="ep:plus" class="mr-5px" />
              新增药品
            </el-button>
            <el-button
              type="success"
              @click="handleBatchImport"
              v-hasPermi="['shortage:drug-config:create']"
            >
              <Icon icon="ep:upload" class="mr-5px" />
              批量导入
            </el-button>
          </el-form-item>
        </el-form>
      </ContentWrap>

      <!-- 列表 -->
      <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
        <el-table-column label="序号" type="index" width="80" align="center" />
        <el-table-column
          label="药品名称"
          align="center"
          prop="drugName"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="scope">
            <span class="font-bold">{{ scope.row.drugName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="药品分类" align="center" prop="drugCategory" width="140">
          <template #default="scope">
            {{ scope.row.drugCategory || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="剂型规格" align="center" prop="dosageCategory" width="120">
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
              :max="9999"
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
            <el-button
              type="success"
              size="small"
              @click="openForm('update', scope.row.id)"
              v-hasPermi="['shortage:drug-config:update']"
            >
              <Icon icon="ep:edit" class="mr-1" />
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['shortage:drug-config:delete']"
            >
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
    <DrugConfigForm ref="formRef" @success="getList" :zone-id="currentZoneId" />

    <!-- 批量导入弹窗 -->
    <BatchImportDialog ref="batchImportRef" @success="getList" :zone-id="currentZoneId" />
  </div>
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { DrugConfigApi, ReportZoneApi, type DrugConfigVO, type ReportZoneVO } from '@/api/shortage'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import DrugConfigForm from './DrugConfigForm.vue'
import BatchImportDialog from './components/BatchImportDialog.vue'
import { ArrowLeft } from '@element-plus/icons-vue'

/** 专区药品配置 列表 */
defineOptions({ name: 'ShortageDrugConfig' })

const message = useMessage() // 消息弹窗
const route = useRoute()
const router = useRouter()

const loading = ref(true) // 列表的加载中
const list = ref<DrugConfigVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const zoneInfo = ref<ReportZoneVO>()
const currentZoneId = ref<number>()
const activeTab = ref('all') // 当前激活的tab
const categoryTabs = ref<string[]>([]) // 分类标签列表

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  zoneId: undefined as number | undefined,
  drugName: '',
  drugCategory: '', // 由 activeTab 控制
  dosageCategory: '',
  dosageForm: '',
  status: undefined as number | undefined
})

const queryFormRef = ref() // 搜索的表单

// 返回专区管理页面
const handleBackToZone = () => {
  router.push('/shortage/report-zone')
}

// 从路由参数获取专区信息
const initZoneInfo = async () => {
  const zoneId = route.query.zoneId as string
  const zoneName = route.query.zoneName as string

  if (!zoneId) {
    message.error('缺少专区信息，请从专区管理页面进入')
    router.back()
    return
  }

  currentZoneId.value = Number(zoneId)
  queryParams.zoneId = Number(zoneId)

  // 查询完整的专区信息
  try {
    const data = await ReportZoneApi.get(Number(zoneId))
    zoneInfo.value = data
  } catch (error) {
    // 如果查询失败，使用路由参数设置基本信息
    zoneInfo.value = {
      id: Number(zoneId),
      zoneName: zoneName || '药品配置管理',
      zoneCode: `ZONE_${String(zoneId).padStart(3, '0')}`,
      status: 1
    } as ReportZoneVO
    message.error('获取专区信息失败，使用默认信息')
  }
}

/** 加载分类标签 */
const loadCategoryTabs = async () => {
  if (!currentZoneId.value) return

  try {
    // 获取该专区配置的所有药品的分类列表
    const data = await DrugConfigApi.getPage({
      zoneId: currentZoneId.value,
      pageNo: 1,
      pageSize: -1 // 获取所有数据
    })

    // 提取唯一的分类名称
    const categories = new Set<string>()
    data.list.forEach((item: any) => {
      if (item.drugCategory) {
        categories.add(item.drugCategory)
      }
    })
    categoryTabs.value = Array.from(categories)
  } catch (error) {
    console.error('加载分类标签失败:', error)
  }
}

/** 查询列表 */
const getList = async () => {
  if (!currentZoneId.value) return

  loading.value = true
  try {
    // 构建查询参数
    const params = {
      ...queryParams,
      drugCategory: activeTab.value === 'all' ? undefined : activeTab.value
    }
    
    const data = await DrugConfigApi.getPage(params)
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
  queryParams.dosageCategory = ''
  queryParams.dosageForm = ''
  queryParams.status = undefined
  handleQuery()
}

/** 修改状态 */
const handleStatusChange = async (row: DrugConfigVO) => {
  try {
    const text = row.status === 0 ? '启用' : '停用'
    await message.confirm('确认要"' + text + '""' + row.drugName + '"吗?')
    await DrugConfigApi.updateStatus(row.id!, row.status)
    message.success('修改成功')
    await getList()
  } catch {
    // 取消后，恢复状态
    row.status = row.status === 0 ? 1 : 0
  }
}

/** 修改排序 */
const handleSortOrderChange = async (row: DrugConfigVO) => {
  try {
    await DrugConfigApi.updateSortOrder(row.id!, row.sortOrder)
    message.success('排序修改成功')
  } catch (error) {
    message.error('排序修改失败')
    await getList()
  }
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 批量导入操作 */
const batchImportRef = ref()
const handleBatchImport = () => {
  batchImportRef.value.open()
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await DrugConfigApi.delete(id)
    message.success('删除成功')
    await getList()
    // 重新加载分类标签（可能删除后某个分类为空了）
    await loadCategoryTabs()
  } catch {}
}

/** 初始化 **/
onMounted(async () => {
  await initZoneInfo()
  await loadCategoryTabs()
  getList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
  min-height: 100vh;
}

/* 固定头部卡片样式 */
.header-card {
  margin-bottom: 20px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 20px;
  z-index: 100;
  transition: all 0.3s ease;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  gap: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  min-width: 0;
}

.back-button {
  color: #4b5563;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 14px;
  margin: -4px 0 0 -4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.back-button:hover {
  color: #667eea;
  background: #f3f4f6;
  border-color: #667eea;
  transform: translateX(-4px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.back-icon {
  font-size: 16px;
  transition: transform 0.3s ease;
}

.back-button:hover .back-icon {
  transform: translateX(-2px);
}

.header-divider {
  width: 1px;
  height: 32px;
  background: linear-gradient(to bottom, transparent, #d1d5db, transparent);
  flex-shrink: 0;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.meta-value {
  font-size: 13px;
  color: #1a202c;
  font-weight: 600;
  background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%);
  padding: 4px 12px;
  border-radius: 6px;
}

.meta-divider {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .header-content {
    flex-wrap: wrap;
  }

  .header-right {
    width: 100%;
    justify-content: flex-start;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
  }
}

@media (max-width: 768px) {
  .app-container {
    padding: 16px;
  }

  .header-card {
    top: 16px;
  }

  .header-content {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
  }

  .header-left {
    width: 100%;
    flex-wrap: wrap;
  }

  .back-button {
    padding: 8px 12px;
    font-size: 13px;
  }

  .page-title {
    font-size: 16px;
  }

  .page-subtitle {
    font-size: 12px;
  }

  .header-right {
    width: 100%;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
    flex-wrap: wrap;
  }
}
</style>
