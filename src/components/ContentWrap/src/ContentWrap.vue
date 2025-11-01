<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { useDesign } from '@/hooks/web/useDesign'
import { ref } from 'vue'

defineOptions({ name: 'ContentWrap' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('content-wrap')

const props = defineProps({
  title: propTypes.string.def(''),
  message: propTypes.string.def(''),
  bodyStyle: propTypes.object.def({ padding: '20px' }),
  // 新增属性
  headerIcon: propTypes.string.def(''), // 标题图标
  headerIconColor: propTypes.string.def('#409EFF'), // 图标颜色
  headerBackground: propTypes.bool.def(true), // 是否显示标题背景
  shadow: propTypes.string.def('hover') as any, // 卡片阴影: 'hover' | 'always' | 'never'
  // 折叠功能
  collapsible: propTypes.bool.def(false), // 是否可折叠
  defaultCollapsed: propTypes.bool.def(false) // 默认是否折叠
})

// 折叠状态
const collapsed = ref(props.defaultCollapsed)

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <ElCard :class="[prefixCls, 'mb-20px', 'content-wrap-card']" :shadow="shadow">
    <template v-if="title" #header>
      <div 
        class="header-wrapper" 
        :class="{ 
          'with-background': headerBackground,
          'clickable': collapsible 
        }"
        @click="collapsible ? toggleCollapse() : undefined"
      >
        <div class="flex items-start justify-between header-bar">
          <div class="flex items-center flex-1 header-left">
            <!-- 标题图标 -->
            <Icon
              v-if="headerIcon"
              :icon="headerIcon"
              :size="20"
              class="header-icon mr-8px"
              :style="{ color: headerIconColor }"
            />
            <span class="text-16px font-700 header-title">{{ title }}</span>
            <ElTooltip v-if="message" effect="dark" placement="right">
              <template #content>
                <div class="max-w-200px">{{ message }}</div>
              </template>
              <Icon :size="14" class="ml-5px" icon="ep:question-filled" />
            </ElTooltip>
            <div class="flex flex-1 justify-end items-center gap-12px pl-20px header-extra">
              <slot name="header"></slot>
            </div>
          </div>
          
          <!-- 折叠按钮 -->
          <Icon
            v-if="collapsible"
            :icon="collapsed ? 'ep:arrow-down' : 'ep:arrow-up'"
            :size="16"
            class="collapse-icon ml-12px"
          />
        </div>
      </div>
    </template>
    
    <!-- 可折叠内容 -->
    <template v-if="collapsible">
      <ElCollapseTransition>
        <div v-show="!collapsed" :style="bodyStyle">
          <slot></slot>
        </div>
      </ElCollapseTransition>
    </template>
    
    <!-- 普通内容 -->
    <template v-else>
      <div :style="bodyStyle">
        <slot></slot>
      </div>
    </template>
  </ElCard>
</template>

<style lang="scss" scoped>
/* ContentWrap 卡片容器样式 */
.content-wrap-card {
  background: #ffffff !important;
  border: 1px solid rgba(91, 141, 239, 0.1) !important;
  box-shadow: 0 2px 12px rgba(91, 141, 239, 0.08), 
              0 0 1px rgba(91, 141, 239, 0.1) !important;
  overflow: hidden;
  position: relative;
  
  /* 顶部渐变装饰条 - 柔和配色 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      rgba(91, 141, 239, 0.3) 0%,
      rgba(124, 58, 237, 0.25) 50%,
      rgba(91, 141, 239, 0.3) 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 10;
  }
  
  &:hover {
    box-shadow: 0 6px 20px rgba(91, 141, 239, 0.12), 
                0 0 1px rgba(91, 141, 239, 0.15) !important;
    border-color: rgba(91, 141, 239, 0.15) !important;
    
    &::before {
      opacity: 1;
    }
  }
}

/* 卡片头部样式重置 */
:deep(.el-card__header) {
  padding: 0 !important;
  border-bottom: none !important;
  background: transparent !important;
}

/* 标题区域样式 */
.header-wrapper {
  padding: 16px 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  /* 可点击状态 */
  &.clickable {
    cursor: pointer;
    user-select: none;
    
    &:active {
      transform: scale(0.995);
    }
  }
}

.header-bar {
  gap: 12px;
}

.header-left {
  min-height: 32px;
}

.header-title {
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1.2;
}

.header-extra {
  min-height: 32px;
  flex-wrap: wrap;
}

/* 带背景色的标题 - 高级渐变效果 */
.header-wrapper.with-background {
  /* 双层渐变背景 - 更丰富的视觉效果 */
  background: linear-gradient(
    135deg,
    rgba(91, 141, 239, 0.08) 0%,
    rgba(124, 58, 237, 0.06) 50%,
    rgba(91, 141, 239, 0.08) 100%
  );
  
  /* 顶部光晕效果 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(255, 255, 255, 0.1) 30%,
      transparent 100%
    );
    pointer-events: none;
    z-index: 1;
  }
  
  /* 底部装饰线 - 渐变色 */
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 20px;
    right: 20px;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(91, 141, 239, 0.4) 20%,
      rgba(124, 58, 237, 0.4) 50%,
      rgba(91, 141, 239, 0.4) 80%,
      transparent 100%
    );
    z-index: 2;
  }
  
  /* 标题文字增强 */
  span {
    color: var(--el-text-color-primary);
    position: relative;
    z-index: 2;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  }
}

/* 标题图标样式 */
.header-icon {
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 2px 4px rgba(91, 141, 239, 0.3));
}

/* 折叠按钮样式 */
.collapse-icon {
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
  color: var(--el-text-color-secondary);
}

/* 卡片内容区域 */
:deep(.el-card__body) {
  background: #ffffff;
  padding: 0 !important;
}

/* 折叠过渡动画优化 */
:deep(.el-collapse-transition) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-wrapper {
    padding: 12px 16px;
  }

  .header-icon {
    display: none;
  }

  .content-wrap-card {
    border-radius: var(--border-radius-base) !important;
  }
}

/* 暗黑模式适配 */
html.dark {
  .content-wrap-card {
    background: var(--el-bg-color) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    
    &::before {
      background: linear-gradient(
        90deg,
        #5B8DEF 0%,
        #7c3aed 50%,
        #5B8DEF 100%
      );
    }
  }
  
  .header-wrapper.with-background {
    background: linear-gradient(
      135deg,
      rgba(91, 141, 239, 0.15) 0%,
      rgba(124, 58, 237, 0.12) 50%,
      rgba(91, 141, 239, 0.15) 100%
    );
    
    &::before {
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.1) 0%,
        rgba(255, 255, 255, 0.03) 30%,
        transparent 100%
      );
    }
    
    span {
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }
  }
  
  :deep(.el-card__body) {
    background: var(--el-bg-color);
  }
}
</style>
