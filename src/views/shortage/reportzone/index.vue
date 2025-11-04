<!--填报配置管理页-->
<template>
  <div>
    <!-- Tab 标签页 -->
    <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
      <!-- 专区管理 Tab -->
      <el-tab-pane name="reportZone">
        <template #label>
          <span class="tab-label-wrapper">
            <Icon icon="ep:data-board" class="tab-icon" />
            <span>专区管理</span>
          </span>
        </template>
        
        <!-- 搜索工作栏 -->
        <ContentWrap>
          <el-form
            class="-mb-15px"
            :model="queryParams"
            ref="queryFormRef"
            :inline="true"
            label-width="68px"
          >
            <el-form-item label="专区名称" prop="zoneName">
              <el-input
                v-model="queryParams.zoneName"
                placeholder="请输入专区名称"
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
                v-hasPermi="['shortage:report-zone:create']"
              >
                <Icon icon="ep:plus" class="mr-5px" />
                新增专区
              </el-button>
            </el-form-item>
          </el-form>
        </ContentWrap>

        <!-- 列表 -->
        <ContentWrap>
          <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
            <el-table-column label="序号" type="index" width="80" align="center" />
            <el-table-column label="专区编码" align="center" prop="zoneCode" width="120px" />
            <el-table-column label="专区名称" align="center" prop="zoneName" width="180px">
              <template #default="scope">
                <span class="font-bold">{{ scope.row.zoneName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" align="center" prop="status" width="100px">
              <template #default="scope">
                <el-switch
                  v-model="scope.row.status"
                  :active-value="0"
                  :inactive-value="1"
                  @change="handleStatusChange(scope.row)"
                  :disabled="!checkPermi(['shortage:report-zone:update'])"
                />
              </template>
            </el-table-column>
            <el-table-column label="药品数" align="center" prop="drugCount" width="100px">
              <template #default="scope">
                <el-tag>{{ scope.row.drugCount || 0 }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="填报次数" align="center" prop="reportCount" width="100px">
              <template #default="scope">
                <el-tag>{{ scope.row.reportCount || 0 }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip />
            <el-table-column
              label="创建时间"
              align="center"
              prop="createTime"
              :formatter="dateFormatter"
              width="180px"
            />
            <el-table-column label="操作" align="center" width="300px" fixed="right">
              <template #default="scope">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleConfig(scope.row)"
                  v-hasPermi="['shortage:drug-config:query']"
                >
                  <Icon icon="ep:setting" class="mr-1" />
                  药品配置
                </el-button>
                <el-button
                  type="success"
                  size="small"
                  @click="openForm('update', scope.row.id)"
                  v-hasPermi="['shortage:report-zone:update']"
                >
                  <Icon icon="ep:edit" class="mr-1" />
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleDelete(scope.row.id)"
                  v-hasPermi="['shortage:report-zone:delete']"
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
        </ContentWrap>
      </el-tab-pane>

      <!-- 药品分类 Tab -->
      <el-tab-pane name="drugCategory">
        <template #label>
          <span class="tab-label-wrapper">
            <Icon icon="ep:list" class="tab-icon" />
            <span>药品分类</span>
          </span>
        </template>
        <DrugCategoryManagement />
      </el-tab-pane>

      <!-- 剂型分类 Tab -->
      <el-tab-pane name="dosageCategory">
        <template #label>
          <span class="tab-label-wrapper">
            <Icon icon="ep:grid" class="tab-icon" />
            <span>剂型分类</span>
          </span>
        </template>
        <DosageCategoryManagement />
      </el-tab-pane>
    </el-tabs>

    <!-- 表单弹窗：添加/修改 -->
    <ReportZoneForm ref="formRef" @success="getList" />
  </div>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { checkPermi } from '@/utils/permission'
import { dateFormatter } from '@/utils/formatTime'
import { CommonStatusEnum } from '@/utils/constants'
import { ReportZoneApi, type ReportZoneVO } from '@/api/shortage'
import ReportZoneForm from './ReportZoneForm.vue'
import DrugCategoryManagement from '../drugconfig/components/DrugCategoryManagement.vue'
import DosageCategoryManagement from '../drugconfig/components/DosageCategoryManagement.vue'

/** 短缺药品填报专区 列表 */
defineOptions({ name: 'ShortageReportZone' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const router = useRouter()
const loading = ref(true) // 列表的加载中
const list = ref<ReportZoneVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const activeTab = ref('reportZone') // 当前激活的tab
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  zoneName: '',
  status: undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ReportZoneApi.getPage(queryParams)
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
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** Tab切换处理 */
const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
}

/** 修改专区状态 */
const handleStatusChange = async (row: ReportZoneVO) => {
  try {
    // 修改状态的二次确认
    const text = row.status === CommonStatusEnum.ENABLE ? '启用' : '停用'
    await message.confirm('确认要"' + text + '""' + row.zoneName + '"专区吗?')
    // 发起修改状态
    await ReportZoneApi.updateStatus(row.id, row.status)
    message.success('修改成功')
    // 刷新列表
    await getList()
  } catch {
    // 取消后，进行恢复按钮
    row.status =
      row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  }
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 药品配置操作 */
const handleConfig = (row: ReportZoneVO) => {
  router.push({
    path: '/shortage/drug-config',
    query: {
      zoneId: row.id,
      zoneName: row.zoneName
    }
  })
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ReportZoneApi.delete(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
/* Tab 标签图标优化 */
.tab-label-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  .tab-icon {
    font-size: 16px;
    transition: all 0.3s ease;
  }
}

/* Tab 激活状态时图标动画 */
:deep(.el-tabs__item.is-active) {
  .tab-icon {
    color: #5b8def;
    transform: scale(1.1);
    filter: drop-shadow(0 2px 4px rgba(91, 141, 239, 0.3));
  }
}

/* Tab 悬停状态时图标动画 */
:deep(.el-tabs__item:hover:not(.is-active)) {
  .tab-icon {
    transform: translateY(-1px);
  }
}
</style>
