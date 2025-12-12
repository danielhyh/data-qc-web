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
        <el-tree-select
          v-model="formData.deptId"
          :data="deptTree"
          :props="defaultProps"
          filterable
          check-strictly
          node-key="id"
          placeholder="请选择机构"
          class="!w-full"
          :disabled="!!fixedDeptId"
        />
      </el-form-item>
      <el-form-item label="不上报模块" prop="moduleCode">
        <el-select
          v-model="formData.moduleCode"
          placeholder="请选择不上报模块"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in availableModuleOptions"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
        <div v-if="deptBusinessType && deptBusinessType !== 'BOTH'" class="text-gray-400 text-xs mt-1">
          <Icon icon="ep:info-filled" class="mr-1" />
          该机构只参与{{ deptBusinessType === 'SHORTAGE' ? '短缺药品' : '监测' }}系统，只能选择对应模块
        </div>
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
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import { defaultProps, handleTree } from '@/utils/tree'
import {
  MonitoringUnableReportApi,
  MonitoringUnableReportVO
} from '@/api/system/monitoringunablereport'
import { getSimpleDeptList } from '@/api/system/dept'
import { Icon } from '@/components/Icon'

/** 无法上报机构 表单 */
defineOptions({ name: 'MonitoringUnableReportForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined as number | undefined,
  deptId: undefined as number | undefined,
  moduleCode: undefined as string | undefined,
  unableReportReason: undefined as string | undefined,
  remark: undefined as string | undefined
})
const formRules = reactive({
  deptId: [{ required: true, message: '所属机构不能为空', trigger: 'change' }],
  moduleCode: [{ required: true, message: '不上报模块不能为空', trigger: 'change' }],
  unableReportReason: [{ required: true, message: '无法上报原因不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const deptTree = ref<Tree[]>([]) // 机构树
const fixedDeptId = ref<number>() // 固定的机构ID（从机构管理入口传入）
const deptBusinessType = ref<string>() // 机构的参与系统类型

/** 根据机构参与系统过滤可选模块 */
const availableModuleOptions = computed(() => {
  const allOptions = getStrDictOptions(DICT_TYPE.BUSINESS_MODULE)
  // 如果没有指定业务类型或是BOTH，返回所有选项（排除BOTH本身）
  if (!deptBusinessType.value || deptBusinessType.value === 'BOTH') {
    return allOptions.filter(opt => opt.value !== 'BOTH')
  }
  // 否则只返回对应的模块
  return allOptions.filter(opt => opt.value === deptBusinessType.value)
})

/** 打开弹窗 */
const open = async (type: string, id?: number, deptId?: number, areaCode?: string, businessType?: string) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  
  // 如果传入了固定的机构ID，设置并置灰
  if (deptId) {
    fixedDeptId.value = deptId
    formData.value.deptId = deptId
  } else {
    fixedDeptId.value = undefined
  }
  
  // 设置机构的参与系统类型，用于限制可选模块
  deptBusinessType.value = businessType
  
  // 加载机构列表
  await loadDeptList(areaCode ? undefined : undefined)
  
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

/** 加载机构树 */
const loadDeptList = async (regionId?: number) => {
  try {
    const list = await getSimpleDeptList(regionId)
    deptTree.value = handleTree(list)
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
    moduleCode: undefined,
    unableReportReason: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
