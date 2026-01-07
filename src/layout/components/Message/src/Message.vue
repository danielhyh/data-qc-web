<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import * as NoticeApi from '@/api/system/notice'
import * as NotifyMessageApi from '@/api/system/notify/message'
import { getUnreadFeedbackCount } from '@/api/drug/feedback'
import { useUserStoreWithOut } from '@/store/modules/user'

defineOptions({ name: 'Message' })

const { push } = useRouter()
const userStore = useUserStoreWithOut()
const activeName = ref('notice')
const unreadNoticeCount = ref(0) // 未读公告数量
const unreadMessageCount = ref(0) // 未读站内信数量
const feedbackCount = ref(0) // 未读反馈数量
const noticeList = ref<any[]>([]) // 公告列表
const messageList = ref<any[]>([]) // 站内信列表

// 总未读数量
const unreadCount = computed(() => unreadNoticeCount.value + unreadMessageCount.value)

// 暴露 feedbackCount 给父组件使用
defineExpose({
  feedbackCount
})

// 获得公告列表
const getNoticeList = async () => {
  noticeList.value = await NoticeApi.getMyUnreadList(10)
}

// 获得站内信列表
const getMessageList = async () => {
  try {
    messageList.value = await NotifyMessageApi.getUnreadNotifyMessageList()
  } catch (e) {
    messageList.value = []
  }
}

// 获得未读数量（公告+站内信+反馈）
const getUnreadCount = async () => {
  try {
    // 并行获取公告、站内信和反馈的未读数量
    const [noticeCount, msgCount, fbCount] = await Promise.all([
      NoticeApi.getMyUnreadCount(),
      NotifyMessageApi.getUnreadNotifyMessageCount(),
      getUnreadFeedbackCount()
    ])
    unreadNoticeCount.value = noticeCount || 0
    unreadMessageCount.value = msgCount || 0
    feedbackCount.value = fbCount || 0
  } catch (e) {
    unreadNoticeCount.value = 0
    unreadMessageCount.value = 0
    feedbackCount.value = 0
  }
}

// 点击铃铛时加载数据
const handleClick = () => {
  getNoticeList()
  getMessageList()
}

// 跳转我的公告
const goMyNoticeList = () => {
  push({ name: 'MyNotice' })
}

// 跳转我的站内信
const goMyMessageList = () => {
  push({ name: 'MyNotifyMessage' })
}

// 标记站内信已读
const markMessageRead = async (item: any) => {
  if (!item.readStatus) {
    await NotifyMessageApi.updateNotifyMessageRead([item.id])
    item.readStatus = true
    unreadMessageCount.value = Math.max(0, unreadMessageCount.value - 1)
  }
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
        unreadNoticeCount.value = 0
        unreadMessageCount.value = 0
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
        <div class="notice-trigger" @click="handleClick">
          <ElBadge :value="unreadCount > 0 ? unreadCount : undefined" :max="99" :hidden="unreadCount === 0" class="notice-badge">
            <Icon :size="18" class="cursor-pointer" icon="ep:bell" />
          </ElBadge>
        </div>
      </template>
      <ElTabs v-model="activeName">
        <!-- 站内信 Tab -->
        <ElTabPane name="message">
          <template #label>
            <ElBadge :value="unreadMessageCount > 0 ? unreadMessageCount : undefined" :max="99" :hidden="unreadMessageCount === 0" class="tab-badge">
              站内信
            </ElBadge>
          </template>
          <el-scrollbar class="message-list">
            <template v-for="item in messageList" :key="item.id">
              <div class="message-item" :class="{ 'is-read': item.readStatus }" @click="markMessageRead(item)">
                <div class="message-icon-wrapper">
                  <Icon :size="24" icon="ep:message" :class="item.readStatus ? 'text-gray-400' : 'text-primary'" />
                </div>
                <div class="message-content">
                  <span class="message-title" :class="{ 'text-gray-400': item.readStatus }">
                    {{ item.templateNickname }}
                  </span>
                  <span class="message-desc">
                    {{ item.templateContent?.substring(0, 50) }}{{ item.templateContent?.length > 50 ? '...' : '' }}
                  </span>
                  <span class="message-date">
                    {{ formatDate(item.createTime) }}
                  </span>
                </div>
                <div v-if="!item.readStatus" class="unread-dot"></div>
              </div>
            </template>
            <div v-if="messageList.length === 0" class="message-empty">
              <Icon :size="48" icon="ep:message" class="text-gray-300 mb-10px" />
              <span>暂无未读站内信</span>
            </div>
          </el-scrollbar>
        </ElTabPane>
        <!-- 公告 Tab -->
        <ElTabPane name="notice">
          <template #label>
            <ElBadge :value="unreadNoticeCount > 0 ? unreadNoticeCount : undefined" :max="99" :hidden="unreadNoticeCount === 0" class="tab-badge">
              公告
            </ElBadge>
          </template>
          <el-scrollbar class="message-list">
            <template v-for="item in noticeList" :key="item.id">
              <div class="message-item" @click="goMyNoticeList">
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
            <div v-if="noticeList.length === 0" class="message-empty">
              <Icon :size="48" icon="ep:notification" class="text-gray-300 mb-10px" />
              <span>暂无未读公告</span>
            </div>
          </el-scrollbar>
        </ElTabPane>
      </ElTabs>
      <!-- 更多 -->
      <div style="margin-top: 10px; text-align: right">
        <XButton 
          v-if="activeName === 'message'" 
          preIcon="ep:view" 
          title="查看全部站内信" 
          type="primary" 
          @click="goMyMessageList" 
        />
        <XButton 
          v-else 
          preIcon="ep:view" 
          title="查看全部公告" 
          type="primary" 
          @click="goMyNoticeList" 
        />
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
  
  .tab-badge {
    :deep(.el-badge__content) {
      top: -4px;
      right: -8px;
      height: 12px;
      min-width: 12px;
      padding: 0 2px;
      font-size: 8px;
      line-height: 12px;
      transform: scale(0.9);
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
  color: var(--el-text-color-secondary);
}

.message-list {
  display: flex;
  height: 400px;
  flex-direction: column;

  .message-item {
    display: flex;
    align-items: center;
    padding: 16px 12px;
    border-bottom: 1px solid var(--el-border-color-light);
    cursor: pointer;
    position: relative;
    transition: background-color 0.2s;

    &:last-child {
      border: none;
    }
    
    &:hover {
      background: var(--el-fill-color-light);
    }
    
    &.is-read {
      opacity: 0.7;
    }

    .message-icon {
      width: 40px;
      height: 40px;
      margin: 0 16px 0 4px;
      border-radius: 8px;
    }
    
    .message-icon-wrapper {
      width: 40px;
      height: 40px;
      margin: 0 16px 0 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--el-fill-color-light);
      border-radius: 8px;
    }

    .message-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;

      .message-title {
        margin-bottom: 4px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
      
      .message-desc {
        margin-bottom: 4px;
        font-size: 13px;
        color: var(--el-text-color-regular);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .message-date {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
    
    .unread-dot {
      width: 8px;
      height: 8px;
      background: var(--el-color-danger);
      border-radius: 50%;
      margin-left: 8px;
      flex-shrink: 0;
    }
  }
}
</style>
