<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <PageHeader
      title="药品数据批量导入"
      content="支持批量导入药品相关数据，系统将自动验证文件格式并进行数据质控"
      :show-back-button="true"
      back-button-text="返回列表"
      :back-button-disabled="importing"
      @back-click="handleBack"
    />

    <!-- 导入步骤 -->
    <el-card class="steps-card" shadow="never">
      <el-steps :active="currentStep" align-center>
        <el-step title="上传文件" description="选择压缩包文件" />
        <el-step title="文件验证" description="验证格式和内容" />
        <el-step title="确认导入" description="确认任务信息并开始导入" />
      </el-steps>
    </el-card>

    <!-- 步骤内容 -->
    <el-card class="content-card" shadow="never">
      <!-- 步骤1: 文件上传 -->
      <div v-show="currentStep === 0" class="step-content">
        <el-form
          ref="uploadFormRef"
          :model="uploadForm"
          :rules="uploadRules"
          label-width="120px"
          class="upload-form"
        >
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="任务名称" prop="taskName">
                <el-input
                  v-model="uploadForm.taskName"
                  placeholder="请输入任务名称，便于后续查找和管理"
                  maxlength="100"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="数据来源" prop="dataSource">
                <el-select
                  v-model="uploadForm.dataSource"
                  placeholder="请选择数据来源"
                  style="width: 100%"
                >
                  <el-option
                    v-for="dict in getDictOptions(DICT_TYPE.DRUG_DATA_SOURCE)"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="备注说明" prop="description">
            <el-input
              v-model="uploadForm.description"
              type="textarea"
              :rows="3"
              placeholder="可选：描述本次导入的数据内容、时间范围、注意事项等信息"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="导入文件" prop="file" required>
            <div class="upload-section">
              <el-upload
                ref="uploadRef"
                class="upload-dragger"
                drag
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleFileChange"
                :before-upload="() => false"
                accept=".zip,.rar"
              >
                <div v-if="!uploadForm.file" class="upload-content">
                  <el-icon class="upload-icon"><UploadFilled /></el-icon>
                  <div class="upload-text">
                    <p>拖拽文件到此处，或<em>点击上传</em></p>
                    <p class="upload-hint">仅支持 .zip 或 .rar 格式，文件大小不超过 100MB</p>
                  </div>
                </div>
                <div v-else class="file-info">
                  <el-icon class="file-icon"><Document /></el-icon>
                  <div class="file-details">
                    <div class="file-name">{{ uploadForm.file.name }}</div>
                    <div class="file-size">{{ formatFileSize(uploadForm.file.size) }}</div>
                  </div>
                  <el-button
                    type="danger"
                    size="small"
                    circle
                    @click="removeFile"
                    class="remove-btn"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
              </el-upload>
            </div>
          </el-form-item>
        </el-form>

        <!-- 文件要求说明 - 优化为居中展示 -->
        <div class="requirements-section">
          <el-alert title="导入文件要求" type="info" :closable="false" class="requirements-alert">
            <template #default>
              <div class="requirements-content">
                <div class="requirements-header">
                  <h3 class="requirements-title">压缩包必须包含以下5个Excel文件</h3>
                  <p class="requirements-subtitle">请确保文件名称和内容格式完全符合要求</p>
                </div>

                <div class="file-list-container">
                  <div class="file-grid">
                    <div v-for="(table, key) in tableDefinitions" :key="key" class="file-card">
                      <div class="file-card-header">
                        <el-icon class="file-card-icon" :style="{ color: table.color }">
                          <Files />
                        </el-icon>
                        <div class="file-card-title">{{ table.fileName }}</div>
                      </div>
                      <div class="file-card-content">
                        <div class="file-card-name">{{ table.name }}</div>
                        <div class="file-card-desc">{{ table.description }}</div>
                        <div class="file-card-stats">
                          <span class="field-count">{{ table.fieldCount }} 个字段</span>
                          <span class="required-fields"
                            >{{ table.requiredFields?.length || 0 }} 个必填</span
                          >
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="template-download-section">
                  <div class="download-info">
                    <el-icon class="download-icon"><Download /></el-icon>
                    <div class="download-text">
                      <h4>获取标准模板</h4>
                      <p>下载包含所有必要文件和示例数据的标准模板</p>
                    </div>
                  </div>
                  <el-button type="primary" @click="downloadTemplate" class="download-btn">
                    <el-icon><Download /></el-icon>
                    下载标准模板
                  </el-button>
                </div>

                <div class="requirements-tips">
                  <div class="tip-item">
                    <el-icon class="tip-icon success"><CircleCheck /></el-icon>
                    <span>文件格式：Excel (.xlsx) 文件，UTF-8编码</span>
                  </div>
                  <div class="tip-item">
                    <el-icon class="tip-icon warning"><Warning /></el-icon>
                    <span>字段要求：必填字段不能为空，可选字段可为空</span>
                  </div>
                  <div class="tip-item">
                    <el-icon class="tip-icon info"><InfoFilled /></el-icon>
                    <span>数据质量：建议数据完整性超过90%以获得最佳导入效果</span>
                  </div>
                </div>
              </div>
            </template>
          </el-alert>
        </div>
      </div>

      <!-- 步骤2: 文件验证 -->
      <div v-show="currentStep === 1" class="step-content">
        <div v-loading="validating" class="validation-content">
          <div v-if="!validating && validationResult" class="validation-result">
            <el-result
              :icon="validationResult.valid ? 'success' : 'error'"
              :title="validationResult.valid ? '文件验证通过' : '文件验证失败'"
              :sub-title="validationResult.validationMessage"
            >
              <template #extra>
                <div v-if="validationResult.valid" class="validation-success">
                  <el-descriptions title="文件信息" :column="2" border>
                    <el-descriptions-item label="文件名称">{{
                      validationResult.fileName
                    }}</el-descriptions-item>
                    <el-descriptions-item label="文件大小">{{
                      formatFileSize(validationResult.fileSize)
                    }}</el-descriptions-item>
                    <el-descriptions-item label="解压文件数">{{
                      validationResult.extractedFiles?.length || 0
                    }}</el-descriptions-item>
                    <el-descriptions-item label="验证状态">
                      <el-tag type="success">全部通过</el-tag>
                    </el-descriptions-item>
                  </el-descriptions>

                  <!-- 文件详情表格 -->
                  <div class="files-table" style="margin-top: 20px">
                    <h4>解压文件清单</h4>
                    <el-table :data="validationResult.extractedFiles" border stripe>
                      <el-table-column prop="fileName" label="文件名" width="200" />
                      <el-table-column prop="tableType" label="数据类型" width="150">
                        <template #default="{ row }">
                          <el-tag :color="tableDefinitions[row.tableType]?.color">
                            {{ tableDefinitions[row.tableType]?.name }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="rowCount" label="数据行数" width="100" align="center">
                        <template #default="{ row }">
                          <span>{{ row.rowCount.toLocaleString() }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column prop="fileSize" label="文件大小" width="100" align="center">
                        <template #default="{ row }">
                          {{ formatFileSize(row.fileSize) }}
                        </template>
                      </el-table-column>
                      <el-table-column prop="isValid" label="验证状态" width="100" align="center">
                        <template #default="{ row }">
                          <el-tag :type="row.isValid ? 'success' : 'danger'">
                            {{ row.isValid ? '通过' : '失败' }}
                          </el-tag>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </div>

                <div v-else class="validation-error">
                  <div v-if="validationResult.missingFiles?.length" class="error-section">
                    <h4>缺失文件：</h4>
                    <el-tag
                      v-for="file in validationResult.missingFiles"
                      :key="file"
                      type="danger"
                      class="error-tag"
                    >
                      {{ file }}
                    </el-tag>
                  </div>
                  <div v-if="validationResult.extraFiles?.length" class="error-section">
                    <h4>多余文件：</h4>
                    <el-tag
                      v-for="file in validationResult.extraFiles"
                      :key="file"
                      type="warning"
                      class="error-tag"
                    >
                      {{ file }}
                    </el-tag>
                  </div>
                </div>
              </template>
            </el-result>
          </div>
        </div>
      </div>

      <!-- 步骤3: 确认导入 -->
      <div v-show="currentStep === 2" class="step-content">
        <div class="import-confirmation">
          <el-descriptions title="任务信息确认" :column="2" border>
            <el-descriptions-item label="任务名称">{{ uploadForm.taskName }}</el-descriptions-item>
            <el-descriptions-item label="数据来源">{{
              getDataSourceText(uploadForm.dataSource)
            }}</el-descriptions-item>
            <el-descriptions-item label="文件名称">{{
              uploadForm.file?.name
            }}</el-descriptions-item>
            <el-descriptions-item label="文件大小">{{
              formatFileSize(uploadForm.file?.size || 0)
            }}</el-descriptions-item>
            <el-descriptions-item label="预计处理时间" span="2">约 5-15 分钟</el-descriptions-item>
            <el-descriptions-item label="创建时间" span="2">{{
              new Date().toLocaleString()
            }}</el-descriptions-item>
          </el-descriptions>

          <!-- 数据表和字段信息展示 -->
          <div class="data-tables-info" style="margin-top: 24px">
            <h3>即将导入的数据表和数据预览</h3>
            <el-collapse>
              <el-collapse-item
                v-for="(fileInfo, index) in validationResult?.extractedFiles"
                :key="index"
                :name="fileInfo.tableType"
              >
                <template #title>
                  <div class="collapse-title">
                    <el-tag :color="tableDefinitions[fileInfo.tableType]?.color" class="table-tag">
                      {{ tableDefinitions[fileInfo.tableType]?.name }}
                    </el-tag>
                    <span class="table-stats">
                      {{ fileInfo.rowCount.toLocaleString() }} 条数据 ·
                      {{
                        fileInfo.actualFields?.length ||
                        tableDefinitions[fileInfo.tableType]?.fieldCount
                      }}
                      个字段
                    </span>
                  </div>
                </template>

                <div class="table-content">
                  <!-- 字段信息 -->
                  <div class="table-fields">
                    <h4>实际字段 ({{ fileInfo.actualFields?.length || 0 }}个)</h4>
                    <div class="fields-list">
                      <el-tag
                        v-for="field in fileInfo.actualFields"
                        :key="field"
                        :type="isRequiredField(fileInfo.tableType, field) ? 'danger' : 'info'"
                        class="field-tag"
                      >
                        {{ field }}
                        <el-icon
                          v-if="isRequiredField(fileInfo.tableType, field)"
                          style="margin-left: 4px"
                          ><Star
                        /></el-icon>
                      </el-tag>
                    </div>

                    <!-- 缺失必填字段警告 -->
                    <div
                      v-if="
                        getMissingRequiredFields(fileInfo.tableType, fileInfo.actualFields).length >
                        0
                      "
                      class="missing-fields-warning"
                    >
                      <el-alert
                        title="缺失必填字段"
                        type="warning"
                        :closable="false"
                        style="margin-top: 12px"
                      >
                        <div class="missing-fields">
                          <el-tag
                            v-for="field in getMissingRequiredFields(
                              fileInfo.tableType,
                              fileInfo.actualFields
                            )"
                            :key="field"
                            type="warning"
                            class="field-tag"
                          >
                            {{ field }}
                          </el-tag>
                        </div>
                      </el-alert>
                    </div>
                  </div>

                  <!-- 数据预览 -->
                  <div class="data-preview" style="margin-top: 20px">
                    <h4>数据预览 (前{{ Math.min(fileInfo.previewData?.length || 0) }}行)</h4>
                    <el-table
                      v-if="fileInfo.previewData?.length > 0"
                      :data="fileInfo.previewData"
                      border
                      stripe
                      size="small"
                      style="width: 100%"
                      max-height="300"
                    >
                      <el-table-column
                        v-for="field in fileInfo.actualFields"
                        :key="field"
                        :prop="field"
                        :label="field"
                        :width="150"
                        show-overflow-tooltip
                      >
                        <template #header="{ column }">
                          <div class="custom-header">
                            <span>{{ column.label }}</span>
                            <el-icon
                              v-if="isRequiredField(fileInfo.tableType, column.label)"
                              class="required-icon"
                            >
                              <Star />
                            </el-icon>
                          </div>
                        </template>
                        <template #default="{ row }">
                          <span :class="{ 'empty-cell': !row[field] }">
                            {{ row[field] || '-' }}
                          </span>
                        </template>
                      </el-table-column>
                    </el-table>
                    <el-empty v-else description="暂无数据预览" />
                  </div>

                  <!-- 数据质量说明 -->
                  <div class="data-quality-info" style="margin-top: 16px">
                    <el-descriptions :column="3" size="small" border>
                      <el-descriptions-item label="总行数">{{
                        fileInfo.rowCount
                      }}</el-descriptions-item>
                      <el-descriptions-item label="有效行数">{{
                        fileInfo.validRowCount || fileInfo.rowCount
                      }}</el-descriptions-item>
                      <el-descriptions-item label="空行数">{{
                        fileInfo.rowCount - (fileInfo.validRowCount || fileInfo.rowCount)
                      }}</el-descriptions-item>
                      <el-descriptions-item label="字段完整率">
                        <el-tag
                          :type="getCompletenessType(fileInfo.tableType, fileInfo.actualFields)"
                        >
                          {{
                            calculateFieldCompleteness(fileInfo.tableType, fileInfo.actualFields)
                          }}%
                        </el-tag>
                      </el-descriptions-item>
                      <el-descriptions-item label="数据质量">
                        <el-tag
                          :type="
                            fileInfo.dataQuality === 'HIGH'
                              ? 'success'
                              : fileInfo.dataQuality === 'MEDIUM'
                                ? 'warning'
                                : 'danger'
                          "
                        >
                          {{ getDataQualityText(fileInfo.dataQuality) }}
                        </el-tag>
                      </el-descriptions-item>
                      <el-descriptions-item label="编码格式">{{
                        fileInfo.encoding || 'UTF-8'
                      }}</el-descriptions-item>
                    </el-descriptions>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>

          <el-alert title="导入说明" type="warning" :closable="false" class="import-notice">
            <template #default>
              <ul>
                <li>导入过程将按照：机构信息 → 药品目录 → 入库/出库/使用 的顺序进行</li>
                <li>导入过程中请勿关闭浏览器，可在进度监控中查看实时状态</li>
                <li>如遇到错误，系统支持智能重试和部分重新导入</li>
                <li>导入完成后会自动进行数据质控检查</li>
                <li>所有字段信息已确认无误，数据不会丢失</li>
              </ul>
            </template>
          </el-alert>
        </div>
      </div>
    </el-card>

    <!-- 底部操作按钮 -->
    <div class="footer-actions">
      <el-button @click="handleBack" :disabled="importing">取消</el-button>
      <el-button v-if="currentStep > 0" @click="prevStep" :disabled="importing || validating">
        上一步
      </el-button>
      <el-button
        v-if="currentStep < 2"
        type="primary"
        @click="nextStep"
        :disabled="!canNextStep"
        :loading="validating"
      >
        {{ currentStep === 1 ? '验证文件' : '下一步' }}
      </el-button>
      <el-button v-if="currentStep === 2" type="primary" @click="startImport" :loading="importing">
        开始导入
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  UploadFilled,
  Document,
  Close,
  Download,
  Files,
  Star,
  CircleCheck,
  Warning,
  InfoFilled
} from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import { DrugBatchImportApi } from '@/api/drug/task'

