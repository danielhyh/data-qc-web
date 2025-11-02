import { computed, defineComponent, resolveComponent } from 'vue'
import { getDictObj } from '@/utils/dict'
import * as EpIcons from '@element-plus/icons-vue'

type DictValue = string | number | boolean

interface ParsedIconSpec {
  name?: string
  color?: string
}

const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

const parseIconSpec = (spec?: string | null): ParsedIconSpec => {
  if (!spec) {
    return {}
  }
  const segments = spec
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean)

  if (segments.length === 0) {
    return {}
  }

  const color = segments.find((item) => HEX_COLOR_PATTERN.test(item))
  const name = segments.find((item) => item !== color)

  return { name, color }
}

export default defineComponent({
  name: 'DictIcon',
  props: {
    dictType: {
      type: String,
      required: true
    },
    value: {
      type: [String, Number, Boolean],
      required: true
    },
    size: {
      type: [Number, String],
      default: 16
    },
    defaultColor: {
      type: String,
      default: '#909399'
    }
  },
  setup(props) {
    const IconComponent = resolveComponent('Icon') as any

    const meta = computed(() => {
      const dict = getDictObj(props.dictType, props.value as DictValue)
      return parseIconSpec(dict?.cssClass)
    })

    return () => {
      const { name, color } = meta.value
      const resolvedColor = color || props.defaultColor
      const size = typeof props.size === 'number' ? `${props.size}px` : props.size
      const style = { color: resolvedColor, fontSize: size }

      if (!name && !color) {
        return null
      }

      if (name && name.includes(':') && IconComponent) {
        return <IconComponent icon={name} style={style} />
      }

      if (name && (EpIcons as Record<string, any>)[name]) {
        const Comp = (EpIcons as Record<string, any>)[name]
        return (
          <el-icon style={style}>
            <Comp />
          </el-icon>
        )
      }

      if (!name && color) {
        return <i style={{ ...style, display: 'inline-block' }}>●</i>
      }

      return null
    }
  }
})

