# 主题预设系统使用指南

## 概述

新的主题预设系统将原本分散的"系统主题"、"头部主题"、"菜单主题"三个独立配置项合并为统一的主题预设选择器，提供 6 套开箱即用的经典主题。

## 主题列表

### 1. 清新蓝 (fresh-blue) - 默认主题
- 主题色：`#5B8DEF`
- 菜单背景：浅蓝色渐变 `#e8f0fe`
- 头部背景：柔和浅灰 `#f8fafc`
- 适用场景：通用场景，清新优雅

### 2. 优雅紫 (elegant-purple)
- 主题色：`#7c3aed`
- 菜单背景：浅紫色 `#f3e8ff`
- 头部背景：淡紫灰 `#faf5ff`
- 适用场景：高端品牌，优雅精致

### 3. 科技青 (tech-cyan)
- 主题色：`#00d4ff`
- 菜单背景：浅青色 `#e0f7fa`
- 头部背景：淡青灰 `#e0f2f1`
- 适用场景：科技公司，现代活力

### 4. 商务灰 (business-gray)
- 主题色：`#64748b`
- 菜单背景：浅灰色 `#f1f5f9`
- 头部背景：白色 `#ffffff`
- 适用场景：商务场合，专业稳重

### 5. 暖阳橙 (warm-orange)
- 主题色：`#f59e0b`
- 菜单背景：浅橙色 `#fff7ed`
- 头部背景：浅黄灰 `#fffbeb`
- 适用场景：创意设计，温暖活力

### 6. 深邃蓝 (deep-blue)
- 主题色：`#409eff`
- 菜单背景：深蓝色 `#001529`
- 头部背景：深蓝灰 `#1e293b`
- 适用场景：夜间模式，深沉稳重

## 使用方式

### 用户端使用

1. 点击右上角设置图标
2. 在"主题风格"区域选择喜欢的主题卡片
3. 点击即可立即应用

### 编程方式使用

```typescript
import { useAppStore } from '@/store/modules/app'
import { getThemePresetById } from '@/config/theme'

const appStore = useAppStore()

// 应用指定主题
const preset = getThemePresetById('fresh-blue')
if (preset) {
  appStore.setTheme(preset.config)
  appStore.setCssVarTheme()
}
```

## 新增主题

如需添加新的主题预设，编辑 `src/config/theme.ts`：

```typescript
{
  id: 'my-theme',
  name: '我的主题',
  description: '自定义主题描述',
  previewColors: {
    primary: '#主题色',
    menu: '#菜单色',
    header: '#头部色'
  },
  config: {
    elColorPrimary: '#主题色',
    leftMenuBgColor: '#菜单背景色',
    // ... 完整配置
  }
}
```

## 主题配置项说明

每个主题包含以下配置项：

- `elColorPrimary`: 主题色（按钮、链接等）
- `leftMenuBgColor`: 菜单背景色
- `leftMenuBgLightColor`: 菜单次级背景色
- `leftMenuHoverBgColor`: 菜单悬停背景色
- `leftMenuBgActiveColor`: 菜单选中背景色
- `leftMenuTextColor`: 菜单文字颜色
- `leftMenuTextActiveColor`: 菜单选中文字颜色
- `leftMenuShadow`: 菜单阴影效果
- `logoTitleTextColor`: Logo 文字颜色
- `topHeaderBgColor`: 头部背景色
- `topHeaderTextColor`: 头部文字颜色
- `topHeaderHoverColor`: 头部悬停色
- `topHeaderShadow`: 头部阴影效果
- 等等...

## 文件结构

```
src/
├── config/
│   └── theme.ts                    # 主题预设配置
├── layout/components/Setting/
│   └── src/
│       ├── components/
│       │   ├── ThemePresetCard.vue      # 主题卡片组件
│       │   └── ThemePresetPicker.vue    # 主题选择器
│       └── Setting.vue             # 设置面板（已更新）
└── store/modules/
    └── app.ts                      # 状态管理（已更新）
```

## 迁移指南

### 旧版本（已移除）

```vue
<!-- 系统主题 -->
<ColorRadioPicker v-model="systemTheme" @change="setSystemTheme" />

<!-- 头部主题 -->
<ColorRadioPicker v-model="headerTheme" @change="setHeaderTheme" />

<!-- 菜单主题 -->
<ColorRadioPicker v-model="menuTheme" @change="setMenuTheme" />
```

### 新版本

```vue
<!-- 主题预设 -->
<ThemePresetPicker v-model="currentThemeId" @change="applyThemePreset" />
```

## 优势

1. **简化操作**：一键应用完整主题，无需分别设置
2. **专业配色**：预设主题经过精心设计，色彩协调统一
3. **可扩展性**：易于添加新主题，支持自定义
4. **缓存支持**：主题选择会自动保存，下次登录保持
5. **角色适配**：支持不同角色使用不同默认主题

## 注意事项

1. 切换主题会立即生效，无需刷新页面
2. 主题配置与用户账号绑定，不同用户可选择不同主题
3. 深色主题（如深邃蓝）会自动调整文字颜色以保证可读性
4. 所有主题在 classic、top、topLeft 三种布局下均适配良好