// 导入优化后的PageHeader组件
import PageHeader from '@/components/PageHeader/index.vue'
import { getDictLabel, DICT_TYPE, getDictOptions } from '@/utils/dict'
/** 组件名称定义 */
defineOptions({ name: 'DrugBatchImportPage' })

const router = useRouter()

// ========================= 表定义数据 =========================
const tableDefinitions = {
  HOSPITAL_INFO: {
    name: '公立医疗机构基本情况',
    fileName: '机构基本情况.xlsx',
    description: '医疗机构的基础信息数据',
    requiredFields: [
      '数据上报日期',
      '省级行政区划代码',
      '组织机构代码',
      '医疗机构代码',
      '组织机构名称',
      '年度药品总收入（元）',
      '实有床位数'
    ],
    fieldCount: 7,
    color: '#1890ff'
  },
  DRUG_CATALOG: {
    name: '公立医疗机构药品目录',
    fileName: '药品目录.xlsx',
    description: '医疗机构使用的药品目录清单',
    requiredFields: [
      '数据上报日期',
      '省级行政区划代码',
      '组织机构代码',
      '医疗机构代码',
      '国家药品编码（YPID）',
      '院内药品唯一码',
      '通用名',
      '产品名称',
      '批准文号',
      '生产企业',
      '制剂单位',
      '最小销售包装单位',
      '转换系数'
    ],
    optionalFields: ['商品名', '商品名（英文）', '剂型名称', '制剂规格', '是否基本药物'],
    fieldCount: 18,
    color: '#52c41a'
  },
  DRUG_INBOUND: {
    name: '公立医疗机构药品入库情况',
    fileName: '药品入库.xlsx',
    description: '药品采购入库的详细记录',
    requiredFields: [
      '数据上报日期',
      '省级行政区划代码',
      '组织机构代码',
      '医疗机构代码',
      '国家药品编码（YPID）',
      '院内药品唯一码',
      '产品名称',
      '入库总金额（元）',
      '入库数量（最小销售包装单位）',
      '入库数量（最小制剂单位）'
    ],
    optionalFields: ['省级药品集中采购平台药品编码'],
    fieldCount: 11,
    color: '#fa8c16'
  },
  DRUG_OUTBOUND: {
    name: '公立医疗机构药品出库情况',
    fileName: '药品出库.xlsx',
    description: '药品发放出库的详细记录',
    requiredFields: [
      '数据上报日期',
      '省级行政区划代码',
      '组织机构代码',
      '医疗机构代码',
      '国家药品编码（YPID）',
      '院内药品唯一码',
      '产品名称',
      '出库数量（最小销售包装单位）',
      '出库数量（最小制剂单位）'
    ],
    optionalFields: ['省级药品集中采购平台药品编码'],
    fieldCount: 10,
    color: '#eb2f96'
  },
  DRUG_USAGE: {
    name: '公立医疗机构药品使用情况',
    fileName: '药品使用.xlsx',
    description: '药品临床使用和销售统计',
    requiredFields: [
      '数据上报日期',
      '省级行政区划代码',
      '组织机构代码',
      '医疗机构代码',
      '国家药品编码（YPID）',
      '院内药品唯一码',
      '产品名称',
      '销售总金额（元）',
      '销售数量（最小销售包装单位）',
      '销售数量（最小制剂单位）'
    ],
    optionalFields: ['省级药品集中采购平台药品编码'],
    fieldCount: 11,
    color: '#722ed1'
  }
}

