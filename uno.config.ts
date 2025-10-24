import { defineConfig, toEscapedSelector as e, presetUno } from 'unocss'
// import transformerVariantGroup from '@unocss/transformer-variant-group'

export default defineConfig({
  // ...UnoCSS options
  rules: [
    [
      /^custom-hover$/,
      ([], { rawSelector }) => {
        const selector = e(rawSelector)
        return `
${selector} {
  display: flex;
  height: 100%;
  padding: 0 10px;
  cursor: pointer;
  align-items: center;
  transition: background var(--transition-time-02);
}
/* you can have multiple rules */
${selector}:hover {
  background-color: var(--top-header-hover-color);
}
.dark ${selector}:hover {
  background-color: var(--el-bg-color-overlay);
}
`
      }
    ],
    [
      /^layout-border__left$/,
      ([], { rawSelector }) => {
        const selector = e(rawSelector)
        return `
${selector}:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: var(--el-border-color);
  z-index: 3;
}
`
      }
    ],
    [
      /^layout-border__right$/,
      ([], { rawSelector }) => {
        const selector = e(rawSelector)
        return `
${selector}:after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background-color: var(--el-border-color);
  z-index: 3;
}
`
      }
    ],
    [
      /^layout-border__top$/,
      ([], { rawSelector }) => {
        const selector = e(rawSelector)
        return `
${selector}:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: var(--el-border-color);
  z-index: 3;
}
`
      }
    ],
    [
      /^layout-border__bottom$/,
      ([], { rawSelector }) => {
        const selector = e(rawSelector)
        return `
${selector}:after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: var(--el-border-color);
  z-index: 3;
}
`
      }
    ]
  ],
  presets: [presetUno({ dark: 'class', attributify: false })],
  // transformers: [transformerVariantGroup()],
  shortcuts: {
    'wh-full': 'w-full h-full',
    'tech-card-light': 'bg-white rounded-12px border-1 border-[rgba(91,141,239,0.1)] shadow-sm hover:shadow-md transition-all',
    'tech-gradient-text': 'bg-clip-text text-transparent bg-gradient-to-r from-[#5B8DEF] to-[#7c3aed]',
    'tech-hover-scale': 'transition-all hover:scale-102 hover:-translate-y-1',
    'tech-btn-primary': 'px-6 py-3 rounded-10px text-white font-600 bg-gradient-to-r from-[#5B8DEF] to-[#7c3aed] hover:shadow-md transition-all',
    'tech-input': 'rounded-10px border-1 border-[rgba(91,141,239,0.1)] focus:border-[#5B8DEF] transition-all',
    'tech-shadow': 'shadow-[0_2px_8px_rgba(91,141,239,0.08)]',
    'tech-badge': 'px-3 py-1 rounded-6px text-xs font-600 bg-[rgba(91,141,239,0.1)] text-[#5B8DEF] border-1 border-[rgba(91,141,239,0.3)]'
  }
})
