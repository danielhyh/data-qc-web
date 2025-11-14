import type { App } from 'vue'
// 需要全局引入一些组件，如ElScrollbar，不然一些下拉项样式有问题
// 全局注册下拉相关组件，确保动态渲染的下拉框能正确应用圆角样式
import { 
  ElLoading, 
  ElScrollbar, 
  ElButton, 
  ElPopper,
  ElTooltip,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem
} from 'element-plus'

const plugins = [ElLoading]

const components = [
  ElScrollbar, 
  ElButton, 
  ElPopper,
  ElTooltip,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem
]

export const setupElementPlus = (app: App<Element>) => {
  plugins.forEach((plugin) => {
    app.use(plugin)
  })

  components.forEach((component) => {
    app.component(component.name, component)
  })
}
