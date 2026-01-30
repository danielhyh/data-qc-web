<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="任务名称" prop="taskName">
        <el-input v-model="formData.taskName" placeholder="请输入任务名称" />
      </el-form-item>
      <el-form-item label="采集年度" prop="uploadYear">
        <el-input v-model="formData.uploadYear" placeholder="请输入采集年度" />
      </el-form-item>
      <el-form-item label="总部门数" prop="totalDepts">
        <el-input v-model="formData.totalDepts" placeholder="请输入总部门数" />
      </el-form-item>
      <el-form-item label="成功部门数" prop="successDepts">
        <el-input v-model="formData.successDepts" placeholder="请输入成功部门数" />
      </el-form-item>
      <el-form-item label="失败部门数" prop="failedDepts">
        <el-input v-model="formData.failedDepts" placeholder="请输入失败部门数" />
      </el-form-item>

    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { UploadTaskApi, UploadTaskVO } from '@/api/drug/uploadtask'

/** 数据上报任务主 表单 */
defineOptions({ name: 'UploadTaskForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  taskName: undefined,
  uploadYear: undefined,
  totalDepts: undefined,
  successDepts: undefined,
  failedDepts: undefined,
  status: undefined,
})
const formRules = reactive({
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await UploadTaskApi.getUploadTask(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as UploadTaskVO
    if (formType.value === 'create') {
      await UploadTaskApi.createUploadTask(data)
      message.success(t('common.createSuccess'))
    } else {
      await UploadTaskApi.updateUploadTask(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    taskName: undefined,
    uploadYear: undefined,
    totalDepts: undefined,
    successDepts: undefined,
    failedDepts: undefined,
    status: undefined,
  }
  formRef.value?.resetFields()
}
</script>
