<template>
  <ContentWrap>
    <!-- 搜索和操作栏 -->
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="demo-form-inline">
      <el-form-item label="反馈标题" prop="title">
        <el-input v-model="queryParams.title" placeholder="请输入反馈标题" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 140px">
          <el-option label="待处理" :value="0" />
          <el-option label="处理中" :value="1" />
          <el-option label="已解决" :value="2" />
          <el-option label="已关闭" :value="3" />
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
        <el-button type="success" @click="openForm">
          <Icon icon="ep:plus" class="mr-5px" />
          新建反馈
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap>
    <!-- 反馈列表 -->
    <el-table v-loading="loading" :data="list" class="mt-10px">
      <el-table-column align="center" prop="id" label="工单编号" width="100" />
      <el-table-column align="center" prop="title" label="反馈标题" min-width="200" show-overflow-tooltip />
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
              <el-icon><View /></el-icon>
              {{ scope.row.status < 2 ? '详情' : '查看' }}</el-button>
            <span v-if="scope.row.hasNewReply && scope.row.lastReplyType === 2" class="new-dot"></span>
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

  <!-- 新建反馈弹窗 -->
  <Dialog v-model="dialogVisible" title="新建反馈" width="550px" destroy-on-close>
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
      <el-form-item label="反馈标题" prop="title">
        <el-input v-model="formData.title" placeholder="请简要描述您的问题" maxlength="100" show-word-limit />
      </el-form-item>
      <el-form-item label="问题类型" prop="type">
        <el-select v-model="formData.type" placeholder="请选择问题类型" style="width: 100%">
          <el-option label="功能异常" :value="1" />
          <el-option label="数据错误" :value="2" />
          <el-option label="操作咨询" :value="3" />
          <el-option label="功能建议" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="优先级" prop="priority">
        <el-radio-group v-model="formData.priority">
          <el-radio :value="1">低</el-radio>
          <el-radio :value="2">中</el-radio>
          <el-radio :value="3">高</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="问题描述" prop="content">
        <el-input
          type="textarea"
          :rows="5"
          v-model="formData.content"
          placeholder="请详细描述您遇到的问题，包括操作步骤、错误信息等"
          maxlength="2000"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="截图附件">
        <UploadImgs v-model="formData.images" :limit="5" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="submitForm" :loading="submitLoading">提 交</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getFeedbackPage, createFeedback } from '@/api/drug/feedback'
import { dateFormatter } from '@/utils/formatTime'
import { UploadImgs } from '@/components/UploadFile'
import { View } from '@element-plus/icons-vue'

defineOptions({ name: 'MyFeedback' })

const router = useRouter()

const loading = ref(false)
const submitLoading = ref(false)
const list = ref([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  title: '',
  status: undefined as number | undefined
})
const queryFormRef = ref()
const dialogVisible = ref(false)
const formRef = ref()
const formData = reactive({
  title: '',
  content: '',
  images: [] as string[],
  type: undefined as number | undefined,
  priority: 2
})
const formRules = {
  title: [{ required: true, message: '请输入反馈标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择问题类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入问题描述', trigger: 'blur' }]
}

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

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryParams.title = ''
  queryParams.status = undefined
  queryParams.pageNo = 1
  getList()
}

const openForm = () => {
  formData.title = ''
  formData.content = ''
  formData.images = []
  formData.type = undefined
  formData.priority = 2
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value?.validate()
  submitLoading.value = true
  try {
    const data = {
      title: formData.title,
      content: formData.content,
      images: formData.images?.length ? formData.images.join(',') : '',
      type: formData.type,
      priority: formData.priority
    }
    await createFeedback(data)
    ElMessage.success('反馈提交成功，我们会尽快处理')
    dialogVisible.value = false
    getList()
  } finally {
    submitLoading.value = false
  }
}

const handleView = (id: number) => {
  router.push({ name: 'MyFeedbackDetail', params: { id } })
}

onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
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
