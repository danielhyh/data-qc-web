# 统计分析 - 区域机构选择组件优化说明

## 优化内容

参考 `ReportZoneOrgSelector.vue` 的设计，为统计分析页面创建了专用的区域/机构选择组件 `StatisticsAreaOrgSelector.vue`。

## 核心特性

### 1. 双模式选择
- **地区模式**：选择某个地区，查询该地区及子地区的所有机构数据
- **机构模式**：选择特定机构，仅查询这些机构的数据
- 两种模式互斥，通过顶部切换按钮切换

### 2. 交互优化
- **地区模式**：
  - 点击地区节点即选中
  - 当前选中地区高亮显示，带选中标记图标
  - 右侧显示该地区下的机构列表（仅预览，不可选）
  
- **机构模式**：
  - 右侧机构树显示复选框
  - 支持全选、等级筛选
  - 支持机构搜索

### 3. 视觉设计
- 模式切换区域：
  - 蓝色渐变背景
  - 清晰的模式说明提示
  
- 左侧地区面板：
  - 蓝色主题
  - 显示直属机构数和总机构数
  - 选中状态带渐变背景和左侧边框
  
- 右侧机构面板：
  - 绿色主题
  - 显示机构等级、类别
  - 支持等级快速筛选

### 4. 数据回显
- 打开对话框时自动回显当前选择
- 根据当前模式展示对应的选择状态
- 确认后更新查询参数

## 使用方式

```vue
<StatisticsAreaOrgSelector
  v-model="showDialog"
  :default-mode="currentMode"
  :default-area-code="areaCode"
  :default-org-ids="orgIds"
  @confirm="handleConfirm"
/>
```

### Props
- `modelValue`: 对话框显示状态
- `defaultMode`: 初始模式 ('area' | 'org')
- `defaultAreaCode`: 默认地区代码
- `defaultOrgIds`: 默认选中的机构ID列表

### Events
- `confirm`: 确认选择
  ```ts
  {
    mode: 'area' | 'org',
    areaCode?: string,
    areaName?: string,
    orgIds?: number[],
    orgDetails?: any[]
  }
  ```

## 与 ReportZoneOrgSelector 的区别

| 特性 | ReportZoneOrgSelector | StatisticsAreaOrgSelector |
|------|----------------------|---------------------------|
| 用途 | 配置填报机构 | 统计查询筛选 |
| 选择模式 | 仅机构多选 | 地区单选 OR 机构多选 |
| 地区树交互 | 仅浏览切换 | 可选中地区 |
| 机构树复选框 | 始终显示 | 仅机构模式显示 |
| 返回数据 | 机构列表 | 地区信息 OR 机构列表 |

## 优势

1. **清晰的业务语义**：通过模式切换明确区分"按地区查询"和"按机构查询"
2. **更好的用户体验**：
   - 地区模式下点击即选，无需额外确认
   - 机构模式下保留完整的筛选功能
3. **统一的视觉风格**：复用了 ReportZoneOrgSelector 的设计语言
4. **灵活的查询能力**：支持宽泛查询（地区）和精确查询（机构）

