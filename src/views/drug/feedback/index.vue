<template>
  <ContentWrap>
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="demo-form-inline">
      <el-form-item label="工单标题" prop="title">
        <el-input v-model="queryParams.title" placeholder="请输入工单标题" />
      </el-form-item>
      <el-form-item label="工单状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择工单状态" clearable style="width: 160px">
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
      </el-form-item>
    </el-form>

    <el-button type="primary" @click="openForm('create')">
      <Icon icon="ep:plus" class="mr-5px" />
      新建工单
    </el-button>

    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" prop="id" label="工单ID" />
      <el-table-column align="center" prop="title" label="工单标题" />
      <el-table-column align="center" prop="type" label="问题类型">
        <template #default="scope">
          <span v-if="scope.row.type === 1">功能异常</span>
          <span v-else-if="scope.row.type === 2">数据错误</span>
          <span v-else-if="scope.row.type === 3">操作咨询</span>
          <span v-else-if="scope.row.type === 4">功能建议</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column align="center" prop="priority" label="优先级">
        <template #default="scope">
          <el-tag type="info" v-if="scope.row.priority === 1">低</el-tag>
          <el-tag type="warning" v-else-if="scope.row.priority === 2">中</el-tag>
          <el-tag type="danger" v-else-if="scope.row.priority === 3">高</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column align="center" prop="status" label="工单状态">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 0">待处理</el-tag>
          <el-tag type="warning" v-if="scope.row.status === 1">处理中</el-tag>
          <el-tag type="success" v-if="scope.row.status === 2">已解决</el-tag>
          <el-tag type="info" v-if="scope.row.status === 3">已关闭</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        prop="createTime"
        label="创建时间"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column align="center" label="操作">
        <template #default="scope">
          <el-button link type="primary" @click="handleView(scope.row.id)">详情</el-button>
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

  <el-dialog v-model="dialogVisible" title="新建工单" width="500px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
      <el-form-item label="工单标题" prop="title">
        <el-input v-model="formData.title" placeholder="请输入工单标题" />
      </el-form-item>
            <el-form-item label="问题类型" prop="type">
        <el-select v-model="formData.type" placeholder="请选择问题类型">
          <el-option label="功能异常" :value="1" />
          <el-option label="数据错误" :value="2" />
          <el-option label="操作咨询" :value="3" />
          <el-option label="功能建议" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="优先级" prop="priority">
        <el-select v-model="formData.priority" placeholder="请选择优先级">
          <el-option label="低" :value="1" />
          <el-option label="中" :value="2" />
          <el-option label="高" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="问题描述" prop="content">
        <el-input
          type="textarea"
          :rows="4"
          v-model="formData.content"
          placeholder="请详细描述您遇到的问题"
        />
      </el-form-item>
      <el-form-item label="文件上传" prop="images">
        <UploadImgs v-model="formData.images"/>
      </el-form-item>

    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="submitForm">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getFeedbackPage, createFeedback } from '@/api/drug/feedback'
import { dateFormatter } from '@/utils/formatTime'
import { UploadImgs} from "@/components/UploadFile";

const router = useRouter()
const loading = ref(true)
const list = ref([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  title: '',
  status: null
})
const queryFormRef = ref()
const dialogVisible = ref(false)
const formRef = ref()
const formData = reactive({
  title: '',
  content: '',
  images: [],
  type: null,
  priority: null
})
const formRules = {
  title: [{ required: true, message: '请输入工单标题', trigger: 'blur' }],
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
  queryFormRef.value.resetFields()
  handleQuery()
}

const openForm = () => {
  formData.title = ''
  formData.content = ''
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value.validate()
  const data = {
    title: formData.title,
    content: formData.content,
    images: formData.images.join(','),
    type: formData.type,
    priority: formData.priority
  }
  await createFeedback(data)
  ElMessage.success('创建成功')
  dialogVisible.value = false
  getList()
}

const handleView = (id) => {
  router.push({ name: 'FeedbackDetail', params: { id } })
}

getList()
</script>
