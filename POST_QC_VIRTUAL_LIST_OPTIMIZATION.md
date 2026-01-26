# 后置质控统计页面虚拟列表优化

## 优化背景

后置质控统计页面在数据量较大时（500+ 机构），使用普通的 `el-table` 会导致页面加载缓慢、滚动卡顿等性能问题。

## 优化方案

将折叠面板中的机构错误列表从 `el-table` 改为 `el-table-v2`（Element Plus 虚拟化表格组件）。

### 虚拟列表原理

虚拟列表只渲染可视区域内的数据行，而不是一次性渲染所有数据。当用户滚动时，动态更新可视区域的内容，从而大幅提升性能。

## 实现细节

### 1. 引入依赖

```typescript
import { Column, TableV2FixedDir } from 'element-plus'
```

### 2. 改用 TSX 语法定义列

使用 `getOrgErrorColumns()` 函数返回 `Column[]` 数组，支持自定义渲染器：

```typescript
const getOrgErrorColumns = (ruleCode: string): Column[] => [
  {
    dataKey: 'deptName',
    title: '机构名称',
    width: 250,
    cellRenderer: ({ cellData }: any) => (
      <div class="text-ellipsis" title={cellData}>
        {cellData}
      </div>
    )
  },
  // ... 其他列
]
```

### 3. 使用 el-auto-resizer 自适应容器

```vue
<div class="virtual-table-container mt-12px">
  <el-auto-resizer>
    <template #default="{ height, width }">
      <el-table-v2
        :columns="getOrgErrorColumns(rule.ruleCode)"
        :data="rule.orgErrors"
        :width="width"
        :height="Math.min(height, 500)"
        :row-height="50"
        fixed
      />
    </template>
  </el-auto-resizer>
</div>
```

### 4. 关键配置

- `width` 和 `height`：由 `el-auto-resizer` 自动计算
- `row-height`：固定行高 50px，确保虚拟滚动计算准确
- `fixed`：启用固定列功能（操作列固定在右侧）

## 性能对比

| 数据量 | el-table（普通表格） | el-table-v2（虚拟列表） |
|--------|---------------------|------------------------|
| 100 条 | 流畅                | 流畅                   |
| 500 条 | 明显卡顿            | 流畅                   |
| 1000+ 条 | 严重卡顿          | 流畅                   |

## 功能保留

虚拟列表优化后，所有原有功能均保留：

- ✅ 序号列
- ✅ 机构名称、代码、等级
- ✅ 总记录数、错误记录数、错误率
- ✅ 建议退回标识和原因
- ✅ 查看错误详情按钮
- ✅ 标签颜色区分（根据等级和错误率）
- ✅ 文本溢出省略和 tooltip

## 注意事项

1. **TSX 语法**：`<script setup lang="tsx">` 支持在 JS 中写 JSX
2. **列宽固定**：虚拟表格需要固定列宽，不支持 `min-width`
3. **行高固定**：必须设置 `row-height`，确保滚动计算准确
4. **样式调整**：部分样式需要通过 `cellRenderer` 内联实现

## 参考示例

项目中其他使用虚拟列表的页面：

- `data-qc-web/src/views/system/regions/index.vue` - 地区管理
- `data-qc-web/src/views/system/menu/index.vue` - 菜单管理
- `data-qc-web/src/views/system/area/index.vue` - 区域管理

## 总结

通过引入虚拟列表，后置质控统计页面在大数据量场景下的性能得到显著提升，用户体验更加流畅。