// ========================= 响应式数据 =========================
const currentStep = ref(0)
const validating = ref(false)
const importing = ref(false)

const uploadFormRef = ref<FormInstance>()
const uploadRef = ref()

/** 上传表单数据 */
const uploadForm = reactive({
  taskName: '',
  description: '',
  dataSource: '',
  file: null as File | null
})

/** 表单验证规则 */
const uploadRules: FormRules = {
  taskName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 100, message: '任务名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  dataSource: [{ required: true, message: '请选择数据来源', trigger: 'change' }]
}

/** 文件验证结果 */
const validationResult = ref<any>(null)

// ========================= 计算属性 =========================
const canNextStep = computed(() => {
  switch (currentStep.value) {
    case 0:
      return uploadForm.taskName && uploadForm.dataSource && uploadForm.file
    case 1:
      return validationResult.value?.valid
    default:
      return false
  }
})

// ========================= 方法 =========================

/** 处理文件改变 */
const handleFileChange = (uploadFile: UploadFile) => {
  const file = uploadFile.raw
  if (!file) return

  // 验证文件类型
  const allowedTypes = ['.zip', '.rar']
  const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

  if (!allowedTypes.includes(fileExtension)) {
    ElMessage.error('仅支持 .zip 或 .rar 格式的文件')
    return false
  }

  // 验证文件大小 (100MB)
  const maxSize = 100 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 100MB')
    return false
  }

  uploadForm.file = file
  ElMessage.success('文件选择成功')
}

