<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" class="template-form-dialog" width="1200px">
    <div v-loading="formLoading" class="template-form-container">
      <!-- 基本信息配置 -->
      <el-card class="config-section" shadow="never">
        <template #header>
          <div class="section-header">
            <Icon class="section-icon" icon="ep:info" />
            <span class="section-title">基本信息</span>
          </div>
        </template>

        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          class="basic-form"
          label-width="120px"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="模板名称" prop="templateName">
                <el-input
                  v-model="formData.templateName"
                  maxlength="100"
                  placeholder="请输入模板名称"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="模板编码" prop="templateCode">
                <el-input
                  v-model="formData.templateCode"
                  :disabled="formType === 'update'"
                  maxlength="50"
                  placeholder="请输入模板编码"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="表类型" prop="tableType">
                <el-select
                  v-model="formData.tableType"
                  :disabled="formType === 'update'"
                  placeholder="请选择表类型"
                  style="width: 100%"
                >
                  <el-option
                    v-for="dict in getStrDictOptions(DICT_TYPE.IMPORT_TABLE_TYPE)"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="状态" prop="status">
                <el-radio-group v-model="formData.status">
                  <el-radio :value="true">启用</el-radio>
                  <el-radio :value="false">禁用</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="标题行文本" prop="titleText">
            <el-input
              v-model="formData.titleText"
              maxlength="200"
              placeholder="请输入Excel第1行的标题文本"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="说明行文本" prop="descriptionText">
            <el-input
              v-model="formData.descriptionText"
              :rows="3"
              maxlength="1000"
              placeholder="请输入Excel第2行的说明文本，支持长文本编辑"
              show-word-limit
              type="textarea"
            />
          </el-form-item>

          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              :rows="2"
              maxlength="500"
              placeholder="请输入备注信息"
              show-word-limit
              type="textarea"
            />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 字段配置 -->
      <el-card class="config-section" shadow="never">
        <template #header>
          <div class="section-header">
            <Icon class="section-icon" icon="ep:list" />
            <span class="section-title">字段配置</span>
            <div class="section-actions">
              <el-tooltip
                :disabled="!!formData.tableType"
                content="请先选择表类型后，才能从字段库添加"
                placement="top"
              >
                <el-button
                  :disabled="!formData.tableType"
                  size="small"
                  type="primary"
                  @click="openFieldLibrary"
                >
                  <Icon class="mr-5px" icon="ep:plus" />
                  从字段库添加
                </el-button>
              </el-tooltip>
              <el-button size="small" type="success" @click="addField">
                <Icon class="mr-5px" icon="ep:plus" />
                添加字段
              </el-button>
              <el-button
                :disabled="!selectedFields.length"
                size="small"
                type="warning"
                @click="batchSetRequired"
              >
                <Icon class="mr-5px" icon="ep:check" />
                批量设置必填
              </el-button>
            </div>
          </div>
        </template>

        <div class="field-config">
          <div v-if="formData.fields && formData.fields.length" class="field-list">
            <draggable
              v-model="formData.fields"
              handle=".drag-handle"
              item-key="id"
              @change="handleFieldSort"
            >
              <template #item="{ element, index }">
                <div :class="{ required: element.isRequired }" class="field-item">
                  <div class="field-header">
                    <el-checkbox
                      v-model="selectedFields"
                      :value="element.id || index"
                      class="field-select"
                    />
                    <Icon class="drag-handle" icon="ep:sort" />
                    <span class="field-order">{{ index + 1 }}</span>
                    <span class="field-name">{{ element.fieldName }}</span>
                    <span class="field-code">{{ element.fieldCode }}</span>
                    <el-tag
                      :type="FIELD_TYPE_COLORS[element.fieldType] || 'info'"
                      class="field-type"
                      size="small"
                    >
                      {{ FIELD_TYPE_NAMES[element.fieldType] }}
                    </el-tag>
                    <el-tag
                      v-if="element.isRequired"
                      class="required-tag"
                      size="small"
                      type="danger"
                    >
                      必填
                    </el-tag>
                    <div class="field-actions">
                      <el-button link size="small" type="primary" @click="editField(index)">
                        <Icon icon="ep:edit" />
                      </el-button>
                      <el-button link size="small" type="danger" @click="removeField(index)">
                        <Icon icon="ep:delete" />
                      </el-button>
                    </div>
                  </div>
                  <div v-if="element.exampleValue || element.remark" class="field-details">
                    <div v-if="element.exampleValue" class="field-example">
                      示例值：{{ element.exampleValue }}
                    </div>
                    <div v-if="element.remark" class="field-remark">
                      说明：{{ element.remark }}
                    </div>
                  </div>
                </div>
              </template>
            </draggable>
          </div>

          <div v-else class="empty-fields">
            <el-empty description="暂无字段配置，请添加字段">
              <el-button type="primary" @click="addField">
                <Icon class="mr-5px" icon="ep:plus" />
                添加字段
              </el-button>
            </el-empty>
          </div>
        </div>
      </el-card>

      <!-- 实时预览 -->
      <el-card class="config-section" shadow="never">
        <template #header>
          <div class="section-header">
            <Icon class="section-icon" icon="ep:view" />
            <span class="section-title">实时预览</span>
            <div class="section-actions">
              <el-button size="small" type="info" @click="refreshPreview">
                <Icon class="mr-5px" icon="ep:refresh" />
                刷新预览
              </el-button>
            </div>
          </div>
        </template>

        <div class="preview-container">
          <div class="preview-table">
            <table class="excel-preview">
              <tbody>
                <tr class="title-row">
                  <td class="title-cell" colspan="100%">
                    {{ formData.titleText || '标题行文本（第1行）' }}
                  </td>
                </tr>
                <tr v-if="formData.descriptionText" class="description-row">
                  <td class="description-cell" colspan="100%">
                    {{ formData.descriptionText }}
                  </td>
                </tr>
                <tr class="header-row">
                  <td
                    v-for="(field, index) in formData.fields || []"
                    :key="index"
                    :class="{ required: field.isRequired }"
                    class="header-cell"
                  >
                    {{ field.fieldName }}
                  </td>
                  <td v-if="!formData.fields || !formData.fields.length" class="placeholder-cell">
                    请添加字段
                  </td>
                </tr>
                <tr class="example-row">
                  <td
                    v-for="(field, index) in formData.fields || []"
                    :key="index"
                    class="example-cell"
                  >
                    {{ field.exampleValue || `示例${index + 1}` }}
                  </td>
                  <td v-if="!formData.fields || !formData.fields.length" class="placeholder-cell">
                    示例数据
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button :loading="validating" type="primary" @click="validateConfig">
          <Icon class="mr-5px" icon="ep:check" />
          验证配置
        </el-button>
        <el-button :disabled="formLoading" type="success" @click="submitForm">
          <Icon class="mr-5px" icon="ep:check" />
          确定保存
        </el-button>
      </div>
    </template>

    <!-- 字段编辑弹窗 -->
    <FieldEditDialog
      ref="fieldEditRef"
      :table-type="formData.tableType"
      :template-id="formData.id"
      :total-fields-count="fieldCount"
      @confirm="handleFieldEdit"
    />

    <!-- 字段库选择弹窗 -->
    <FieldLibraryDialog
      ref="fieldLibraryRef"
      :template-id="formData.id"
      @confirm="handleAddFromLibrary"
    />
  </Dialog>
