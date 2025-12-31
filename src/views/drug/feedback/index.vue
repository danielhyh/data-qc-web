<template>
    <!-- Tab 标签页 -->
    <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
      <!-- 待处理 Tab -->
      <el-tab-pane name="pending">
        <template #label>
          <span class="tab-label-wrapper">
            <Icon icon="ep:clock" class="tab-icon" />
            <span>待处理</span>
            <el-badge
              v-if="tabCounts.pending > 0"
              :value="tabCounts.pending"
              :max="999"
              class="tab-badge tab-badge-danger"
            />
          </span>
        </template>
      </el-tab-pane>

      <!-- 处理中 Tab -->
      <el-tab-pane name="processing">
        <template #label>
          <span class="tab-label-wrapper">
            <Icon icon="ep:loading" class="tab-icon" />
            <span>处理中</span>
            <el-badge
              v-if="tabCounts.processing > 0"
              :value="tabCounts.processing"
              :max="999"
              class="tab-badge tab-badge-warning"
            />
          </span>
        </template>
      </el-tab-pane>

      <!-- 已解决 Tab -->
      <el-tab-pane name="resolved">
        <template #label>
          <span class="tab-label-wrapper">
            <Icon icon="ep:circle-check" class="tab-icon" />
            <span>已解决</span>
            <el-badge
              v-if="tabCounts.resolved > 0"
              :value="tabCounts.resolved"
              :max="999"
              class="tab-badge tab-badge-success"
            />
          </span>
        </template>
      </el-tab-pane>

      <!-- 已关闭 Tab -->
      <el-tab-pane name="closed">
        <template #label>
          <span class="tab-label-wrapper">
            <Icon icon="ep:circle-close" class="tab-icon" />
            <span>已关闭</span>
            <el-badge
              v-if="tabCounts.closed > 0"
              :value="tabCounts.closed"
              :max="999"
              class="tab-badge tab-badge-info"
            />
          </span>
        </template>
      </el-tab-pane>

    <!-- 搜索和操作栏 -->
    <ContentWrap>
      <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="反馈标题" prop="title">
          <el-input v-model="queryParams.title" placeholder="请输入反馈标题" clearable @keyup.enter="handleQuery" class="!w-200px" />
        </el-form-item>
        <el-form-item label="问题类型" prop="type">
          <el-select v-model="queryParams.type" placeholder="全部类型" clearable class="!w-140px">
            <el-option label="功能异常" :value="1" />
            <el-option label="数据错误" :value="2" />
            <el-option label="操作咨询" :value="3" />
            <el-option label="功能建议" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="queryParams.priority" placeholder="全部" clearable class="!w-100px">
            <el-option label="低" :value="1" />
            <el-option label="中" :value="2" />
            <el-option label="高" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <Icon icon="ep:search" class="mr-5px" />
            查询
          </el-button>
          <el-button @click="resetQuery">
            <Icon icon="ep:refresh" class="mr-5px" />
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 反馈列表 -->
      <ContentWrap>
    <el-table v-loading="loading" :data="list" class="mt-10px">
      <el-table-column align="center" prop="id" label="工单编号" width="100" />
      <el-table-column align="center" prop="title" label="反馈标题" min-width="200" show-overflow-tooltip />
      <el-table-column align="center" prop="userName" label="提交人" width="120" />
      <el-table-column align="center" prop="type" label="问题类型" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.type === 1" type="danger" size="small">功能异常</el-tag>
          <el-tag v-else-if="scope.row.type === 2" type="warning" size="small">数据错误</el-tag>
          <el-tag v-else-if="scope.row.type === 3" type="info" size="small">操作咨询</el-tag>
          <el-tag v-else-if="scope.row.type === 4" type="success" size="small">功能建议</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column align="center" prop="priority" label="优先级" width="80">
        <template #default="scope">
          <el-tag type="info" size="small" v-if="scope.row.priority === 1">低</el-tag>
          <el-tag type="warning" size="small" v-else-if="scope.row.priority === 2">中</el-tag>
          <el-tag type="danger" size="small" v-else-if="scope.row.priority === 3">高</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column align="center" prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 0" type="danger">待处理</el-tag>
          <el-tag v-else-if="scope.row.status === 1" type="warning">处理中</el-tag>
          <el-tag v-else-if="scope.row.status === 2" type="success">已解决</el-tag>
          <el-tag v-else-if="scope.row.status === 3" type="info">已关闭</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        prop="createTime"
        label="创建时间"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column align="center" label="操作" width="100" fixed="right">
        <template #default="scope">
          <div class="action-btn-wrapper">
            <el-button type="primary" size="small" @click="handleView(scope.row.id)">
              <el-icon><Edit v-if="scope.row.status < 2" /><View v-else /></el-icon>
              {{ scope.row.status < 2 ? '处理' : '查看' }}</el-button>
            <span v-if="scope.row.hasNewReply && scope.row.lastReplyType === 1" class="new-dot"></span>
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
        </ContentWrap>
    </el-tabs>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getFeedbackPage } from '@/api/drug/feedback'
