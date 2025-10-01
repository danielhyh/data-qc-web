<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="任务编号（格式：YPID_YYYYMMDD_XXXXXX）" prop="taskNo">
        <el-input
          v-model="formData.taskNo"
          placeholder="请输入任务编号（格式：YPID_YYYYMMDD_XXXXXX）"
        />
      </el-form-item>
      <el-form-item label="任务名称" prop="taskName">
        <el-input v-model="formData.taskName" placeholder="请输入任务名称" />
      </el-form-item>
      <el-form-item label="任务类型:1-质控导入,2-模板导入" prop="taskType">
        <el-select v-model="formData.taskType" placeholder="请选择任务类型:1-质控导入,2-模板导入">
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="来源ID（质控任务ID等）" prop="sourceId">
        <el-input v-model="formData.sourceId" placeholder="请输入来源ID（质控任务ID等）" />
      </el-form-item>
      <el-form-item label="来源文件（模板导入时记录）" prop="sourceFile">
        <UploadFile v-model="formData.sourceFile" />
      </el-form-item>
      <el-form-item label="任务状态:0-待处理,1-处理中,2-已完成,3-已取消" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="总待匹配数" prop="totalCount">
        <el-input v-model="formData.totalCount" placeholder="请输入总待匹配数" />
      </el-form-item>
      <el-form-item label="已匹配数" prop="matchedCount">
        <el-input v-model="formData.matchedCount" placeholder="请输入已匹配数" />
      </el-form-item>
      <el-form-item label="已确认数" prop="confirmedCount">
        <el-input v-model="formData.confirmedCount" placeholder="请输入已确认数" />
      </el-form-item>
      <el-form-item label="匹配失败数" prop="failedCount">
        <el-input v-model="formData.failedCount" placeholder="请输入匹配失败数" />
      </el-form-item>
      <el-form-item label="是否启用自动应用" prop="autoApplyEnabled">
        <el-radio-group v-model="formData.autoApplyEnabled">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="自动应用阈值(0-100)" prop="autoApplyThreshold">
        <el-input v-model="formData.autoApplyThreshold" placeholder="请输入自动应用阈值(0-100)" />
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
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { YpidMatchTaskApi, YpidMatchTaskVO } from '@/api/drug/ypid/task'

/** YPID匹配任务 表单 */
defineOptions({ name: 'YpidMatchTaskForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  taskNo: undefined,
  taskName: undefined,
  taskType: undefined,
  sourceId: undefined,
  sourceFile: undefined,
  status: undefined,
  totalCount: undefined,
  matchedCount: undefined,
  confirmedCount: undefined,
  failedCount: undefined,
  autoApplyEnabled: undefined,
  autoApplyThreshold: undefined,
  startTime: undefined,
  endTime: undefined
})
const formRules = reactive({
  taskNo: [
    { required: true, message: '任务编号（格式：YPID_YYYYMMDD_XXXXXX）不能为空', trigger: 'blur' }
  ],
  taskName: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
  taskType: [
    { required: true, message: '任务类型:1-质控导入,2-模板导入不能为空', trigger: 'change' }
  ],
  status: [
    {
      required: true,
      message: '任务状态:0-待处理,1-处理中,2-已完成,3-已取消不能为空',
      trigger: 'blur'
    }
  ],
  totalCount: [{ required: true, message: '总待匹配数不能为空', trigger: 'blur' }],
  matchedCount: [{ required: true, message: '已匹配数不能为空', trigger: 'blur' }],
  confirmedCount: [{ required: true, message: '已确认数不能为空', trigger: 'blur' }],
  failedCount: [{ required: true, message: '匹配失败数不能为空', trigger: 'blur' }]
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
      formData.value = await YpidMatchTaskApi.getYpidMatchTask(id)
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
    const data = formData.value as unknown as YpidMatchTaskVO
    if (formType.value === 'create') {
      await YpidMatchTaskApi.createYpidMatchTask(data)
      message.success(t('common.createSuccess'))
    } else {
      await YpidMatchTaskApi.updateYpidMatchTask(data)
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
    taskNo: undefined,
    taskName: undefined,
    taskType: undefined,
    sourceId: undefined,
    sourceFile: undefined,
    status: undefined,
    totalCount: undefined,
    matchedCount: undefined,
    confirmedCount: undefined,
    failedCount: undefined,
    autoApplyEnabled: undefined,
    autoApplyThreshold: undefined,
    startTime: undefined,
    endTime: undefined
  }
  formRef.value?.resetFields()
}
</script>
