<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="机构名称（用于匹配）" prop="institutionName">
        <el-input v-model="formData.institutionName" placeholder="请输入机构名称（用于匹配）" />
      </el-form-item>
      <el-form-item label="行政管理归属" prop="category">
        <el-select v-model="formData.category" placeholder="请选择行政管理归属" clearable>
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.ADMINISTRATIVE_AFFILIATION)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="机构级别" prop="level">
        <el-input v-model="formData.level" placeholder="请输入机构级别，如：三级" />
      </el-form-item>
      <el-form-item label="医疗类别" prop="medicalCategory">
        <el-input v-model="formData.medicalCategory" placeholder="请输入医疗类别，如：综合医院" />
      </el-form-item>
      <el-form-item label="状态：0-启用 1-禁用" prop="status">
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
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" placeholder="请输入备注" />
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
import { InstitutionCategoryConfigApi, InstitutionCategoryConfigVO } from '@/api/system/institutioncategoryconfig'

/** 机构行政归属配置 表单 */
defineOptions({ name: 'InstitutionCategoryConfigForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  institutionName: undefined,
  category: undefined,
  level: undefined,
  medicalCategory: undefined,
  status: undefined,
  remark: undefined,
})
const formRules = reactive({
  institutionName: [{ required: true, message: '机构名称（用于匹配）不能为空', trigger: 'blur' }],
  category: [{ required: true, message: '行政管理归属：委直/委管/部队等不能为空', trigger: 'change' }],
  status: [{ required: true, message: '状态：0-启用 1-禁用不能为空', trigger: 'blur' }],
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
      formData.value = await InstitutionCategoryConfigApi.getInstitutionCategoryConfig(id)
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
    const data = formData.value as unknown as InstitutionCategoryConfigVO
    if (formType.value === 'create') {
      await InstitutionCategoryConfigApi.createInstitutionCategoryConfig(data)
      message.success(t('common.createSuccess'))
    } else {
      await InstitutionCategoryConfigApi.updateInstitutionCategoryConfig(data)
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
    institutionName: undefined,
    category: undefined,
    level: undefined,
    medicalCategory: undefined,
    status: undefined,
    remark: undefined,
  }
  formRef.value?.resetFields()
}
</script>