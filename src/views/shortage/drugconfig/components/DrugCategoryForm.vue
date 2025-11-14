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
          <el-radio :value="1">只新增分类</el-radio>
          <el-radio :value="2">选择已有分类添加药品信息</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 分类名称：新增分类时为输入框，选择已有分类时为下拉框 -->
      <el-form-item prop="categoryName">
        <template #label>
          <Tooltip
            v-if="formData.addMode === 1 && formType === 'create'"
            title="分类名称"
            message="新增的分类名称必须唯一"
            icon="ep:info-filled"
          />
          <span v-else>分类名称</span>
        </template>
        <el-input 
          v-if="formType === 'update' || formData.addMode === 1"
          v-model="formData.categoryName" 
          placeholder="请输入分类名称"
          :disabled="formType === 'update'"
        />
        <el-select
          v-else
          v-model="formData.categoryName"
          placeholder="请选择分类"
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

      <!-- 只在模式2或编辑时显示药品名称 -->
      <el-form-item label="药品名称" prop="drugName" v-if="formType === 'update' || formData.addMode === 2">
        <el-input 
          v-model="formData.drugName" 
          placeholder="请输入药品名称"
          :disabled="formType === 'update'"
        />
      </el-form-item>
      <!-- 模式2或编辑时显示剂型规格列表 -->
      <template v-if="(formType === 'create' && formData.addMode === 2) || formType === 'update'">
        <el-form-item label="剂型规格列表">
          <div class="dosage-list-container">
            <!-- 剂型规格列表 -->
            <div 
              v-for="(dosage, index) in formData.dosageInfos" 
              :key="index"
              class="dosage-item"
            >
              <el-select
                v-model="dosage.dosageCategory"
                placeholder="请选择剂型规格"
                @change="handleDosageCategoryChangeForItem(index)"
                style="width: 200px"
                clearable
              >
                <el-option
                  v-for="category in dosageCategories"
                  :key="category"
                  :label="category"
                  :value="category"
                />
              </el-select>
              <el-select
                v-model="dosage.dosageForm"
                placeholder="请选择统计单位"
                :disabled="!dosage.dosageCategory"
                style="width: 200px; margin-left: 10px"
                filterable
                clearable
              >
                <el-option
                  v-for="unit in dosage.availableUnits || []"
                  :key="unit"
                  :label="unit"
                  :value="unit"
                />
              </el-select>
              <el-button 
                type="danger" 
                size="small" 
                @click="removeDosageItem(index)"
                style="margin-left: 10px"
              >
                <Icon icon="ep:delete" />
              </el-button>
            </div>
            
            <!-- 添加按钮 -->
            <el-button 
              type="primary" 
              size="small" 
              @click="addDosageItem"
              :style="formData.dosageInfos.length > 0 ? 'margin-top: 10px' : ''"
            >
              <Icon icon="ep:plus" class="mr-1" />
              添加剂型规格
            </el-button>
          </div>
        </el-form-item>
      </template>
      <el-form-item label="排序" prop="sortOrder">
        <el-input-number v-model="formData.sortOrder" :min="0" :max="999" style="width: 100%" />
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
import { DrugCategoryApi, type DrugCategoryVO, type DrugCategoryBatchSaveVO } from '@/api/shortage/drugcategory'
import { DosageCategoryApi } from '@/api/shortage/dosagecategory'
import {DICT_TYPE, getIntDictOptions} from "@/utils/dict";

/** 组件名称 */
defineOptions({ name: 'DrugCategoryForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formRef = ref()

const formData = ref({
  id: undefined,
  addMode: 1, // 1-只新增分类，2-选择已有分类添加药品信息
  categoryName: '',
  drugName: '',
  originalCategoryName: '', // 编辑时保存原始分类名称
  originalDrugName: '', // 编辑时保存原始药品名称
  dosageCategory: '',
  dosageForm: '',
  dosageUnit: '',
  dosageInfos: [], // 模式2的剂型列表（默认为空）
  sortOrder: 0,
  status: 0
})

// API数据
const existingCategories = ref<string[]>([])  // 已有的分类列表
const dosageCategories = ref<string[]>([])
const availableDosageUnits = ref<string[]>([])

const formRules = computed(() => {
  const rules: any = {
    addMode: [{ required: true, message: '请选择添加模式', trigger: 'change' }],
    categoryName: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }],
    status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
  }
  
  // 模式2（选择已有分类添加药品信息）或编辑时，药品名称为必填
  if (formType.value === 'update' || formData.value.addMode === 2) {
    rules.drugName = [{ required: true, message: '药品名称不能为空', trigger: 'blur' }]
  }
  
  return rules
})

// 加载已有分类列表
const loadExistingCategories = async () => {
  try {
    const categoryNames = await DrugCategoryApi.getCategoryNames()
    existingCategories.value = categoryNames
  } catch (error) {
    console.error('加载分类列表失败:', error)
  }
}

// 加载剂型规格数据
const loadDosageCategories = async () => {
  try {
    const dosageCategoryNames = await DosageCategoryApi.getCategoryNames()
    dosageCategories.value = dosageCategoryNames
  } catch (error) {
    console.error('加载剂型规格失败:', error)
  }
}

// 处理添加模式变化
const handleAddModeChange = (mode: number) => {
  // 清空相关字段
  formData.value.categoryName = ''
  formData.value.drugName = ''
  formData.value.dosageCategory = ''
  formData.value.dosageForm = ''
  formData.value.dosageUnit = ''
  formData.value.dosageInfos = []
  availableDosageUnits.value = []
  
  // 如果是模式2，加载已有分类列表
  if (mode === 2) {
    loadExistingCategories()
  }
}

