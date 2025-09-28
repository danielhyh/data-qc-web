<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="任务编号（格式：DRUG_YYYYMMDD_XXXXXX）" prop="taskNo">
        <el-input v-model="formData.taskNo" placeholder="请输入任务编号（格式：DRUG_YYYYMMDD_XXXXXX）" />
      </el-form-item>
      <el-form-item label="预期文件数量" prop="totalFiles">
        <el-input v-model="formData.totalFiles" placeholder="请输入预期文件数量" />
      </el-form-item>
      <el-form-item label="成功文件数" prop="successFiles">
        <el-input v-model="formData.successFiles" placeholder="请输入成功文件数" />
      </el-form-item>
      <el-form-item label="警告文件数" prop="warningFiles">
        <el-input v-model="formData.warningFiles" placeholder="请输入警告文件数" />
      </el-form-item>
      <el-form-item label="失败文件数" prop="failedFiles">
        <el-input v-model="formData.failedFiles" placeholder="请输入失败文件数" />
      </el-form-item>
      <el-form-item label="总记录数" prop="totalRecords">
        <el-input v-model="formData.totalRecords" placeholder="请输入总记录数" />
      </el-form-item>
      <el-form-item label="成功记录数" prop="successRecords">
        <el-input v-model="formData.successRecords" placeholder="请输入成功记录数" />
      </el-form-item>
      <el-form-item label="失败记录数" prop="failedRecords">
        <el-input v-model="formData.failedRecords" placeholder="请输入失败记录数" />
      </el-form-item>
      <el-form-item label="警告记录数" prop="warningRecords">
        <el-input v-model="formData.warningRecords" placeholder="请输入警告记录数" />
      </el-form-item>
      <el-form-item label="异常记录数" prop="anomalyRecords">
        <el-input v-model="formData.anomalyRecords" placeholder="请输入异常记录数" />
      </el-form-item>
      <el-form-item label="总耗时(毫秒)" prop="durationMs">
        <el-input v-model="formData.durationMs" placeholder="请输入总耗时(毫秒)" />
      </el-form-item>
      <el-form-item label="平均单条记录处理时间(ms)" prop="avgRecordTime">
        <el-date-picker
          v-model="formData.avgRecordTime"
          type="date"
          value-format="x"
          placeholder="选择平均单条记录处理时间(ms)"
        />
      </el-form-item>
      <el-form-item label="是否生成错误文件" prop="hasErrorFile">
        <UploadFile v-model="formData.hasErrorFile" />
      </el-form-item>
      <el-form-item label="错误文件路径" prop="errorFilePath">
        <el-input v-model="formData.errorFilePath" placeholder="请输入错误文件路径" />
      </el-form-item>
      <el-form-item label="错误信息" prop="errorMessage">
        <el-input v-model="formData.errorMessage" placeholder="请输入错误信息" />
      </el-form-item>
      <el-form-item label="详细错误信息" prop="errorDetail">
        <el-input v-model="formData.errorDetail" placeholder="请输入详细错误信息" />
      </el-form-item>
      <el-form-item label="数据来源" prop="dataSource">
        <el-input v-model="formData.dataSource" placeholder="请输入数据来源" />
      </el-form-item>
      <el-form-item label="备注说明" prop="description">
        <Editor v-model="formData.description" height="150px" />
      </el-form-item>
      <el-form-item label="部门id" prop="deptId">
        <el-input v-model="formData.deptId" placeholder="请输入部门id" />
      </el-form-item>
      <el-form-item label="上报进度" prop="reportProgress">
        <el-input v-model="formData.reportProgress" placeholder="请输入上报进度" />
      </el-form-item>
      <el-form-item label="上报任务id" prop="reportId">
        <el-input v-model="formData.reportId" placeholder="请输入上报任务id" />
      </el-form-item>
      <el-form-item label="当前步骤" prop="currentStep">
        <el-input v-model="formData.currentStep" placeholder="请输入当前步骤" />
      </el-form-item>
      <el-form-item label="上报状态：0未上报、1审核中,2已退回、3已通过,4已上报" prop="reportStatus">
        <el-radio-group v-model="formData.reportStatus">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.REPORT_STATUS)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="上报时间" prop="reportTime">
        <el-date-picker
          v-model="formData.reportTime"
          type="date"
          value-format="x"
          placeholder="选择上报时间"
        />
      </el-form-item>
      <el-form-item label="退回时间" prop="rejectTime">
        <el-date-picker
          v-model="formData.rejectTime"
          type="date"
          value-format="x"
          placeholder="选择退回时间"
        />
      </el-form-item>
      <el-form-item label="通过时间" prop="approveTime">
        <el-date-picker
          v-model="formData.approveTime"
          type="date"
          value-format="x"
          placeholder="选择通过时间"
        />
      </el-form-item>
      <el-form-item label="退回原因" prop="rejectReason">
        <el-input v-model="formData.rejectReason" placeholder="请输入退回原因" />
      </el-form-item>
      <el-form-item label="提交时间" prop="submitTime">
        <el-date-picker
          v-model="formData.submitTime"
          type="date"
          value-format="x"
          placeholder="选择提交时间"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { ImportTaskApi, ImportTaskVO } from '@/api/drug/batch'

/** 药品数据导入任务 表单 */
defineOptions({ name: 'ImportTaskForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  taskNo: undefined,
  totalFiles: undefined,
  successFiles: undefined,
  warningFiles: undefined,
  failedFiles: undefined,
  totalRecords: undefined,
  successRecords: undefined,
  failedRecords: undefined,
  warningRecords: undefined,
  anomalyRecords: undefined,
  durationMs: undefined,
  avgRecordTime: undefined,
  hasErrorFile: undefined,
  errorFilePath: undefined,
  errorMessage: undefined,
  errorDetail: undefined,
  dataSource: undefined,
  description: undefined,
  deptId: undefined,
  reportProgress: undefined,
  reportId: undefined,
  currentStep: undefined,
  reportStatus: undefined,
  reportTime: undefined,
  rejectTime: undefined,
  approveTime: undefined,
  rejectReason: undefined,
  submitTime: undefined,
})
const formRules = reactive({
  taskNo: [{ required: true, message: '任务编号（格式：DRUG_YYYYMMDD_XXXXXX）不能为空', trigger: 'blur' }],
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
      formData.value = await ImportTaskApi.getImportTask(id)
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
    const data = formData.value as unknown as ImportTaskVO
    if (formType.value === 'create') {
      await ImportTaskApi.createImportTask(data)
      message.success(t('common.createSuccess'))
    } else {
      await ImportTaskApi.updateImportTask(data)
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
    taskNo: undefined,
    totalFiles: undefined,
    successFiles: undefined,
    warningFiles: undefined,
    failedFiles: undefined,
    totalRecords: undefined,
    successRecords: undefined,
    failedRecords: undefined,
    warningRecords: undefined,
    anomalyRecords: undefined,
    durationMs: undefined,
    avgRecordTime: undefined,
    hasErrorFile: undefined,
    errorFilePath: undefined,
    errorMessage: undefined,
    errorDetail: undefined,
    dataSource: undefined,
    description: undefined,
    deptId: undefined,
    reportProgress: undefined,
    reportId: undefined,
    currentStep: undefined,
    reportStatus: undefined,
    reportTime: undefined,
    rejectTime: undefined,
    approveTime: undefined,
    rejectReason: undefined,
    submitTime: undefined,
  }
  formRef.value?.resetFields()
}
</script>