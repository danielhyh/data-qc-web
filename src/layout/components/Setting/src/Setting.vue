<script lang="ts" setup>
// import { ElMessage } from 'element-plus'
// import { useClipboard } from '@vueuse/core'

import { CACHE_KEY, useCache } from '@/hooks/web/useCache'

import { useAppStore } from '@/store/modules/app'
import { ThemeSwitch } from '@/layout/components/ThemeSwitch'
import InterfaceDisplay from './components/InterfaceDisplay.vue'
import LayoutRadioPicker from './components/LayoutRadioPicker.vue'
import ThemePresetPicker from './components/ThemePresetPicker.vue'
import { getThemePresetById, DEFAULT_THEME_ID, THEME_PRESETS } from '@/config/theme'
import { ElementPlusSize } from '@/types/elementPlus'

defineOptions({ name: 'Setting' })

// 定义 props,允许外部控制抽屉显示
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// 定义 emits
const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const appStore = useAppStore()

// 使用计算属性来支持 v-model
const drawer = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 当前选中的主题 ID
const currentThemeId = ref<string>(DEFAULT_THEME_ID)

// 初始化当前主题（尝试从当前主题色匹配）
const initCurrentTheme = () => {
  const currentPrimaryColor = appStore.getTheme.elColorPrimary
  
  // 尝试根据主题色匹配预设主题
  const matchedPreset = THEME_PRESETS.find(
    (preset) => preset.config.elColorPrimary === currentPrimaryColor
  )
  currentThemeId.value = matchedPreset ? matchedPreset.id : DEFAULT_THEME_ID
}

// 应用主题预设
const applyThemePreset = (themeId: string) => {
  const preset = getThemePresetById(themeId)
  if (!preset) {
    console.warn(`主题预设 ${themeId} 不存在`)
    return
  }

  // 应用完整主题配置
  appStore.setTheme(preset.config)
  appStore.setCssVarTheme()
  
  currentThemeId.value = themeId
}

// 组件挂载时初始化
onMounted(() => {
  initCurrentTheme()
})

// 组件尺寸设置
const sizeMap = computed(() => appStore.sizeMap)
const currentSize = computed(() => appStore.getCurrentSize)

const setCurrentSize = (size: ElementPlusSize) => {
  appStore.setCurrentSize(size)
}

