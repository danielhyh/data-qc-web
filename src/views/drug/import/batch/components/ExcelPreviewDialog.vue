<template>
  <Dialog
    v-model="dialogVisible"
    width="90%"
    :fullscreen="true"
    :scroll="true"
    maxHeight="80vh"
  >
    <template #title>
      <div class="preview-dialog-title">
        <Icon icon="ep:view" class="preview-title-icon" />
        <span class="preview-title-text">{{ dialogTitle }}</span>
      </div>
    </template>
    <div v-loading="loading" class="preview-container" element-loading-text="加载中...">
      <div v-if="!loading && templateInfo" class="excel-content">
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

                    <!-- 第2行：说明（仅在有说明文本且非空时显示） -->
                    <tr v-if="previewData?.descriptionRow && previewData.descriptionRow.trim()" class="description-row">
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
      </div>

      <el-empty v-else-if="!loading" description="暂无预览数据" />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="downloading" :disabled="downloading" @click="downloadTemplate">
          <Icon icon="ep:download" class="mr-5px" />
          下载模板
        </el-button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import type {
  ImportTemplateRespVO,
  TemplateFieldRespVO
} from '@/api/drug/task/template'
import {
  ImportTemplateApi,
  FIELD_TYPE_NAMES,
  FIELD_TYPE,
  TABLE_TYPE_NAMES
} from '@/api/drug/task/template'
import download from '@/utils/download'

defineOptions({ name: 'ExcelPreviewDialog' })

// ========================= 响应式数据 =========================
const dialogVisible = ref(false)
const loading = ref(false)
const downloading = ref(false)
const showExampleData = ref(true)
const currentTemplateId = ref<number>()

const templateInfo = ref<ImportTemplateRespVO>()
const previewData = ref<any>()
const fieldList = ref<TemplateFieldRespVO[]>([])

// ========================= 计算属性 =========================
const dialogTitle = computed(() => {
  return templateInfo.value
    ? `Excel 预览 - ${templateInfo.value.templateName}`
    : 'Excel 预览'
})

const exampleRows = computed(() => {
  // 检查是否有示例数据，空数组也算没有
  if (!previewData.value?.exampleRows || previewData.value.exampleRows.length === 0) {
    // 生成默认示例数据（1行）
    return Array.from({ length: 1 }, (_, rowIndex) =>
      fieldList.value.map(
        (field, colIndex) => field.exampleValue || `示例${rowIndex + 1}-${colIndex + 1}`
      )
    )
  }
  return previewData.value.exampleRows
})

// ========================= 方法 =========================

/** 打开弹框 */
const open = async (templateId: number) => {
  dialogVisible.value = true
  currentTemplateId.value = templateId
  await loadPreviewData()
}

/** 通过Code打开弹框 */
const openByCode = async (templateCode: string) => {
  dialogVisible.value = true
  await loadPreviewDataByCode(templateCode)
}

/** 加载预览数据 */
const loadPreviewData = async () => {
  if (!currentTemplateId.value) return

  loading.value = true
  try {
    const response = await ImportTemplateApi.previewImportTemplate(currentTemplateId.value)

    // 修复数据结构映射
    templateInfo.value = {
      ...response.template,
      tableTypeName: getTableTypeName(response.template.tableType), // 添加表类型名称
      statusText: response.template.status ? '启用' : '禁用'
    }

    // 从 template 对象中获取标题和说明，如果 previewData 中没有的话
    const titleRow = response.previewData?.titleRow || response.template?.titleText || '模板标题'
    const descriptionRow = response.previewData?.descriptionRow || response.template?.descriptionText || '' // 空字符串而非默认文本

    // previewData 已经是正确的对象格式，但需要确保 titleRow 和 descriptionRow 有值
    previewData.value = {
      titleRow,
      descriptionRow,
      headerRow: response.previewData?.headerRow || [],
      exampleRows: response.previewData?.exampleRows || []
    }

    // 修复字段列表映射，并转换字段类型
    fieldList.value = (response.fields || []).map((field) => ({
      ...field,
      fieldType: convertFieldType(field.fieldType), // 转换字段类型
      isRequired: field.isRequired || false
    }))
    
    // 保存当前模板ID，用于下载
    currentTemplateId.value = response.template.id
  } catch (error) {
    console.error('加载预览数据失败:', error)
    ElMessage.error('加载预览数据失败')
  } finally {
    loading.value = false
  }
}

