<template>
  <!-- TODO @芋艿：可优化，对标 vben 版本 -->
  <div class="flex">
    <el-card class="user w-1/3" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>{{ t('profile.user.title') }}</span>
        </div>
      </template>
      <ProfileUser ref="profileUserRef" />
    </el-card>
    <el-card class="user ml-3 w-2/3" shadow="hover">
      <div>
        <el-tabs v-model="activeName" type="card" class="profile-tabs" style="height: 400px">
          <!-- 基本信息 Tab -->
          <el-tab-pane name="basicInfo">
            <template #label>
              <span class="tab-label">
                <Icon icon="ep:user" class="tab-icon" />
                <span>{{ t('profile.info.basicInfo') }}</span>
              </span>
            </template>
            <BasicInfo @success="handleBasicInfoSuccess" />
          </el-tab-pane>
          
          <!-- 修改密码 Tab -->
          <el-tab-pane name="resetPwd">
            <template #label>
              <span class="tab-label">
                <Icon icon="ep:lock" class="tab-icon" />
                <span>{{ t('profile.info.resetPwd') }}</span>
              </span>
            </template>
            <ResetPwd />
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>
  </div>
</template>
<script lang="ts" setup>
import { BasicInfo, ProfileUser, ResetPwd } from './components'

const { t } = useI18n()
defineOptions({ name: 'Profile' })
const activeName = ref('basicInfo')
const profileUserRef = ref()

// 处理基本信息更新成功
const handleBasicInfoSuccess = async () => {
  await profileUserRef.value?.refresh()
}
</script>
<style scoped lang="scss">
.user {
  max-height: 960px;
  padding: 15px 20px 20px;
}

.card-header {
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.el-card .el-card__header) {
  padding: 15px !important;
}

:deep(.el-card .el-card__body) {
  padding: 15px !important;
}

/* Tab 标签美化 */
.profile-tabs {
  /* Tab 标签项优化 */
  .tab-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    
    .tab-icon {
      font-size: 16px;
      transition: all 0.3s ease;
    }
  }
  
  /* Tab 内容区域 */
  :deep(.el-tabs__content) {
    padding: 24px;
    font-weight: 500;
    color: var(--tech-text-secondary);
  }
  
  /* 激活状态图标动画 */
  :deep(.el-tabs__item.is-active) {
    .tab-icon {
      color: #5B8DEF;
      transform: scale(1.1);
      filter: drop-shadow(0 2px 4px rgba(91, 141, 239, 0.3));
    }
  }
  
  /* 悬停状态图标动画 */
  :deep(.el-tabs__item:hover:not(.is-active)) {
    .tab-icon {
      transform: translateY(-1px);
    }
  }
}

:deep(.el-tabs--left .el-tabs__content) {
  height: 100%;
}
</style>
