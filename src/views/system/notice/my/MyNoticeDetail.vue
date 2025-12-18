<template>
  <Dialog v-model="dialogVisible" :title="detailData.title || '公告详情'" width="900">
    <div v-loading="loading">
      <el-descriptions :column="2" border class="mb-20px">
        <el-descriptions-item label="公告类型">
          <dict-tag :type="DICT_TYPE.SYSTEM_NOTICE_TYPE" :value="detailData.type" />
        </el-descriptions-item>
        <el-descriptions-item label="发布时间">
          {{ formatDate(detailData.publishTime) }}
        </el-descriptions-item>
      </el-descriptions>
      <!-- 富文本内容 -->
      <div class="notice-content" v-html="detailData.content"></div>
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as NoticeApi from '@/api/system/notice'

defineOptions({ name: 'MyNoticeDetail' })

const emit = defineEmits(['read'])

const dialogVisible = ref(false)
const loading = ref(false)
const detailData = ref<any>({})

/** 打开弹窗 */
const open = async (row: any) => {
  dialogVisible.value = true
  loading.value = true
  try {
    // 获取详情并标记已读
    detailData.value = await NoticeApi.getMyNoticeDetail(row.id)
    // 通知父组件刷新列表
    emit('read')
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<style lang="scss" scoped>
.notice-content {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
  line-height: 1.8;

  :deep(img) {
    max-width: 100%;
    height: auto;
  }

  :deep(video) {
    max-width: 100%;
  }

  :deep(a) {
    color: #409eff;
    text-decoration: underline;
  }
}
</style>
