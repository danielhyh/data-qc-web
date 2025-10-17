<template>
  <!-- 使用基于角色的新仪表板 -->
  <RoleBasedDashboard />
</template>

<script setup lang="ts">
import RoleBasedDashboard from './components/RoleBasedDashboard.vue'

defineOptions({ name: 'HomeIndex' })
</script>

<style scoped>


/* Responsive design */
@media (width <= 1200px) {
  .content-section {
    margin-top: 0;
  }

  .content-section .el-col-lg-16,
  .content-section .el-col-lg-8 {
    margin-bottom: 20px;
  }
}

@media (width <= 768px) {
  .dashboard-container {
    padding: 10px;
  }

  .stats-section .el-col {
    margin-bottom: 12px;
  }

  .card-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .action-item {
    padding: 12px;
  }

  .action-icon {
    width: 40px;
    height: 40px;
  }
}

/* 响应式调整 */
@media (width <= 768px) {
  :deep(.stat-card .stat-bottom) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  :deep(.stat-card .stat-footer) {
    text-align: left;
  }
}

/* 响应式调整 */
@media (width <= 768px) {
  :deep(.stat-card .stat-main) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  :deep(.stat-card .stat-value) {
    font-size: 24px;
  }

  :deep(.stat-card .stat-extra-info) {
    width: 100%;
    max-width: none;
    text-align: left;
  }
}

@media (width <= 480px) {
  :deep(.stat-card) {
    padding: 16px;
  }

  :deep(.stat-card .stat-value) {
    font-size: 22px;
  }

  :deep(.stat-card .stat-main) {
    gap: 8px;
  }
}

.dashboard-container {
  min-height: calc(100vh - 50px);
  padding: 20px;
  background-color: #f5f5f5;
}

.stats-section {
  margin-bottom: 20px;
}

.content-section {
  margin-top: 20px;
}

.content-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgb(0 0 0 / 8%);
}

.content-card:last-child {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-icon {
  font-size: 18px;
  color: #409eff;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-title .el-icon {
  font-size: 20px;
  color: #409eff;
}

/* Chart styles */
.chart-card {
  margin-top: 20px;
}

.chart-container {
  padding: 20px 0;
}

/* Quick actions */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-item {
  display: flex;
  padding: 16px;
  cursor: pointer;
  background-color: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s ease;
  align-items: center;
  gap: 12px;
}

.action-item:hover {
  background-color: #e9ecef;
  transform: translateX(4px);
}

.action-icon {
  display: flex;
  width: 48px;
  height: 48px;
  color: white;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-content {
  flex: 1;
}

.action-title {
  margin-bottom: 4px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.action-desc {
  font-size: 13px;
  color: #909399;
}

.action-arrow {
  font-size: 16px;
  color: #c0c4cc;
}

/* Alerts */
.alert-badge {
  margin-left: 8px;
}

.alerts-container {
  max-height: 300px;
  overflow-y: auto;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-item {
  display: flex;
  padding: 12px;
  cursor: pointer;
  background-color: #f8f9fa;
  border-radius: 6px;
  transition: all 0.2s ease;
  align-items: flex-start;
  gap: 12px;
}

.alert-item:hover {
  background-color: #e9ecef;
}

.alert-item.unread {
  background-color: #ecf5ff;
}

.alert-item.unread:hover {
  background-color: #d9ecff;
}

.alert-icon {
  margin-top: 2px;
  font-size: 20px;
}

.alert-content {
  flex: 1;
}

.alert-title {
  margin-bottom: 4px;
  font-size: 14px;
  line-height: 1.4;
  color: #303133;
}

.alert-time {
  font-size: 12px;
  color: #909399;
}

/* Data distribution */
.data-distribution {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.distribution-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.distribution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.distribution-label {
  color: #606266;
}

.distribution-value {
  font-weight: 600;
  color: #303133;
}
:deep(.el-card__header) {
  padding: 16px 20px;
  background-color: #fafafa;  /* 浅灰色背景 */
  border-bottom: 1px solid #ebeef5;
}
/* Table styles */
:deep(.el-table) {
  overflow: hidden;
  border-radius: 8px;
}

:deep(.el-table th) {
  font-weight: 600;
  color: #606266;
  background-color: #fafafa;
}

:deep(.el-progress) {
  line-height: 1;
}

:deep(.el-progress__text) {
  font-size: 12px !important;
}

/* Loading states */
:deep(.el-loading-mask) {
  background-color: rgb(255 255 255 / 80%);
}

/* Empty state */
:deep(.el-empty) {
  padding: 20px 0;
}

:deep(.el-empty__description) {
  margin-top: 8px;
}
</style>