import { dateFormatter } from '@/utils/formatTime'
import { Edit, View } from '@element-plus/icons-vue'

defineOptions({ name: 'FeedbackManage' })

const router = useRouter()

// Tab 相关
const activeTab = ref('pending')
const tabCounts = reactive({
  pending: 0,
  processing: 0,
  resolved: 0,
  closed: 0
})

const tabStatusMap: Record<string, number> = {
  pending: 0,
  processing: 1,
  resolved: 2,
  closed: 3
}

const loading = ref(false)
const list = ref([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  title: '',
  type: undefined as number | undefined,
  priority: undefined as number | undefined,
  status: 0 as number
})
const queryFormRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await getFeedbackPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const getTabCounts = async () => {
  try {
    const [pending, processing, resolved, closed] = await Promise.all([
      getFeedbackPage({ pageNo: 1, pageSize: 1, status: 0 }),
      getFeedbackPage({ pageNo: 1, pageSize: 1, status: 1 }),
      getFeedbackPage({ pageNo: 1, pageSize: 1, status: 2 }),
      getFeedbackPage({ pageNo: 1, pageSize: 1, status: 3 })
    ])
    tabCounts.pending = pending.total
    tabCounts.processing = processing.total
    tabCounts.resolved = resolved.total
    tabCounts.closed = closed.total
  } catch (e) {
    console.error('获取Tab数量失败', e)
  }
}

const handleTabChange = (tabName: string) => {
  queryParams.status = tabStatusMap[tabName]
  queryParams.pageNo = 1
  getList()
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryParams.title = ''
  queryParams.type = undefined
  queryParams.priority = undefined
  queryParams.pageNo = 1
  getList()
}

const handleView = (id: number) => {
  router.push({ name: 'SystemFeedbackDetail', params: { id } })
}

onMounted(() => {
  getList()
  getTabCounts()
})
</script>

<style scoped lang="scss">
.tab-label-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tab-icon {
  font-size: 16px;
  transition: all 0.3s ease;
}

.tab-badge {
  margin-left: 4px;
}

/* 待处理 - 红色 */
.tab-badge-danger {
  :deep(.el-badge__content) {
    background: linear-gradient(135deg, #f56c6c, #e74c3c) !important;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(245, 108, 108, 0.4) !important;
    color: white;
    font-weight: 600;
  }
}

/* 处理中 - 橙色 */
.tab-badge-warning {
  :deep(.el-badge__content) {
    background: linear-gradient(135deg, #f59e0b, #d97706) !important;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4) !important;
    color: white;
    font-weight: 600;
  }
}

/* 已解决 - 绿色 */
.tab-badge-success {
  :deep(.el-badge__content) {
    background: linear-gradient(135deg, #67c23a, #52c41a) !important;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(103, 194, 58, 0.4) !important;
    color: white;
    font-weight: 600;
  }
}

/* 已关闭 - 灰色 */
.tab-badge-info {
  :deep(.el-badge__content) {
    background: linear-gradient(135deg, #909399, #6c757d) !important;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(144, 147, 153, 0.4) !important;
    color: white;
    font-weight: 600;
  }
}

/* Tab 激活状态时图标动画 */
:deep(.el-tabs__item.is-active) {
  .tab-icon {
    color: #5b8def;
    transform: scale(1.1);
    filter: drop-shadow(0 2px 4px rgba(91, 141, 239, 0.3));
  }

  /* 激活状态时待处理徽标脉动动画 */
  .tab-badge-danger :deep(.el-badge__content) {
    animation: badge-pulse-danger 1.5s ease-in-out infinite;
  }
}

/* Tab 悬停状态时图标动画 */
:deep(.el-tabs__item:hover:not(.is-active)) {
  .tab-icon {
    transform: translateY(-1px);
  }
}

/* 红色徽标脉动动画 */
@keyframes badge-pulse-danger {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(245, 108, 108, 0.4);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 4px 16px rgba(245, 108, 108, 0.6);
  }
}

/* 操作按钮容器 */
.action-btn-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* NEW 小红点 - 按钮右上角 */
.new-dot {
  position: absolute;
  top: -1px;
  right: -1px;
  width: 6px;
  height: 6px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(255, 107, 107, 0.6);
  animation: dot-pulse 1.5s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 6px rgba(255, 107, 107, 0.6);
  }
  50% {
    transform: scale(1.2);
    box-shadow: 0 0 10px rgba(255, 107, 107, 0.8);
  }
}
</style>
