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
                <div class="file-card-icon-wrapper" :style="{ background: table.color + '15', borderColor: table.color + '30' }">
                  <el-icon class="file-card-icon" :style="{ color: table.color }">
                    <Files />
                  </el-icon>
                </div>
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
              <div class="file-card-arrow">
                <el-icon><ArrowRight /></el-icon>
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
          <el-button type="info" :loading="downloadingTemplate" :disabled="downloadingTemplate" @click="$emit('download-template')">
            <el-icon class="mr-5px">
              <Download />
            </el-icon>
            下载标准模板压缩包(2025)
          </el-button>
          <el-button type="primary" @click="$emit('start-upload')">
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
  Upload,
  ArrowRight
} from '@element-plus/icons-vue'
import DictTag from '@/components/DictTag/src/DictTag.vue'
import { DICT_TYPE } from '@/utils/dict'

// Props定义
interface Props {
  tableDefinitions: Record<string, any>
  downloadingTemplate?: boolean
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
    padding: 24px;
  }

  .requirements-content {
    max-width: 1500px;
    margin: 0 auto;
  }

  .requirements-header {
    text-align: center;
    margin-bottom: 32px;

    .requirements-title {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .requirements-subtitle {
      font-size: 14px;
      color: #6b7280;
    }
  }

  .file-list-container {
    margin-bottom: 32px;
  }

  .file-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }

  .file-card {
    position: relative;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 18px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      border-color: var(--file-color, #409eff);
      box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.1), 0 0 0 1px var(--file-color, #409eff);
      transform: translateY(-3px);

      .file-card-arrow {
        opacity: 1;
        transform: translateX(0);
        color: var(--file-color, #409eff);
      }
    }

    .file-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;

      .file-card-icon-wrapper {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        border: 1px solid;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .file-card-icon {
        font-size: 20px;
      }

      .file-card-title {
        font-weight: 600;
        font-size: 14px;
        color: #1f2937;
        line-height: 1.4;
      }
    }

    .file-card-content {
      .file-card-name {
        margin-bottom: 10px;
      }

      .file-card-stats {
        display: flex;
        flex-wrap: nowrap;
        gap: 6px;
        font-size: 12px;
        color: #6b7280;
        white-space: nowrap;

        span {
          background: #f3f4f6;
          padding: 3px 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .required-fields {
          color: #d97706;
          background: #fef3c7;
        }
      }
    }

    .file-card-arrow {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%) translateX(-4px);
      font-size: 16px;
      color: #9ca3af;
      opacity: 0;
      transition: all 0.3s;
    }
  }

  .requirements-tips {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 32px;

    .tip-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 14px;

      &:last-child {
        margin-bottom: 0;
      }

      .tip-icon {
        font-size: 18px;
        margin-top: 2px;
        flex-shrink: 0;

        &.success {
          color: #10b981;
        }

        &.warning {
          color: #f59e0b;
        }

        &.info {
          color: #3b82f6;
        }
      }

      span {
        color: #475569;
        font-size: 14px;
        line-height: 1.6;
      }
    }
  }

  .prepare-actions {
    display: flex;
    justify-content: center;
    gap: 16px;

    .el-button {
      border-radius: 8px;
      font-weight: 500;
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .prepare-tab {
    .requirements-section {
      padding: 16px;
    }

    .file-grid {
      grid-template-columns: 1fr;
    }

    .prepare-actions {
      flex-direction: column;

      .el-button {
        width: 100%;
      }
    }
  }
}
</style>
