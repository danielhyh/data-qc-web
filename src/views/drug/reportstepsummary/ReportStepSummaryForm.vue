<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="关联任务ID" prop="taskId">
        <el-input v-model="formData.taskId" placeholder="请输入关联任务ID" />
      </el-form-item>
      <el-form-item label="步骤类型：1上传/2质控/3提交/4国家平台" prop="stepType">
        <el-select v-model="formData.stepType" placeholder="请选择步骤类型：1上传/2质控/3提交/4国家平台">
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="处理状态：0处理中/1已完成/2部分失败/3全部失败" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="总文件数" prop="totalFiles">
        <el-input v-model="formData.totalFiles" placeholder="请输入总文件数" />
      </el-form-item>
      <el-form-item label="成功文件数" prop="successFiles">
        <el-input v-model="formData.successFiles" placeholder="请输入成功文件数" />
      </el-form-item>
      <el-form-item label="失败文件数" prop="failedFiles">
        <el-input v-model="formData.failedFiles" placeholder="请输入失败文件数" />
      </el-form-item>
      <el-form-item label="警告文件数" prop="warningFiles">
        <el-input v-model="formData.warningFiles" placeholder="请输入警告文件数" />
      </el-form-item>
      <el-form-item label="总记录数" prop="totalRecords">
        <el-input v-model="formData.totalRecords" placeholder="请输入总记录数" />
      </el-form-item>
      <el-form-item label="成功记录数" prop="successRecords">
        <el-input v-model="formData.successRecords" placeholder="请输入成功记录数" />
      </el-form-item>
      <el-form-item label="错误记录数" prop="errorRecords">
        <el-input v-model="formData.errorRecords" placeholder="请输入错误记录数" />
      </el-form-item>
      <el-form-item label="警告记录数" prop="warningRecords">
        <el-input v-model="formData.warningRecords" placeholder="请输入警告记录数" />
      </el-form-item>
      <el-form-item label="开始时间" prop="startTime">
        <el-date-picker
          v-model="formData.startTime"
          type="date"
          value-format="x"
          placeholder="选择开始时间"
        />
      </el-form-item>
      <el-form-item label="结束时间" prop="endTime">
        <el-date-picker
          v-model="formData.endTime"
          type="date"
          value-format="x"
          placeholder="选择结束时间"
        />
      </el-form-item>
      <el-form-item label="处理耗时（秒）" prop="duration">
        <el-input v-model="formData.duration" placeholder="请输入处理耗时（秒）" />
      </el-form-item>
      <el-form-item label="步骤特有数据（JSON格式）" prop="summaryData">
        <el-input v-model="formData.summaryData" placeholder="请输入步骤特有数据（JSON格式）" />
      </el-form-item>
      <el-form-item label="错误汇总信息" prop="errorSummary">
        <el-input v-model="formData.errorSummary" placeholder="请输入错误汇总信息" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { ReportStepSummaryApi, ReportStepSummaryVO } from '@/api/drug/reportstepsummary'

/** 上报步骤总览 表单 */
defineOptions({ name: 'ReportStepSummaryForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  taskId: undefined,
  stepType: undefined,
  status: undefined,
  totalFiles: undefined,
  successFiles: undefined,
  failedFiles: undefined,
  warningFiles: undefined,
  totalRecords: undefined,
  successRecords: undefined,
  errorRecords: undefined,
  warningRecords: undefined,
  startTime: undefined,
  endTime: undefined,
  duration: undefined,
  summaryData: undefined,
  errorSummary: undefined,
})
const formRules = reactive({
  taskId: [{ required: true, message: '关联任务ID不能为空', trigger: 'blur' }],
  stepType: [{ required: true, message: '步骤类型：1上传/2质控/3提交/4国家平台不能为空', trigger: 'change' }],
  status: [{ required: true, message: '处理状态：0处理中/1已完成/2部分失败/3全部失败不能为空', trigger: 'blur' }],
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
      formData.value = await ReportStepSummaryApi.getReportStepSummary(id)
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
    const data = formData.value as unknown as ReportStepSummaryVO
    if (formType.value === 'create') {
      await ReportStepSummaryApi.createReportStepSummary(data)
      message.success(t('common.createSuccess'))
    } else {
      await ReportStepSummaryApi.updateReportStepSummary(data)
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
    taskId: undefined,
    stepType: undefined,
    status: undefined,
    totalFiles: undefined,
    successFiles: undefined,
    failedFiles: undefined,
    warningFiles: undefined,
    totalRecords: undefined,
    successRecords: undefined,
    errorRecords: undefined,
    warningRecords: undefined,
    startTime: undefined,
    endTime: undefined,
    duration: undefined,
    summaryData: undefined,
    errorSummary: undefined,
  }
  formRef.value?.resetFields()
}
</script>