// 拷贝
// const copyConfig = async () => {
//   const { copy, copied, isSupported } = useClipboard({
//     source: `
//       // 面包屑
//       breadcrumb: ${appStore.getBreadcrumb},
//       // 面包屑图标
//       breadcrumbIcon: ${appStore.getBreadcrumbIcon},
//       // 折叠图标
//       hamburger: ${appStore.getHamburger},
//       // 全屏图标
//       screenfull: ${appStore.getScreenfull},
//       // 尺寸图标
//       size: ${appStore.getSize},
//       // 多语言图标
//       locale: ${appStore.getLocale},
//       // 消息图标
//       message: ${appStore.getMessage},
//       // 标签页
//       tagsView: ${appStore.getTagsView},
//       // 标签页
//       tagsViewImmerse: ${appStore.getTagsViewImmerse},
//       // 标签页图标
//       tagsViewIcon: ${appStore.getTagsViewIcon},
//       // logo
//       logo: ${appStore.getLogo},
//       // 菜单手风琴
//       uniqueOpened: ${appStore.getUniqueOpened},
//       // 固定header
//       fixedHeader: ${appStore.getFixedHeader},
//       // 页脚
//       footer: ${appStore.getFooter},
//       // 灰色模式
//       greyMode: ${appStore.getGreyMode},
//       // layout布局
//       layout: '${appStore.getLayout}',
//       // 暗黑模式
//       isDark: ${appStore.getIsDark},
//       // 组件尺寸
//       currentSize: '${appStore.getCurrentSize}',
//       // 主题相关
//       theme: {
//         // 主题色
//         elColorPrimary: '${appStore.getTheme.elColorPrimary}',
//         // 左侧菜单边框颜色
//         leftMenuBorderColor: '${appStore.getTheme.leftMenuBorderColor}',
//         // 左侧菜单背景颜色
//         leftMenuBgColor: '${appStore.getTheme.leftMenuBgColor}',
//         // 左侧菜单浅色背景颜色
//         leftMenuBgLightColor: '${appStore.getTheme.leftMenuBgLightColor}',
//         // 左侧菜单选中背景颜色
//         leftMenuBgActiveColor: '${appStore.getTheme.leftMenuBgActiveColor}',
//         // 左侧菜单收起选中背景颜色
//         leftMenuCollapseBgActiveColor: '${appStore.getTheme.leftMenuCollapseBgActiveColor}',
//         // 左侧菜单字体颜色
//         leftMenuTextColor: '${appStore.getTheme.leftMenuTextColor}',
//         // 左侧菜单选中字体颜色
//         leftMenuTextActiveColor: '${appStore.getTheme.leftMenuTextActiveColor}',
//         // logo字体颜色
//         logoTitleTextColor: '${appStore.getTheme.logoTitleTextColor}',
//         // logo边框颜色
//         logoBorderColor: '${appStore.getTheme.logoBorderColor}',
//         // 头部背景颜色
//         topHeaderBgColor: '${appStore.getTheme.topHeaderBgColor}',
//         // 头部字体颜色
//         topHeaderTextColor: '${appStore.getTheme.topHeaderTextColor}',
//         // 头部悬停颜色
//         topHeaderHoverColor: '${appStore.getTheme.topHeaderHoverColor}',
//         // 头部边框颜色
//         topToolBorderColor: '${appStore.getTheme.topToolBorderColor}'
//       }
//     `
//   })
//   if (!isSupported) {
//     ElMessage.error(t('setting.copyFailed'))
//   } else {
//     await copy()
//     if (unref(copied)) {
//       ElMessage.success(t('setting.copySuccess'))
//     }
//   }
// }

// 清空缓存
const clear = () => {
  const { wsCache } = useCache()
  wsCache.delete(CACHE_KEY.LAYOUT)
  wsCache.delete(CACHE_KEY.THEME)
  wsCache.delete(CACHE_KEY.IS_DARK)
  window.location.reload()
}
</script>

<template>
  <ElDrawer v-model="drawer" :z-index="4000" direction="rtl" size="350px" :modal="true" :close-on-click-modal="true">
    <template #header>
      <span class="text-16px font-700">{{ t('setting.projectSetting') }}</span>
    </template>

    <div class="text-center">
      <!-- 暗黑模式 -->
      <ElDivider>{{ t('setting.theme') }}</ElDivider>
      <ThemeSwitch />

      <!-- 布局 -->
      <ElDivider>{{ t('setting.layout') }}</ElDivider>
      <LayoutRadioPicker />

      <!-- 主题预设 -->
      <ElDivider>主题风格</ElDivider>
      <ThemePresetPicker v-model="currentThemeId" @change="applyThemePreset" />
      
      <!-- 组件尺寸 -->
      <ElDivider>{{ t('setting.componentSize') }}</ElDivider>
      <div class="flex justify-center gap-4">
        <ElButton
          v-for="item in sizeMap"
          :key="item"
          :type="currentSize === item ? 'primary' : 'default'"
          @click="setCurrentSize(item)"
        >
          {{ t(`size.${item}`) }}
        </ElButton>
      </div>
    </div>

    <!-- 界面显示 -->
    <ElDivider>{{ t('setting.interfaceDisplay') }}</ElDivider>
    <InterfaceDisplay />

    <ElDivider />
    <!-- 拷贝配置按钮 -->
    <!-- <div>
      <ElButton class="w-full" type="primary" @click="copyConfig">{{ t('setting.copy') }}</ElButton>
    </div> -->
    <div class="mt-5px">
      <ElButton class="w-full" type="danger" @click="clear">
        {{ t('setting.clearAndReset') }}
      </ElButton>
    </div>
  </ElDrawer>
</template>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-setting;

.#{$prefix-cls} {
  border-radius: 6px 0 0 6px;
  z-index: 1200;/*修正没有z-index会被表格层覆盖,值不要超过4000*/
}
</style>