</template>
<script lang="ts" setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import draggable from 'vuedraggable'
import {DICT_TYPE, getIntDictOptions, getStrDictOptions} from '@/utils/dict'
import {
  FIELD_TYPE,
  FIELD_TYPE_NAMES,
  ImportTemplateApi,
  ImportTemplateSaveReqVO,
  TemplateFieldApi,
  TemplateFieldSaveReqVO
} from '@/api/drug/task/template'
import FieldEditDialog from './components/FieldEditDialog.vue'
import FieldLibraryDialog from './components/FieldLibraryDialog.vue'

defineOptions({ name: 'ImportTemplateForm' })

const { t } = useI18n()
const message = useMessage()

// ========================= 响应式数据 =========================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const validating = ref(false)
const selectedFields = ref<(number | string)[]>([])

const formData = ref<ImportTemplateSaveReqVO>({
  templateName: '',
  templateCode: '',
  tableType: '',
  titleText: '',
  descriptionText: '',
  status: true,
  remark: '',
  fields: []
})

const formRules = reactive({
  templateName: [{ required: true, message: '模板名称不能为空', trigger: 'blur' }],
  templateCode: [
    { required: true, message: '模板编码不能为空', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_-]+$/,
      message: '模板编码只能包含字母、数字、下划线和横线',
      trigger: 'blur'
    }
  ],
  tableType: [{ required: true, message: '表类型不能为空', trigger: 'change' }],
  titleText: [{ required: true, message: '标题行文本不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
})

const formRef = ref()
const fieldEditRef = ref()
const fieldLibraryRef = ref()

// 字段类型颜色映射
const FIELD_TYPE_COLORS = {
  [FIELD_TYPE.TEXT]: 'primary',
  [FIELD_TYPE.NUMBER]: 'success',
  [FIELD_TYPE.DATE]: 'warning',
  [FIELD_TYPE.DECIMAL]: 'info',
  [FIELD_TYPE.BOOLEAN]: 'danger'
}

// ========================= 计算属性 =========================
const fieldCount = computed(() => formData.value.fields?.length || 0)

// ========================= 核心方法 =========================

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新建模板' : '编辑模板'
  formType.value = type
  resetForm()

  // 修改时，加载数据
  if (id) {
    formLoading.value = true
    try {
      const templateData = await ImportTemplateApi.getImportTemplate(id)
      const fieldsData = await TemplateFieldApi.getTemplateFieldListByTemplateId(id)

      formData.value = {
        ...templateData,
        fields: fieldsData.map((field, index) => ({
          ...field,
          sortOrder: index + 1
        }))
      }
    } finally {
      formLoading.value = false
    }
  }
}

defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  try {
    // 校验表单
    await formRef.value.validate()

    if (!formData.value.fields || formData.value.fields.length === 0) {
      message.warning('请至少添加一个字段')
      return
    }

    formLoading.value = true

    // 更新字段排序
    formData.value.fields.forEach((field, index) => {
      field.sortOrder = index + 1
    })

    if (formType.value === 'create') {
      await ImportTemplateApi.createImportTemplate(formData.value)
      message.success('创建成功')
    } else {
      await ImportTemplateApi.updateImportTemplate(formData.value)
      message.success('更新成功')
    }

    dialogVisible.value = false
    emit('success')
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    formLoading.value = false
  }
}

/** 验证配置 */
const validateConfig = async () => {
  try {
    validating.value = true

    // 基本校验
    await formRef.value.validate()

    if (!formData.value.fields || formData.value.fields.length === 0) {
      message.warning('请至少添加一个字段')
      return
    }

    // 调用后端验证接口
    const result = await ImportTemplateApi.validateImportTemplateConfig(formData.value)

    if (result.valid) {
      message.success('配置验证通过')
    } else {
      message.warning(result.message || '配置验证失败')
    }
  } catch (error) {
    message.error('验证失败')
  } finally {
    validating.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    templateName: '',
    templateCode: '',
    tableType: '',
    titleText: '',
    descriptionText: '',
    status: true,
    remark: '',
    fields: []
  }
  selectedFields.value = []
  formRef.value?.resetFields()
}

// ========================= 字段管理方法 =========================

/** 添加字段 */
const addField = () => {
  fieldEditRef.value?.open('create', {
    fieldName: '',
    fieldCode: '',
    fieldType: FIELD_TYPE.TEXT,
    isRequired: false,
    exampleValue: '',
    sortOrder: fieldCount.value + 1,
    helpText: ''
  })
}

/** 编辑字段 */
const editField = (index: number) => {
  const field = formData.value.fields![index]
  fieldEditRef.value?.open('update', { ...field }, index)
}

