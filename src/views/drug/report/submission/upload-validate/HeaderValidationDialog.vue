<!--
  表头校验结果对话框
  功能：展示Excel/ZIP文件的表头字段校验结果
-->
<template>
  <el-dialog
    v-model="visible"
    title="Excel字段校验结果"
    width="700px"
    :close-on-click-modal="false"
    :z-index="2100"
    append-to-body
  >
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
        :type="result.allPassed ? 'success' : 'error'"
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
      
      <!-- 单个Excel：直接显示校验结果 -->
      <div v-else-if="uploadFileType === 'excel' && result.fileResults && result.fileResults.length > 0">
        <div class="single-file-validation">
          <div v-for="fileResult in result.fileResults" :key="fileResult.fileName">
            <!-- 匹配成功的字段 -->
            <div v-if="fileResult.matched && fileResult.matched.length > 0" class="field-group">
              <div class="field-group-title">
                <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
                <span>匹配成功的字段（{{ fileResult.matched.length }}个）</span>
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
                <span>缺失的必填字段（{{ fileResult.missingRequired.length }}个）</span>
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
              <el-alert
                type="warning"
                :closable="false"
                style="margin-top: 8px"
              >
                <template #title>
                  <span style="font-size: 13px">请在Excel中添加这些字段列，或从下方下载标准模板</span>
                </template>
              </el-alert>
            </div>
            
            <!-- 缺失的可选字段 -->
            <div v-if="fileResult.missingOptional && fileResult.missingOptional.length > 0" class="field-group">
              <div class="field-group-title">
                <el-icon color="#e6a23c"><WarningFilled /></el-icon>
                <span>缺失的可选字段（{{ fileResult.missingOptional.length }}个）</span>
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
                <span>Excel中多余的字段（{{ fileResult.extra.length }}个）</span>
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
        </div>
      </div>
    </div>
    
    <template #footer>
      <!-- 校验通过：显示继续导入和重新选择 -->
      <template v-if="result?.allPassed">
        <el-button @click="handleCancel">
          重新选择
        </el-button>
        <el-button type="primary" @click="handleContinueUpload">
          <el-icon><CircleCheckFilled /></el-icon>
          确认继续导入
        </el-button>
      </template>
      <!-- 校验未通过：显示下载模板和关闭 -->
      <template v-else>
        <el-button @click="handleDownloadTemplate">
          <el-icon><Download /></el-icon>
          下载标准模板
        </el-button>
        <el-button type="primary" @click="visible = false">
          知道了
        </el-button>
      </template>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Document,
  Download,
  CircleCheckFilled,
  CircleCloseFilled,
  WarningFilled,
  InfoFilled
} from '@element-plus/icons-vue'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'

// Props定义
interface Props {
  modelValue: boolean
  fileName: string
  uploadFileType: string
  result: any
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  fileName: '',
  uploadFileType: '',
  result: null
})

// Emits定义
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'download-template'): void
  (e: 'continue-upload'): void  // 用户确认继续上传
}>()

// 内部可见状态，与v-model双向绑定
const visible = ref(props.modelValue)

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

// 监听内部状态变化，通知父组件
watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 下载模板
const handleDownloadTemplate = () => {
  emit('download-template')
}

// 继续上传（校验通过后用户确认）
const handleContinueUpload = () => {
  visible.value = false
  emit('continue-upload')
}

// 取消/重新选择
const handleCancel = () => {
  visible.value = false
}
</script>

<style scoped lang="scss">
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
}
</style>
