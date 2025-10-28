<template>
  <Dialog title="模板预览" v-model="dialogVisible" width="1000px" class="template-preview-dialog">
    <div class="preview-container" v-loading="loading">
      <!-- 模板信息 -->
      <div class="template-info-section">
        <el-card shadow="never">
          <template #header>
            <div class="info-header">
              <Icon icon="ep:info-filled" class="header-icon" />
              <span class="header-title">模板信息</span>
            </div>
          </template>

          <div class="template-details" v-if="templateInfo">
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="detail-item">
                  <span class="detail-label">模板名称：</span>
                  <span class="detail-value">{{ templateInfo.templateName }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="detail-item">
                  <span class="detail-label">模板编码：</span>
                  <span class="detail-value">{{ templateInfo.templateCode }}</span>
                </div>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="detail-item">
                  <span class="detail-label">表类型：</span>
                  <dict-tag :type="DICT_TYPE.IMPORT_TABLE_TYPE" :value="templateInfo.tableType" />
                </div>
              </el-col>
              <el-col :span="12">
                <div class="detail-item">
                  <span class="detail-label">字段数量：</span>
                  <span class="detail-value">{{ templateInfo.fieldCount }} 个</span>
                </div>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="detail-item">
                  <span class="detail-label">状态：</span>
                  <el-tag :type="templateInfo.status ? 'success' : 'info'" size="small">
                    {{ templateInfo.statusText }}
                  </el-tag>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </div>

      <!-- Excel预览 -->
      <div class="excel-preview-section">
        <el-card shadow="never">
          <template #header>
            <div class="preview-header">
              <div class="header-left">
                <Icon icon="ep:view" class="header-icon" />
                <span class="header-title">Excel预览</span>
              </div>
              <div class="header-actions">
                <el-button size="small" @click="toggleExampleData">
                  <Icon icon="ep:view" class="mr-5px" />
                  {{ showExampleData ? '隐藏' : '显示' }}示例数据
                </el-button>
                <el-button size="small" type="primary" @click="downloadTemplate">
                  <Icon icon="ep:download" class="mr-5px" />
                  下载模板
                </el-button>
              </div>
            </div>
          </template>

          <div class="excel-container">
            <div class="excel-wrapper">
              <table class="excel-table">
                <tbody>
                  <!-- 第1行：标题 -->
                  <tr class="title-row">
                    <td :colspan="fieldList.length || 1" class="title-cell">
                      {{ previewData?.titleRow || '模板标题' }}
                    </td>
                  </tr>

                  <!-- 第2行：说明（仅在有说明文本时显示） -->
                  <tr v-if="previewData?.descriptionRow" class="description-row">
                    <td :colspan="fieldList.length || 1" class="description-cell">
                      {{ previewData.descriptionRow }}
                    </td>
                  </tr>

                  <!-- 第3行：表头 -->
                  <tr class="header-row">
                    <td
                      v-for="field in fieldList"
                      :key="field.fieldCode"
                      class="header-cell"
                      :class="{ required: field.isRequired }"
                    >
                      {{ field.fieldName }}
                    </td>
                    <td v-if="!fieldList.length" class="placeholder-cell"> 暂无字段配置 </td>
                  </tr>

                  <!-- 第4行及以后：示例数据 -->
                  <template v-if="showExampleData">
                    <tr v-for="(row, rowIndex) in exampleRows" :key="rowIndex" class="example-row">
                      <td v-for="(value, colIndex) in row" :key="colIndex" class="example-cell">
                        {{ value }}
                      </td>
                      <td v-if="!fieldList.length" class="placeholder-cell"> 示例数据 </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 字段详情 -->
      <div class="fields-detail-section">
        <el-card shadow="never">
          <template #header>
            <div class="fields-header">
              <Icon icon="ep:list" class="header-icon" />
              <span class="header-title">字段详情 ({{ fieldList.length }})</span>
            </div>
          </template>

          <div class="fields-list" v-if="fieldList.length">
            <div
              v-for="(field, index) in fieldList"
              :key="field.fieldCode"
              class="field-detail-item"
            >
              <div class="field-index">{{ index + 1 }}</div>
              <div class="field-content">
                <div class="field-main">
                  <div class="field-name-row">
                    <span class="field-name">{{ field.fieldName }}</span>
                    <span class="field-code">{{ field.fieldCode }}</span>
                    <el-tag :type="FIELD_TYPE_COLORS[field.fieldType] || 'info'" size="small">
                      {{ FIELD_TYPE_NAMES[field.fieldType] }}
                    </el-tag>
                    <el-tag v-if="field.isRequired" type="danger" size="small"> 必填 </el-tag>
                  </div>

                  <div class="field-meta" v-if="field.exampleValue || field.remark">
                    <div v-if="field.exampleValue" class="meta-item">
                      <span class="meta-label">示例值：</span>
                      <span class="meta-value">{{ field.exampleValue }}</span>
                    </div>
                    <div v-if="field.remark" class="meta-item">
                      <span class="meta-label">说明：</span>
                      <span class="meta-value">{{ field.remark }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-fields">
            <el-empty description="暂无字段配置" />
          </div>
        </el-card>
      </div>

      <!-- 使用说明 -->
      <div class="usage-guide-section">
        <el-card shadow="never">
          <template #header>
            <div class="guide-header">
              <Icon icon="ep:document" class="header-icon" />
              <span class="header-title">使用说明</span>
            </div>
          </template>

          <div class="usage-content">
            <el-alert title="模板使用说明" type="info" :closable="false" class="usage-alert">
              <div class="usage-steps">
                <div class="step-item">
                  <span class="step-number">1</span>
                  <span class="step-text">下载此Excel模板文件</span>
                </div>
                <div class="step-item">
                  <span class="step-number">2</span>
                  <span class="step-text">删除示例数据行，保留标题行、说明行（如有）、表头行</span>
                </div>
                <div class="step-item">
                  <span class="step-number">3</span>
                  <span class="step-text">从数据行开始填写实际数据</span>
                </div>
                <div class="step-item">
                  <span class="step-number">4</span>
                  <span class="step-text">确保必填字段（标红*）都已填写</span>
                </div>
                <div class="step-item">
                  <span class="step-number">5</span>
                  <span class="step-text">保存Excel文件并上传导入</span>
                </div>
              </div>
            </el-alert>

            <div class="field-rules" v-if="fieldList.length">
              <h4>字段填写规则</h4>
              <ul class="rules-list">
                <li v-for="field in requiredFields" :key="field.fieldCode">
                  <strong>{{ field.fieldName }}</strong
                  >：
                  {{ getFieldRule(field) }}
                </li>
              </ul>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="downloadTemplate">
          <Icon icon="ep:download" class="mr-5px" />
          下载模板
        </el-button>
      </div>
    </template>

    <!-- 下载配置弹窗 -->
    <TemplateDownloadDialog ref="downloadRef" />
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@/components/Icon'
import { DICT_TYPE } from '@/utils/dict'
import {
  ImportTemplateApi,
  TemplatePreviewVO,
  ImportTemplateRespVO,
  TemplateFieldRespVO,
  FIELD_TYPE_NAMES,
  FIELD_TYPE
} from '@/api/drug/task/template'
import TemplateDownloadDialog from './TemplateDownloadDialog.vue'
import DictTag from '@/components/DictTag/src/DictTag.vue'

defineOptions({ name: 'TemplatePreviewDialog' })

// ========================= 响应式数据 =========================
const dialogVisible = ref(false)
const loading = ref(false)
const showExampleData = ref(true)
const currentTemplateId = ref<number>()

const templateInfo = ref<ImportTemplateRespVO>()
const previewData = ref<any>()
const fieldList = ref<TemplateFieldRespVO[]>([])
const downloadRef = ref()

// 字段类型颜色映射
const FIELD_TYPE_COLORS = {
  [FIELD_TYPE.TEXT]: 'primary',
  [FIELD_TYPE.NUMBER]: 'success',
  [FIELD_TYPE.DATE]: 'warning',
  [FIELD_TYPE.DECIMAL]: 'info',
  [FIELD_TYPE.BOOLEAN]: 'danger'
}

// ========================= 计算属性 =========================
const requiredFields = computed(() => {
  return fieldList.value.filter((field) => field.isRequired)
})

const exampleRows = computed(() => {
  if (!previewData.value?.exampleRows) {
    // 生成默认示例数据
    return Array.from({ length: 3 }, (_, rowIndex) =>
      fieldList.value.map(
        (field, colIndex) => field.exampleValue || `示例${rowIndex + 1}-${colIndex + 1}`
      )
    )
  }
  return previewData.value.exampleRows
})

// ========================= 核心方法 =========================

/** 打开弹窗 */
const open = async (templateId: number) => {
  dialogVisible.value = true
  currentTemplateId.value = templateId

  await loadPreviewData()
}

defineExpose({ open })

/** 加载预览数据 */
const loadPreviewData = async () => {
  if (!currentTemplateId.value) return

  loading.value = true
  try {
    const response: any = await ImportTemplateApi.previewImportTemplate(currentTemplateId.value)

    // 映射模板信息
    templateInfo.value = {
      ...response.template,
      statusText: response.template.status ? '启用' : '禁用'
    }

    // 使用新的结构化数据（后端已改为返回对象而非数组）
    const apiPreviewData = response.previewData as any
    previewData.value = {
      titleRow: apiPreviewData.title || '模板标题',
      descriptionRow: apiPreviewData.description, // 可能为null/空字符串
      headerRow: apiPreviewData.headers || [],
      exampleRows: apiPreviewData.examples || []
    }

    // 映射字段列表，并转换字段类型
    fieldList.value = (response.fields || []).map((field: any) => ({
      ...field,
      fieldType: convertFieldType(field.fieldType), // 转换字段类型
      isRequired: field.isRequired || false
    }))
  } catch (error) {
    console.error('加载预览数据失败:', error)
    ElMessage.error('加载预览数据失败')
  } finally {
    loading.value = false
  }
}
// 添加字段类型转换函数
const convertFieldType = (apiFieldType: string) => {
  const typeMapping = {
    STRING: FIELD_TYPE.TEXT,
    INTEGER: FIELD_TYPE.NUMBER,
    DECIMAL: FIELD_TYPE.DECIMAL,
    DATE: FIELD_TYPE.DATE,
    DATETIME: FIELD_TYPE.DATE,
    BOOLEAN: FIELD_TYPE.BOOLEAN
  }
  return typeMapping[apiFieldType] || FIELD_TYPE.TEXT
}

/** 切换示例数据显示 */
const toggleExampleData = () => {
  showExampleData.value = !showExampleData.value
}

/** 下载模板 */
const downloadTemplate = () => {
  if (!currentTemplateId.value) return
  
  // 打开下载配置弹窗
  downloadRef.value.open(currentTemplateId.value)
}

// ========================= 工具方法 =========================

/** 获取字段规则描述 */
const getFieldRule = (field: TemplateFieldRespVO): string => {
  const rules: string[] = []

  if (field.isRequired) {
    rules.push('必填')
  }

  switch (field.fieldType) {
    case FIELD_TYPE.TEXT:
      rules.push('文本类型')
      break
    case FIELD_TYPE.NUMBER:
      rules.push('整数类型')
      break
    case FIELD_TYPE.DATE:
      rules.push('日期类型，格式如：2024-01-01')
      break
    case FIELD_TYPE.DECIMAL:
      rules.push('小数类型')
      break
    case FIELD_TYPE.BOOLEAN:
      rules.push('布尔类型，填写：是/否 或 true/false')
      break
  }

  if (field.exampleValue) {
    rules.push(`参考示例：${field.exampleValue}`)
  }

  return rules.join('，')
}
</script>

<style scoped>
.template-preview-dialog {
  --dialog-width: 1000px;
}

.preview-container {
  max-height: 80vh;
  overflow-y: auto;
}

/* 各个区块 */
.template-info-section,
.excel-preview-section,
.fields-detail-section,
.usage-guide-section {
  margin-bottom: 20px;
}

.template-info-section:last-child,
.excel-preview-section:last-child,
.fields-detail-section:last-child,
.usage-guide-section:last-child {
  margin-bottom: 0;
}

/* 头部样式 */
.info-header,
.preview-header,
.fields-header,
.guide-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-header {
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 16px;
  color: #409eff;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 模板信息 */
.template-details {
  padding: 8px 0;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.detail-label {
  font-weight: 600;
  color: #606266;
  min-width: 80px;
}

.detail-value {
  color: #303133;
  flex: 1;
}

/* Excel预览 */
.excel-container {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
  background: white;
}

.excel-wrapper {
  overflow-x: auto;
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 600px;
}

.excel-table td {
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

/* 字段详情 */
.fields-list {
  max-height: 400px;
  overflow-y: auto;
}

.field-detail-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.field-detail-item:last-child {
  border-bottom: none;
}

.field-index {
  width: 32px;
  height: 32px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  margin-right: 16px;
  flex-shrink: 0;
}

.field-content {
  flex: 1;
}

.field-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.field-name {
  font-weight: 600;
  color: #303133;
}

.field-code {
  color: #606266;
  font-family: 'Courier New', monospace;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.field-meta {
  font-size: 12px;
  color: #909399;
}

.meta-item {
  margin-bottom: 4px;
}

.meta-label {
  font-weight: 500;
}

.meta-value {
  margin-left: 4px;
}

.empty-fields {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

/* 使用说明 */
.usage-content {
  line-height: 1.6;
}

.usage-alert {
  margin-bottom: 20px;
}

.usage-steps {
  margin-top: 12px;
}

.step-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.step-number {
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
  margin-right: 12px;
  flex-shrink: 0;
}

.step-text {
  color: #606266;
}

.field-rules h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
}

.rules-list {
  margin: 0;
  padding-left: 20px;
  color: #606266;
}

.rules-list li {
  margin-bottom: 6px;
  line-height: 1.5;
}

/* 弹窗底部 */
.dialog-footer {
  display: flex;
  justify-content: end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .template-preview-dialog {
    --dialog-width: 95vw;
  }

  .preview-container {
    max-height: 70vh;
  }

  .preview-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .field-name-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .excel-table {
    min-width: 400px;
  }

  .dialog-footer {
    flex-direction: column-reverse;
    gap: 8px;
  }
}

/* 卡片样式优化 */
:deep(.el-card) {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
}

:deep(.el-card__header) {
  background: #fafbfc;
  border-bottom: 1px solid #e1e4e8;
  padding: 16px 20px;
}

:deep(.el-card__body) {
  padding: 20px;
}

/* 标签样式 */
:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
}

/* 按钮样式 */
:deep(.el-button) {
  border-radius: 6px;
  font-weight: 500;
}
</style>
