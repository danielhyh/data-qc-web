<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <!-- 新增时显示添加模式选择 -->
      <el-form-item label="添加模式" prop="addMode" v-if="formType === 'create'">
        <el-radio-group v-model="formData.addMode" @change="handleAddModeChange">
          <el-radio :value="1">新增剂型规格</el-radio>
          <el-radio :value="2">选择已有剂型规格添加统计单位</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 剂型规格：新增模式为输入框，选择模式为下拉框 -->
      <el-form-item label="剂型规格" prop="categoryName">
        <el-input 
          v-if="formType === 'update' || formData.addMode === 1"
          v-model="formData.categoryName" 
          placeholder="请输入剂型规格名称"
          :disabled="formType === 'update'"
        />
        <el-select
          v-else
          v-model="formData.categoryName"
          placeholder="请选择剂型规格"
          filterable
          style="width: 100%"
        >
          <el-option
            v-for="category in existingCategories"
            :key="category"
            :label="category"
            :value="category"
          />
        </el-select>
      </el-form-item>

      <!-- 只在模式2（选择已有剂型规格）或编辑时显示统计单位 -->
      <el-form-item prop="dosageUnit" v-if="formType === 'update' || formData.addMode === 2">
        <template #label>
          <Tooltip
            title="统计单位"
            message="格式：剂型名称(单位)，如：普通片剂(片)、胶囊(粒)"
            icon="ep:info-filled"
          />
        </template>
        <el-input v-model="formData.dosageUnit" placeholder="如：普通片剂(片)" />
      </el-form-item>
      <el-form-item label="排序" prop="sortOrder">
        <el-input-number v-model="formData.sortOrder" :min="0" :max="999" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm" :loading="formLoading">确 定</el-button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DosageCategoryApi, type DosageCategoryVO } from '@/api/shortage/dosagecategory'
import {DICT_TYPE, getIntDictOptions} from "@/utils/dict";

/** 组件名称 */
defineOptions({ name: 'DosageCategoryForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formRef = ref()

// 已有的剂型规格列表
const existingCategories = ref<string[]>([])

const formData = ref({
  id: undefined,
  addMode: 1, // 1-新增剂型规格，2-选择已有剂型规格
  categoryName: '',
  dosageUnit: '',
  sortOrder: 0,
  status: 0
})

const formRules = computed(() => {
  const rules: any = {
    addMode: [{ required: true, message: '请选择添加模式', trigger: 'change' }],
    categoryName: [{ required: true, message: '剂型规格名称不能为空', trigger: 'blur' }],
    status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
  }
  
  // 模式2（选择已有剂型规格）或编辑时，统计单位为必填
  if (formType.value === 'update' || formData.value.addMode === 2) {
    rules.dosageUnit = [{ required: true, message: '统计单位不能为空', trigger: 'blur' }]
  }
  
  return rules
})

/** 加载已有的剂型规格列表 */
const loadExistingCategories = async () => {
  try {
    existingCategories.value = await DosageCategoryApi.getCategoryNames()
  } catch (error) {
    console.error('加载剂型规格列表失败:', error)
  }
}

/** 处理添加模式变化 */
const handleAddModeChange = (mode: number) => {
  // 清空剂型规格和统计单位选择
  formData.value.categoryName = ''
  formData.value.dosageUnit = ''
  
  // 如果是选择已有剂型规格模式，加载列表
  if (mode === 2) {
    loadExistingCategories()
  }
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加剂型规格' : '修改剂型规格'
  formType.value = type
  resetForm()
  
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await DosageCategoryApi.get(id)
      Object.assign(formData.value, data)
    } finally {
      formLoading.value = false
    }
  } else {
    // 新增时加载已有剂型规格列表（为模式2准备）
    await loadExistingCategories()
  }
}

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  const valid = await formRef.value.validate()
  if (!valid) return
  formLoading.value = true
  try {
    const data = {
      id: formData.value.id,
      categoryName: formData.value.categoryName,
      dosageUnit: formData.value.dosageUnit,
      sortOrder: formData.value.sortOrder,
      status: formData.value.status
    } as DosageCategoryVO
    
    if (formType.value === 'create') {
      await DosageCategoryApi.create(data)
      message.success('新增成功')
    } else {
      await DosageCategoryApi.update(data)
      message.success('修改成功')
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    addMode: 1,
    categoryName: '',
    dosageUnit: '',
    sortOrder: 0,
    status: 0
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>