/** 移除文件 */
const removeFile = () => {
  uploadForm.file = null
  validationResult.value = null
  if (currentStep.value > 0) {
    currentStep.value = 0
  }
}

/** 下一步 */
const nextStep = async () => {
  if (currentStep.value === 0) {
    // 验证表单
    const valid = await uploadFormRef.value?.validate()
    if (!valid) return

    // 进入文件验证步骤
    currentStep.value = 1
    await validateFile()
  } else if (currentStep.value === 1) {
    // 进入确认导入步骤
    currentStep.value = 2
  }
}

/** 上一步 */
const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

/** 验证文件 */
const validateFile = async () => {
  if (!uploadForm.file) return

  validating.value = true
  try {
    const result = await DrugBatchImportApi.validateImportFile(uploadForm.file)
    validationResult.value = result

    if (result.valid) {
      ElMessage.success('文件验证通过，可以开始导入')
    } else {
      ElMessage.error('文件验证失败，请检查文件内容')
    }
  } catch (error) {
    ElMessage.error('文件验证失败，请稍后重试')
    console.error('文件验证失败:', error)
  } finally {
    validating.value = false
  }
}

/** 开始导入 */
const startImport = async () => {
  if (!uploadForm.file) return

  try {
    await ElMessageBox.confirm(
      '确认开始导入？导入过程可能需要几分钟时间，请耐心等待。',
      '确认导入',
      {
        type: 'warning',
        confirmButtonText: '开始导入',
        cancelButtonText: '再想想'
      }
    )

    importing.value = true

    const result = await DrugBatchImportApi.createImportTask(uploadForm.file, {
      taskName: uploadForm.taskName,
      description: uploadForm.description || undefined,
      dataSource: uploadForm.dataSource
    })

    ElNotification({
      type: 'success',
      title: '导入任务创建成功',
      message: `任务编号：${result.taskNo}，正在后台处理中`,
      duration: 5000
    })

    // 跳转到任务列表或进度监控页面
    await router.push({
      name: 'DrugImportMonitor',
      params: { id: result.taskId }
    })
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('创建导入任务失败：' + (error.message || '未知错误'))
      console.error('创建导入任务失败:', error)
    }
  } finally {
    importing.value = false
  }
}

