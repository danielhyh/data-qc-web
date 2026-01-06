<!--
  表头校验结果对话框
  功能：展示Excel/ZIP文件的表头字段校验结果
-->
<template>
  <Dialog
    v-model="visible"
    title="Excel字段校验结果"
    width="700px"
    :fullscreen="true"
    :scroll="true"
    maxHeight="500px"
  >
    <template #title>
      <div class="dialog-title">
        <Icon icon="ep:document-checked" class="dialog-title-icon" />
        <span class="dialog-title-text">Excel字段校验结果</span>
      </div>
    </template>

    <div v-if="result" class="validation-result">
      <!-- 文件信息 -->
      <div class="file-info">
        <el-icon><Document /></el-icon>
        <span>{{ fileName }}</span>
        <el-tag v-if="uploadFileType === 'zip'" type="info" size="small">
          压缩包
        </el-tag>
      </div>
      
      <!-- 总体校验状态 -->
      <el-alert
        :type="props.validating ? 'warning' : (result.allPassed ? 'success' : 'error')"
        :title="result.message"
        :closable="false"
        show-icon
        style="margin: 16px 0"
      />
      
      <!-- ZIP压缩包：显示每个文件的校验结果 -->
      <div v-if="uploadFileType === 'zip' && result.fileResults">
        <el-divider>各文件校验详情</el-divider>
        
        <el-collapse accordion>
          <el-collapse-item 
            v-for="(fileResult, index) in result.fileResults" 
            :key="index"
            :name="index"
          >
            <template #title>
              <div class="collapse-title">
                <el-icon :color="fileResult.passed ? '#67c23a' : '#f56c6c'">
                  <component :is="fileResult.passed ? CircleCheckFilled : CircleCloseFilled" />
                </el-icon>
                <!-- 映射文件类型 -->
                <span class="mapping-label">映射类型：</span>
                <el-tag type="primary" size="small" effect="plain">
                  {{ getFileTypeLabel(fileResult.fileType) }}
                </el-tag>
                <span class="separator">|</span>
                <!-- 识别到的文件 -->
                <span class="mapping-label">识别文件：</span>
                <span class="file-name-text">{{ fileResult.fileName }}</span>
                <!-- 校验结果 -->
                <el-tag 
                  :type="fileResult.passed ? 'success' : 'danger'" 
                  size="small"
                  style="margin-left: auto; flex-shrink: 0"
                >
                  {{ fileResult.passed ? '通过' : '未通过' }}
                </el-tag>
              </div>
            </template>
            
            <!-- 单个文件的详细信息 -->
            <div class="single-file-validation">
              <!-- 匹配成功的字段 -->
              <div v-if="fileResult.matched && fileResult.matched.length > 0" class="field-group">
                <div class="field-group-title">
                  <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
                  <span>匹配成功（{{ fileResult.matched.length }}个）</span>
                </div>
                <el-tag
                  v-for="field in fileResult.matched"
                  :key="field"
                  type="success"
                  size="small"
                  style="margin: 4px"
                >
                  {{ field }}
                </el-tag>
              </div>
              
              <!-- 缺失的必填字段 -->
              <div v-if="fileResult.missingRequired && fileResult.missingRequired.length > 0" class="field-group">
                <div class="field-group-title">
                  <el-icon color="#f56c6c"><CircleCloseFilled /></el-icon>
                  <span>缺失必填字段（{{ fileResult.missingRequired.length }}个）</span>
                </div>
                <el-tag
                  v-for="field in fileResult.missingRequired"
                  :key="field"
                  type="danger"
                  size="small"
                  style="margin: 4px"
                >
                  {{ field }}
                </el-tag>
              </div>
              
              <!-- 缺失的可选字段 -->
              <div v-if="fileResult.missingOptional && fileResult.missingOptional.length > 0" class="field-group">
                <div class="field-group-title">
                  <el-icon color="#e6a23c"><WarningFilled /></el-icon>
                  <span>缺失可选字段（{{ fileResult.missingOptional.length }}个）</span>
                </div>
                <el-tag
                  v-for="field in fileResult.missingOptional"
                  :key="field"
                  type="warning"
                  size="small"
                  style="margin: 4px"
                >
                  {{ field }}
                </el-tag>
              </div>
              
              <!-- Excel中多余的字段 -->
              <div v-if="fileResult.extra && fileResult.extra.length > 0" class="field-group">
                <div class="field-group-title">
                  <el-icon color="#909399"><InfoFilled /></el-icon>
                  <span>多余字段（{{ fileResult.extra.length }}个）</span>
                </div>
                <el-tag
                  v-for="field in fileResult.extra"
                  :key="field"
                  type="info"
                  size="small"
                  style="margin: 4px"
                >
                  {{ field }}
                </el-tag>
                <el-alert
                  type="info"
                  :closable="false"
                  style="margin-top: 8px"
                >
                  <template #title>
                    <span style="font-size: 13px">这些字段不在模板中，导入时会被忽略</span>
                  </template>
                </el-alert>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
      
      <!-- 单个/多个Excel文件：使用折叠列表展示校验结果 -->
      <div v-else-if="result.fileResults && result.fileResults.length > 0">
        <el-divider>{{ result.fileResults.length > 1 ? '各文件校验详情' : '文件校验详情' }}</el-divider>
        
        <!-- 重复文件提示 -->
        <el-alert
          v-if="result.hasDuplicates"
          type="warning"
          :closable="false"
          style="margin-bottom: 16px"
        >
          <template #title>
            <span style="font-size: 13px">
              检测到 {{ result.duplicateCount }} 个重复类型文件，同一类型只会采用第一个文件，其余将被忽略
            </span>
          </template>
        </el-alert>
        
        <el-collapse accordion>
          <el-collapse-item 
            v-for="(fileResult, index) in result.fileResults" 
            :key="index"
            :name="index"
            :class="{ 'duplicate-item': fileResult.duplicateStatus === 'duplicate' }"
          >
            <template #title>
              <div class="collapse-title">
                <el-icon :color="getFileStatusColor(fileResult)">
                  <component :is="getFileStatusIcon(fileResult)" />
                </el-icon>
                <!-- 采用/忽略标识 -->
                <el-tag 
                  v-if="fileResult.willBeUsed === true" 
                  type="success" 
                  size="small" 
                  effect="dark"
                  class="use-status-tag"
                >
                  采用
                </el-tag>
                <el-tag 
                  v-else-if="fileResult.duplicateStatus === 'duplicate'" 
                  type="info" 
                  size="small"
                  effect="dark"
                  class="use-status-tag"
                >
                  忽略
                </el-tag>
                <!-- 映射文件类型 -->
                <span class="mapping-label">映射类型：</span>
                <el-tag type="primary" size="small" effect="plain">
                  {{ getFileTypeLabel(fileResult.fileType) }}
                </el-tag>
                <span class="separator">|</span>
                <!-- 识别到的文件 -->
                <span class="mapping-label">识别文件：</span>
                <span class="file-name-text" :class="{ 'text-muted': fileResult.duplicateStatus === 'duplicate' }">
                  {{ fileResult.fileName }}
                </span>
                <!-- 校验结果 -->
                <el-tag 
                  :type="fileResult.passed ? 'success' : 'danger'" 
                  size="small"
                  style="margin-left: auto; flex-shrink: 0"
                >
                  {{ fileResult.passed ? '通过' : '未通过' }}
                </el-tag>
              </div>
            </template>
            
            <!-- 单个文件的详细信息 -->
            <div class="single-file-validation">
              <!-- 匹配成功的字段 -->
              <div v-if="fileResult.matched && fileResult.matched.length > 0" class="field-group">
                <div class="field-group-title">
                  <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
                  <span>匹配成功（{{ fileResult.matched.length }}个）</span>
                </div>
                <el-tag
                  v-for="field in fileResult.matched"
                  :key="field"
                  type="success"
                  size="small"
                  style="margin: 4px"
                >
                  {{ field }}
                </el-tag>
              </div>
              
              <!-- 缺失的必填字段 -->
              <div v-if="fileResult.missingRequired && fileResult.missingRequired.length > 0" class="field-group">
                <div class="field-group-title">
                  <el-icon color="#f56c6c"><CircleCloseFilled /></el-icon>
                  <span>缺失必填字段（{{ fileResult.missingRequired.length }}个）</span>
                </div>
                <el-tag
                  v-for="field in fileResult.missingRequired"
                  :key="field"
                  type="danger"
                  size="small"
                  style="margin: 4px"
                >
                  {{ field }}
                </el-tag>
              </div>
              
              <!-- 缺失的可选字段 -->
              <div v-if="fileResult.missingOptional && fileResult.missingOptional.length > 0" class="field-group">
                <div class="field-group-title">
                  <el-icon color="#e6a23c"><WarningFilled /></el-icon>
                  <span>缺失可选字段（{{ fileResult.missingOptional.length }}个）</span>
                </div>
                <el-tag
                  v-for="field in fileResult.missingOptional"
                  :key="field"
                  type="warning"
                  size="small"
                  style="margin: 4px"
                >
                  {{ field }}
                </el-tag>
              </div>
              
              <!-- Excel中多余的字段 -->
              <div v-if="fileResult.extra && fileResult.extra.length > 0" class="field-group">
                <div class="field-group-title">
                  <el-icon color="#909399"><InfoFilled /></el-icon>
                  <span>多余字段（{{ fileResult.extra.length }}个）</span>
                </div>
                <el-tag
                  v-for="field in fileResult.extra"
                  :key="field"
                  type="info"
                  size="small"
                  style="margin: 4px"
                >
                  {{ field }}
                </el-tag>
                <el-alert
                  type="info"
                  :closable="false"
                  style="margin-top: 8px"
                >
                  <template #title>
                    <span style="font-size: 13px">这些字段不在模板中，导入时会被忽略</span>
                  </template>
                </el-alert>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
    
    <template #footer>
      <!-- 正在校验中：显示加载状态 -->
      <template v-if="props.validating">
        <el-button type="primary" :loading="true" disabled>
          正在校验文件...
        </el-button>
      </template>
      <!-- 校验完成且通过：显示继续导入和重新选择 -->
      <template v-else-if="!props.validating && result?.allPassed">
        <el-button @click="handleCancel">
          重新选择
        </el-button>
        <el-button type="primary" @click="handleContinueUpload">
          <el-icon><CircleCheckFilled /></el-icon>
          确认继续导入
        </el-button>
      </template>
      <!-- 校验完成但未通过：显示下载模板和关闭 -->
      <template v-else-if="!props.validating && !result?.allPassed">
        <el-button type="info" :loading="downloadingTemplate" :disabled="downloadingTemplate" @click="handleDownloadTemplate">
          <el-icon class="mr-5px">
            <Download />
          </el-icon>
          下载标准模板压缩包(2025)
        </el-button>
        <el-button type="primary" @click="handleCancel">
          知道了
        </el-button>
      </template>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  Document,
  Download,
  CircleCheckFilled,
  CircleCloseFilled,
  WarningFilled,
  InfoFilled
} from '@element-plus/icons-vue'
import { Dialog } from '@/components/Dialog'
import { Icon } from '@/components/Icon'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'

