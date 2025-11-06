<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="机构名称" prop="institutionName">
            <el-input 
              v-model="formData.institutionName" 
              placeholder="请输入完整机构名称，用于精确匹配"
              clearable
            >
              <template #prefix>
                <Icon icon="ep:office-building" />
              </template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="行政归属" prop="category">
            <el-select 
              v-model="formData.category" 
              placeholder="请选择" 
              clearable
              class="!w-full"
            >
              <el-option
                v-for="dict in getStrDictOptions(DICT_TYPE.ADMINISTRATIVE_AFFILIATION)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="机构级别" prop="level">
            <el-input 
              v-model="formData.level" 
              placeholder="如：三级、二级"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="医疗类别" prop="medicalCategory">
            <el-input 
              v-model="formData.medicalCategory" 
              placeholder="如：综合医院"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
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
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input 
              v-model="formData.remark" 
              type="textarea"
              :rows="3"
              placeholder="请输入备注信息（可选）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="submitForm" :disabled="formLoading">
        <Icon icon="ep:check" class="mr-5px" />
        确 定
      </el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, getStrDictOptions, DICT_TYPE } from '@/utils/dict'
import { InstitutionCategoryConfigApi, InstitutionCategoryConfigVO } from '@/api/system/institutioncategoryconfig'
import { Icon } from '@/components/Icon'

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
  status: 0, // 默认启用
  remark: undefined,
})
const formRules = reactive({
  institutionName: [{ required: true, message: '请输入机构名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择行政归属', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
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
    status: 0, // 默认启用
    remark: undefined,
  }
  formRef.value?.resetFields()
}
</script>