/** 下载模板 */
const downloadTemplate = async () => {
  const downloadUrl = 'http://cdn.fangliyun.com/drug-data-guard-suite/药品数据导入模板_2024.zip'

  // 创建隐藏的 a 标签进行下载
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = '药品数据导入模板_2024.zip' // 指定下载文件名
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  ElMessage.success('模板开始下载')
}

/** 返回上一页 */
const handleBack = () => {
  if (importing.value) {
    ElMessage.warning('导入正在进行中，无法离开页面')
    return
  }
  router.back()
}

/** 获取数据来源文本 */
const getDataSourceText = (value: string) => {
  return getDictLabel(DICT_TYPE.DRUG_DATA_SOURCE, value)
}

/** 格式化文件大小 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/** 判断字段是否为必填字段 */
const isRequiredField = (tableType: string, fieldName: string): boolean => {
  const tableInfo = tableDefinitions[tableType]
  return tableInfo?.requiredFields.includes(fieldName) || false
}

/** 获取缺失的必填字段 */
const getMissingRequiredFields = (tableType: string, actualFields: string[] = []): string[] => {
  const tableInfo = tableDefinitions[tableType]
  if (!tableInfo) return []

  return tableInfo.requiredFields.filter((field) => !actualFields.includes(field))
}

/** 计算字段完整率 */
const calculateFieldCompleteness = (tableType: string, actualFields: string[] = []): number => {
  const tableInfo = tableDefinitions[tableType]
  if (!tableInfo) return 0

  const requiredCount = tableInfo.requiredFields.length
  const foundRequired = tableInfo.requiredFields.filter((field) =>
    actualFields.includes(field)
  ).length

  return Math.round((foundRequired / requiredCount) * 100)
}

