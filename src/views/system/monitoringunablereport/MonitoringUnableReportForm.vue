<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="所属机构" prop="deptId">
        <el-select
          v-model="formData.deptId"
          placeholder="请选择机构"
          clearable
          filterable
          class="!w-240px"
        >
          <el-option v-for="dept in deptList" :key="dept.id" :label="dept.name" :value="dept.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="无法上报原因" prop="unableReportReason">
        <el-select
          v-model="formData.unableReportReason"
          placeholder="请选择无法上报原因"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.UNABLE_REPORT_REASON)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="备注说明" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注说明" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import {
  MonitoringUnableReportApi,
  MonitoringUnableReportVO
} from '@/api/system/monitoringunablereport'
import { DeptVO, getSimpleDeptList } from '@/api/system/dept'

/** 无法上报机构 表单 */
defineOptions({ name: 'MonitoringUnableReportForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  deptId: undefined,
  unableReportReason: undefined,
  remark: undefined,
  status: 0
})
const formRules = reactive({
  deptId: [{ required: true, message: '所属机构不能为空', trigger: 'blur' }],
  unableReportReason: [{ required: true, message: '无法上报原因不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const deptList = ref<DeptVO[]>([]) // 机构列表

/** 打开弹窗 */
const open = async (type: string, id?: number, regionId?: number, areaCode?: string) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 加载机构列表
  await loadDeptList(regionId)
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await MonitoringUnableReportApi.getMonitoringUnableReport(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 加载机构列表 */
const loadDeptList = async (regionId?: number) => {
  try {
    deptList.value = await getSimpleDeptList(regionId)
  } catch (error) {
    console.error('加载机构列表失败:', error)
  }
}

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as MonitoringUnableReportVO
    if (formType.value === 'create') {
      await MonitoringUnableReportApi.createMonitoringUnableReport(data)
      message.success(t('common.createSuccess'))
    } else {
      await MonitoringUnableReportApi.updateMonitoringUnableReport(data)
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
    deptId: undefined,
    unableReportReason: undefined,
    remark: undefined,
    status: 0
  }
  formRef.value?.resetFields()
}
</script>
