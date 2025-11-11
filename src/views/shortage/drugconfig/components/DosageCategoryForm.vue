<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="剂型规格" prop="categoryName">
        <el-input v-model="formData.categoryName" placeholder="请输入剂型规格名称" />
      </el-form-item>
      <el-form-item label="统计单位" prop="dosageUnit">
        <el-input v-model="formData.dosageUnit" placeholder="如：普通片剂(片)" />
        <div class="el-form-item__help">
          格式：剂型名称(单位)，如：普通片剂(片)、胶囊(粒)
        </div>
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

const formData = ref({
  id: undefined,
  categoryName: '',
  dosageUnit: '',
  sortOrder: 0,
  status: 0
})

const formRules = reactive({
  categoryName: [{ required: true, message: '剂型规格名称不能为空', trigger: 'blur' }],
  dosageUnit: [{ required: true, message: '统计单位不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
})

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
  }
}

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  const valid = await formRef.value.validate()
  if (!valid) return
  formLoading.value = true
  try {
    const data = formData.value as unknown as DosageCategoryVO
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
    categoryName: '',
    dosageUnit: '',
    sortOrder: 0,
    status: 0
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>

<style scoped>
.el-form-item__help {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
