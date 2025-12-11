<!--
  准备阶段Tab组件
  功能：展示文件要求、下载模板、开始上传
-->
<template>
  <div class="prepare-tab">
    <div class="requirements-section">
      <div class="requirements-content">
        <div class="requirements-header">
          <h3 class="requirements-title">压缩包必须包含以下5个Excel文件</h3>
          <p class="requirements-subtitle">请确保文件名称和内容格式完全符合要求</p>
        </div>
        
        <!-- 文件卡片网格 -->
        <div class="file-list-container">
          <div class="file-grid">
            <div
              v-for="(table, key) in tableDefinitions"
              :key="key"
              class="file-card"
              :style="{ '--file-color': table.color }"
              @click="$emit('preview-template', table.id)"
            >
              <div class="file-card-header">
                <el-icon class="file-card-icon" :style="{ color: table.color }">
                  <Files />
                </el-icon>
                <div class="file-card-title">{{ table.fileName }}</div>
              </div>
              <div class="file-card-content">
                <div class="file-card-name">
                  <dict-tag :type="DICT_TYPE.IMPORT_TABLE_TYPE" :value="table.type" />
                </div>
                <div class="file-card-stats">
                  <span class="field-count">{{ table.fieldCount }} 个字段</span>
                  <span class="required-fields">{{ table.requiredFieldsCount || 0 }} 个必填</span>
                  <span class="download-count">{{ table.downloadCount || 0 }} 次下载</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 提示信息 -->
        <div class="requirements-tips">
          <div class="tip-item">
            <el-icon class="tip-icon success">
              <CircleCheck />
            </el-icon>
            <span>文件格式：Excel (.xlsx) 文件，UTF-8编码，GBK编码</span>
          </div>
          <div class="tip-item">
            <el-icon class="tip-icon warning">
              <Warning />
            </el-icon>
            <span>字段要求：必填字段不能为空，可选字段可为空；字段需符合类型、长度、正则表达式等高级校验规则</span>
          </div>
          <div class="tip-item">
            <el-icon class="tip-icon info">
              <InfoFilled />
            </el-icon>
            <span>数据质量：建议数据完整性超过90%以获得最佳导入效果</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="prepare-actions">
          <el-button size="large" @click="$emit('download-template')">
            <el-icon class="mr-5px">
              <Download />
            </el-icon>
            下载标准模板压缩包
          </el-button>
          <el-button type="primary" size="large" @click="$emit('start-upload')">
            <el-icon class="mr-5px">
              <Upload />
            </el-icon>
            开始上传文件
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Files,
  CircleCheck,
  Warning,
  InfoFilled,
  Download,
  Upload
} from '@element-plus/icons-vue'
import DictTag from '@/components/DictTag/src/DictTag.vue'
import { DICT_TYPE } from '@/utils/dict'

// Props定义
interface Props {
  tableDefinitions: Record<string, any>
}

defineProps<Props>()

// Emits定义
defineEmits<{
  (e: 'preview-template', id: number): void
  (e: 'download-template'): void
  (e: 'start-upload'): void
}>()
</script>

<style scoped lang="scss">
.prepare-tab {
  .requirements-section {
    padding: 20px;
  }

  .requirements-content {
    max-width: 1200px;
    margin: 0 auto;
  }

  .requirements-header {
    text-align: center;
    margin-bottom: 30px;

    .requirements-title {
      font-size: 20px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 8px;
    }

    .requirements-subtitle {
      font-size: 14px;
      color: #909399;
    }
  }

  .file-list-container {
    margin-bottom: 30px;
  }

  .file-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .file-card {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: var(--file-color, #409eff);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .file-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      .file-card-icon {
        font-size: 24px;
      }

      .file-card-title {
        font-weight: 600;
        font-size: 14px;
        color: #303133;
      }
    }

    .file-card-content {
      .file-card-name {
        margin-bottom: 8px;
      }

      .file-card-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 12px;
        color: #909399;

        span {
          background: #f5f7fa;
          padding: 2px 8px;
          border-radius: 4px;
        }
      }
    }
  }

  .requirements-tips {
    background: #f5f7fa;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;

    .tip-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .tip-icon {
        font-size: 18px;

        &.success {
          color: #67c23a;
        }

        &.warning {
          color: #e6a23c;
        }

        &.info {
          color: #409eff;
        }
      }

      span {
        color: #606266;
        font-size: 14px;
      }
    }
  }

  .prepare-actions {
    display: flex;
    justify-content: center;
    gap: 20px;
  }
}
</style>