// Props定义
interface Props {
  modelValue: boolean
  fileName: string
  uploadFileType: string
  result: any
  validating?: boolean  // 新增：是否正在校验中
  downloadingTemplate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  fileName: '',
  uploadFileType: '',
  result: null,
  validating: false,
  downloadingTemplate: false
})

// Emits定义
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'download-template'): void
  (e: 'continue-upload'): void  // 用户确认继续上传
  (e: 'cancel'): void  // 用户取消或关闭对话框
}>()

// 内部可见状态，与v-model双向绑定
const visible = ref(props.modelValue)

// 下载状态
const downloadingTemplate = computed(() => props.downloadingTemplate)

// 监听props变化
watch(() => props.modelValue, (val) => {
  visible.value = val
})

/**
 * 获取文件类型的显示名称
 * @param fileType 文件类型编码（如 HOSPITAL, INBOUND 等）
 */
const getFileTypeLabel = (fileType: string): string => {
  if (!fileType) return '未识别'
  return getDictLabel(DICT_TYPE.IMPORT_TABLE_TYPE, fileType) || fileType
}

/**
 * 获取文件状态颜色
 */
const getFileStatusColor = (fileResult: any): string => {
  if (fileResult.duplicateStatus === 'duplicate') {
    return '#909399'  // 灰色 - 忽略的文件
  }
  return fileResult.passed ? '#67c23a' : '#f56c6c'
}

