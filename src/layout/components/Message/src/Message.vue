<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import * as NoticeApi from '@/api/system/notice'
import { getUnreadFeedbackCount } from '@/api/drug/feedback'
import { useUserStoreWithOut } from '@/store/modules/user'

defineOptions({ name: 'Message' })

const { push } = useRouter()
const userStore = useUserStoreWithOut()
const activeName = ref('notice')
const unreadCount = ref(0) // 未读公告数量
const feedbackCount = ref(0) // 未读反馈数量
const list = ref<any[]>([]) // 消息列表

// 暴露 feedbackCount 给父组件使用
defineExpose({
  feedbackCount
})

// 获得消息列表
const getList = async () => {
  list.value = await NoticeApi.getMyUnreadList(10)
  // 强制设置 unreadCount 为 0，避免小红点因为轮询太慢，不消除
  unreadCount.value = 0
}

// 获得未读数量（公告+反馈）
const getUnreadCount = async () => {
  // 并行获取公告和反馈的未读数量
  const [noticeCount, fbCount] = await Promise.all([
    NoticeApi.getMyUnreadCount(),
    getUnreadFeedbackCount()
  ])
  unreadCount.value = noticeCount || 0
  feedbackCount.value = fbCount || 0
}

// 跳转我的公告
const goMyList = () => {
  push({
    name: 'MyNotice'
  })
}

// ========== 初始化 =========
onMounted(() => {
  // 首次加载小红点
  getUnreadCount()
  // 轮询刷新小红点
  setInterval(
    () => {
      if (userStore.getIsSetUser) {
        getUnreadCount()
      } else {
        unreadCount.value = 0
        feedbackCount.value = 0
      }
    },
    1000 * 60 * 2
  )
})
</script>
<template>
  <div class="message">
    <ElPopover :width="400" placement="bottom" trigger="click">
      <template #reference>
        <div class="notice-trigger" @click="getList">
          <ElBadge :value="unreadCount > 0 ? unreadCount : undefined" :max="99" :hidden="unreadCount === 0" class="notice-badge">
            <Icon :size="18" class="cursor-pointer" icon="ep:bell" />
          </ElBadge>
        </div>
      </template>
      <ElTabs v-model="activeName">
        <ElTabPane label="我的公告" name="notice">
          <el-scrollbar class="message-list">
            <template v-for="item in list" :key="item.id">
              <div class="message-item" @click="goMyList">
                <img alt="" class="message-icon" src="@/assets/imgs/logo.png" />
                <div class="message-content">
                  <span class="message-title">
                    {{ item.title }}
                  </span>
                  <span class="message-date">
                    {{ formatDate(item.publishTime) }}
                  </span>
                </div>
              </div>
            </template>
            <div v-if="list.length === 0" class="message-empty">
              <span>暂无未读公告</span>
            </div>
          </el-scrollbar>
        </ElTabPane>
      </ElTabs>
      <!-- 更多 -->
      <div style="margin-top: 10px; text-align: right">
        <XButton preIcon="ep:view" title="查看全部" type="primary" @click="goMyList" />
      </div>
    </ElPopover>
  </div>
</template>
<style lang="scss" scoped>
.message {
  .notice-badge {
    :deep(.el-badge__content) {
      top: 0px;
      right: 8px;
      height: 16px;
      min-width: 16px;
      padding: 0 4px;
      font-size: 10px;
      line-height: 16px;
    }
  }
}

.message-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 260px;
  line-height: 45px;
}

.message-list {
  display: flex;
  height: 400px;
  flex-direction: column;

  .message-item {
    display: flex;
    align-items: center;
    padding: 20px 0;
    border-bottom: 1px solid var(--el-border-color-light);
    cursor: pointer;

    &:last-child {
      border: none;
    }
    
    &:hover {
      background: var(--el-fill-color-light);
    }

    .message-icon {
      width: 40px;
      height: 40px;
      margin: 0 20px 0 5px;
    }

    .message-content {
      display: flex;
      flex-direction: column;

      .message-title {
        margin-bottom: 5px;
      }

      .message-date {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}
</style>
