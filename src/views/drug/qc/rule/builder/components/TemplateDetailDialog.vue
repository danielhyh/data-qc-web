<template>
  <el-dialog
    v-model="dialogVisible"
    title="模板详情"
    width="70%"
    :before-close="handleClose"
    destroy-on-close
    class="template-detail-dialog"
  >
    <div v-if="template" class="template-container">
      <!-- 模板基本信息 -->
      <div class="template-header">
        <div class="header-left">
          <div class="template-title">
            <Icon :icon="getTemplateIcon(template.category)" class="template-icon" />
            <h3>{{ template.name }}</h3>
            <el-tag :type="getCategoryType(template.category)" size="small">
              {{ getCategoryName(template.category) }}
            </el-tag>
          </div>
          <div class="template-meta">
            <span class="meta-item">
              <Icon icon="ep:user" class="meta-icon" />
              {{ template.author || '系统模板' }}
            </span>
            <span class="meta-item">
              <Icon icon="ep:calendar" class="meta-icon" />
              {{ formatDate(template.createdAt) }}
            </span>
            <span class="meta-item">
              <Icon icon="ep:view" class="meta-icon" />
              使用次数: {{ template.usageCount || 0 }}
            </span>
          </div>
        </div>
        <div class="header-right">
          <el-button-group>
            <el-button @click="useTemplate">
              <Icon icon="ep:select" class="mr-5px" />
              使用模板
            </el-button>
            <el-button @click="copyTemplate">
              <Icon icon="ep:document-copy" class="mr-5px" />
              复制
            </el-button>
            <el-button @click="downloadTemplate">
              <Icon icon="ep:download" class="mr-5px" />
              下载
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 模板描述和标签 -->
      <div class="template-info">
        <div class="template-description">
          <div class="desc-header">
            <Icon icon="ep:document" class="desc-icon" />
            <span>模板描述</span>
          </div>
          <div class="desc-content">{{ template.description }}</div>
        </div>

        <div v-if="template.tags && template.tags.length > 0" class="template-tags">
          <div class="tags-header">
            <Icon icon="ep:collection-tag" class="tags-icon" />
            <span>标签</span>
          </div>
          <div class="tags-content">
            <el-tag v-for="tag in template.tags" :key="tag" size="small" class="tag-item">
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 模板内容详情 -->
      <div class="template-content">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 表达式详情 -->
          <el-tab-pane label="表达式详情" name="expression">
            <div class="expression-detail">
              <div class="expression-overview">
                <div class="overview-header">
                  <span>表达式概览</span>
                  <el-button size="small" text @click="copyExpression">
                    <Icon icon="ep:document-copy" class="mr-5px" />
                    复制表达式
                  </el-button>
                </div>
                <div class="expression-text">
                  <code>{{ getExpressionText() }}</code>
                </div>
              </div>

              <div class="expression-components">
                <div class="components-header">
                  <span>组件分析</span>
                </div>
                <div class="components-stats">
                  <el-row :gutter="16">
                    <el-col :span="6" v-for="(count, type) in componentStats" :key="type">
                      <div class="stat-card">
                        <div class="stat-icon">
                          <Icon :icon="getComponentIcon(type)" />
                        </div>
                        <div class="stat-content">
                          <div class="stat-number">{{ count }}</div>
                          <div class="stat-label">{{ getComponentTypeName(type) }}</div>
                        </div>
                      </div>
                    </el-col>
                  </el-row>
                </div>
              </div>

              <div class="expression-visualization">
                <div class="viz-header">
                  <span>可视化结构</span>
                </div>
                <div class="viz-content">
                  <ExpressionTree :components="template.expression?.components || []" />
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 使用示例 -->
          <el-tab-pane label="使用示例" name="usage">
            <div class="usage-examples">
              <div class="example-scenario">
                <div class="scenario-header">
                  <Icon icon="ep:lightbulb" class="scenario-icon" />
                  <span>适用场景</span>
                </div>
                <div class="scenario-content">
                  {{ generateScenarioDescription() }}
                </div>
              </div>

              <div class="example-code">
                <div class="code-header">
                  <span>代码示例</span>
                  <el-button size="small" text @click="copyCode">
                    <Icon icon="ep:document-copy" class="mr-5px" />
                    复制代码
                  </el-button>
                </div>
                <div class="code-content">
                  <pre><code>{{ generateCodeExample() }}</code></pre>
                </div>
              </div>

              <div class="example-parameters">
                <div class="params-header">
                  <span>参数说明</span>
                </div>
                <div class="params-content">
                  <el-table :data="getParameterList()" border stripe>
                    <el-table-column prop="name" label="参数名" width="120" />
                    <el-table-column prop="type" label="类型" width="100">
                      <template #default="{ row }">
                        <el-tag size="small" :type="getTypeColor(row.type)">
                          {{ row.type }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="required" label="必填" width="80">
                      <template #default="{ row }">
                        <el-tag size="small" :type="row.required ? 'danger' : 'info'">
                          {{ row.required ? '是' : '否' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="description" label="说明" show-overflow-tooltip />
                    <el-table-column prop="example" label="示例" width="120" />
                  </el-table>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 版本历史 -->
          <el-tab-pane label="版本历史" name="versions">
            <div class="version-history">
              <div class="history-header">
                <span>版本历史</span>
                <el-button size="small" @click="loadVersionHistory">
                  <Icon icon="ep:refresh" class="mr-5px" />
                  刷新
                </el-button>
              </div>

              <div class="history-timeline">
                <el-timeline>
                  <el-timeline-item
                    v-for="version in versionHistory"
                    :key="version.id"
                    :timestamp="formatDate(version.createdAt)"
                    placement="top"
                  >
                    <div class="version-item">
                      <div class="version-header">
                        <span class="version-number">v{{ version.version }}</span>
                        <el-tag size="small" :type="version.isCurrent ? 'success' : 'info'">
                          {{ version.isCurrent ? '当前版本' : '历史版本' }}
                        </el-tag>
                        <span class="version-author">by {{ version.author }}</span>
                      </div>
                      <div class="version-description">{{ version.description }}</div>
                      <div class="version-changes">
                        <div v-for="change in version.changes" :key="change.id" class="change-item">
                          <el-tag
                            size="small"
                            :type="getChangeType(change.type)"
                            class="change-tag"
                          >
                            {{ getChangeTypeName(change.type) }}
                          </el-tag>
                          <span class="change-desc">{{ change.description }}</span>
                        </div>
                      </div>
                      <div class="version-actions">
                        <el-button
                          v-if="!version.isCurrent"
                          size="small"
                          text
                          @click="revertToVersion(version)"
                        >
                          恢复此版本
                        </el-button>
                        <el-button size="small" text @click="compareVersion(version)">
                          对比差异
                        </el-button>
                      </div>
                    </div>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </div>
          </el-tab-pane>

          <!-- 评论反馈 -->
          <el-tab-pane label="评论反馈" name="feedback">
            <div class="template-feedback">
              <div class="feedback-stats">
                <div class="stats-header">
                  <span>评价统计</span>
                </div>
                <div class="stats-content">
                  <el-row :gutter="16">
                    <el-col :span="8">
                      <div class="rating-summary">
                        <div class="rating-score">{{ template.rating || 0 }}</div>
                        <el-rate
                          :model-value="template.rating || 0"
                          disabled
                          show-score
                          text-color="#ff9900"
                        />
                        <div class="rating-count">{{ template.reviewCount || 0 }} 人评价</div>
                      </div>
                    </el-col>
                    <el-col :span="16">
                      <div class="rating-breakdown">
                        <div
                          v-for="(count, star) in ratingBreakdown"
                          :key="star"
                          class="rating-bar"
                        >
                          <span class="star-label">{{ star }}星</span>
                          <el-progress
                            :percentage="getRatingPercentage(count)"
                            :show-text="false"
                            class="rating-progress"
                          />
                          <span class="rating-count">{{ count }}</span>
                        </div>
                      </div>
                    </el-col>
                  </el-row>
                </div>
              </div>

              <div class="feedback-form">
                <div class="form-header">
                  <span>发表评论</span>
                </div>
                <el-form :model="feedbackForm" label-width="80px">
                  <el-form-item label="评分">
                    <el-rate v-model="feedbackForm.rating" />
                  </el-form-item>
                  <el-form-item label="评论">
                    <el-input
                      v-model="feedbackForm.comment"
                      type="textarea"
                      :rows="3"
                      placeholder="请输入你的使用体验和建议..."
                      maxlength="500"
                      show-word-limit
                    />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="submitFeedback" :loading="submitting">
                      提交评论
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>

              <div class="feedback-list">
                <div class="list-header">
                  <span>用户评论</span>
                </div>
                <div class="comments-list">
                  <div v-for="comment in comments" :key="comment.id" class="comment-item">
                    <div class="comment-header">
                      <div class="user-info">
                        <el-avatar v-if="comment.userAvatar" :size="32" :src="comment.userAvatar" />
                        <div v-else class="comment-text-avatar" :style="{ background: getAvatarBgColor(comment.userName) }">
                          {{ getAvatarText(comment.userName) }}
                        </div>
                        <div class="user-details">
                          <div class="user-name">{{ comment.userName }}</div>
                          <div class="comment-time">{{ formatDate(comment.createdAt) }}</div>
                        </div>
                      </div>
                      <el-rate :model-value="comment.rating" disabled size="small" />
                    </div>
                    <div class="comment-content">{{ comment.content }}</div>
                    <div class="comment-actions">
                      <el-button size="small" text @click="likeComment(comment)">
                        <Icon icon="ep:thumb" class="mr-5px" />
                        {{ comment.likes || 0 }}
                      </el-button>
                      <el-button size="small" text @click="replyComment(comment)">
                        <Icon icon="ep:chat-round" class="mr-5px" />
                        回复
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-button @click="addToFavorites">
            <Icon icon="ep:star" class="mr-5px" />
            收藏模板
          </el-button>
          <el-button @click="shareTemplate">
            <Icon icon="ep:share" class="mr-5px" />
            分享
          </el-button>
        </div>
        <div class="footer-right">
          <el-button @click="handleClose">关闭</el-button>
          <el-button type="primary" @click="useTemplate">
            <Icon icon="ep:check" class="mr-5px" />
            使用此模板
          </el-button>
        </div>
      </div>
    </template>

    <!-- 版本对比对话框 -->
    <VersionCompareDialog
      v-model="showVersionCompare"
      :template="template"
      :version="selectedVersion"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import ExpressionTree from './ExpressionTree.vue'
import VersionCompareDialog from './VersionCompareDialog.vue'

interface Props {
  modelValue: boolean
  template: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'use', template: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 对话框状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 数据状态
const activeTab = ref('expression')
const versionHistory = ref([])
const comments = ref([])
const ratingBreakdown = ref({ 5: 15, 4: 10, 3: 5, 2: 2, 1: 1 })
const showVersionCompare = ref(false)
const selectedVersion = ref(null)
const submitting = ref(false)

// 反馈表单
const feedbackForm = reactive({
  rating: 5,
  comment: ''
})

// 计算属性
const componentStats = computed(() => {
  if (!props.template?.expression?.components) return {}

  const stats: Record<string, number> = {}
  props.template.expression.components.forEach((comp: any) => {
    stats[comp.type] = (stats[comp.type] || 0) + 1
  })

  return stats
})

// 工具方法
const getTemplateIcon = (category: string) => {
  const icons: Record<string, string> = {
    drug_qc: 'ep:pills',
    data_validation: 'ep:shield',
    business_rule: 'ep:briefcase',
    statistics: 'ep:data-analysis',
    custom: 'ep:setting'
  }
  return icons[category] || 'ep:document'
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

const getComponentIcon = (type: string) => {
  const icons: Record<string, string> = {
    field: 'ep:key',
    function: 'ep:cpu',
    operator: 'ep:sort',
    constant: 'ep:price-tag',
    group: 'ep:collection'
  }
  return icons[type] || 'ep:document'
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

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    string: '',
    number: 'success',
    boolean: 'warning',
    date: 'info'
  }
  return colors[type] || ''
}

const getChangeType = (type: string) => {
  const types: Record<string, string> = {
    add: 'success',
    modify: 'warning',
    delete: 'danger',
    fix: 'info'
  }
  return types[type] || ''
}

const getChangeTypeName = (type: string) => {
  const names: Record<string, string> = {
    add: '新增',
    modify: '修改',
    delete: '删除',
    fix: '修复'
  }
  return names[type] || type
}

const formatDate = (date: string | Date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 头像辅助函数
const getAvatarText = (name: string) => {
  return (name || '').charAt(0) || '用'
}

const getAvatarBgColor = (name: string) => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  ]
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const getExpressionText = () => {
  if (!props.template?.expression?.text) return '无表达式内容'
  return props.template.expression.text
}

const generateScenarioDescription = () => {
  if (!props.template) return ''

  const scenarios: Record<string, string> = {
    drug_qc: '适用于药品数据质量控制场景，如药品信息完整性检查、价格合理性验证等。',
    data_validation: '适用于数据验证场景，如字段格式检查、必填项验证、数据一致性校验等。',
    business_rule: '适用于业务规则验证场景，如业务流程控制、权限检查、业务逻辑校验等。',
    statistics: '适用于统计分析场景，如数据汇总、趋势分析、异常检测等。'
  }

  return scenarios[props.template.category] || '通用数据处理场景'
}

const generateCodeExample = () => {
  return `
// 导入模板
import { useQcTemplate } from '@/composables/useQcTemplate'

// 使用模板
const { createRule } = useQcTemplate()

const rule = createRule({
  template: '${props.template?.name}',
  name: '${props.template?.name}规则',
  checkDimension: 'RECORD',
  // 自定义参数
  params: {
    tableName: 'drug_list',
    threshold: 100
  }
})

// 执行规则
const result = await rule.execute(data)
console.log('验证结果:', result)
  `.trim()
}

const getParameterList = () => {
  // 模拟参数列表
  return [
    {
      name: 'tableName',
      type: 'string',
      required: true,
      description: '目标数据表名',
      example: 'drug_list'
    },
    {
      name: 'threshold',
      type: 'number',
      required: false,
      description: '阈值参数',
      example: '100'
    },
    {
      name: 'enabled',
      type: 'boolean',
      required: false,
      description: '是否启用',
      example: 'true'
    }
  ]
}

const getRatingPercentage = (count: number) => {
  const total = Object.values(ratingBreakdown.value).reduce((sum, val) => sum + val, 0)
  return total > 0 ? (count / total) * 100 : 0
}

// 操作方法
const loadVersionHistory = async () => {
  // 模拟加载版本历史
  versionHistory.value = [
    {
      id: 1,
      version: '1.2.0',
      description: '优化表达式性能，增加新的验证规则',
      author: '张三',
      createdAt: new Date(),
      isCurrent: true,
      changes: [
        { id: 1, type: 'modify', description: '优化函数执行性能' },
        { id: 2, type: 'add', description: '增加新的空值检查函数' }
      ]
    },
    {
      id: 2,
      version: '1.1.0',
      description: '修复已知问题，增加错误处理',
      author: '李四',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      isCurrent: false,
      changes: [
        { id: 3, type: 'fix', description: '修复空值处理异常' },
        { id: 4, type: 'add', description: '增加详细错误信息' }
      ]
    }
  ]

  // 模拟加载评论
  comments.value = [
    {
      id: 1,
      userName: '王五',
      userAvatar: '',
      rating: 5,
      content: '这个模板非常实用，帮我节省了很多开发时间！',
      createdAt: new Date(),
      likes: 12
    },
    {
      id: 2,
      userName: '赵六',
      userAvatar: '',
      rating: 4,
      content: '整体不错，但希望能增加更多的配置选项。',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      likes: 5
    }
  ]
}

const copyExpression = async () => {
  try {
    await navigator.clipboard.writeText(getExpressionText())
    ElMessage.success('表达式已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(generateCodeExample())
    ElMessage.success('代码已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const useTemplate = () => {
  emit('use', props.template)
  ElMessage.success('已应用模板')
  handleClose()
}

const copyTemplate = () => {
  ElMessage.success('模板已复制，可在模板管理中查看')
}

const downloadTemplate = () => {
  const data = JSON.stringify(props.template, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.template?.name || 'template'}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('模板已下载')
}

const addToFavorites = () => {
  ElMessage.success('已添加到收藏夹')
}

const shareTemplate = () => {
  ElMessage.info('分享功能开发中...')
}

const revertToVersion = (version: any) => {
  ElMessage.success(`已恢复到版本 v${version.version}`)
}

const compareVersion = (version: any) => {
  selectedVersion.value = version
  showVersionCompare.value = true
}

const submitFeedback = async () => {
  if (!feedbackForm.comment.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  try {
    submitting.value = true

    // 模拟提交
    await new Promise((resolve) => setTimeout(resolve, 1000))

    ElMessage.success('评论提交成功')

    // 重置表单
    feedbackForm.rating = 5
    feedbackForm.comment = ''

    // 重新加载评论
    loadVersionHistory()
  } catch (error) {
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

const likeComment = (comment: any) => {
  comment.likes = (comment.likes || 0) + 1
  ElMessage.success('点赞成功')
}

const replyComment = (comment: any) => {
  ElMessage.info('回复功能开发中...')
}

// 事件处理
const handleClose = () => {
  dialogVisible.value = false
}

// 初始化数据
if (props.template) {
  loadVersionHistory()
}
</script>

<style lang="scss" scoped>
.template-detail-dialog {
  .template-container {
    max-height: 70vh;
    overflow-y: auto;

    .template-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 16px;
      border-bottom: 1px solid #e4e7ed;
      margin-bottom: 20px;

      .header-left {
        flex: 1;

        .template-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;

          .template-icon {
            font-size: 24px;
            color: #409eff;
          }

          h3 {
            margin: 0;
            color: #303133;
          }
        }

        .template-meta {
          display: flex;
          gap: 16px;
          color: #606266;
          font-size: 13px;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;

            .meta-icon {
              font-size: 12px;
            }
          }
        }
      }

      .header-right {
        flex-shrink: 0;
      }
    }

    .template-info {
      margin-bottom: 20px;

      .template-description {
        margin-bottom: 16px;

        .desc-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          font-weight: 500;

          .desc-icon {
            color: #409eff;
          }
        }

        .desc-content {
          color: #606266;
          line-height: 1.6;
        }
      }

      .template-tags {
        .tags-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          font-weight: 500;

          .tags-icon {
            color: #409eff;
          }
        }

        .tags-content {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;

          .tag-item {
            margin: 0;
          }
        }
      }
    }

    .template-content {
      .expression-detail {
        .expression-overview {
          margin-bottom: 20px;

          .overview-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-weight: 500;
          }

          .expression-text {
            background: #f5f5f5;
            padding: 12px;
            border-radius: 6px;
            font-family: 'Fira Code', Consolas, monospace;
            overflow-x: auto;
          }
        }

        .expression-components {
          margin-bottom: 20px;

          .components-header {
            margin-bottom: 12px;
            font-weight: 500;
          }

          .components-stats {
            .stat-card {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 16px;
              background: #f8f9fa;
              border-radius: 8px;
              border: 1px solid #e4e7ed;

              .stat-icon {
                font-size: 24px;
                color: #409eff;
              }

              .stat-content {
                .stat-number {
                  font-size: 20px;
                  font-weight: 600;
                  color: #303133;
                }

                .stat-label {
                  font-size: 12px;
                  color: #909399;
                }
              }
            }
          }
        }

        .expression-visualization {
          .viz-header {
            margin-bottom: 12px;
            font-weight: 500;
          }

          .viz-content {
            border: 1px solid #e4e7ed;
            border-radius: 6px;
            padding: 16px;
            min-height: 200px;
            background: #fafafa;
          }
        }
      }

      .usage-examples {
        .example-scenario,
        .example-code,
        .example-parameters {
          margin-bottom: 20px;

          .scenario-header,
          .code-header,
          .params-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
            font-weight: 500;

            .scenario-icon {
              color: #409eff;
              margin-right: 6px;
            }
          }

          .scenario-content {
            color: #606266;
            line-height: 1.6;
          }

          .code-content {
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

          .params-content {
            border: 1px solid #e4e7ed;
            border-radius: 6px;
            overflow: hidden;
          }
        }
      }

      .version-history {
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          font-weight: 500;
        }

        .history-timeline {
          .version-item {
            .version-header {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 8px;

              .version-number {
                font-weight: 600;
                color: #409eff;
              }

              .version-author {
                font-size: 12px;
                color: #909399;
              }
            }

            .version-description {
              color: #606266;
              margin-bottom: 8px;
            }

            .version-changes {
              margin-bottom: 8px;

              .change-item {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;
                font-size: 13px;

                .change-tag {
                  margin: 0;
                }
              }
            }

            .version-actions {
              display: flex;
              gap: 8px;
            }
          }
        }
      }

      .template-feedback {
        .feedback-stats {
          margin-bottom: 20px;

          .stats-header {
            margin-bottom: 12px;
            font-weight: 500;
          }

          .stats-content {
            .rating-summary {
              text-align: center;

              .rating-score {
                font-size: 36px;
                font-weight: 600;
                color: #ff9900;
                margin-bottom: 8px;
              }

              .rating-count {
                font-size: 12px;
                color: #909399;
                margin-top: 4px;
              }
            }

            .rating-breakdown {
              .rating-bar {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 6px;

                .star-label {
                  width: 40px;
                  font-size: 12px;
                }

                .rating-progress {
                  flex: 1;
                }

                .rating-count {
                  width: 30px;
                  text-align: right;
                  font-size: 12px;
                  color: #909399;
                }
              }
            }
          }
        }

        .feedback-form {
          margin-bottom: 20px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;

          .form-header {
            margin-bottom: 12px;
            font-weight: 500;
          }
        }

        .feedback-list {
          .list-header {
            margin-bottom: 12px;
            font-weight: 500;
          }

          .comments-list {
            .comment-item {
              padding: 16px;
              border: 1px solid #e4e7ed;
              border-radius: 8px;
              margin-bottom: 12px;

              .comment-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;

                .user-info {
                  display: flex;
                  align-items: center;
                  gap: 8px;

                  .comment-text-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    font-size: 14px;
                    font-weight: 600;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                    flex-shrink: 0;
                  }

                  .user-details {
                    .user-name {
                      font-weight: 500;
                      font-size: 14px;
                    }

                    .comment-time {
                      font-size: 12px;
                      color: #909399;
                    }
                  }
                }
              }

              .comment-content {
                color: #606266;
                line-height: 1.6;
                margin-bottom: 8px;
              }

              .comment-actions {
                display: flex;
                gap: 16px;
              }
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
      display: flex;
      gap: 8px;
    }

    .footer-right {
      display: flex;
      gap: 12px;
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .template-detail-dialog {
    .template-container {
      .template-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .template-info .template-meta {
        flex-direction: column;
        gap: 8px;
      }

      .expression-components .components-stats .el-row .el-col {
        margin-bottom: 12px;
      }

      .feedback-stats .stats-content .el-row .el-col {
        margin-bottom: 16px;
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
