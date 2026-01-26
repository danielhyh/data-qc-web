# 后置质控前端页面重构说明

## 改动概述

将后置质控统计页面从**机构维度**改为**规则维度**展示，使用折叠面板展示每条规则及其错误机构列表。

## 页面路径

`data-qc-web/src/views/drug/postqc/statistics/index.vue`

## 主要改动

### 1. 顶部统计卡片

**之前**：
- 总机构数
- 通过机构数
- 待审核机构数
- 建议退回机构数

**现在**：
- 后置质控规则数
- 错误机构数（去重）
- 建议退回机构数（去重）

### 2. 主体内容

**之前**：
- 按等级统计表
- 机构详情列表（平铺展示所有机构）

**现在**：
- 规则列表（折叠面板）
  - 每条规则一个折叠项
  - 规则头部显示：规则编码、规则名称、统计信息
  - 展开后显示：规则描述 + 该规则的错误机构列表

### 3. 数据结构

#### 新增 API 接口

```typescript
// 获取后置质控规则统计（按规则维度）
export const getRuleStatistics = (reportId: number) => {
  return request.get<PostQcRuleStatisticsVO>({ 
    url: '/admin/drug/post-qc/rule-statistics', 
    params: { reportId } 
  })
}

// 获取指定规则的机构错误列表
export const getRuleOrgErrors = (reportId: number, ruleCode: string) => {
  return request.get<PostQcOrgError[]>({ 
    url: '/admin/drug/post-qc/rule-org-errors', 
    params: { reportId, ruleCode } 
  })
}
```

#### 数据类型定义

```typescript
export interface PostQcRuleStatistics {
  ruleCode: string              // 规则编码
  ruleName: string              // 规则名称
  ruleDescription: string       // 规则描述
  totalErrorOrgs: number        // 总错误机构数
  suggestedReturnOrgs: number   // 建议退回机构数
  totalErrorRecords: number     // 总错误记录数
  executeTime: number           // 执行时间
  orgErrors: PostQcOrgError[]   // 机构错误列表
}

export interface PostQcOrgError {
  taskId: number                // 任务ID
  deptId: number                // 机构ID
  deptName: string              // 机构名称
  orgCode: string               // 机构代码
  hospitalLevel: number         // 机构等级 (1-三级, 2-二级, 3-基层)
  hospitalLevelName: string     // 机构等级名称
  totalRecords: number          // 总记录数
  errorRecords: number          // 错误记录数
  errorRate: number             // 错误率
  suggestedReturn: boolean      // 是否建议退回
  suggestedReason?: string      // 建议退回原因
}

export interface PostQcRuleStatisticsVO {
  rules: PostQcRuleStatistics[]
}
```

## 页面展示效果

```
┌─────────────────────────────────────────────────────────────┐
│  [规则数: 8]  [错误机构: 519]  [建议退回: 23]                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ▼ POST_QC_001 参考价格极值检查                               │
│   [错误机构: 519] [建议退回: 23] [错误记录: 1234]            │
├─────────────────────────────────────────────────────────────┤
│ 规则描述：价格超过参考价格100倍或低于1/100                   │
│                                                              │
│ 机构错误列表：                                               │
│ ┌──────────────────────────────────────────────────────┐   │
│ │序号│机构名称│等级│总记录│错误数│错误率│建议退回│原因│   │
│ ├──────────────────────────────────────────────────────┤   │
│ │ 1  │医疗机构A│三级│1000 │ 63  │6.3% │  是   │...  │   │
│ │ 2  │医疗机构B│基层│ 500 │ 47  │9.4% │  否   │ -   │   │
│ └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ▶ POST_QC_002 销售金额为0检查                                │
│   [错误机构: 123] [建议退回: 5] [错误记录: 456]              │
└─────────────────────────────────────────────────────────────┘

...
```

## 核心功能

### 1. 折叠面板

- 使用 `el-collapse` 组件
- 默认展开第一条规则
- 可以同时展开多条规则

### 2. 规则头部

显示内容：
- 规则编码（Tag）
- 规则名称
- 错误机构数（红色 Tag）
- 建议退回机构数（橙色 Tag）
- 错误记录数（灰色 Tag）

### 3. 机构列表

表格列：
- 序号
- 机构名称
- 机构代码
- 等级（Tag，不同颜色）
- 总记录数
- 错误记录数（红色高亮）
- 错误率（Tag，根据等级和错误率显示不同颜色）
- 是否建议退回（Tag）
- 建议退回原因
- 操作（查看错误按钮）

### 4. 错误率颜色规则

**二三级医院**：
- 错误率 >= 5%：红色（danger）
- 错误率 >= 2%：橙色（warning）
- 错误率 < 2%：绿色（success）

**基层医院**：
- 错误率 >= 55%：红色（danger）
- 错误率 >= 30%：橙色（warning）
- 错误率 < 30%：绿色（success）

### 5. 统计计算

- **总规则数**：`ruleStatistics.length`
- **错误机构数（去重）**：遍历所有规则的机构，按 taskId 去重
- **建议退回机构数（去重）**：遍历所有规则的机构，筛选 `suggestedReturn=true`，按 taskId 去重

## 优势

1. **按规则聚合**：便于分析每条规则的执行情况
2. **折叠展示**：减少页面长度，按需展开
3. **清晰的视觉层次**：规则 → 机构 → 错误详情
4. **智能标记**：自动标记建议退回的机构
5. **去重统计**：避免重复计数（一个机构可能违反多条规则）

## 注意事项

1. 默认只展开第一条规则，避免页面过长
2. 机构列表按错误率降序排序
3. 只展示有错误的机构（无错误的机构不在列表中）
4. 查看错误按钮会打开错误详情弹框
5. 建议退回原因只在 `suggestedReturn=true` 时显示

## 测试建议

1. 测试折叠面板的展开/收起
2. 测试机构列表的排序
3. 测试错误率颜色的正确性
4. 测试统计数字的准确性（去重）
5. 测试查看错误按钮的功能