/** 获取完整率对应的标签类型 */
const getCompletenessType = (tableType: string, actualFields: string[] = []) => {
  const completeness = calculateFieldCompleteness(tableType, actualFields)
  if (completeness >= 100) return 'success'
  if (completeness >= 80) return 'warning'
  return 'danger'
}

/** 获取数据质量文本 */
const getDataQualityText = (quality: string): string => {
  const map: Record<string, string> = {
    HIGH: '优秀',
    MEDIUM: '良好',
    LOW: '较差'
  }
  return map[quality] || '未知'
}
</script>

<style scoped>
.app-container {
  padding: 20px;
  min-height: calc(100vh - 120px);
}

.steps-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.content-card {
  border-radius: 8px;
  min-height: 500px;
}

.step-content {
  padding: 24px 0;
}

.upload-form {
  margin-bottom: 32px;
}

.upload-section {
  width: 100%;
}

.upload-content {
  padding: 40px 20px;
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
}

.upload-text p {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
}

.upload-text em {
  color: #409eff;
  font-style: normal;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
}

.file-info {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 6px;
  position: relative;
}

.file-icon {
  font-size: 32px;
  color: #409eff;
  margin-right: 12px;
}

.file-details {
  flex: 1;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
}

/* ============ 文件要求区域优化样式 ============ */
.requirements-section {
  margin-top: 20px;
  width: 100%;
  display: flex;
  justify-content: center; /* 让alert容器居中 */
}

.requirements-alert {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  width: 100%;
}

.requirements-content {
  text-align: center;
  padding: 20px;
  max-width: 100%;
  margin: 0 auto; /* 确保内容居中 */
}

.requirements-header {
  margin-bottom: 32px;
}

