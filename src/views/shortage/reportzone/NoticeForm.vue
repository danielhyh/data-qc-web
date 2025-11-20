<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="800px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" v-loading="formLoading">
      <el-form-item label="专区名称">
        <el-input v-model="formData.zoneName" disabled />
      </el-form-item>
      <el-form-item label="专区编码">
        <el-input v-model="formData.zoneCode" disabled />
      </el-form-item>
      <el-form-item label="通知内容" prop="noticeContent">
        <Editor 
          v-model="formData.noticeContent" 
          height="350px"
          placeholder="请输入填报通知内容，支持富文本格式..."
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="submitForm" type="primary" :loading="formLoading">保存</el-button>
      <el-button @click="dialogVisible = false">取消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ReportZoneApi } from '@/api/shortage'
import type { ReportZoneVO } from '@/api/shortage'
import { Editor } from '@/components/Editor'

const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formData = ref({
  id: undefined,
  zoneName: '',
  zoneCode: '',
  noticeContent: '',
})

const formRules = reactive({
  noticeContent: [{ required: true, message: '请输入通知内容', trigger: 'blur' }]
})

const formRef = ref()

const open = async (row: ReportZoneVO) => {
  dialogVisible.value = true
  dialogTitle.value = `配置通知 - ${row.zoneName}`
  resetForm()
  
  // 设置数据
  formData.value.id = row.id
  formData.value.zoneName = row.zoneName
  formData.value.zoneCode = row.zoneCode
  formData.value.noticeContent = row.noticeContent || getDefaultNoticeContent()
}

const emit = defineEmits(['success'])

const submitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => {})
  if (!valid) return
  
  formLoading.value = true
  try {
    await ReportZoneApi.updateNotice(formData.value.id!, formData.value.noticeContent)
    message.success('配置成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    id: undefined,
    zoneName: '',
    zoneCode: '',
    noticeContent: '',
  }
  formRef.value?.resetFields()
}

// 获取默认通知内容模板
const getDefaultNoticeContent = (): string => {
  return `<div>
    <h3>📢 填报通知</h3>
    <p>各医疗机构请注意：</p>
    <ol>
      <li><strong>填报时间</strong>：每周五12:00-18:00</li>
      <li><strong>填报范围</strong>：本周六至本周五中午12:00的数据</li>
      <li><strong>数据要求</strong>：按最小剂量单位填写，数据真实准确</li>
      <li><strong>联系方式</strong>：如有疑问请联系质控中心</li>
    </ol>
    <p style="color: #E74C3C;">请务必在规定时间内完成填报，逾期系统将自动关闭。</p>
  </div>`
}

defineExpose({ open })
</script>

<style scoped>
:deep(.el-dialog__body) {
  padding-bottom: 10px;
}
</style>