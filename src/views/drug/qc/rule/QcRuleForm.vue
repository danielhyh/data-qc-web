<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1000px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-row :gutter="20">
        <!-- 基本信息 -->
        <el-col :span="24">
          <el-card class="mb-4">
            <template #header>
              <span class="card-header">基本信息</span>
            </template>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="规则编码" prop="ruleCode">
                  <el-input
                    v-model="formData.ruleCode"
                    placeholder="请输入规则编码，如PRE_QC_001"
                    :disabled="formType === 'update'"
                  >
                    <template #prepend>
                      <el-select
                        v-model="ruleCodePrefix"
                        style="width: 100px"
                        @change="handlePrefixChange"
                      >
                        <el-option label="PRE_QC" value="PRE_QC" />
                        <el-option label="POST_QC" value="POST_QC" />
                      </el-select>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="规则名称" prop="ruleName">
                  <el-input v-model="formData.ruleName" placeholder="请输入规则名称" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="规则类型" prop="ruleType">
                  <el-radio-group v-model="formData.ruleType" @change="handleRuleTypeChange">
                    <el-radio :value="1">前置质控</el-radio>
                    <el-radio :value="2">后置质控</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="规则分类" prop="ruleCategory">
                  <el-select v-model="formData.ruleCategory" placeholder="请选择规则分类">
                    <el-option
                      v-for="dict in ruleCategoryOptions"
                      :key="dict.value"
                      :label="dict.label"
                      :value="dict.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="适用表" prop="tableType">
                  <div class="table-type-container">
                    <el-checkbox
                      v-model="isAllTables"
                      class="all-tables-checkbox"
                      @change="handleAllTablesChange"
                    >
                      全部表
                    </el-checkbox>
                    <el-select
                      v-model="selectedTableTypes"
                      :disabled="isAllTables"
                      clearable
                      collapse-tags
                      collapse-tags-tooltip
                      multiple
                      placeholder="请选择适用表类型"
                      style="width: 100%"
                      @change="handleTableTypesChange"
                    >
                      <el-option
                        v-for="dict in tableTypeOptions"
                        :key="dict.value"
                        :label="dict.label"
                        :value="parseInt(dict.value)"
                      />
                    </el-select>
                    <div class="form-tip">选择"全部表"或选择具体的表类型</div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="检查字段" prop="fieldName">
                  <div class="field-input-container">
                    <div class="field-input-group">
                      <el-input
                        v-model="newFieldName"
                        clearable
                        placeholder="输入字段名，按回车添加"
                        @keyup.enter="addFieldName"
                      />
                      <el-button size="small" type="primary" @click="addFieldName">添加</el-button>
                    </div>
                    <div v-if="selectedFieldNames.length > 0" class="field-tags-container">
                      <el-tag
                        v-for="(field, index) in selectedFieldNames"
                        :key="index"
                        class="field-tag"
                        closable
                        size="small"
                        type="success"
                        @close="removeFieldName(index)"
                      >
                        {{ field }}
                      </el-tag>
                    </div>
                    <div class="form-tip"
                      >添加需要检查的字段名称，支持多个字段，将以逗号分隔保存</div
                    >
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="错误级别" prop="errorLevel">
                  <el-radio-group v-model="formData.errorLevel">
                    <el-radio :value="1">错误</el-radio>
                    <el-radio :value="2">警告</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="优先级" prop="priority">
                  <el-input-number
                    v-model="formData.priority"
                    :min="0"
                    :max="999"
                    placeholder="数字越小优先级越高"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-card>
        </el-col>

        <!-- 规则表达式 -->
        <el-col :span="24">
          <el-card class="mb-4">
            <template #header>
              <div class="card-header-flex">
                <span class="card-header">规则表达式</span>
                <div>
                  <el-button size="small" @click="showExpressionHelp">表达式帮助</el-button>
                  <el-button size="small" type="primary" @click="testExpression">
                    测试表达式
                  </el-button>
                </div>
              </div>
            </template>

            <el-form-item prop="ruleExpression">
              <el-input
                v-model="formData.ruleExpression"
                type="textarea"
                :rows="6"
                placeholder="请输入规则表达式，支持SpEL语法，如：#amount > 0 && #amount <= 200000000"
              />
            </el-form-item>

            <!-- 常用表达式模板 -->
            <div class="expression-templates">
              <span class="template-label">常用模板：</span>
              <el-tag
                v-for="template in expressionTemplates"
                :key="template.name"
                class="template-tag"
                @click="insertTemplate(template.expression)"
                style="cursor: pointer"
              >
                {{ template.name }}
              </el-tag>
            </div>
          </el-card>
        </el-col>

        <!-- 错误提示和阈值配置 -->
        <el-col :span="24">
          <el-card class="mb-4">
            <template #header>
              <span class="card-header">错误提示和配置</span>
            </template>

            <el-form-item label="错误提示信息" prop="errorMessage">
              <el-input
                v-model="formData.errorMessage"
                type="textarea"
                :rows="3"
                placeholder="请输入错误提示信息模板，支持${变量}占位符"
              />
              <div class="help-text">
                提示：可使用占位符如 ${fieldName}、${count}、${rate} 等动态显示值
              </div>
            </el-form-item>

            <el-form-item label="阈值配置" prop="thresholdValue">
              <el-input
                v-model="formData.thresholdValue"
                type="textarea"
                :rows="4"
                placeholder='请输入阈值配置（JSON格式），如：{"maxAmount": 200000000, "errorTolerance": 0.1}'
              />
              <div class="help-text">
                配置格式为JSON，常用配置项：maxAmount（最大金额）、errorTolerance（容错率）、minRecords（最小记录数）
              </div>
            </el-form-item>
          </el-card>
        </el-col>

        <!-- 其他配置 -->
        <el-col :span="24">
          <el-card>
            <template #header>
              <span class="card-header">其他配置</span>
            </template>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="是否启用" prop="enabled">
                  <el-switch v-model="formData.enabled" />
                  <span class="help-text ml-2">新建规则默认启用，可后续调整</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="规则说明" prop="description">
                  <el-input
                    v-model="formData.description"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入规则的详细说明"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submitForm" :disabled="formLoading"> 确定 </el-button>
    </template>
  </Dialog>

  <!-- 表达式帮助弹窗 -->
  <ExpressionHelp ref="expressionHelpRef" />

  <!-- 规则测试弹窗 - 修改：使用RuleTestModal -->
  <RuleTestModal v-model="testVisible" :rule="currentTestRule" />
