# Z-Index 层级规范

本文档记录了项目中各组件的 z-index 层级使用情况，便于开发时参考和维护。

## 层级分布总览

| 层级范围 | 用途 | 组件示例 |
|---------|------|---------|
| 3000+ | 最高层级 - 移动端菜单遮罩 | 移动端侧边菜单 |
| 100 | 流程设计器工具栏 | BPMN 设计器 |
| 99 | 全屏遮罩层 | 移动端菜单背景遮罩 |
| 36 | AI 写作停止按钮 | AI 模块浮动按钮 |
| 12 | 浮动操作按钮 | DIY 编辑器悬浮按钮 |
| 11 | 切割菜单二级菜单 | TabMenu 子菜单 |
| 10 | 固定头部/标签页 | ToolHeader + TagsView |
| 3 | 表格固定列/表头 | el-table 固定列 |
| 2 | 表格单元格 | el-table 普通单元格 |
| 1 | 普通内容层 | 角标、进度条、通知卡片 |
| 0 | 默认层级 | 流程设计器连接线 |

## 详细说明

### 布局层级 (Layout)

```
z-3000  移动端侧边菜单 (useRenderLayout.tsx)
        - 移动端展开时的左侧菜单，需要覆盖所有内容

z-99    移动端遮罩层 (Layout.vue)
        - 点击关闭菜单的半透明背景

z-11    切割菜单二级菜单 (TabMenu.vue)
        - cutMenu 布局模式下的二级菜单

z-10    固定头部区域 (useRenderLayout.tsx)
        - ToolHeader 工具栏
        - TagsView 标签页
        - 编辑器工具栏
        - AI 模块顶部导航
```

### 表格层级 (Table)

```
z-3     表格固定列/表头 (index.scss)
        - el-table 的固定列和表头

z-2     表格普通单元格 (index.scss)
        - el-table 的普通单元格
```

### 组件层级 (Components)

```
z-100   BPMN 流程设计器工具栏 (process-designer.scss)

z-36    AI 写作停止按钮 (Right.vue)

z-12    DIY 编辑器浮动按钮 (FloatingActionButton/index.vue)

z-1     通用内容层
        - 商品角标 (ProductList, ProductCard 等)
        - 菜单角标 (MenuGrid, MenuSwiper)
        - 进度条 (progress-fix.scss)
        - 通知横幅 (NoticeBar.vue)
        - 流程设计器节点 (simple-process-designer.scss)
        - 标签关闭按钮 (index.scss)

z-0     流程设计器连接线 (simple-process-designer.scss)
```

## 使用建议

### 新增组件时的层级选择

1. **页面内普通内容**: 使用 `z-1` 或不设置
2. **需要浮动但不遮挡导航**: 使用 `z-1` ~ `z-9`
3. **需要与固定头部同级**: 使用 `z-10`
4. **弹出菜单/下拉框**: 使用 `z-11` ~ `z-50`
5. **全屏遮罩**: 使用 `z-99`
6. **移动端特殊处理**: 使用 `z-3000`

### 注意事项

1. **避免随意使用高层级**: 除非确实需要覆盖其他元素
2. **考虑父元素的层叠上下文**: 子元素的 z-index 只在父元素的层叠上下文内生效
3. **固定定位元素**: `position: fixed` 的元素会创建新的层叠上下文
4. **Element Plus 组件**: 弹窗、下拉框等组件有自己的 z-index 管理，通常在 2000+

## Element Plus 默认层级参考

Element Plus 组件库的默认 z-index：

| 组件 | z-index |
|------|---------|
| Dropdown | 2000 |
| Dialog | 2001 |
| Drawer | 2001 |
| Message | 2001 |
| Notification | 2001 |
| Popover | 2000 |
| Tooltip | 2000 |
| Loading | 2000 |

## 更新记录

- 2025-12-30: 初始版本，整理现有 z-index 使用情况
