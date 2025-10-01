<template>
  <el-alert
    v-if="isTimeRestricted"
    :type="isInReportTime ? 'success' : 'warning'"
    show-icon
    :closable="closable"
  >
    <template #title>
      <div class="time-alert-content">
        <span v-if="isInReportTime"> 剩余填报时间: {{ remainingTime }} </span>
        <span v-else>
          {{ timeConfigDisplay }}
        </span>
      </div>
    </template>
  </el-alert>
</template>

<script setup lang="ts">
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'TimeAlert' })

const props = defineProps({
  isTimeRestricted: propTypes.bool.def(false),
  isInReportTime: propTypes.bool.def(false),
  remainingTime: propTypes.string.def(''),
  timeConfigDisplay: propTypes.string.def('加载中...'),
  closable: propTypes.bool.def(true)
})
</script>

<style scoped>
.time-alert-content {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.alert-title {
  font-weight: 600;
  margin-right: 12px;
  padding-right: 12px;
  border-right: 1px solid currentColor;
  opacity: 0.6;
}

.el-alert {
  margin-bottom: 10px;
}

.el-alert--warning.is-light {
  border: 1px solid #e6a23c;
  background-color: #fdf6ec;
}

.el-alert--success.is-light {
  border: 1px solid #67c23a;
  background-color: #f0f9ff;
}

/* 关闭按钮悬停效果 */
.el-alert :deep(.el-alert__close-btn) {
  transition: all 0.3s;
}

.el-alert :deep(.el-alert__close-btn:hover) {
  color: #409eff;
}
</style>