.requirements-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.requirements-subtitle {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

.file-list-container {
  margin: 24px 0;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  justify-items: center; /* 让卡片在网格中居中 */
  width: 100%;
  max-width: 1600px; /* 限制网格的最大宽度 */
  margin: 0 auto; /* 让整个网格居中 */
}

.file-card {
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  width: 100%;
  max-width: 320px; /* 保持卡片的最大宽度限制 */
  transition: all 0.3s ease;
  cursor: pointer;
}

.file-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.file-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.file-card-icon {
  font-size: 24px;
  margin-right: 12px;
}

.file-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  text-align: left;
}

.file-card-content {
  text-align: left;
}

.file-card-name {
  font-size: 13px;
  font-weight: 500;
  color: #409eff;
  margin-bottom: 8px;
}

.file-card-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  margin-bottom: 12px;
}

.file-card-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-count,
.required-fields {
  font-size: 11px;
  color: #666;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 12px;
}

.required-fields {
  background: #fef0f0;
  color: #f56c6c;
}

.template-download-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 32px 0 24px 0;
  padding: 24px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #d9ecff;
}

.download-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.download-icon {
  font-size: 32px;
  color: #409eff;
}

.download-text h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #303133;
  text-align: left;
}

.download-text p {
  margin: 0;
  font-size: 13px;
  color: #606266;
  text-align: left;
}

.download-btn {
  padding: 12px 24px;
  height: auto;
  font-size: 14px;
}

.requirements-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
  width: 100%;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.tip-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.tip-icon.success {
  color: #67c23a;
}

.tip-icon.warning {
  color: #e6a23c;
}

.tip-icon.info {
  color: #409eff;
}

/* ============ 其他现有样式 ============ */
.validation-content {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.validation-result {
  width: 100%;
}

.files-table {
  margin-top: 20px;
}

.files-table h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}

.validation-error .error-section {
  margin-bottom: 16px;
}

.validation-error h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #303133;
}

.error-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.import-confirmation {
  padding: 20px 0;
}

.data-tables-info h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.collapse-title {
  display: flex;
  align-items: center;
  width: 100%;
}

.table-tag {
  margin-right: 12px;
}

.table-stats {
  color: #606266;
  font-size: 14px;
}

.table-fields h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}

.fields-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.field-tag {
  margin: 0;
}

.table-content {
  padding: 16px 0;
}

.data-preview h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}

.custom-header {
  display: flex;
  align-items: center;
  gap: 4px;
}

.required-icon {
  color: #f56c6c;
  font-size: 12px;
}

.empty-cell {
  color: #c0c4cc;
  font-style: italic;
}

.missing-fields-warning .missing-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.data-quality-info {
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
}

.import-notice {
  margin-top: 24px;
  border-radius: 6px;
}

.import-notice ul {
  margin: 0;
  padding-left: 20px;
}

.import-notice li {
  margin: 4px 0;
}

.footer-actions {
  margin-top: 24px;
  text-align: center;
  padding: 20px;
  border-top: 1px solid #ebeef5;
}

.footer-actions .el-button {
  margin: 0 8px;
}

/* 响应式设计优化 */
@media (max-width: 768px) {
  .app-container {
    padding: 16px;
  }

  .file-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
    justify-items: stretch; /* 改为拉伸，让卡片填满可用空间 */
    width: 100%; /* 占满容器宽度 */
  }

  .template-download-section {
    flex-direction: column;
    justify-content: center; /* 小屏幕下恢复居中 */
    gap: 16px;
    text-align: center;
  }

  .download-text h4,
  .download-text p {
    text-align: center;
  }
}

@media (min-width: 1200px) {
  .file-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* 大屏幕下稍微增大最小宽度 */
  }
}

:deep(.el-upload-dragger) {
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

:deep(.el-upload-dragger:hover) {
  border-color: #409eff;
}

:deep(.el-upload-dragger.is-dragover) {
  background-color: rgba(64, 158, 255, 0.06);
  border: 2px dashed #409eff;
}

:deep(.el-descriptions__title) {
  font-weight: 600;
  color: #303133;
}

:deep(.el-collapse-item__header) {
  padding-left: 20px;
  padding-right: 20px;
}

:deep(.el-collapse-item__content) {
  padding: 16px 20px 20px 20px;
}

:deep(.el-alert--info) {
  background-color: #f4f7ff;
  border-color: #d9ecff;
}

:deep(.el-alert--info .el-alert__title) {
  color: #303133;
}
</style>
