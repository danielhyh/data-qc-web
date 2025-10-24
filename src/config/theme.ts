import type { ThemeTypes } from '@/types/theme'

export interface ThemePreset {
  id: string
  name: string
  description: string
  previewColors: {
    primary: string
    menu: string
    header: string
  }
  config: ThemeTypes
}

// 6套经典主题预设
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'fresh-blue',
    name: '清新蓝',
    description: '清新优雅的蓝色系，适合大多数场景',
    previewColors: {
      primary: '#5B8DEF',
      menu: '#e8f0fe',
      header: '#f8fafc'
    },
    config: {
      elColorPrimary: '#5B8DEF',
      leftMenuBorderColor: 'inherit',
      leftMenuBgColor: '#e8f0fe',
      leftMenuBgLightColor: '#e8f0fe',
      leftMenuHoverBgColor: '#d3e3fd',
      leftMenuBgActiveColor: '#c2d9fc',
      leftMenuCollapseBgActiveColor: '#c2d9fc',
      leftMenuTextColor: '#334155',
      leftMenuTextActiveColor: '#1e40af', // 深蓝色，确保对比度
      leftMenuShadow: '2px 0 8px rgba(91, 141, 239, 0.1)',
      logoTitleTextColor: '#334155',
      logoBorderColor: 'inherit',
      topHeaderBgColor: '#f8fafc',
      topHeaderTextColor: 'inherit',
      topHeaderHoverColor: 'rgba(91, 141, 239, 0.08)',
      topToolBorderColor: 'rgba(91, 141, 239, 0.1)',
      topHeaderShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      appContentBgColor: 'linear-gradient(135deg, #f8fafc 0%, #e8f0fe 50%, #f8fafc 100%)'
    }
  },
  {
    id: 'elegant-purple',
    name: '优雅紫',
    description: '高贵优雅的紫色系，彰显品位',
    previewColors: {
      primary: '#7c3aed',
      menu: '#f3e8ff',
      header: '#faf5ff'
    },
    config: {
      elColorPrimary: '#7c3aed',
      leftMenuBorderColor: 'inherit',
      leftMenuBgColor: '#f3e8ff',
      leftMenuBgLightColor: '#f3e8ff',
      leftMenuHoverBgColor: '#e9d5ff',
      leftMenuBgActiveColor: '#d8b4fe',
      leftMenuCollapseBgActiveColor: '#d8b4fe',
      leftMenuTextColor: '#334155',
      leftMenuTextActiveColor: '#5b21b6', // 深紫色，确保对比度
      leftMenuShadow: '2px 0 8px rgba(124, 58, 237, 0.1)',
      logoTitleTextColor: '#334155',
      logoBorderColor: 'inherit',
      topHeaderBgColor: '#faf5ff',
      topHeaderTextColor: 'inherit',
      topHeaderHoverColor: 'rgba(124, 58, 237, 0.08)',
      topToolBorderColor: 'rgba(124, 58, 237, 0.1)',
      topHeaderShadow: '0 2px 8px rgba(124, 58, 237, 0.06)',
      appContentBgColor: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #faf5ff 100%)'
    }
  },
  {
    id: 'tech-cyan',
    name: '科技青',
    description: '现代科技感的青色系，充满活力',
    previewColors: {
      primary: '#00d4ff',
      menu: '#e0f7fa',
      header: '#e0f2f1'
    },
    config: {
      elColorPrimary: '#00d4ff',
      leftMenuBorderColor: 'inherit',
      leftMenuBgColor: '#e0f7fa',
      leftMenuBgLightColor: '#e0f7fa',
      leftMenuHoverBgColor: '#b2ebf2',
      leftMenuBgActiveColor: '#80deea',
      leftMenuCollapseBgActiveColor: '#80deea',
      leftMenuTextColor: '#334155',
      leftMenuTextActiveColor: '#006064', // 深青色，确保对比度
      leftMenuShadow: '2px 0 8px rgba(0, 212, 255, 0.1)',
      logoTitleTextColor: '#334155',
      logoBorderColor: 'inherit',
      topHeaderBgColor: '#e0f2f1',
      topHeaderTextColor: 'inherit',
      topHeaderHoverColor: 'rgba(0, 212, 255, 0.08)',
      topToolBorderColor: 'rgba(0, 212, 255, 0.1)',
      topHeaderShadow: '0 2px 8px rgba(0, 212, 255, 0.06)',
      appContentBgColor: 'linear-gradient(135deg, #e0f2f1 0%, #e0f7fa 50%, #e0f2f1 100%)'
    }
  },
  {
    id: 'business-gray',
    name: '商务灰',
    description: '专业稳重的灰色系，商务首选',
    previewColors: {
      primary: '#64748b',
      menu: '#f1f5f9',
      header: '#ffffff'
    },
    config: {
      elColorPrimary: '#64748b',
      leftMenuBorderColor: 'inherit',
      leftMenuBgColor: '#f1f5f9',
      leftMenuBgLightColor: '#f1f5f9',
      leftMenuHoverBgColor: '#e2e8f0',
      leftMenuBgActiveColor: '#cbd5e1',
      leftMenuCollapseBgActiveColor: '#cbd5e1',
      leftMenuTextColor: '#334155',
      leftMenuTextActiveColor: '#1e293b', // 深灰色，确保对比度
      leftMenuShadow: '2px 0 8px rgba(100, 116, 139, 0.1)',
      logoTitleTextColor: '#334155',
      logoBorderColor: 'inherit',
      topHeaderBgColor: '#ffffff',
      topHeaderTextColor: 'inherit',
      topHeaderHoverColor: 'rgba(100, 116, 139, 0.08)',
      topToolBorderColor: 'rgba(100, 116, 139, 0.1)',
      topHeaderShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      appContentBgColor: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)'
    }
  },
  {
    id: 'warm-orange',
    name: '暖阳橙',
    description: '温暖活力的橙色系，积极向上',
    previewColors: {
      primary: '#f59e0b',
      menu: '#fff7ed',
      header: '#fffbeb'
    },
    config: {
      elColorPrimary: '#f59e0b',
      leftMenuBorderColor: 'inherit',
      leftMenuBgColor: '#fff7ed',
      leftMenuBgLightColor: '#fff7ed',
      leftMenuHoverBgColor: '#fed7aa',
      leftMenuBgActiveColor: '#fbbf24',
      leftMenuCollapseBgActiveColor: '#fbbf24',
      leftMenuTextColor: '#334155',
      leftMenuTextActiveColor: '#92400e', // 深橙色，确保对比度
      leftMenuShadow: '2px 0 8px rgba(245, 158, 11, 0.1)',
      logoTitleTextColor: '#334155',
      logoBorderColor: 'inherit',
      topHeaderBgColor: '#fffbeb',
      topHeaderTextColor: 'inherit',
      topHeaderHoverColor: 'rgba(245, 158, 11, 0.08)',
      topToolBorderColor: 'rgba(245, 158, 11, 0.1)',
      topHeaderShadow: '0 2px 8px rgba(245, 158, 11, 0.06)',
      appContentBgColor: 'linear-gradient(135deg, #fffbeb 0%, #fff7ed 50%, #fffbeb 100%)'
    }
  },
  {
    id: 'deep-blue',
    name: '深邃蓝',
    description: '深沉稳重的深蓝系，夜间模式',
    previewColors: {
      primary: '#409eff',
      menu: '#001529',
      header: '#1e293b'
    },
    config: {
      elColorPrimary: '#409eff',
      leftMenuBorderColor: 'inherit',
      leftMenuBgColor: '#001529',
      leftMenuBgLightColor: '#0f2438',
      leftMenuHoverBgColor: '#1a3a52',
      leftMenuBgActiveColor: 'var(--el-color-primary)',
      leftMenuCollapseBgActiveColor: 'var(--el-color-primary)',
      leftMenuTextColor: '#bfcbd9',
      leftMenuTextActiveColor: '#fff',
      leftMenuShadow: '2px 0 8px rgba(0, 0, 0, 0.2)',
      logoTitleTextColor: '#fff',
      logoBorderColor: 'inherit',
      topHeaderBgColor: '#1e293b',
      topHeaderTextColor: '#fff',
      topHeaderHoverColor: 'rgba(64, 158, 255, 0.2)',
      topToolBorderColor: 'rgba(64, 158, 255, 0.3)',
      topHeaderShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      appContentBgColor: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
    }
  }
]

// 根据 ID 获取主题预设
export const getThemePresetById = (id: string): ThemePreset | undefined => {
  return THEME_PRESETS.find((preset) => preset.id === id)
}

// 默认主题 ID
export const DEFAULT_THEME_ID = 'fresh-blue'

// 机构用户主题（可以映射到某个预设主题，或保持独立配置）
export const INSTITUTION_THEME_ID = 'fresh-blue' // 使用清新蓝作为机构主题