/** 通过Code加载预览数据 */
const loadPreviewDataByCode = async (code: string) => {
  loading.value = true
  try {
    const response = await ImportTemplateApi.previewImportTemplateByCode(code)

    // 修复数据结构映射
    templateInfo.value = {
      ...response.template,
      tableTypeName: getTableTypeName(response.template.tableType), // 添加表类型名称
      statusText: response.template.status ? '启用' : '禁用'
    }

    // 从 template 对象中获取标题和说明，如果 previewData 中没有的话
    const titleRow = response.previewData?.titleRow || response.template?.titleText || '模板标题'
    const descriptionRow = response.previewData?.descriptionRow || response.template?.descriptionText || '' // 空字符串而非默认文本

    // previewData 已经是正确的对象格式，但需要确保 titleRow 和 descriptionRow 有值
    previewData.value = {
      titleRow,
      descriptionRow,
      headerRow: response.previewData?.headerRow || [],
      exampleRows: response.previewData?.exampleRows || []
    }

    // 修复字段列表映射，并转换字段类型
    fieldList.value = (response.fields || []).map((field) => ({
      ...field,
      fieldType: convertFieldType(field.fieldType), // 转换字段类型
      isRequired: field.isRequired || false
    }))
    
    // 保存当前模板ID，用于下载
    currentTemplateId.value = response.template.id
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

// 添加获取表类型名称的函数
const getTableTypeName = (tableType: number): string => {
  return TABLE_TYPE_NAMES[tableType] || '未知类型'
}

/** 切换示例数据显示 */
const toggleExampleData = () => {
  showExampleData.value = !showExampleData.value
}

/** 下载模板 */
const downloadTemplate = async () => {
  if (!currentTemplateId.value) return

  downloading.value = true
  try {
    // 使用默认参数直接下载模板
    const data = await ImportTemplateApi.downloadImportTemplateBlob(
      currentTemplateId.value,
      true,  // includeExampleData - 默认包含示例数据
      1,     // exampleRows - 默认1行
      'xlsx', // fileFormat - 默认xlsx格式
      true,  // includeValidation - 默认包含验证规则
      true,  // freezeHeader - 默认冻结表头
      true,  // autoColumnWidth - 默认自动调整列宽
      false  // includeDropdown - 默认不包含下拉选项
    )

    // 获取文件名
    const fileName = templateInfo.value
      ? `${templateInfo.value.templateName}_导入模板.xlsx`
      : '导入模板.xlsx'

    // 触发下载
    download.excel(data, fileName)

    ElMessage.success('模板下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败，请重试')
  } finally {
    downloading.value = false
  }
}

// ========================= 暴露方法 =========================
defineExpose({
  open,
  openByCode
})
</script>

<style scoped>
/* 预览容器 - 确保 loading 居中 */
.preview-container {
  min-height: 300px;
}

/* 标题样式 */
.preview-dialog-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-title-icon {
  font-size: 20px;
  color: #409eff;
}

.preview-title-text {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  letter-spacing: 0.3px;
}

/* 各个区块 */
.excel-preview-section {
  margin-bottom: 20px;
}

.excel-preview-section:last-child {
  margin-bottom: 0;
}

/* 头部样式 */
.preview-header {
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

/* 模板信息已移除 */

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

/* 弹窗底部 */
.dialog-footer {
  display: flex;
  justify-content: end;
  gap: 12px;
}

.mr-5px {
  margin-right: 5px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .preview-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
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
