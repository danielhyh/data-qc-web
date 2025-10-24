<script lang="tsx">
import { defineComponent, computed, ref } from 'vue'
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
    const showSetting = ref(false)

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
          <div
            class="custom-hover h-full flex items-center px-10px cursor-pointer"
            onClick={() => (showSetting.value = true)}
          >
            <Icon icon="ep:setting" color="var(--top-header-text-color)" />
          </div>
          {screenfull.value ? (
            <Screenfull class="custom-hover" color="var(--top-header-text-color)"></Screenfull>
          ) : undefined}
          {message.value ? (
            <Message class="custom-hover" color="var(--top-header-text-color)"></Message>
          ) : undefined}
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
  border-bottom: 1px solid var(--tech-light-border);
  box-shadow: 0 2px 8px rgba(91, 141, 239, 0.06);
  position: relative;
  z-index: 99;
  
  /* 顶部渐变装饰条 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--tech-gradient-primary);
    opacity: 0.3;
  }
  
  /* 工具项悬停效果 */
  :deep(.custom-hover) {
    transition: var(--tech-transition);
    border-radius: 8px;
    
    &:hover {
      background: var(--tech-hover-bg);
      transform: translateY(-1px);
    }
  }
  
  /* 用户信息区域增强 */
  :deep(.v-user-info) {
    .el-dropdown {
      transition: var(--tech-transition);
      border-radius: 8px;
      padding: 4px 12px;
      
      &:hover {
        background: var(--tech-hover-bg);
      }
    }
  }
}
</style>
