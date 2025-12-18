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
      <el-form-item label="公告标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入公告标题"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="发布状态" prop="publishStatus">
        <el-select
          v-model="queryParams.publishStatus"
          placeholder="请选择发布状态"
          clearable
          class="!w-240px"
        >
          <el-option label="草稿" :value="0" />
          <el-option label="已发布" :value="1" />
          <el-option label="已关闭" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['system:notice:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="公告编号" align="center" prop="id" width="100" />
      <el-table-column label="公告标题" align="center" prop="title" min-width="150" show-overflow-tooltip />
      <el-table-column label="公告类型" align="center" prop="type" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SYSTEM_NOTICE_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="发布状态" align="center" prop="publishStatus" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.publishStatus === 0" type="info">草稿</el-tag>
          <el-tag v-else-if="scope.row.publishStatus === 1" type="success">已发布</el-tag>
          <el-tag v-else-if="scope.row.publishStatus === 2" type="danger">已关闭</el-tag>
          <el-tag v-else type="info">草稿</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="目标机构" align="center" prop="targetAdminLevels" width="150">
        <template #default="scope">
          <span v-if="scope.row.targetAdminLevels?.length">
            {{ formatTargetAdminLevels(scope.row.targetAdminLevels) }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column
        label="发布时间"
        align="center"
        prop="publishTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" width="200" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['system:notice:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['system:notice:delete']"
          >
            删除
          </el-button>
          <el-button
            v-if="scope.row.publishStatus !== 1"
            link
            type="success"
            @click="handlePublish(scope.row.id)"
            v-hasPermi="['system:notice:update']"
          >
            发布
          </el-button>
          <el-button
            v-if="scope.row.publishStatus === 1"
            link
            type="warning"
            @click="handleClose(scope.row.id)"
            v-hasPermi="['system:notice:update']"
          >
            关闭
          </el-button>
          <el-button
            v-if="scope.row.publishStatus === 1"
            link
            type="info"
            @click="openReadStats(scope.row)"
            v-hasPermi="['system:notice:query']"
          >
            已读统计
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
  <NoticeForm ref="formRef" @success="getList" />

  <!-- 已读统计弹窗 -->
  <Dialog v-model="readStatsVisible" title="已读统计" width="900">
    <div v-loading="statsLoading">
      <el-descriptions :column="2" border class="mb-20px">
        <el-descriptions-item label="公告标题" :span="2">{{ currentNotice?.title }}</el-descriptions-item>
        <el-descriptions-item label="发布时间">{{ formatDate(currentNotice?.publishTime) }}</el-descriptions-item>
        <el-descriptions-item label="目标机构">
          {{ currentNotice?.targetAdminLevels?.length ? formatTargetAdminLevels(currentNotice.targetAdminLevels) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="已读用户数">{{ readStats?.readUserCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="已读率">-</el-descriptions-item>
      </el-descriptions>
      
      <div class="mb-10px">
        <span class="text-lg font-medium">已读用户列表</span>
      </div>
      
      <el-table :data="readStats?.readUsers || []" max-height="350" border>
        <el-table-column prop="username" label="用户账号" width="120" />
        <el-table-column prop="nickname" label="用户身份" width="120" />
        <el-table-column prop="realName" label="真实姓名" width="100" />
        <el-table-column prop="mobile" label="手机号" width="130" />
        <el-table-column prop="deptName" label="所属机构" min-width="200" show-overflow-tooltip />
        <el-table-column prop="readTime" label="阅读时间" width="180" :formatter="dateFormatter" />
      </el-table>
      
      <div v-if="!readStats?.readUsers?.length" class="text-center text-gray-500 py-20px">
        暂无已读用户
      </div>
      
      <!-- 分页 -->
      <div class="mt-10px flex justify-end" v-if="readStats?.readUserTotal > 0">
        <el-pagination
          v-model:current-page="statsPageNo"
          v-model:page-size="statsPageSize"
          :total="readStats?.readUserTotal || 0"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadReadStats"
          @current-change="loadReadStats"
        />
      </div>
    </div>
    <template #footer>
      <el-button @click="readStatsVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as NoticeApi from '@/api/system/notice'
import NoticeForm from './NoticeForm.vue'

defineOptions({ name: 'SystemNotice' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const total = ref(0)
const list = ref([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  title: '',
  publishStatus: undefined
})
const queryFormRef = ref()

/** 查询公告列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await NoticeApi.getNoticePage(queryParams)
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
    await message.delConfirm()
    await NoticeApi.deleteNotice(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 发布按钮操作 */
const handlePublish = async (id: number) => {
  try {
    await message.confirm('是否发布该公告？发布后目标用户可见')
    await NoticeApi.publishNotice(id)
    message.success('发布成功')
    await getList()
  } catch {}
}

/** 关闭按钮操作 */
const handleClose = async (id: number) => {
  try {
    await message.confirm('是否关闭该公告？关闭后用户不可见')
    await NoticeApi.closeNotice(id)
    message.success('关闭成功')
    await getList()
  } catch {}
}

/** 格式化目标管理级别 */
const formatTargetAdminLevels = (levels: number[]) => {
  const levelMap: Record<number, string> = {
    0: '机构',
    1: '省级',
    2: '市级',
    3: '区县级'
  }
  return levels.map(l => levelMap[l] || l).join('、')
}

/** 已读统计 */
const readStatsVisible = ref(false)
const statsLoading = ref(false)
const currentNotice = ref<any>(null)
const readStats = ref<any>(null)
const statsPageNo = ref(1)
const statsPageSize = ref(10)

const openReadStats = async (row: any) => {
  currentNotice.value = row
  readStatsVisible.value = true
  statsPageNo.value = 1
  statsPageSize.value = 10
  await loadReadStats()
}

const loadReadStats = async () => {
  statsLoading.value = true
  try {
    readStats.value = await NoticeApi.getReadStats(currentNotice.value.id, statsPageNo.value, statsPageSize.value)
  } finally {
    statsLoading.value = false
  }
}

/** 格式化日期 */
const formatDate = (date: any) => {
  if (!date) return '-'
  return dateFormatter(null, null, date)
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
