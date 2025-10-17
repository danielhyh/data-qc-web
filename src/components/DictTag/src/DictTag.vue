<script lang="tsx">
import { computed, defineComponent, PropType } from 'vue'
import { isHexColor } from '@/utils/color'
import { ElTag } from 'element-plus'
import { DictDataType, getDictOptions } from '@/utils/dict'
import { isArray, isBoolean, isNumber, isString } from '@/utils/is'

export default defineComponent({
  name: 'DictTag',
  props: {
    type: {
      type: String as PropType<string>,
      required: true
    },
    value: {
      type: [String, Number, Boolean, Array],
      required: true
    },
    separator: {
      type: String as PropType<string>,
      default: ','
    },
    gutter: {
      type: String as PropType<string>,
      default: '8px'
    },
    // 新增：标签风格
    theme: {
      type: String as PropType<'modern' | 'soft' | 'gradient' | 'glass'>,
      default: 'modern'
    }
  },
  setup(props) {
    const valueArr: any = computed(() => {
      if (isNumber(props.value) || isBoolean(props.value)) {
        return [String(props.value)]
      } else if (isString(props.value)) {
        return props.value.split(props.separator)
      } else if (isArray(props.value)) {
        return props.value.map(String)
      }
      return []
    })

    // 现代化配色方案
    const colorMap = {
      success: { bg: '#f0fdf4', color: '#16a34a', border: '#86efac' },
      warning: { bg: '#fffbeb', color: '#d97706', border: '#fcd34d' },
      danger: { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
      info: { bg: '#f0f9ff', color: '#0284c7', border: '#7dd3fc' },
      primary: { bg: '#eff6ff', color: '#2563eb', border: '#93c5fd' },
      default: { bg: '#f9fafb', color: '#6b7280', border: '#d1d5db' }
    }

    const getTagStyle = (dict: DictDataType) => {
      const colorType = (dict.colorType || 'default') as keyof typeof colorMap
      const colors = colorMap[colorType] || colorMap.default

      const baseStyle = {
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        padding: '4px 12px',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        cursor: 'default',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }

      // 不同主题样式
      switch (props.theme) {
        case 'soft':
          return {
            ...baseStyle,
            backgroundColor: colors.bg,
            color: colors.color,
            boxShadow: 'none'
          }
        case 'gradient':
          return {
            ...baseStyle,
            background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.border}30 100%)`,
            color: colors.color,
            border: 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }
        case 'glass':
          return {
            ...baseStyle,
            background: `${colors.bg}cc`,
            color: colors.color,
            backdropFilter: 'blur(8px)',
            border: `1px solid ${colors.border}60`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }
        default: // modern
          return {
            ...baseStyle,
            backgroundColor: colors.bg,
            color: colors.color,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }
      }
    }

    const renderDictTag = () => {
      if (!props.type) {
        return null
      }
      if (props.value === undefined || props.value === null || props.value === '') {
        return null
      }
      const dictOptions = getDictOptions(props.type)

      return (
        <div
          class="dict-tag-wrapper"
          style={{
            display: 'inline-flex',
            gap: props.gutter,
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          {dictOptions.map((dict: DictDataType) => {
            if (valueArr.value.includes(dict.value)) {
              // 如果有自定义颜色
              if (dict?.cssClass && isHexColor(dict?.cssClass)) {
                return (
                  <span
                    class="custom-dict-tag"
                    style={{
                      ...getTagStyle(dict),
                      backgroundColor: `${dict.cssClass}15`,
                      color: dict.cssClass,
                      border: `1px solid ${dict.cssClass}40`
                    }}
                  >
                    {dict?.label}
                  </span>
                )
              }

              return (
                <span class="custom-dict-tag" style={getTagStyle(dict)}>
                  {dict?.label}
                </span>
              )
            }
          })}
        </div>
      )
    }
    return () => renderDictTag()
  }
})
</script>

<style scoped lang="scss">
.custom-dict-tag {
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08) !important;
  }
}

.dict-tag-wrapper {
  line-height: 1;
}
</style>