// 添加剂型规格项
const addDosageItem = () => {
  formData.value.dosageInfos.push({ 
    dosageCategory: '', 
    dosageForm: '', 
    availableUnits: [] 
  })
}

// 删除剂型规格项
const removeDosageItem = (index: number) => {
  formData.value.dosageInfos.splice(index, 1)
}

// 处理剂型规格变化（批量添加模式中的某一项）
const handleDosageCategoryChangeForItem = async (index: number) => {
  const item = formData.value.dosageInfos[index]
  item.dosageForm = ''
  item.availableUnits = []

  if (item.dosageCategory) {
    try {
      const dosageUnits = await DosageCategoryApi.getDosageUnitsByCategory(item.dosageCategory)
      item.availableUnits = dosageUnits
    } catch (error) {
      console.error('加载统计单位列表失败:', error)
    }
  }
}

// 处理剂型规格变化（编辑模式）
const handleDosageCategoryChange = async (category: string) => {
  // 清空统计单位选择
  formData.value.dosageForm = ''
  formData.value.dosageUnit = ''
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

/** 打开弹窗 */
const open = async (type: string, id?: number, defaultCategory?: string) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加药品分类' : '修改药品分类'
  formType.value = type
  resetForm()
  
  // 加载基础数据
  await loadDosageCategories()
  
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await DrugCategoryApi.get(id)
      
      // 加载该药品的所有剂型规格记录
      if (data.categoryName && data.drugName) {
        const drugRecords = await DrugCategoryApi.getListByDrug(data.categoryName, data.drugName)
        
        // 转换为剂型规格列表
        formData.value.dosageInfos = []
        for (const record of drugRecords) {
          const dosageItem: any = {
            id: record.id,
            dosageCategory: record.dosageCategory || '',
            dosageForm: record.dosageForm || '',
            availableUnits: []
          }
          
          // 加载该剂型规格的统计单位列表
          if (record.dosageCategory) {
            try {
              const dosageUnits = await DosageCategoryApi.getDosageUnitsByCategory(record.dosageCategory)
              dosageItem.availableUnits = dosageUnits
            } catch (error) {
              console.error('加载统计单位列表失败:', error)
            }
          }
          
          formData.value.dosageInfos.push(dosageItem)
        }
        
        // 设置基础信息
        formData.value.categoryName = data.categoryName
        formData.value.drugName = data.drugName
        formData.value.originalCategoryName = data.categoryName
        formData.value.originalDrugName = data.drugName
        formData.value.sortOrder = data.sortOrder
        formData.value.status = data.status
      }
    } finally {
      formLoading.value = false
    }
  } else {
    // 新增时加载已有分类列表（为模式2准备）
    await loadExistingCategories()
    
    // 如果传入了默认分类，设置为默认值（模式2时自动选中当前Tab的分类）
    if (defaultCategory) {
      formData.value.addMode = 2
      formData.value.categoryName = defaultCategory
    }
  }
}

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  const valid = await formRef.value.validate()
  if (!valid) return
  
  // 模式2时，如果有剂型规格列表，则校验完整性
  if (formType.value === 'create' && formData.value.addMode === 2 && formData.value.dosageInfos.length > 0) {
    const hasEmptyDosage = formData.value.dosageInfos.some(
      item => !item.dosageCategory || !item.dosageForm
    )
    if (hasEmptyDosage) {
      message.error('请完善所有剂型规格和统计单位信息')
      return
    }
  }
  
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      if (formData.value.addMode === 1) {
        // 模式1：只新增分类
        await DrugCategoryApi.create({
          categoryName: formData.value.categoryName,
          sortOrder: formData.value.sortOrder,
          status: formData.value.status
        } as DrugCategoryVO)
        message.success('新增成功')
      } else {
        // 模式2：批量创建（选择已有分类添加药品信息）
        await DrugCategoryApi.batchCreate({
          categoryName: formData.value.categoryName,
          drugName: formData.value.drugName,
          dosageInfos: formData.value.dosageInfos.map(item => ({
            dosageCategory: item.dosageCategory,
            dosageForm: item.dosageForm
          })),
          sortOrder: formData.value.sortOrder,
          status: formData.value.status
        })
        message.success(`成功添加 ${formData.value.dosageInfos.length} 个剂型规格`)
      }
    } else {
      // 编辑模式：批量更新（先删除该药品所有记录，再批量创建）
      await DrugCategoryApi.batchUpdate(
        {
          categoryName: formData.value.categoryName,
          drugName: formData.value.drugName,
          dosageInfos: formData.value.dosageInfos.map(item => ({
            dosageCategory: item.dosageCategory,
            dosageForm: item.dosageForm
          })),
          sortOrder: formData.value.sortOrder,
          status: formData.value.status
        },
        formData.value.originalCategoryName,
        formData.value.originalDrugName
      )
      message.success(`成功更新 ${formData.value.dosageInfos.length} 个剂型规格`)
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
    drugName: '',
    originalCategoryName: '',
    originalDrugName: '',
    dosageCategory: '',
    dosageForm: '',
    dosageUnit: '',
    dosageInfos: [], // 默认为空数组
    sortOrder: 0,
    status: 0
  }
  availableDosageUnits.value = []
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>

<style scoped>
.dosage-list-container {
  width: 100%;
}

.dosage-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
</style>
