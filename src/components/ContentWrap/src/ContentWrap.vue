<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'ContentWrap' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('content-wrap')

defineProps({
  title: propTypes.string.def(''),
  message: propTypes.string.def(''),
  bodyStyle: propTypes.object.def({ padding: '20px' }),
  // 新增属性
  headerIcon: propTypes.string.def(''), // 标题图标
  headerIconColor: propTypes.string.def('#409EFF'), // 图标颜色
  headerBackground: propTypes.bool.def(true), // 是否显示标题背景
  shadow: propTypes.string.def('never') // 卡片阴影
})
</script>

<template>
  <ElCard :body-style="bodyStyle" :class="[prefixCls, 'mb-20px']" :shadow="shadow">
    <template v-if="title" #header>
      <div class="header-wrapper" :class="{ 'with-background': headerBackground }">
        <div class="flex items-center">
          <!-- 标题图标 -->
          <Icon
            v-if="headerIcon"
            :icon="headerIcon"
            :size="20"
            class="header-icon mr-8px"
            :style="{ color: headerIconColor }"
          />
          <span class="text-16px font-700">{{ title }}</span>
          <ElTooltip v-if="message" effect="dark" placement="right">
            <template #content>
              <div class="max-w-200px">{{ message }}</div>
            </template>
            <Icon :size="14" class="ml-5px" icon="ep:question-filled" />
          </ElTooltip>
          <div class="flex flex-grow pl-20px">
            <slot name="header"></slot>
          </div>
        </div>
      </div>
    </template>
    <slot></slot>
  </ElCard>
</template>

<!--
<style lang="scss" scoped>
.v-content-wrap {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
}

.v-content-wrap:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

/* 覆盖 Element Plus Card 的默认样式 */
:deep(.el-card) {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: none;
  transition: all 0.3s ease;
}

:deep(.el-card:hover) {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

:deep(.el-card__header) {
  padding: 0;
  border-bottom: 1px solid color-mix(in srgb, var(&#45;&#45;el-color-primary) 10%, #ebeef5);
}

/* 标题区域样式 */
.header-wrapper {
  padding: 12px 16px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* 带背景色的标题 - 使用主题渐变 */
.header-wrapper.with-background {
  /* 降级方案：纯色半透明背景 */
  background-color: rgba(91, 141, 239, 0.05);

  /* 现代浏览器：主题色渐变 */
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(&#45;&#45;el-color-primary) 5%, transparent) 0%,
    color-mix(in srgb, var(&#45;&#45;el-color-primary) 8%, transparent) 50%,
    color-mix(in srgb, var(&#45;&#45;el-color-primary) 5%, transparent) 100%
  );

  /* 顶部装饰线 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(&#45;&#45;el-color-primary) 50%,
      transparent 100%
    );
    opacity: 0.3;
  }

  /* 标题文字增强对比度 */
  span {
    color: var(&#45;&#45;el-text-color-primary);
    position: relative;
    z-index: 1;
  }
}

/* 标题图标样式 */
.header-icon {
  transition: transform 0.3s ease;
}

.v-content-wrap:hover .header-icon {
  transform: scale(1.1);
}

:deep(.el-card__body) {
  background: #ffffff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-wrapper {
    padding: 10px 12px;
  }

  .header-icon {
    display: none;
  }

  :deep(.el-card) {
    border-radius: var(&#45;&#45;border-radius-base);
  }
}
</style>
-->