</template>

<script setup lang="ts">
import { QcRuleApi, QcRuleVO } from '@/api/drug/qc/rule'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import ExpressionHelp from './components/ExpressionHelp.vue'
import RuleTestModal from './components/RuleTestModal.vue'

/** 质控规则表单 */
defineOptions({ name: 'QcRuleForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const ruleCodePrefix = ref('PRE_QC') // 规则编码前缀

// 测试相关状态 - 新增
const testVisible = ref(false)
const currentTestRule = ref<any>(null)
const newFieldName = ref('') // 新字段名输入

// 表单控制变量
const isAllTables = ref(false) // 是否选择全部表
const selectedTableTypes = ref<number[]>([]) // 选中的表类型数组
const selectedFieldNames = ref<string[]>([]) // 选中的字段名数组

// 表单数据
const formData = ref<QcRuleVO>({
  ruleCode: '',
  ruleName: '',
  ruleType: 1,
  ruleCategory: 'FIELD',
  tableType: undefined, // 后端字段，字符串格式
  fieldName: '', // 后端字段，字符串格式
  ruleExpression: '',
  errorMessage: '',
  errorLevel: 1,
  thresholdValue: '',
  priority: 100,
  enabled: true,
  description: ''
})

// 表单验证规则
const formRules = reactive({
  ruleCode: [
    { required: true, message: '规则编码不能为空', trigger: 'blur' },
    { pattern: /^[A-Z_0-9]+$/, message: '规则编码只能包含大写字母、数字和下划线', trigger: 'blur' }
  ],
  ruleName: [
    { required: true, message: '规则名称不能为空', trigger: 'blur' },
    { max: 100, message: '规则名称长度不能超过100个字符', trigger: 'blur' }
  ],
  ruleType: [{ required: true, message: '规则类型不能为空', trigger: 'change' }],
  ruleCategory: [{ required: true, message: '规则分类不能为空', trigger: 'change' }],
  ruleExpression: [{ required: true, message: '规则表达式不能为空', trigger: 'blur' }],
  errorMessage: [{ required: true, message: '错误提示信息不能为空', trigger: 'blur' }],
  errorLevel: [{ required: true, message: '错误级别不能为空', trigger: 'change' }],
  priority: [
    { required: true, message: '优先级不能为空', trigger: 'blur' },
    { type: 'number', min: 0, max: 999, message: '优先级范围为0-999', trigger: 'blur' }
  ]
})

const formRef = ref() // 表单 Ref

// 字典数据
const ruleCategoryOptions = getDictOptions(DICT_TYPE.DRUG_QC_RULE_CATEGORY)
const tableTypeOptions = getDictOptions(DICT_TYPE.DRUG_QC_TABLE_TYPE)

// 表达式模板
const expressionTemplates = ref([
  { name: '非空检查', expression: '#fieldName != null && #fieldName.trim().length() > 0' },
  { name: '数值范围', expression: '#amount > 0 && #amount <= 200000000' },
  { name: '百分比检查', expression: 'Math.abs(#value1 - #value2) / #value2 <= 0.1' },
  { name: '转换系数', expression: '#packageQty * #conversionFactor == #dosageQty' },
  { name: '字典验证', expression: 'isValidDictValue(#fieldValue, "DICT_TYPE")' },
  { name: '正则匹配', expression: '#mobile.matches("^1[3-9]\\\\d{9}$")' }
])

/** 打开弹窗 */
const open = async (type: string, id?: number, copyData?: QcRuleVO) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()

  // 如果是复制数据
  if (copyData) {
    Object.assign(formData.value, copyData)
    return
  }

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await QcRuleApi.getQcRule(id)
      Object.assign(formData.value, data)

      // 解析表类型数据
      parseFormData(data)

      // 设置规则编码前缀
      if (data.ruleCode.startsWith('PRE_QC_')) {
        ruleCodePrefix.value = 'PRE_QC'
      } else if (data.ruleCode.startsWith('POST_QC_')) {
        ruleCodePrefix.value = 'POST_QC'
      }
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
  if (!formRef.value) return
  await formRef.value.validate()

  // 验证阈值配置JSON格式
  if (formData.value.thresholdValue) {
    try {
      JSON.parse(formData.value.thresholdValue)
    } catch (e) {
      message.error('阈值配置不是有效的JSON格式')
      return
    }
  }

  // 转换数据格式并提交请求
  formLoading.value = true
  try {
    const data = { ...formData.value }

    // 转换表类型数据
    data.tableType = isAllTables.value ? '0' : selectedTableTypes.value.join(',')

    // 转换字段名数据
    data.fieldName = selectedFieldNames.value.join(',')

    if (formType.value === 'create') {
      await QcRuleApi.createQcRule(data)
      message.success(t('common.createSuccess'))
    } else {
      await QcRuleApi.updateQcRule(data)
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
    ruleCode: '',
    ruleName: '',
    ruleType: 1,
    ruleCategory: 'FIELD',
    tableType: undefined,
    fieldName: '',
    ruleExpression: '',
    errorMessage: '',
    errorLevel: 1,
    thresholdValue: '',
    priority: 100,
    enabled: true,
    description: ''
  }

  // 重置控制变量
  newFieldName.value = ''
  isAllTables.value = false
  selectedTableTypes.value = []
  selectedFieldNames.value = []

  formRef.value?.resetFields()
}

/** 添加字段名 */
const addFieldName = () => {
  if (newFieldName.value.trim() && !selectedFieldNames.value.includes(newFieldName.value.trim())) {
    selectedFieldNames.value.push(newFieldName.value.trim())
    newFieldName.value = ''
  }
}

/** 移除字段名 */
const removeFieldName = (index: number) => {
  selectedFieldNames.value.splice(index, 1)
}

/** 全部表变化处理 */
const handleAllTablesChange = (value: boolean) => {
  if (value) {
    selectedTableTypes.value = []
  }
}

/** 表类型选择变化处理 */
const handleTableTypesChange = (value: number[]) => {
  if (value.length > 0) {
    isAllTables.value = false
  }
}

/** 解析表单数据 */
const parseFormData = (data: any) => {
  // 解析表类型数据
  if (data.tableType === '0') {
    isAllTables.value = true
    selectedTableTypes.value = []
  } else if (data.tableType) {
    isAllTables.value = false
    selectedTableTypes.value = data.tableType
      .split(',')
      .map((t: string) => parseInt(t.trim()))
      .filter((t: number) => !isNaN(t))
  } else {
    isAllTables.value = false
    selectedTableTypes.value = []
  }

  // 解析字段名数据
  if (data.fieldName) {
    selectedFieldNames.value = data.fieldName
      .split(',')
      .map((f: string) => f.trim())
      .filter((f: string) => f.length > 0)
  } else {
    selectedFieldNames.value = []
  }
}

/** 规则类型变化处理 */
const handleRuleTypeChange = (value: number) => {
  ruleCodePrefix.value = value === 1 ? 'PRE_QC' : 'POST_QC'
  updateRuleCode()
}

/** 编码前缀变化处理 - 新增双向联动 */
const handlePrefixChange = (prefix: string) => {
  // 前缀变化时联动规则类型
  formData.value.ruleType = prefix === 'PRE_QC' ? 1 : 2
  updateRuleCode()
}

/** 更新规则编码 */
const updateRuleCode = () => {
  if (formType.value === 'create' && !formData.value.ruleCode.includes('_')) {
    // 自动生成规则编码
    const lastNumber = getNextRuleNumber()
    formData.value.ruleCode = `${ruleCodePrefix.value}_${String(lastNumber).padStart(3, '0')}`
  }
}

/** 获取下一个规则编号 */
const getNextRuleNumber = (): number => {
  // 这里可以调用API获取最大编号，暂时返回默认值
  return 100
}

/** 插入表达式模板 */
const insertTemplate = (template: string) => {
  const textarea = document.querySelector(
    'textarea[placeholder*="规则表达式"]'
  ) as HTMLTextAreaElement
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const current = formData.value.ruleExpression
    formData.value.ruleExpression = current.substring(0, start) + template + current.substring(end)

    // 设置光标位置
    nextTick(() => {
      textarea.focus()
      textarea.setSelectionRange(start + template.length, start + template.length)
    })
  } else {
    formData.value.ruleExpression += template
  }
}

/** 显示表达式帮助 */
const expressionHelpRef = ref()
const showExpressionHelp = () => {
  expressionHelpRef.value.open()
}

/** 测试表达式 - 修改：使用RuleTestModal */
const testExpression = () => {
  if (!formData.value.ruleExpression) {
    message.warning('请先输入规则表达式')
    return
  }

  // 构造当前规则对象用于测试
  currentTestRule.value = {
    id: formData.value.id || 0, // 新建时为0
    ruleCode: formData.value.ruleCode || '临时规则',
    ruleName: formData.value.ruleName || '临时测试规则',
    ruleType: formData.value.ruleType,
    ruleCategory: formData.value.ruleCategory,
    tableType: formData.value.tableType,
    fieldName: formData.value.fieldName,
    ruleExpression: formData.value.ruleExpression,
    errorMessage: formData.value.errorMessage,
    errorLevel: formData.value.errorLevel,
    priority: formData.value.priority,
    enabled: formData.value.enabled,
    description: formData.value.description || '这是一个临时测试规则'
  }

  // 打开测试弹窗
  testVisible.value = true
}
</script>

<style lang="scss" scoped>
.card-header {
  font-weight: bold;
  color: #303133;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.expression-templates {
  margin-top: 8px;

  .template-label {
    font-size: 14px;
    color: #666;
    margin-right: 8px;
  }

  .template-tag {
    margin-right: 8px;
    margin-bottom: 4px;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }
}

.help-text {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  line-height: 1.4;
}

/* 字段输入组样式 */
.field-input-container {
  width: 100%;
}

.field-input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.field-input-group .el-input {
  flex: 1;
}

.field-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
  min-height: 24px;
  padding: 4px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fafafa;
}

.field-tag {
  margin: 0;
}

/* 表类型容器样式 */
.table-type-container {
  width: 100%;
}

.all-tables-checkbox {
  margin-bottom: 8px;
  font-weight: 500;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-textarea__inner) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}
</style>
