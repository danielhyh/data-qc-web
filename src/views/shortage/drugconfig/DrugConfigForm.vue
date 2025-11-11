<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="药品分类" prop="drugCategory">
        <el-select
          v-model="formData.drugCategory"
          placeholder="请选择药品分类"
          @change="handleDrugCategoryChange"
          style="width: 100%"
        >
          <el-option
            v-for="category in drugCategories"
            :key="category"
            :label="category"
            :value="category"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="药品名称" prop="drugName">
        <el-select
          v-model="formData.drugName"
          placeholder="请先选择药品分类"
          :disabled="!formData.drugCategory"
          filterable
          style="width: 100%"
        >
          <el-option
            v-for="drugName in availableDrugNames"
            :key="drugName"
            :label="drugName"
            :value="drugName"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="剂型规格" prop="dosageCategory">
        <el-select
          v-model="formData.dosageCategory"
          placeholder="请选择剂型规格"
          @change="handleDosageCategoryChange"
          style="width: 100%"
        >
          <el-option
            v-for="category in dosageCategories"
            :key="category"
            :label="category"
            :value="category"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="统计单位" prop="dosageForm">
        <el-select
          v-model="formData.dosageForm"
          placeholder="请先选择剂型规格"
          :disabled="!formData.dosageCategory"
          style="width: 100%"
          filterable
        >
          <el-option
            v-for="unit in availableDosageUnits"
            :key="unit"
            :label="unit"
            :value="unit"
          />
        </el-select>
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
      <el-form-item label="排序" prop="sortOrder">
        <el-input-number
          v-model="formData.sortOrder"
          :min="0"
          :max="9999"
          placeholder="请输入排序数值"
          style="width: 100%"
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
import { DrugConfigApi, type DrugConfigVO } from '@/api/shortage'
import { DrugCategoryApi } from '@/api/shortage/drugcategory'
import { DosageCategoryApi } from '@/api/shortage/dosagecategory'
import {DICT_TYPE, getIntDictOptions} from "@/utils/dict";

/** 专区药品配置 表单 */
defineOptions({ name: 'DrugConfigForm' })

const message = useMessage() // 消息弹窗

// Props
const props = defineProps<{
  zoneId?: number
}>()

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  zoneId: props.zoneId,
  drugCategory: '', // 新增：药品分类
  drugName: '',
  dosageCategory: '',
  dosageForm: '',
  status: 0,
  sortOrder: 0,
})

// API数据
const drugCategories = ref<string[]>([])
const availableDrugNames = ref<string[]>([])
const dosageCategories = ref<string[]>([])
const availableDosageUnits = ref<string[]>([])

const formRules = reactive({
  drugCategory: [{ required: true, message: '请选择药品分类', trigger: 'change' }],
  drugName: [{ required: true, message: '请选择药品名称', trigger: 'change' }],
  dosageCategory: [{ required: true, message: '请选择剂型规格', trigger: 'change' }],
  dosageForm: [{ required: true, message: '请选择统计单位', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
})

// 加载基础数据
const loadBasicData = async () => {
  try {
    // 加载药品分类
    const drugCategoryNames = await DrugCategoryApi.getCategoryNames()
    drugCategories.value = drugCategoryNames

    // 加载剂型规格
    const dosageCategoryNames = await DosageCategoryApi.getCategoryNames()
    dosageCategories.value = dosageCategoryNames
  } catch (error) {
    console.error('加载基础数据失败:', error)
  }
}

// 处理药品分类变化
const handleDrugCategoryChange = async (category: string) => {
  // 清空药品名称选择
  formData.value.drugName = ''
  availableDrugNames.value = []

  if (category) {
    try {
      // 根据分类加载药品列表
      const drugNames = await DrugCategoryApi.getDrugsByCategory(category)
      availableDrugNames.value = drugNames
    } catch (error) {
      console.error('加载药品列表失败:', error)
    }
  }
}

// 处理剂型规格变化
const handleDosageCategoryChange = async (category: string) => {
  // 清空统计单位选择
  formData.value.dosageForm = ''
  availableDosageUnits.value = []

  if (category) {
    try {
      // 根据剂型规格加载统计单位列表
      const dosageUnits = await DosageCategoryApi.getDosageUnitsByCategory(category)
      availableDosageUnits.value = dosageUnits
    } catch (error) {
      console.error('加载统计单位列表失败:', error)
    }
  }
}

// 自动生成排序号
const generateSortOrder = async () => {
  if (!props.zoneId) return 1

  try {
    // 查询当前专区的药品配置数量，用于生成下一个排序号
    const data = await DrugConfigApi.getPage({
      pageNo: 1,
      pageSize: 1,
      zoneId: props.zoneId
    })
    return (data.total || 0) + 1
  } catch (error) {
    return 1
  }
}

const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增药品配置' : '编辑药品配置'
  formType.value = type
  resetForm()

  // 加载基础数据
  await loadBasicData()

  // 设置专区ID
  if (props.zoneId) {
    formData.value.zoneId = props.zoneId
  }

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await DrugConfigApi.get(id)
      Object.assign(formData.value, data)

      // 如果有药品分类，加载对应的药品列表
      if (data.drugCategory) {
        await handleDrugCategoryChange(data.drugCategory)
      }

      // 如果有剂型规格，加载对应的统计单位列表
      if (data.dosageCategory) {
        await handleDosageCategoryChange(data.dosageCategory)
      }
    } finally {
      formLoading.value = false
    }
  } else {
    // 新增时自动生成排序号
    formData.value.sortOrder = await generateSortOrder()
  }
}

defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

const submitForm = async () => {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => {})
  if (!valid) return

  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as DrugConfigVO
    if (formType.value === 'create') {
      await DrugConfigApi.create(data)
      message.success('创建成功')
    } else {
      await DrugConfigApi.update(data)
      message.success('更新成功')
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
    zoneId: props.zoneId,
    drugCategory: '',
    drugName: '',
    dosageCategory: '',
    dosageForm: '',
    status: 0,
    sortOrder: 0,
  }

  // 清空动态数据
  availableDrugNames.value = []
  availableDosageUnits.value = []

  formRef.value?.resetFields()
}
</script>
