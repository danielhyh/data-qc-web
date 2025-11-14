<template>
  <Dialog v-model="dialogVisible" title="从药品分类批量导入" width="800px">
    <div v-loading="loading">
      <!-- 选择分类 -->
      <el-form :model="formData" label-width="100px">
        <el-form-item label="药品分类">
          <el-select
            v-model="formData.categoryName"
            placeholder="请选择要导入的药品分类"
            @change="handleCategoryChange"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="category in categoryOptions"
              :key="category"
              :label="category"
              :value="category"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 预览列表 -->
      <div v-if="previewList.length > 0" class="preview-section">
        <el-divider content-position="left">
          <span class="preview-title">
            <Icon icon="ep:view" class="mr-1" />
            预览导入药品（{{ previewList.length }} 种）
          </span>
        </el-divider>
        
        <div class="preview-table-wrapper">
          <el-table 
            :data="mergedPreviewList" 
            border 
            max-height="400"
            size="small"
            :span-method="objectSpanMethod"
          >
            <el-table-column label="序号" width="60" align="center">
              <template #default="scope">
                <span v-if="scope.row.showDrugName">{{ scope.row.drugIndex }}</span>
              </template>
            </el-table-column>
            <el-table-column 
              label="药品名称" 
              prop="drugName" 
              min-width="150"
              show-overflow-tooltip
            />
            <el-table-column 
              label="剂型规格" 
              prop="dosageCategory" 
              width="120"
              align="center"
            >
              <template #default="scope">
                {{ scope.row.dosageCategory || '-' }}
              </template>
            </el-table-column>
            <el-table-column 
              label="统计单位" 
              prop="dosageForm" 
              width="100"
              align="center"
            >
              <template #default="scope">
                <el-tag v-if="scope.row.dosageForm" size="small" type="success">
                  {{ scope.row.dosageForm }}
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column 
              label="状态" 
              prop="status" 
              width="80"
              align="center"
            >
              <template #default="scope">
                <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-alert
          type="info"
          :closable="false"
          show-icon
          class="mt-3"
        >
          <template #title>
            <span>提示：将从"{{ formData.categoryName }}"分类中导入 <strong>{{ uniqueDrugCount }}</strong> 种药品（共 {{ previewList.length }} 条记录）到当前专区</span>
          </template>
        </el-alert>
      </div>

      <el-empty 
        v-else-if="formData.categoryName" 
        description="该分类下暂无药品"
        :image-size="100"
      />
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button 
        type="primary" 
        @click="handleConfirm" 
        :disabled="previewList.length === 0"
        :loading="importing"
      >
        确认导入
      </el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DrugCategoryApi } from '@/api/shortage/drugcategory'
import { DrugConfigApi } from '@/api/shortage'
import { DICT_TYPE } from '@/utils/dict'
import { Icon } from '@/components/Icon'

/** 批量导入对话框 */
defineOptions({ name: 'BatchImportDialog' })

const message = useMessage()

// Props
const props = defineProps<{
  zoneId?: number
}>()

const dialogVisible = ref(false)
const loading = ref(false)
const importing = ref(false)
const categoryOptions = ref<string[]>([])
const previewList = ref<any[]>([])
const mergedPreviewList = ref<any[]>([]) // 合并后的预览列表

const formData = ref({
  categoryName: ''
})

// 计算唯一药品数量
const uniqueDrugCount = computed(() => {
  const uniqueDrugs = new Set(previewList.value.map(item => item.drugName))
  return uniqueDrugs.size
})

/** 打开弹窗 */
const open = async () => {
  dialogVisible.value = true
  formData.value.categoryName = ''
  previewList.value = []
  
  // 加载药品分类列表
  await loadCategories()
}

/** 加载药品分类列表 */
const loadCategories = async () => {
  loading.value = true
  try {
    const categories = await DrugCategoryApi.getCategoryNames()
    categoryOptions.value = categories
  } catch (error) {
    console.error('加载药品分类失败:', error)
    message.error('加载药品分类失败')
  } finally {
    loading.value = false
  }
}

/** 处理分类变化 */
const handleCategoryChange = async (categoryName: string) => {
  if (!categoryName) {
    previewList.value = []
    mergedPreviewList.value = []
    return
  }
  
  loading.value = true
  try {
    // 获取该分类下的完整药品列表（用于预览）
    const drugs = await DrugCategoryApi.getDrugListByCategory(categoryName)
    previewList.value = drugs
    
    // 合并相同药品名称
    mergeDrugNames(drugs)
  } catch (error) {
    console.error('加载药品列表失败:', error)
    message.error('加载药品列表失败')
    previewList.value = []
    mergedPreviewList.value = []
  } finally {
    loading.value = false
  }
}

/** 合并相同药品名称 */
const mergeDrugNames = (drugs: any[]) => {
  const drugMap = new Map<string, any[]>()
  
  // 按药品名称分组
  drugs.forEach(drug => {
    if (!drugMap.has(drug.drugName)) {
      drugMap.set(drug.drugName, [])
    }
    drugMap.get(drug.drugName)!.push(drug)
  })
  
  // 转换为合并列表
  const result: any[] = []
  let drugIndex = 1
  
  drugMap.forEach((items, drugName) => {
    items.forEach((item, index) => {
      result.push({
        ...item,
        drugIndex: drugIndex,
        showDrugName: index === 0, // 只有第一行显示药品名称
        rowspan: index === 0 ? items.length : 0 // 合并行数
      })
    })
    drugIndex++
  })
  
  mergedPreviewList.value = result
}

/** 表格合并方法 */
const objectSpanMethod = ({ row, column, rowIndex, columnIndex }: any) => {
  // 合并序号列和药品名称列
  if (columnIndex === 0 || columnIndex === 1) {
    if (row.showDrugName) {
      return {
        rowspan: row.rowspan,
        colspan: 1
      }
    } else {
      return {
        rowspan: 0,
        colspan: 0
      }
    }
  }
}

/** 确认导入 */
const emit = defineEmits(['success'])
const handleConfirm = async () => {
  if (!props.zoneId) {
    message.error('专区ID不能为空')
    return
  }
  
  if (!formData.value.categoryName) {
    message.error('请选择药品分类')
    return
  }
  
  importing.value = true
  try {
    const count = await DrugConfigApi.batchImportFromCategory({
      zoneId: props.zoneId,
      categoryName: formData.value.categoryName
    })
    
    message.success(`成功导入 ${count} 种药品`)
    dialogVisible.value = false
    emit('success')
  } catch (error) {
    console.error('批量导入失败:', error)
    message.error('批量导入失败')
  } finally {
    importing.value = false
  }
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.preview-section {
  margin-top: 20px;
}

.preview-title {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.preview-table-wrapper {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}
</style>

