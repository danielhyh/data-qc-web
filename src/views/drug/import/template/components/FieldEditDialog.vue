<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="650px" class="field-edit-dialog">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      class="field-form"
    >
      <!-- 字段名称 -->
      <el-form-item prop="fieldName">
        <template #label>
          <Tooltip
            title="字段名称"
            message="在Excel表头中显示的字段名称，便于用户识别"
            icon="ep:info-filled"
          />
        </template>
        <el-input
          v-model="formData.fieldName"
          placeholder="请输入字段名称（Excel表头显示文本）"
          maxlength="50"
          show-word-limit
          clearable
        />
      </el-form-item>

      <!-- 字段编码 -->
      <el-form-item prop="fieldCode">
        <template #label>
          <Tooltip
            title="字段编码"
            message="用于数据处理的字段标识，建议使用英文字母、数字和下划线组合"
            icon="ep:info-filled"
          />
        </template>
        <el-input
          v-model="formData.fieldCode"
          placeholder="如：hospital_name"
          maxlength="50"
          show-word-limit
          clearable
        />
      </el-form-item>

      <!-- 字段类型 -->
      <el-form-item prop="fieldType">
        <template #label>
          <Tooltip
            title="字段类型"
            message="选择合适的字段类型，系统将根据类型自动进行数据验证"
            icon="ep:info-filled"
          />
        </template>
        <el-select v-model="formData.fieldType" placeholder="请选择字段类型" style="width: 100%">
          <el-option
            v-for="(name, type) in FIELD_TYPE_NAMES"
            :key="type"
            :label="name"
            :value="type"
          >
            <div class="field-type-option">
              <div class="type-info">
                <Icon :icon="getFieldTypeIcon(type)" class="type-icon" />
                <span class="type-name">{{ name }}</span>
              </div>
              <span class="type-desc">{{ getFieldTypeDesc(type) }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- 是否必填 -->
      <el-form-item prop="isRequired">
        <template #label>
          <Tooltip
            title="是否必填"
            message="必填字段在Excel模板中会标红显示，用户必须填写才能通过验证"
            icon="ep:info-filled"
          />
        </template>
        <el-radio-group v-model="formData.isRequired">
          <el-radio :value="true">
            <span class="radio-label">
              <Icon icon="ep:check" class="required-icon" />
              必填字段
            </span>
          </el-radio>
          <el-radio :value="false">
            <span class="radio-label">
              <Icon icon="ep:minus" class="optional-icon" />
              可选字段
            </span>
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 示例值 -->
      <el-form-item prop="exampleValue">
        <template #label>
          <Tooltip
            title="示例值"
            message="在Excel模板的示例行中显示，帮助用户理解应该填写什么样的数据"
            icon="ep:info-filled"
          />
        </template>
        <el-input
          v-model="formData.exampleValue"
          :placeholder="getExamplePlaceholder(formData.fieldType)"
          maxlength="100"
          show-word-limit
          clearable
        />
      </el-form-item>

      <!-- 排序序号 -->
      <el-form-item prop="sortOrder">
        <template #label>
          <Tooltip
            title="排序序号"
            message="控制字段在表格中的显示顺序，数字越小越靠前（最小值为1）"
            icon="ep:info-filled"
          />
        </template>
        <el-input-number
          v-model="formData.sortOrder"
          :min="1"
          :max="maxSortOrder"
          :step="1"
          placeholder="输入序号"
          style="width: 100%"
          controls-position="right"
        />
      </el-form-item>

      <!-- 字段说明 -->
      <el-form-item prop="helpText">
        <template #label>
          <Tooltip
            title="字段说明"
            message="详细说明字段的含义、填写要求和注意事项，帮助用户正确填写数据"
            icon="ep:info-filled"
          />
        </template>
        <el-input
          v-model="formData.helpText"
          type="textarea"
          :rows="3"
          placeholder="请输入字段的详细说明，用于帮助用户理解字段含义和填写要求"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <!-- 高级配置 -->
      <div class="advanced-config-section">
        <div class="section-header" @click="toggleAdvanced">
          <div class="header-left">
            <Icon :icon="activeCollapse.includes('advanced') ? 'ep:arrow-down' : 'ep:arrow-right'" class="toggle-icon" />
            <Icon icon="ep:setting" class="section-icon" />
            <span class="section-title">高级配置</span>
            <el-tag size="small" type="info" effect="plain">可选</el-tag>
          </div>
          <span class="section-desc">根据字段类型配置验证规则</span>
        </div>

        <el-collapse v-model="activeCollapse" class="advanced-collapse">
          <el-collapse-item name="advanced">
            <template #title>
              <span></span>
            </template>

            <div class="advanced-form">
              <!-- 文本类型：长度限制 -->
              <div v-if="formData.fieldType === FIELD_TYPE.TEXT" class="config-group">
                <div class="group-title">
                  <Icon icon="ep:document-copy" />
                  <span>文本长度限制</span>
                </div>
                
                <el-form-item>
                  <template #label>
                    <Tooltip
                      title="最小长度"
                      message="允许输入的最小字符数（不填则不限制）"
                      icon="ep:info-filled"
                    />
                  </template>
                  <el-input-number
                    v-model="formData.minLength"
                    :min="0"
                    :max="1000"
                    placeholder="最小字符长度"
                    style="width: 100%"
                    controls-position="right"
                  />
                </el-form-item>

                <el-form-item>
                  <template #label>
                    <Tooltip
                      title="最大长度"
                      message="允许输入的最大字符数（不填则不限制）"
                      icon="ep:info-filled"
                    />
                  </template>
                  <el-input-number
                    v-model="formData.maxLength"
                    :min="1"
                    :max="1000"
                    placeholder="最大字符长度"
                    style="width: 100%"
                    controls-position="right"
                  />
                </el-form-item>
              </div>

              <!-- 数值类型：范围限制 -->
              <div v-if="isNumericType(formData.fieldType)" class="config-group">
                <div class="group-title">
                  <Icon icon="ep:data-line" />
                  <span>数值范围限制</span>
                </div>
                
                <el-form-item>
                  <template #label>
                    <Tooltip
                      title="数值范围"
                      message="设置允许输入的数值范围（不填则不限制）"
                      icon="ep:info-filled"
                    />
                  </template>
                  <el-row :gutter="12">
                    <el-col :span="12">
                      <el-input-number
                        v-model="formData.minValue"
                        placeholder="最小值"
                        style="width: 100%"
                        controls-position="right"
                      />
                    </el-col>
                    <el-col :span="12">
                      <el-input-number
                        v-model="formData.maxValue"
                        placeholder="最大值"
                        style="width: 100%"
                        controls-position="right"
                      />
                    </el-col>
                  </el-row>
                </el-form-item>
              </div>

              <!-- 小数类型：精度设置 -->
              <div v-if="formData.fieldType === FIELD_TYPE.DECIMAL" class="config-group">
                <div class="group-title">
                  <Icon icon="ep:coordinate" />
                  <span>小数精度设置</span>
                </div>
                
                <el-form-item>
                  <template #label>
                    <Tooltip
                      title="小数位数"
                      message="设置小数点后保留的位数（0-10位）"
                      icon="ep:info-filled"
                    />
                  </template>
                  <el-input-number
                    v-model="formData.decimalPlaces"
                    :min="0"
                    :max="10"
                    placeholder="小数点后位数"
                    style="width: 100%"
                    controls-position="right"
                  />
                </el-form-item>
              </div>

              <!-- 日期类型：格式设置 -->
              <div v-if="formData.fieldType === FIELD_TYPE.DATE" class="config-group">
                <div class="group-title">
                  <Icon icon="ep:calendar" />
                  <span>日期格式设置</span>
                </div>
                
                <el-form-item>
                  <template #label>
                    <Tooltip
                      title="日期格式"
                      message="选择日期的显示和验证格式"
                      icon="ep:info-filled"
                    />
                  </template>
                  <el-select
                    v-model="formData.dateFormat"
                    placeholder="选择日期格式"
                    style="width: 100%"
                  >
                    <el-option label="YYYY-MM-DD（如：2024-01-01）" value="YYYY-MM-DD" />
                    <el-option label="YYYY/MM/DD（如：2024/01/01）" value="YYYY/MM/DD" />
                    <el-option label="DD/MM/YYYY（如：01/01/2024）" value="DD/MM/YYYY" />
                    <el-option label="MM/DD/YYYY（如：01/01/2024）" value="MM/DD/YYYY" />
                    <el-option label="YYYY-MM-DD HH:mm:ss（含时间）" value="YYYY-MM-DD HH:mm:ss" />
                  </el-select>
                </el-form-item>
              </div>

              <!-- 自定义验证规则 -->
              <div class="config-group">
                <div class="group-title">
                  <Icon icon="ep:magic-stick" />
                  <span>自定义验证规则</span>
                </div>
                
                <el-form-item>
                  <template #label>
                    <Tooltip
                      title="正则表达式"
                      message="使用正则表达式自定义验证规则（适用于高级用户）"
                      icon="ep:info-filled"
                    />
                  </template>
                  <el-input
                    v-model="formData.pattern"
                    placeholder="如：^[A-Z0-9]+$ （大写字母和数字）"
                    maxlength="200"
                    clearable
                  />
                </el-form-item>

                <el-form-item>
                  <template #label>
                    <Tooltip
                      title="错误提示"
                      message="验证失败时显示给用户的提示信息"
                      icon="ep:info-filled"
                    />
                  </template>
                  <el-input
                    v-model="formData.errorMessage"
                    placeholder="如：请输入有效的格式"
                    maxlength="100"
                    clearable
                  />
                </el-form-item>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="submitting">
          <Icon icon="ep:check" class="mr-5px" />
          确定
        </el-button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { TemplateFieldSaveReqVO, FIELD_TYPE_NAMES, FIELD_TYPE } from '@/api/drug/task/template'
import { Tooltip } from '@/components/Tooltip'

defineOptions({ name: 'FieldEditDialog' })

// ========================= Props =========================
const props = defineProps<{
  tableType?: string
  templateId?: number
  totalFieldsCount?: number
}>()

// ========================= 响应式数据 =========================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formType = ref('')
const editIndex = ref<number>()
const submitting = ref(false)
const activeCollapse = ref<string[]>([])

const formData = ref<
  TemplateFieldSaveReqVO & {
    minLength?: number
    maxLength?: number
    minValue?: number
    maxValue?: number
    decimalPlaces?: number
    dateFormat?: string
    pattern?: string
    errorMessage?: string
  }
>({
  fieldName: '',
  fieldCode: '',
  fieldType: FIELD_TYPE.TEXT,
  isRequired: false,
  exampleValue: '',
  sortOrder: 1,
  helpText: ''
})

const formRules = reactive({
  fieldName: [
    { required: true, message: '字段名称不能为空', trigger: 'blur' },
    { min: 1, max: 50, message: '字段名称长度在1到50个字符', trigger: 'blur' }
  ],
  fieldCode: [
    { required: true, message: '字段编码不能为空', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
      message: '字段编码必须以字母开头，只能包含字母、数字和下划线',
      trigger: 'blur'
    },
    { min: 1, max: 50, message: '字段编码长度在1到50个字符', trigger: 'blur' }
  ],
  fieldType: [{ required: true, message: '字段类型不能为空', trigger: 'change' }],
  sortOrder: [
    { required: true, message: '排序序号不能为空', trigger: 'blur' }
  ]
})

const formRef = ref()

// ========================= 计算属性 =========================
const isCreateMode = computed(() => formType.value === 'create')
const maxSortOrder = computed(() => {
  // 编辑模式时，最大值为总字段数
  // 新增模式时，最大值为总字段数+1
  const total = props.totalFieldsCount || 1
  return isCreateMode.value ? total + 1 : total
})

// ========================= 核心方法 =========================

/** 打开弹窗 */
const open = (type: string, field: any, index?: number) => {
  dialogVisible.value = true
  formType.value = type
  editIndex.value = index
  dialogTitle.value = type === 'create' ? '添加字段' : '编辑字段'

  // 重置表单
  resetForm()

  // 设置数据
  if (field) {
    Object.assign(formData.value, field)
  }
}

defineExpose({ open })

/** 确认提交 */
const emit = defineEmits(['confirm'])
const handleConfirm = async () => {
  try {
    // 表单验证
    await formRef.value.validate()

    submitting.value = true

    // 构建提交数据
    const submitData: TemplateFieldSaveReqVO & {
      minLength?: number
      maxLength?: number
      minValue?: number
      maxValue?: number
      decimalPlaces?: number
      dateFormat?: string
      pattern?: string
      errorMessage?: string
    } = {
      fieldName: formData.value.fieldName,
      fieldCode: formData.value.fieldCode,
      fieldType: formData.value.fieldType,
      isRequired: formData.value.isRequired,
      exampleValue: formData.value.exampleValue,
      sortOrder: formData.value.sortOrder,
      helpText: formData.value.helpText
    }

    // 添加高级配置字段
    if (formData.value.minLength !== undefined && formData.value.minLength !== null) {
      submitData.minLength = formData.value.minLength
    }
    if (formData.value.maxLength !== undefined && formData.value.maxLength !== null) {
      submitData.maxLength = formData.value.maxLength
    }
    if (formData.value.minValue !== undefined && formData.value.minValue !== null) {
      submitData.minValue = formData.value.minValue
    }
    if (formData.value.maxValue !== undefined && formData.value.maxValue !== null) {
      submitData.maxValue = formData.value.maxValue
    }
    if (formData.value.decimalPlaces !== undefined && formData.value.decimalPlaces !== null) {
      submitData.decimalPlaces = formData.value.decimalPlaces
    }
    if (formData.value.dateFormat) {
      submitData.dateFormat = formData.value.dateFormat
    }
    if (formData.value.pattern) {
      submitData.pattern = formData.value.pattern
    }
    if (formData.value.errorMessage) {
      submitData.errorMessage = formData.value.errorMessage
    }

    // 如果有ID，传递ID（编辑模式）
    if (formData.value.id) {
      submitData.id = formData.value.id
    }

    emit('confirm', submitData, editIndex.value)

    ElMessage.success(isCreateMode.value ? '添加成功' : '编辑成功')
    dialogVisible.value = false
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitting.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    fieldName: '',
    fieldCode: '',
    fieldType: FIELD_TYPE.TEXT,
    isRequired: false,
    exampleValue: '',
    sortOrder: 1,
    helpText: ''
  }
  activeCollapse.value = []
  formRef.value?.resetFields()
}

// ========================= 工具方法 =========================

/** 判断是否是数值类型 */
const isNumericType = (fieldType: string): boolean => {
  return fieldType === FIELD_TYPE.NUMBER || fieldType === FIELD_TYPE.DECIMAL
}

/** 获取字段类型图标 */
const getFieldTypeIcon = (fieldType: string): string => {
  const icons = {
    [FIELD_TYPE.TEXT]: 'ep:document',
    [FIELD_TYPE.NUMBER]: 'ep:sort',
    [FIELD_TYPE.DATE]: 'ep:calendar',
    [FIELD_TYPE.DECIMAL]: 'ep:data-analysis',
    [FIELD_TYPE.BOOLEAN]: 'ep:finished'
  }
  return icons[fieldType] || 'ep:document'
}

/** 获取字段类型描述 */
const getFieldTypeDesc = (fieldType: string): string => {
  const descriptions = {
    [FIELD_TYPE.TEXT]: '文本类型，支持字母、数字、中文等字符',
    [FIELD_TYPE.NUMBER]: '整数类型，只能输入数字',
    [FIELD_TYPE.DATE]: '日期类型，支持多种日期格式',
    [FIELD_TYPE.DECIMAL]: '小数类型，支持带小数点的数字',
    [FIELD_TYPE.BOOLEAN]: '布尔类型，只能输入true/false或是/否'
  }
  return descriptions[fieldType] || '未知类型'
}

/** 获取示例值占位符 */
const getExamplePlaceholder = (fieldType: string): string => {
  const placeholders = {
    [FIELD_TYPE.TEXT]: '如：张三医院',
    [FIELD_TYPE.NUMBER]: '如：100',
    [FIELD_TYPE.DATE]: '如：2024-01-01',
    [FIELD_TYPE.DECIMAL]: '如：99.99',
    [FIELD_TYPE.BOOLEAN]: '如：是 或 true'
  }
  return placeholders[fieldType] || '请输入示例值'
}

/** 切换高级配置 */
const toggleAdvanced = () => {
  if (activeCollapse.value.includes('advanced')) {
    activeCollapse.value = []
  } else {
    activeCollapse.value = ['advanced']
  }
}
</script>

<style scoped>
/* ==================== 对话框主体 ==================== */
.field-edit-dialog {
  --dialog-width: 650px;
}

.field-form {
  max-height: 75vh;
  overflow-y: auto;
  padding-right: 16px;
}

/* ==================== 表单项样式 ==================== */
:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
  line-height: 22px;
}

