<template>
  <el-dialog
    v-model="dialogVisible"
    title="保存为模板"
    width="50%"
    :before-close="handleClose"
    destroy-on-close
    class="save-template-dialog"
  >
    <div class="template-container">
      <!-- 模板基本信息 -->
      <div class="template-basic-info">
        <div class="section-header">
          <Icon icon="ep:collection-tag" class="header-icon" />
          <span class="header-title">模板基本信息</span>
        </div>

        <el-form
          :model="templateForm"
          :rules="templateRules"
          ref="templateFormRef"
          label-width="100px"
        >
          <el-form-item label="模板名称" prop="name">
            <el-input
              v-model="templateForm.name"
              placeholder="请输入模板名称"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="模板分类" prop="category">
            <el-select v-model="templateForm.category" placeholder="请选择分类">
              <el-option label="药品质控" value="drug_qc" />
              <el-option label="数据验证" value="data_validation" />
              <el-option label="业务规则" value="business_rule" />
              <el-option label="统计分析" value="statistics" />
              <el-option label="自定义" value="custom" />
            </el-select>
          </el-form-item>

          <el-form-item label="模板描述" prop="description">
            <el-input
              v-model="templateForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入模板描述，说明模板的用途和使用场景"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="标签">
            <div class="tags-input">
              <el-tag
                v-for="tag in templateForm.tags"
                :key="tag"
                closable
                @close="removeTag(tag)"
                class="tag-item"
              >
                {{ tag }}
              </el-tag>
              <el-input
                v-if="tagInputVisible"
                ref="tagInputRef"
                v-model="tagInputValue"
                size="small"
                @keyup.enter="addTag"
                @blur="addTag"
                class="tag-input"
              />
              <el-button v-else size="small" text @click="showTagInput" class="add-tag-btn">
                <Icon icon="ep:plus" class="mr-5px" />
                添加标签
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 模板内容预览 -->
      <div class="template-content-preview">
        <div class="section-header">
          <Icon icon="ep:view" class="header-icon" />
          <span class="header-title">模板内容预览</span>
        </div>

        <div class="preview-content">
          <el-tabs v-model="activePreviewTab" type="border-card">
            <!-- 表达式预览 -->
            <el-tab-pane label="表达式" name="expression">
              <div class="expression-preview">
                <div class="expression-text">
                  <span class="preview-label">表达式：</span>
                  <code class="expression-code">{{ expressionText }}</code>
                </div>

                <div
                  v-if="expression.components && expression.components.length > 0"
                  class="components-summary"
                >
                  <div class="summary-header">组件统计：</div>
                  <div class="summary-stats">
                    <el-tag
                      v-for="(count, type) in componentStats"
                      :key="type"
                      size="small"
                      :type="getComponentStatsType(type)"
                      class="stats-tag"
                    >
                      {{ getComponentTypeName(type) }}: {{ count }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <!-- JSON结构 -->
            <el-tab-pane label="JSON结构" name="json">
              <div class="json-preview">
                <div class="json-header">
                  <span>JSON结构：</span>
                  <el-button size="small" text @click="copyJSON">
                    <Icon icon="ep:document-copy" class="mr-5px" />
                    复制JSON
                  </el-button>
                </div>
                <div class="json-content">
                  <pre><code>{{ formattedJSON }}</code></pre>
                </div>
              </div>
            </el-tab-pane>

            <!-- 使用示例 -->
            <el-tab-pane label="使用示例" name="example">
              <div class="usage-example">
                <div class="example-header">
                  <span>使用示例：</span>
                </div>
                <div class="example-content">
                  <div class="example-scenario">
                    <div class="scenario-title">适用场景：</div>
                    <div class="scenario-desc">{{ generateScenarioDescription() }}</div>
                  </div>

                  <div class="example-code">
                    <div class="code-title">代码示例：</div>
                    <pre><code>{{ generateCodeExample() }}</code></pre>
                  </div>

                  <div class="example-result">
                    <div class="result-title">预期结果：</div>
                    <div class="result-desc">{{ generateResultDescription() }}</div>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 模板配置选项 -->
      <div class="template-options">
        <div class="section-header">
          <Icon icon="ep:setting" class="header-icon" />
          <span class="header-title">模板配置</span>
        </div>

        <div class="options-content">
          <el-form :model="templateOptions" label-width="120px">
            <el-form-item label="可见性">
              <el-radio-group v-model="templateOptions.visibility">
                <el-radio label="private">私有模板</el-radio>
                <el-radio label="team">团队共享</el-radio>
                <el-radio label="public">公开模板</el-radio>
              </el-radio-group>
              <div class="option-help">
                <el-text size="small" type="info">
                  私有模板仅自己可见，团队模板团队成员可见，公开模板所有人可见
                </el-text>
              </div>
            </el-form-item>

            <el-form-item label="版本控制">
              <el-switch v-model="templateOptions.versionControl" />
              <div class="option-help">
                <el-text size="small" type="info"> 启用版本控制可以追踪模板的修改历史 </el-text>
              </div>
            </el-form-item>

            <el-form-item label="允许修改">
              <el-switch v-model="templateOptions.allowModification" />
              <div class="option-help">
                <el-text size="small" type="info"> 其他用户是否可以基于此模板创建新版本 </el-text>
              </div>
            </el-form-item>

            <el-form-item label="自动更新">
              <el-switch v-model="templateOptions.autoUpdate" />
              <div class="option-help">
                <el-text size="small" type="info"> 当引用的函数或操作符更新时自动更新模板 </el-text>
              </div>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 相似模板检查 -->
      <div v-if="similarTemplates.length > 0" class="similar-templates">
        <div class="section-header">
          <Icon icon="ep:warning" class="header-icon warning" />
          <span class="header-title">发现相似模板</span>
        </div>

        <div class="similar-content">
          <el-alert
            title="检测到相似的模板"
            type="warning"
            description="系统发现了与当前模板相似的已有模板，请确认是否继续保存"
            :closable="false"
            show-icon
          />

          <div class="similar-list">
            <div v-for="template in similarTemplates" :key="template.id" class="similar-item">
              <div class="similar-header">
                <div class="template-info">
                  <span class="template-name">{{ template.name }}</span>
                  <el-tag size="small" :type="getCategoryType(template.category)">
                    {{ getCategoryName(template.category) }}
                  </el-tag>
                  <span class="similarity-score">相似度: {{ template.similarity }}%</span>
                </div>
                <div class="template-actions">
                  <el-button size="small" text @click="viewSimilarTemplate(template)">
                    <Icon icon="ep:view" />
                    查看
                  </el-button>
                  <el-button size="small" text @click="useSimilarTemplate(template)">
                    <Icon icon="ep:select" />
                    使用此模板
                  </el-button>
                </div>
              </div>
              <div class="similar-desc">{{ template.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-checkbox v-model="saveToLibrary"> 保存到模板库 </el-checkbox>
        </div>
        <div class="footer-right">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="handleSave" :loading="saving">
            <Icon icon="ep:check" class="mr-5px" />
            保存模板
          </el-button>
        </div>
      </div>
    </template>

    <!-- 模板详情查看对话框 -->
    <TemplateDetailDialog v-model="showTemplateDetail" :template="selectedTemplate" />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import TemplateDetailDialog from './TemplateDetailDialog.vue'

interface Props {
  modelValue: boolean
  expression: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', templateInfo: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 对话框状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 表单引用
const templateFormRef = ref()
const tagInputRef = ref()

// 模板表单
const templateForm = reactive({
  name: '',
  category: '',
  description: '',
  tags: []
})

// 表单验证规则
const templateRules = {
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  category: [{ required: true, message: '请选择模板分类', trigger: 'change' }],
  description: [
    { required: true, message: '请输入模板描述', trigger: 'blur' },
    { min: 5, max: 200, message: '长度在 5 到 200 个字符', trigger: 'blur' }
  ]
}

// 模板配置选项
const templateOptions = reactive({
  visibility: 'private',
  versionControl: true,
  allowModification: true,
  autoUpdate: false
})

// 标签相关
const tagInputVisible = ref(false)
const tagInputValue = ref('')

// 预览相关
const activePreviewTab = ref('expression')

// 保存状态
const saving = ref(false)
const saveToLibrary = ref(true)

// 相似模板
const similarTemplates = ref([])
const showTemplateDetail = ref(false)
const selectedTemplate = ref(null)

// 计算属性
const expressionText = computed(() => {
  return props.expression?.text || '空表达式'
})

const componentStats = computed(() => {
  if (!props.expression?.components) return {}

  const stats: Record<string, number> = {}
  props.expression.components.forEach((comp: any) => {
    stats[comp.type] = (stats[comp.type] || 0) + 1
  })

  return stats
})

const formattedJSON = computed(() => {
  return JSON.stringify(props.expression, null, 2)
})

// 监听对话框打开
watch(dialogVisible, (visible) => {
  if (visible) {
    generateDefaultTemplateInfo()
    checkSimilarTemplates()
  }
})

// 生成默认模板信息
const generateDefaultTemplateInfo = () => {
  if (props.expression?.components) {
    // 根据表达式内容生成默认名称
    const hasFunction = props.expression.components.some((comp: any) => comp.type === 'function')
    const hasField = props.expression.components.some((comp: any) => comp.type === 'field')

    if (hasFunction && hasField) {
      templateForm.name = '字段函数验证模板'
      templateForm.category = 'data_validation'
    } else if (hasFunction) {
      templateForm.name = '函数计算模板'
      templateForm.category = 'statistics'
    } else if (hasField) {
      templateForm.name = '字段检查模板'
      templateForm.category = 'drug_qc'
    } else {
      templateForm.name = '自定义表达式模板'
      templateForm.category = 'custom'
    }

    templateForm.description = `基于 ${expressionText.value} 的质控规则模板`
    templateForm.tags = extractDefaultTags()
  }
}

// 提取默认标签
const extractDefaultTags = () => {
  const tags: string[] = []

  if (props.expression?.components) {
    props.expression.components.forEach((comp: any) => {
      if (comp.type === 'function') {
        tags.push(comp.value)
      } else if (comp.type === 'field' && comp.fieldName) {
        if (comp.fieldName.includes('drug')) tags.push('药品')
        if (comp.fieldName.includes('amount')) tags.push('金额')
        if (comp.fieldName.includes('time')) tags.push('时间')
      }
    })
  }

  return [...new Set(tags)].slice(0, 5) // 去重并限制数量
}

// 检查相似模板
const checkSimilarTemplates = async () => {
  // 模拟检查相似模板
  setTimeout(() => {
    similarTemplates.value = [
      {
        id: 1,
        name: '药品金额验证模板',
        category: 'drug_qc',
        description: '验证药品金额字段的有效性',
        similarity: 85,
        expression: 'drug_amount > 0 AND drug_amount < 10000'
      },
      {
        id: 2,
        name: '字段非空检查模板',
        category: 'data_validation',
        description: '检查关键字段是否为空',
        similarity: 72,
        expression: 'drug_name IS NOT NULL AND manufacturer IS NOT NULL'
      }
    ]
  }, 500)
}

// 标签操作
const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const addTag = () => {
  const tag = tagInputValue.value.trim()
  if (tag && !templateForm.tags.includes(tag)) {
    templateForm.tags.push(tag)
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}

const removeTag = (tag: string) => {
  const index = templateForm.tags.indexOf(tag)
  if (index > -1) {
    templateForm.tags.splice(index, 1)
  }
}

// 工具方法
const getComponentStatsType = (type: string) => {
  const types: Record<string, string> = {
    field: 'primary',
    function: 'warning',
    operator: 'success',
    constant: 'info',
    group: 'danger'
  }
  return types[type] || ''
}

const getComponentTypeName = (type: string) => {
  const names: Record<string, string> = {
    field: '字段',
    function: '函数',
    operator: '操作符',
    constant: '常量',
    group: '分组'
  }
  return names[type] || type
}

const getCategoryType = (category: string) => {
  const types: Record<string, string> = {
    drug_qc: 'primary',
    data_validation: 'success',
    business_rule: 'warning',
    statistics: 'info',
    custom: ''
  }
  return types[category] || ''
}

const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    drug_qc: '药品质控',
    data_validation: '数据验证',
    business_rule: '业务规则',
    statistics: '统计分析',
    custom: '自定义'
  }
  return names[category] || category
}

const generateScenarioDescription = () => {
  if (!props.expression?.components) return '通用表达式模板'

  const hasFunction = props.expression.components.some((comp: any) => comp.type === 'function')
  const hasField = props.expression.components.some((comp: any) => comp.type === 'field')

  if (hasFunction && hasField) {
    return '适用于需要对数据字段进行函数计算和验证的场景，如统计分析、数据质量检查等。'
  } else if (hasFunction) {
    return '适用于需要进行复杂计算和逻辑判断的场景，如业务规则验证、数据分析等。'
  } else if (hasField) {
    return '适用于对数据字段进行直接比较和验证的场景，如字段完整性检查、数据格式验证等。'
  }

  return '通用表达式模板，可用于各种数据验证和业务规则场景。'
}

const generateCodeExample = () => {
  // 使用字符串拼接而不是模板字符串中的变量，避免 Vite 解析动态导入路径
  const categoryPath = '${templateForm.category}'
  const templateName = '${templateForm.name}'

  return `
// 1. 引入模板
import template from 'qc-templates/${categoryPath}/${templateName}'

// 2. 创建规则实例
const rule = new QcRule({
  template: template,
  name: '${templateName}规则',
  checkDimension: 'RECORD'
})

// 3. 执行规则检查
const result = await rule.execute(data)
if (!result.isValid) {
  console.log('验证失败:', result.errors)
}
  `.trim()
}

const generateResultDescription = () => {
  return '执行成功时返回验证通过的结果，失败时返回详细的错误信息和建议修复方案。'
}

// 操作方法
const copyJSON = async () => {
  try {
    await navigator.clipboard.writeText(formattedJSON.value)
    ElMessage.success('JSON已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const viewSimilarTemplate = (template: any) => {
  selectedTemplate.value = template
  showTemplateDetail.value = true
}

const useSimilarTemplate = (template: any) => {
  templateForm.name = template.name + ' (副本)'
  templateForm.category = template.category
  templateForm.description = template.description + ' - 基于已有模板创建'

  ElMessage.success('已应用相似模板信息')
}

// 事件处理
const handleClose = () => {
  dialogVisible.value = false
}

const handleSave = async () => {
  try {
    // 表单验证
    const valid = await templateFormRef.value.validate()
    if (!valid) return

    saving.value = true

    const templateInfo = {
      name: templateForm.name,
      category: templateForm.category,
      description: templateForm.description,
      tags: templateForm.tags,
      expression: props.expression,
      options: templateOptions,
      saveToLibrary: saveToLibrary.value,
      createdAt: new Date().toISOString()
    }

    // 模拟保存
    await new Promise((resolve) => setTimeout(resolve, 1000))

    emit('confirm', templateInfo)
    ElMessage.success('模板保存成功')
    handleClose()
  } catch (error: any) {
    ElMessage.error('保存失败: ' + error.message)
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.save-template-dialog {
  .template-container {
    max-height: 70vh;
    overflow-y: auto;

    .template-basic-info,
    .template-content-preview,
    .template-options,
    .similar-templates {
      margin-bottom: 20px;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      overflow: hidden;
    }

    .section-header {
      padding: 12px 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #e4e7ed;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;

      .header-icon {
        color: #409eff;

        &.warning {
          color: #e6a23c;
        }
      }

      .header-title {
        flex: 1;
      }
    }

    .template-basic-info {
      .tags-input {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;

        .tag-item {
          margin: 0;
        }

        .tag-input {
          width: 100px;
        }

        .add-tag-btn {
          border: 1px dashed #d9d9d9;
          height: 24px;
        }
      }

      :deep(.el-form) {
        padding: 16px;
      }
    }

    .template-content-preview {
      .preview-content {
        padding: 16px;

        .expression-preview {
          .expression-text {
            margin-bottom: 16px;

            .preview-label {
              font-weight: 500;
              color: #606266;
            }

            .expression-code {
              display: block;
              background: #f5f5f5;
              padding: 8px 12px;
              border-radius: 4px;
              font-family: 'Fira Code', Consolas, monospace;
              margin-top: 4px;
            }
          }

          .components-summary {
            .summary-header {
              font-weight: 500;
              color: #606266;
              margin-bottom: 8px;
            }

            .summary-stats {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;

              .stats-tag {
                margin: 0;
              }
            }
          }
        }

        .json-preview {
          .json-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-weight: 500;
          }

          .json-content {
            background: #2d3748;
            color: #e2e8f0;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;

            pre code {
              font-family: 'Fira Code', Consolas, monospace;
              line-height: 1.4;
            }
          }
        }

        .usage-example {
          .example-header {
            margin-bottom: 16px;
            font-weight: 500;
          }

          .example-content {
            .example-scenario,
            .example-code,
            .example-result {
              margin-bottom: 16px;

              .scenario-title,
              .code-title,
              .result-title {
                font-weight: 500;
                color: #606266;
                margin-bottom: 8px;
              }

              .scenario-desc,
              .result-desc {
                color: #303133;
                line-height: 1.5;
              }

              pre code {
                background: #f5f5f5;
                padding: 12px;
                border-radius: 4px;
                display: block;
                font-family: 'Fira Code', Consolas, monospace;
                line-height: 1.4;
                overflow-x: auto;
              }
            }
          }
        }
      }
    }

    .template-options {
      .options-content {
        padding: 16px;

        .option-help {
          margin-top: 4px;
        }
      }
    }

    .similar-templates {
      .similar-content {
        padding: 16px;

        .similar-list {
          margin-top: 16px;

          .similar-item {
            padding: 12px;
            border: 1px solid #e4e7ed;
            border-radius: 6px;
            margin-bottom: 12px;

            .similar-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 6px;

              .template-info {
                display: flex;
                align-items: center;
                gap: 8px;

                .template-name {
                  font-weight: 500;
                }

                .similarity-score {
                  font-size: 12px;
                  color: #e6a23c;
                  font-weight: 500;
                }
              }

              .template-actions {
                display: flex;
                gap: 4px;
              }
            }

            .similar-desc {
              font-size: 13px;
              color: #606266;
            }
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .footer-left {
      flex: 1;
    }

    .footer-right {
      display: flex;
      gap: 12px;
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .save-template-dialog {
    .template-container {
      .template-content-preview {
        .preview-content {
          .json-preview .json-content {
            font-size: 12px;
          }

          .usage-example .example-content pre code {
            font-size: 12px;
          }
        }
      }

      .similar-templates {
        .similar-content .similar-list .similar-item .similar-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
      }
    }

    .dialog-footer {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;

      .footer-left,
      .footer-right {
        justify-content: center;
      }
    }
  }
}
</style>