/** 移除字段 */
const removeField = async (index: number) => {
  try {
    await ElMessageBox.confirm('确认要删除该字段吗？', '系统提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    formData.value.fields!.splice(index, 1)
    updateFieldOrder()
  } catch {}
}

/** 处理字段编辑 */
const handleFieldEdit = (field: TemplateFieldSaveReqVO, index?: number) => {
  if (index !== undefined) {
    // 编辑现有字段
    const currentField = formData.value.fields![index]
    const oldSortOrder = currentField.sortOrder
    const newSortOrder = field.sortOrder

    // 如果排序序号发生变化，需要调整其他字段的序号
    if (oldSortOrder !== newSortOrder) {
      // 更新当前字段信息
      formData.value.fields![index] = { ...field }

      // 调整其他字段的序号
      formData.value.fields!.forEach((f, i) => {
        if (i !== index) {
          if (newSortOrder <= oldSortOrder) {
            // 序号变小，原来在新序号和旧序号之间的字段序号+1
            if (f.sortOrder >= newSortOrder && f.sortOrder < oldSortOrder) {
              f.sortOrder += 1
            }
          } else {
            // 序号变大，原来在旧序号和新序号之间的字段序号-1
            if (f.sortOrder > oldSortOrder && f.sortOrder <= newSortOrder) {
              f.sortOrder -= 1
            }
          }
        }
      })

      // 重新排序字段
      reorderFieldsBySortOrder()
    } else {
      // 排序序号未变化，直接更新字段信息
      formData.value.fields![index] = { ...field }
    }
  } else {
    // 添加新字段
    if (!formData.value.fields) {
      formData.value.fields = []
    }

    const newSortOrder = field.sortOrder

    // 调整现有字段的序号
    formData.value.fields.forEach((f) => {
      if (f.sortOrder >= newSortOrder) {
        f.sortOrder += 1
      }
    })

    formData.value.fields.push({ ...field })
    // 重新排序字段
    reorderFieldsBySortOrder()
  }
}

/** 根据排序序号重新排序字段 */
const reorderFieldsBySortOrder = () => {
  if (!formData.value.fields || formData.value.fields.length === 0) {
    return
  }

  // 直接按 sortOrder 排序，保持用户输入的序号
  formData.value.fields.sort((a, b) => a.sortOrder - b.sortOrder)
}

/** 更新字段排序 */
const updateFieldOrder = () => {
  if (formData.value.fields) {
    formData.value.fields.forEach((field, index) => {
      field.sortOrder = index + 1
    })
  }
}

/** 处理字段拖拽排序 */
const handleFieldSort = () => {
  updateFieldOrder()
}

/** 批量设置必填 */
const batchSetRequired = async () => {
  try {
    const { value: required } = await ElMessageBox.confirm('请选择要设置的状态：', '批量设置必填', {
      confirmButtonText: '设为必填',
      cancelButtonText: '设为非必填',
      distinguishCancelAndClose: true,
      type: 'info'
    })

    selectedFields.value.forEach((fieldId) => {
      const field = formData.value.fields?.find(
        (f, index) => (f.id && f.id === fieldId) || index === fieldId
      )
      if (field) {
        field.isRequired = required !== 'cancel'
      }
    })

    selectedFields.value = []
    message.success('批量设置成功')
  } catch (action) {
    if (action === 'cancel') {
      // 设为非必填
      selectedFields.value.forEach((fieldId) => {
        const field = formData.value.fields?.find(
          (f, index) => (f.id && f.id === fieldId) || index === fieldId
        )
        if (field) {
          field.isRequired = false
        }
      })
      selectedFields.value = []
      message.success('批量设置成功')
    }
  }
}

/** 打开字段库 */
const openFieldLibrary = () => {
  fieldLibraryRef.value?.open(formData.value.tableType)
}

/** 从字段库添加字段 */
const handleAddFromLibrary = (fields: any[]) => {
  if (!formData.value.fields) {
    formData.value.fields = []
  }

  fields.forEach((libraryField, index) => {
    const newField: TemplateFieldSaveReqVO = {
      fieldName: libraryField.fieldName,
      fieldCode: libraryField.fieldCode,
      fieldType: libraryField.fieldType,
      isRequired: false,
      exampleValue: libraryField.exampleValue || '',
      sortOrder: formData.value.fields!.length + index + 1,
      remark: libraryField.description || ''
    }
    formData.value.fields!.push(newField)
  })

  updateFieldOrder()
  message.success(`成功添加 ${fields.length} 个字段`)
}

/** 刷新预览 */
const refreshPreview = () => {
  // 强制重新渲染预览
  nextTick(() => {
    message.success('预览已刷新')
  })
}
</script>

<style scoped>
.template-form-dialog {
  --dialog-width: 1200px;
}

.template-form-container {
  max-height: 80vh;
  overflow-y: auto;
}

/* 配置区块 */
.config-section {
  margin-bottom: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.config-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  font-size: 16px;
  color: #409eff;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  flex: 1;
}

.section-actions {
  display: flex;
  gap: 8px;
}

/* 基本表单 */
.basic-form {
  padding: 0;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

/* 字段配置 */
.field-config {
  min-height: 200px;
}

.field-list {
  max-height: 400px;
  overflow-y: auto;
}

.field-item {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.field-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.field-item.required {
  border-color: #f56c6c;
  background: #fef0f0;
}

.field-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
}

.field-select {
  flex-shrink: 0;
}

.drag-handle {
  cursor: move;
  color: #909399;
  font-size: 14px;
  flex-shrink: 0;
}

.drag-handle:hover {
  color: #409eff;
}

.field-order {
  width: 24px;
  height: 24px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.field-name {
  font-weight: 600;
  color: #303133;
  min-width: 120px;
  flex-shrink: 0;
}

.field-code {
  color: #606266;
  font-family: 'Courier New', monospace;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  min-width: 100px;
  flex-shrink: 0;
}

.field-type {
  margin: 0 8px;
  flex-shrink: 0;
}

.required-tag {
  flex-shrink: 0;
}

.field-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.field-details {
  border-top: 1px solid #e9ecef;
  padding: 8px 16px;
  background: #ffffff;
  font-size: 12px;
  color: #606266;
}

.field-example {
  margin-bottom: 4px;
}

.field-remark {
  color: #909399;
}

.empty-fields {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

/* 预览区域 */
.preview-container {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
  background: white;
}

.preview-table {
  overflow-x: auto;
}

.excel-preview {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 600px;
}

.excel-preview td {
  border: 1px solid #d0d7de;
  padding: 8px 12px;
  text-align: center;
  vertical-align: middle;
}

.title-row .title-cell {
  background: #f6f8fa;
  font-weight: 700;
  font-size: 14px;
  color: #24292f;
  text-align: center;
}

.description-row .description-cell {
  background: #ffffff;
  color: #656d76;
  text-align: left;
  line-height: 1.8;
  white-space: pre-wrap;
  padding: 12px 16px;
}

.header-row .header-cell {
  background: #f5f7fa;
  color: #303133;
  font-weight: 600;
  text-align: center;
  position: relative;
  white-space: nowrap;
  min-width: 100px;
}

.header-row .header-cell.required {
  color: #f56c6c;
}

.example-row .example-cell {
  background: #f6f8fa;
  color: #656d76;
  font-style: italic;
}

.placeholder-cell {
  background: #fafbfc;
  color: #8b949e;
  font-style: italic;
}

/* 弹窗底部 */
.dialog-footer {
  display: flex;
  justify-content: end;
  gap: 12px;
  padding: 16px 0 0 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .template-form-dialog {
    --dialog-width: 95vw;
  }

  .template-form-container {
    max-height: 70vh;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .section-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .field-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .field-name,
  .field-code {
    min-width: auto;
    width: 100%;
  }

  .field-actions {
    width: 100%;
    margin-left: 0;
    justify-content: center;
  }

  .excel-preview {
    min-width: 400px;
  }

  .dialog-footer {
    flex-direction: column-reverse;
    gap: 8px;
  }
}

/* 拖拽样式 */
.sortable-ghost {
  opacity: 0.5;
  background: #e6f3ff;
}
.sortable-drag {
  /* 移除倾斜动画 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 卡片样式优化 */
:deep(.el-card__header) {
  background: #fafbfc;
  border-bottom: 1px solid #e1e4e8;
  padding: 16px 20px;
}

:deep(.el-card__body) {
  padding: 20px;
}

/* 表单样式优化 */
:deep(.el-form-item__label) {
  font-weight: 600;
  color: #24292f;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-textarea__inner) {
  border-radius: 6px;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 6px;
}

/* 按钮样式 */
:deep(.el-button) {
  border-radius: 6px;
  font-weight: 500;
}

/* 标签样式 */
:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
}

/* 复选框样式 */
:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #409eff;
  border-color: #409eff;
}

/* 加载样式 */
:deep(.el-loading-mask) {
  border-radius: 8px;
}
</style>