/* ==================== 输入框样式 ==================== */
:deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

:deep(.el-textarea__inner) {
  border-radius: 8px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

:deep(.el-textarea__inner:hover) {
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
}

:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* ==================== 选择框样式 ==================== */
:deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

.field-type-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.type-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.type-icon {
  font-size: 18px;
  color: #3b82f6;
}

.type-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.type-desc {
  font-size: 12px;
  color: #9ca3af;
  margin-left: auto;
}

/* ==================== 单选框样式 ==================== */
.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.required-icon {
  color: #f56c6c;
  font-size: 16px;
}

.optional-icon {
  color: #909399;
  font-size: 16px;
}

:deep(.el-radio__label) {
  color: #606266;
  font-weight: 500;
}

:deep(.el-radio__input.is-checked + .el-radio__label) {
  color: #409eff;
}

/* ==================== 数字输入框样式 ==================== */
:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  border-radius: 4px;
}

/* ==================== 高级配置样式 ==================== */
.advanced-config-section {
  margin-top: 32px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  overflow: hidden;
  background: #ffffff;
  transition: all 0.2s ease;
}

.advanced-config-section:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.05);
}

.section-header {
  padding: 16px 20px;
  cursor: pointer;
  background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
}

.section-header:hover {
  background: linear-gradient(135deg, #f3f4f6 0%, #f9fafb 100%);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-icon {
  font-size: 16px;
  color: #6b7280;
  transition: transform 0.2s ease;
}

.section-icon {
  font-size: 18px;
  color: #3b82f6;
}

.section-title {
  font-weight: 600;
  color: #1f2937;
  font-size: 15px;
}

.section-desc {
  font-size: 13px;
  color: #9ca3af;
}

.advanced-collapse {
  border: none;
}

:deep(.advanced-collapse .el-collapse-item__header) {
  display: none;
}

:deep(.advanced-collapse .el-collapse-item__wrap) {
  border: none;
}

:deep(.advanced-collapse .el-collapse-item__content) {
  padding: 0;
  background: transparent;
}

.advanced-form {
  padding: 24px 20px;
  background: #fafbfc;
}

/* ==================== 配置组样式 ==================== */
.config-group {
  margin-bottom: 24px;
  padding: 20px;
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
}

.config-group:last-child {
  margin-bottom: 0;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f3f4f6;
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.group-title svg {
  font-size: 18px;
  color: #3b82f6;
}

.config-group :deep(.el-form-item) {
  margin-bottom: 16px;
}

.config-group :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

/* ==================== 底部按钮 ==================== */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

:deep(.dialog-footer .el-button) {
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

:deep(.dialog-footer .el-button--primary) {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  box-shadow: 0 2px 4px 0 rgba(59, 130, 246, 0.3);
}

:deep(.dialog-footer .el-button--primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px 0 rgba(59, 130, 246, 0.4);
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 768px) {
  .field-edit-dialog {
    --dialog-width: 95vw;
  }

  .field-form {
    max-height: 65vh;
    padding-right: 8px;
  }

  .field-type-option {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .type-desc {
    margin-left: 0;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .section-desc {
    padding-left: 40px;
  }

  .advanced-form {
    padding: 16px;
  }

  .config-group {
    padding: 16px;
  }

  .dialog-footer {
    flex-direction: column-reverse;
    gap: 8px;
  }

  :deep(.dialog-footer .el-button) {
    width: 100%;
  }
}

/* ==================== 滚动条样式 ==================== */
.field-form::-webkit-scrollbar {
  width: 6px;
}

.field-form::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.field-form::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
  transition: background 0.2s ease;
}

.field-form::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
