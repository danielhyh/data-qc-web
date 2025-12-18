<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="80px">
      <el-form-item label="公告类型" prop="type">
        <el-select v-model="queryParams.type" placeholder="全部类型" clearable class="!w-200px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_NOTICE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="阅读状态" prop="readStatus">
        <el-select v-model="queryParams.readStatus" placeholder="全部状态" clearable class="!w-200px">
          <el-option label="未读" :value="false" />
          <el-option label="已读" :value="true" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" @click="handleMarkAllRead">
          <Icon icon="ep:check" class="mr-5px" /> 全部已读
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" />
      <el-table-column label="公告标题" align="left" prop="title" min-width="200">
        <template #default="scope">
          <el-link type="primary" @click="openDetail(scope.row)">
            <el-badge v-if="!scope.row.readStatus" is-dot class="mr-5px" />
            {{ scope.row.title }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="公告类型" align="center" prop="type" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SYSTEM_NOTICE_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="阅读状态" align="center" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.readStatus" type="success">已读</el-tag>
          <el-tag v-else type="danger">未读</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" align="center" prop="publishTime" width="180" :formatter="dateFormatter" />
      <el-table-column label="阅读时间" align="center" prop="readTime" width="180" :formatter="dateFormatter" />
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 详情弹窗 -->
  <MyNoticeDetail ref="detailRef" @read="getList" />
</template>

<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as NoticeApi from '@/api/system/notice'
import MyNoticeDetail from './MyNoticeDetail.vue'

defineOptions({ name: 'SystemMyNotice' })

const message = useMessage()

const loading = ref(true)
const total = ref(0)
const list = ref<any[]>([])
const selectedIds = ref<number[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  type: undefined,
  readStatus: undefined
})
const queryFormRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await NoticeApi.getMyNoticePage(queryParams)
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

/** 选择变化 */
const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map(item => item.id)
}

/** 全部已读 */
const handleMarkAllRead = async () => {
  try {
    await message.confirm('是否将所有公告标记为已读？')
    await NoticeApi.markAllAsRead()
    message.success('操作成功')
    await getList()
  } catch {}
}

/** 打开详情 */
const detailRef = ref()
const openDetail = (row: any) => {
  detailRef.value.open(row)
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
