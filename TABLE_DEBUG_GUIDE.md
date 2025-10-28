# 📊 表格样式调试工具使用指南

## 🎯 目的

帮助诊断和解决表格固定列（特别是操作列）的样式问题，如：
- 表头透明重叠
- 悬停时数据穿透显示
- z-index 层级问题
- 背景色不生效

## 🚀 快速使用

### 1️⃣ 打开需要调试的页面

例如：导入模板管理页面 (http://localhost:xxxx/drug/import/template)

### 2️⃣ 打开浏览器开发者工具

- **Chrome/Edge**: 按 `F12` 或 `Ctrl+Shift+I`
- **Mac**: 按 `Cmd+Option+I`

### 3️⃣ 切换到 Console (控制台) 标签

### 4️⃣ 运行调试命令

```javascript
// 方法1: 完整调试（推荐）
window.__debugTable()

// 方法2: 高亮固定列（可视化）
window.__highlightFixed()
```

## 📋 详细说明

### 🔍 完整调试 - `window.__debugTable()`

这个命令会在控制台打印详细的调试信息，包括：

#### 输出内容示例：

```
🔍 开始调试表格样式...
================================================================================

📋 【表头信息】
--------------------------------------------------------------------------------

列 1: 模板名称
  Class: el-table__cell
  内联样式:
    - background-color: 未设置
    - opacity: 未设置
    - z-index: 未设置
  计算后样式:
    - background-color: rgb(248, 250, 252)
    - opacity: 1
    - z-index: auto

列 8: 操作
  Class: el-table__cell, is-fixed-column--right
  内联样式:
    - background-color: 未设置
    - opacity: 未设置
    - z-index: 未设置
  计算后样式:
    - background-color: rgba(91, 141, 239, 0.08)
    - opacity: 1
    - z-index: 10
  ⭐ 这是右侧固定列!

📦 【固定列容器】
--------------------------------------------------------------------------------
右侧固定列容器:
  - background-color: rgb(255, 255, 255)
  - z-index: 3
  - box-shadow: rgba(0, 0, 0, 0.1) -2px 0px 12px

📊 【第一行数据单元格】
--------------------------------------------------------------------------------
单元格 8: 编辑 删除
  Class: el-table__cell, is-fixed-column--right
  计算后样式:
    - background-color: rgb(255, 255, 255)
    - opacity: 1
    - z-index: 4
  ⭐ 这是右侧固定列单元格!

🔘 【操作列按钮】
--------------------------------------------------------------------------------
找到 6 个操作按钮

按钮 1: 预览
  Class: el-button, el-button--primary, el-button--small
  z-index (内联): 未设置
  z-index (计算): 11

📈 【诊断总结】
================================================================================
✅ 表头总数: 8
✅ 右侧固定列数: 1
✅ 左侧固定列数: 0
✅ 操作按钮数: 6
```

### 🎨 高亮固定列 - `window.__highlightFixed()`

这个命令会在页面上用彩色边框标记固定列：
- **红色边框**: 右侧固定列
- **蓝色边框**: 左侧固定列
- 5秒后自动消失

## 📸 关键检查点

### ✅ 正常情况应该显示：

1. **表头背景色**
   - 普通列: `rgb(248, 250, 252)` 或类似浅色
   - 操作列: `rgba(91, 141, 239, 0.08)` 蓝色渐变

2. **opacity（不透明度）**
   - 所有列都应该是 `1`（完全不透明）

3. **z-index（层级）**
   - 操作列表头: `10`
   - 操作列单元格: `4`
   - 操作按钮: `11`

4. **固定列检测**
   - 应该显示 `⭐ 这是右侧固定列!`
   - Class 应包含 `is-fixed-column--right`

### ❌ 问题情况：

1. **未检测到固定列**
   ```
   ⚠️  警告: 未检测到右侧固定列
   ```
   **可能原因**:
   - 表格列未设置 `fixed="right"` 属性
   - Element Plus 版本问题
   - 表格数据未加载

2. **背景色透明**
   ```
   background-color: rgba(255, 255, 255, 0.5)
   opacity: 0.8
   ```
   **说明**: 背景不够不透明，会导致重叠

3. **z-index 不正确**
   ```
   z-index: auto  // 应该是具体数字
   ```
   **说明**: 层级设置未生效

## 📤 复制日志给开发者

### 方法1: 复制控制台内容

1. 运行 `window.__debugTable()`
2. 在控制台中右键
3. 选择 "全选" 或使用 `Ctrl+A`
4. 复制 (`Ctrl+C`)
5. 粘贴给开发者

### 方法2: 保存为文件

```javascript
// 运行这段代码，会将调试信息保存到变量
const debugInfo = window.__debugTable()

// 复制这个变量的内容
copy(JSON.stringify(debugInfo, null, 2))
```

### 方法3: 截图

1. 运行调试命令后
2. 截取控制台完整内容
3. 截图发送给开发者

## 🔧 高级用法

### 指定表格选择器

```javascript
// 调试特定表格
window.__debugTable('.my-custom-table')

// 调试页面中第二个表格
window.__debugTable('.el-table:nth-child(2)')
```

### 在组件中使用

```vue
<script setup>
import { debugTableStyles } from '@/utils/tableDebug'
import { onMounted } from 'vue'

onMounted(() => {
  // 等待表格渲染完成
  setTimeout(() => {
    const debugInfo = debugTableStyles('.el-table')
    console.log('调试信息:', debugInfo)
  }, 1000)
})
</script>
```

## 🐛 常见问题排查

### Q: 提示 "window.__debugTable is not a function"

**A**: 刷新页面或等待片刻，调试工具需要加载

### Q: 显示 "未找到表格元素"

**A**: 
- 确保页面中有表格
- 检查表格选择器是否正确
- 等待表格数据加载完成

### Q: 显示 "未找到操作列按钮"

**A**:
- 确保表格有数据
- 检查操作列是否有按钮
- 确认固定列设置正确

## 📊 输出数据结构

调试命令返回的对象结构：

```typescript
{
  timestamp: string          // 调试时间
  headers: Array<{           // 所有表头信息
    text: string
    classes: string[]
    styles: {...}
    computedStyles: {...}
  }>
  fixedColumns: {            // 固定列统计
    left: number
    right: number
    rightClasses: string[]
  }
  firstRowCells: Array<{     // 第一行数据
    text: string
    classes: string[]
    ...
  }>
  actionButtons: Array<{     // 操作按钮信息
    text: string
    classes: string[]
    zIndex: string
  }>
}
```

## 💡 提示

- 在表格数据加载完成后再运行调试命令
- 可以多次运行查看样式变化
- 悬停状态的样式需要在悬停时运行命令查看
- 高亮功能会自动消失，如需再次查看请重新运行

## 📞 反馈问题

将以下信息一起提供给开发者：
1. 控制台完整日志（运行 `window.__debugTable()` 的输出）
2. 问题截图（显示重叠或透明的情况）
3. 浏览器版本和操作系统
4. Element Plus 版本

---

**工具版本**: 1.0.0  
**更新时间**: 2025-10-28

