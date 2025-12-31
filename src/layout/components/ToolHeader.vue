<script lang="tsx">
import { defineComponent, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@/layout/components//Message'
import { Collapse } from '@/layout/components/Collapse'
import { UserInfo } from '@/layout/components/UserInfo'
import { Screenfull } from '@/layout/components/Screenfull'
import { Breadcrumb } from '@/layout/components/Breadcrumb'
import RouterSearch from '@/components/RouterSearch/index.vue'
import Setting from '@/layout/components/Setting/src/Setting.vue'
import { Icon } from '@/components/Icon'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import { useUserStoreWithOut } from '@/store/modules/user'
import { ElBadge, ElTooltip } from 'element-plus'

const { getPrefixCls, variables } = useDesign()

const prefixCls = getPrefixCls('tool-header')

const appStore = useAppStore()

// 面包屑
const breadcrumb = computed(() => appStore.getBreadcrumb)

// 折叠图标
const hamburger = computed(() => appStore.getHamburger)

// 全屏图标
const screenfull = computed(() => appStore.getScreenfull)

// 搜索图片
const search = computed(() => appStore.search)

// 布局
const layout = computed(() => appStore.getLayout)

// 消息图标
const message = computed(() => appStore.getMessage)

export default defineComponent({
  name: 'ToolHeader',
  setup() {
    // 设置抽屉显示状态
    const router = useRouter()
    const userStore = useUserStoreWithOut()
    const showSetting = ref(false)
    
    // Message 组件引用
    const messageRef = ref<InstanceType<typeof Message> | null>(null)
    
    // 从 Message 组件获取反馈数量
    const feedbackCount = computed(() => messageRef.value?.feedbackCount || 0)
    
    // 判断是否为管理员
    const isAdmin = computed(() => {
      const roles = userStore.getRoles || []
      return roles.some(role => ['super_admin', 'provincial_admin'].includes(role))
    })

    return () => (
      <div
        id={`${variables.namespace}-tool-header`}
        class={[
          prefixCls,
          'h-[var(--top-tool-height)] relative px-[var(--top-tool-p-x)] flex items-center justify-between',
          'dark:bg-[var(--el-bg-color)]'
        ]}
      >
        {layout.value !== 'top' ? (
          <div class="h-full flex items-center">
            {hamburger.value && layout.value !== 'cutMenu' ? (
              <Collapse class="custom-hover" color="var(--top-header-text-color)"></Collapse>
            ) : undefined}
            {breadcrumb.value ? <Breadcrumb class="lt-md:hidden"></Breadcrumb> : undefined}
          </div>
        ) : undefined}
        <div class="h-full flex items-center">
          {search.value ? <RouterSearch isModal={false} /> : undefined}
          <ElTooltip content="系统设置" placement="bottom">
            <div
              class="custom-hover h-full flex items-center px-10px cursor-pointer"
              onClick={() => (showSetting.value = true)}
            >
              <Icon icon="ep:setting" color="var(--top-header-text-color)" />
            </div>
          </ElTooltip>
          {screenfull.value ? (
            <Screenfull class="custom-hover" color="var(--top-header-text-color)"></Screenfull>
          ) : undefined}
          {message.value ? (
            <Message ref={messageRef} class="custom-hover" color="var(--top-header-text-color)"></Message>
          ) : undefined}
          <ElTooltip content="问题反馈" placement="bottom">
            <div
              class="custom-hover h-full flex items-center px-10px cursor-pointer"
              onClick={() => router.push(isAdmin.value ? '/system/feedback' : '/user/feedback')}
            >
              <ElBadge 
                value={feedbackCount.value > 0 ? feedbackCount.value : undefined}
                max={99}
                hidden={feedbackCount.value === 0}
                class="feedback-badge"
              >
                <Icon icon="ep:chat-dot-round" color="var(--top-header-text-color)" />
              </ElBadge>
            </div>
          </ElTooltip>
          <UserInfo></UserInfo>
          <Setting v-model={showSetting.value} />
        </div>
      </div>
    )
  }
})
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-tool-header;

.#{$prefix-cls} {
  transition: left var(--transition-time-02);
  background: transparent;
  position: relative;
  z-index: 99;
  
  /* 工具项悬停效果 */
  :deep(.custom-hover) {
    transition: var(--tech-transition);
    border-radius: 8px;
    
    &:hover {
      background: var(--tech-hover-bg);
    }
  }
  
  /* 反馈徽标样式 */
  .feedback-badge {
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
</style>
