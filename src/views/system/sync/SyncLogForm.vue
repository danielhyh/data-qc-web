<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="同步类型" prop="syncType">
        <el-select v-model="formData.syncType" placeholder="请选择同步类型">
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.SYNC_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="外部ID" prop="externalId">
        <el-input v-model="formData.externalId" placeholder="请输入外部ID" />
      </el-form-item>
      <el-form-item label="操作类型" prop="operation">
        <el-input v-model="formData.operation" placeholder="请输入操作类型" />
      </el-form-item>
      <el-form-item label="处理状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.PROCESS_STATUS)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="请求数据" prop="requestData">
        <el-input v-model="formData.requestData" placeholder="请输入请求数据" />
      </el-form-item>
      <el-form-item label="错误信息" prop="errorMsg">
        <el-input v-model="formData.errorMsg" placeholder="请输入错误信息" />
      </el-form-item>
      <el-form-item label="推送时间" prop="pushTime">
        <el-date-picker
          v-model="formData.pushTime"
          type="date"
          value-format="x"
          placeholder="选择推送时间"
        />
      </el-form-item>
      <el-form-item label="处理时间" prop="processTime">
        <el-date-picker
          v-model="formData.processTime"
          type="date"
          value-format="x"
          placeholder="选择处理时间"
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
import { getIntDictOptions, getStrDictOptions, DICT_TYPE } from '@/utils/dict'
import { SyncLogApi, SyncLogVO } from '@/api/system/sync'

/** 直报系统同步日志 表单 */
defineOptions({ name: 'SyncLogForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  syncType: undefined,
  externalId: undefined,
  operation: undefined,
  status: undefined,
  requestData: undefined,
  errorMsg: undefined,
  pushTime: undefined,
  processTime: undefined,
})
const formRules = reactive({
  syncType: [{ required: true, message: '同步类型不能为空', trigger: 'change' }],
  operation: [{ required: true, message: '操作类型不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '处理状态不能为空', trigger: 'blur' }],
  pushTime: [{ required: true, message: '推送时间不能为空', trigger: 'blur' }],
  processTime: [{ required: true, message: '处理时间不能为空', trigger: 'blur' }],
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
      formData.value = await SyncLogApi.getSyncLog(id)
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
    const data = formData.value as unknown as SyncLogVO
    if (formType.value === 'create') {
      await SyncLogApi.createSyncLog(data)
      message.success(t('common.createSuccess'))
    } else {
      await SyncLogApi.updateSyncLog(data)
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
    syncType: undefined,
    externalId: undefined,
    operation: undefined,
    status: undefined,
    requestData: undefined,
    errorMsg: undefined,
    pushTime: undefined,
    processTime: undefined,
  }
  formRef.value?.resetFields()
}
</script>