/**
 * 获取文件状态图标
 */
const getFileStatusIcon = (fileResult: any) => {
  if (fileResult.duplicateStatus === 'duplicate') {
    return InfoFilled  // 忽略的文件用info图标
  }
  return fileResult.passed ? CircleCheckFilled : CircleCloseFilled
}

// 用于标记是否是"继续上传"操作导致的关闭
const isContinueUpload = ref(false)

// 监听内部状态变化，通知父组件
watch(visible, (val, oldVal) => {
  emit('update:modelValue', val)
  // 当对话框从打开变为关闭时
  if (oldVal === true && val === false) {
    if (isContinueUpload.value) {
      // 继续上传操作，触发continue-upload事件
      emit('continue-upload')
      isContinueUpload.value = false
    } else {
      // 其他关闭方式（X按钮、知道了、重新选择），触发cancel事件清除文件缓存
      emit('cancel')
    }
  }
})

// 下载模板
const handleDownloadTemplate = () => {
  emit('download-template')
}

// 继续上传（校验通过后用户确认）
const handleContinueUpload = () => {
  isContinueUpload.value = true
  visible.value = false
}

// 取消/重新选择
const handleCancel = () => {
  visible.value = false
}
</script>

<style scoped lang="scss">
.dialog-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dialog-title-icon {
  font-size: 20px;
  color: #409eff;
}

.dialog-title-text {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  letter-spacing: 0.3px;
}

.validation-result {
  .file-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #606266;
    margin-bottom: 16px;
  }
  
  .single-file-validation {
    padding: 0 8px;
  }
  
  .field-group {
    margin: 16px 0;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 4px;
    
    &-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      margin-bottom: 12px;
      color: #303133;
    }
  }
}

// 折叠面板标题样式
.collapse-title {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  font-size: 13px;
}

.mapping-label {
  color: #909399;
  font-size: 12px;
  flex-shrink: 0;
}

.separator {
  color: #dcdfe6;
  margin: 0 4px;
}

.file-name-text {
  color: #303133;
  font-size: 13px;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  &.text-muted {
    color: #909399;
    font-weight: 400;
  }
}

.use-status-tag {
  flex-shrink: 0;
  margin-right: 4px;
}

// 重复文件项样式
.duplicate-item {
  opacity: 0.7;
  
  :deep(.el-collapse-item__header) {
    background-color: #f5f7fa;
  }
}

.mr-5px {
  margin-right: 5px;
}
</style>
