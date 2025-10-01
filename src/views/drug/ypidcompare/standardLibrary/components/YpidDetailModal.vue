<!-- src/views/drug/ypid/search/components/YpidDetailModal.vue -->
<template>
  <el-dialog
    v-model="visible"
    title="YPID药品详情"
    width="800px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div v-loading="loading" class="ypid-detail-content">
      <!-- 基本信息 -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <span class="card-title">基本信息</span>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="YPID编码" :span="2">
            <span class="ypid-code">{{ detailData.ypid }}</span>
            <el-tag
              v-if="detailData.status === 1"
              type="success"
              size="small"
              style="margin-left: 8px"
            >
              正常
            </el-tag>
            <el-tag v-else type="info" size="small" style="margin-left: 8px"> 停用 </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="药品通用名">
            {{ detailData.genericNameCn || '-' }}
          </el-descriptions-item>

          <el-descriptions-item label="产品名称">
            {{ detailData.productName || '-' }}
          </el-descriptions-item>

          <el-descriptions-item label="规格">
            {{ detailData.specification || '-' }}
          </el-descriptions-item>

          <el-descriptions-item label="剂型">
            {{ detailData.dosageForm || '-' }}
          </el-descriptions-item>

          <el-descriptions-item label="生产企业" :span="2">
            {{ detailData.manufacturerName || '-' }}
          </el-descriptions-item>

          <el-descriptions-item label="批准文号">
            {{ detailData.approvalNumber || '-' }}
          </el-descriptions-item>

          <el-descriptions-item label="转换系数">
            <span class="highlight">{{ detailData.conversionFactor || '-' }}</span>
          </el-descriptions-item>

          <el-descriptions-item label="药品类别">
            <el-tag :type="getCategoryTag(detailData.drugCategory)" size="small">
              {{ getCategoryLabel(detailData.drugCategory) }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="创建时间">
            {{ formatDate(detailData.createTime) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 匹配历史 -->
      <el-card v-if="matchHistory.length > 0" class="info-card" shadow="never">
        <template #header>
          <span class="card-title">匹配使用历史</span>
        </template>

        <el-table :data="matchHistory" stripe size="small" max-height="300">
          <el-table-column prop="taskNo" label="任务编号" width="150" />
          <el-table-column
            prop="hospitalName"
            label="医院名称"
            min-width="150"
            show-overflow-tooltip
          />
          <el-table-column prop="matchCount" label="匹配数量" width="100" align="center" />
          <el-table-column prop="matchType" label="匹配类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.matchType === 'auto' ? 'success' : 'warning'" size="small">
                {{ row.matchType === 'auto' ? '自动' : '手动' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="matchTime"
            label="匹配时间"
            width="150"
            :formatter="dateFormatter"
          />
        </el-table>
      </el-card>

      <!-- 相关药品 -->
      <el-card v-if="relatedDrugs.length > 0" class="info-card" shadow="never">
        <template #header>
          <span class="card-title">相关药品</span>
        </template>

        <el-table :data="relatedDrugs" stripe size="small" max-height="200">
          <el-table-column prop="ypid" label="YPID" width="120">
            <template #default="{ row }">
              <el-link type="primary" @click="handleViewRelated(row.ypid)">
                {{ row.ypid }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column prop="drugName" label="药品名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="specification" label="规格" width="100" />
          <el-table-column
            prop="manufacturer"
            label="生产企业"
            min-width="150"
            show-overflow-tooltip
          />
        </el-table>
      </el-card>

      <!-- 药品图片 -->
      <el-card v-if="drugImages.length > 0" class="info-card" shadow="never">
        <template #header>
          <span class="card-title">药品图片</span>
        </template>

        <div class="image-gallery">
          <el-image
            v-for="(image, index) in drugImages"
            :key="index"
            :src="image.url"
            :preview-src-list="drugImages.map((img) => img.url)"
            :initial-index="index"
            fit="cover"
            class="drug-image"
          >
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </div>
      </el-card>

      <!-- 备注信息 -->
      <el-card v-if="detailData.remarks" class="info-card" shadow="never">
        <template #header>
          <span class="card-title">备注信息</span>
        </template>

        <div class="remarks-content">
          {{ detailData.remarks }}
        </div>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
        <el-button type="primary" @click="handleCopyYpid">
          <el-icon><CopyDocument /></el-icon>
          复制YPID
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, CopyDocument } from '@element-plus/icons-vue'
import { formatDate, dateFormatter } from '@/utils/formatTime'
import { YpidApi, type YpidDrugVO } from '@/api/drug/ypid'

defineOptions({ name: 'YpidDetailModal' })

// ========================= 类型定义 =========================

interface MatchHistory {
  taskNo: string
  hospitalName: string
  matchCount: number
  matchType: string
  matchTime: string
}

interface DrugImage {
  url: string
  title: string
}

// ========================= 属性定义 =========================

interface Props {
  modelValue: boolean
  ypid?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:ypid': [value: string]
}>()

// ========================= 响应式数据 =========================

const visible = ref(false)
const loading = ref(false)
const detailData = ref<YpidDrugVO>({} as YpidDrugVO)
const matchHistory = ref<MatchHistory[]>([])
const relatedDrugs = ref<YpidDrugVO[]>([])
const drugImages = ref<DrugImage[]>([])

// ========================= 监听器 =========================

watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal
    if (newVal && props.ypid) {
      loadDetail()
    }
  }
)

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// ========================= 方法 =========================

const loadDetail = async () => {
  if (!props.ypid) return

  loading.value = true
  try {
    // 加载药品详情
    detailData.value = await YpidApi.getYpidDetail(props.ypid)

    // 模拟加载匹配历史
    matchHistory.value = [
      {
        taskNo: 'DRUG_20240529_000001',
        hospitalName: '北京协和医院',
        matchCount: 15,
        matchType: 'auto',
        matchTime: '2024-05-29 10:30:00'
      },
      {
        taskNo: 'DRUG_20240528_000003',
        hospitalName: '上海瑞金医院',
        matchCount: 8,
        matchType: 'manual',
        matchTime: '2024-05-28 14:20:00'
      }
    ]

    // 模拟加载相关药品
    relatedDrugs.value = []

    // 模拟加载药品图片
    drugImages.value = []
  } catch (error) {
    console.error('加载YPID详情失败:', error)
    ElMessage.error('加载详情失败')
  } finally {
    loading.value = false
  }
}

const handleClosed = () => {
  detailData.value = {} as YpidDrugVO
  matchHistory.value = []
  relatedDrugs.value = []
  drugImages.value = []
}

const handleViewRelated = (ypid: string) => {
  // 查看相关药品
  visible.value = false
  setTimeout(() => {
    emit('update:ypid', ypid)
    visible.value = true
  }, 300)
}

const handleCopyYpid = async () => {
  try {
    await navigator.clipboard.writeText(detailData.value.ypid)
    ElMessage.success('YPID已复制到剪贴板')
  } catch (error) {
    // 降级处理
    const textarea = document.createElement('textarea')
    textarea.value = detailData.value.ypid
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('YPID已复制到剪贴板')
  }
}

// ========================= 工具方法 =========================

const getCategoryLabel = (category: string) => {
  const categoryMap = {
    western: '西药',
    chinese: '中成药',
    herbal: '中药饮片',
    biological: '生物制品'
  }
  return categoryMap[category] || category
}

const getCategoryTag = (category: string) => {
  const tagMap = {
    western: 'primary',
    chinese: 'success',
    herbal: 'warning',
    biological: 'danger'
  }
  return tagMap[category] || 'info'
}
</script>

<style scoped>
.ypid-detail-content {
  max-height: 600px;
  overflow-y: auto;
  padding: 0 10px;
}

.info-card {
  margin-bottom: 16px;
  border-radius: 8px;
}

.info-card:last-child {
  margin-bottom: 0;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.ypid-code {
  font-family: monospace;
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.highlight {
  color: #f56c6c;
  font-weight: 600;
  font-size: 16px;
}

.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.drug-image {
  width: 100%;
  height: 150px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  color: #c0c4cc;
}

.image-error .el-icon {
  font-size: 40px;
}

.remarks-content {
  line-height: 1.6;
  color: #606266;
  white-space: pre-wrap;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 滚动条样式 */
.ypid-detail-content::-webkit-scrollbar {
  width: 6px;
}

.ypid-detail-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.ypid-detail-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.ypid-detail-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
