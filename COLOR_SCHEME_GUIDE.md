# 🎨 统一色彩方案指南

## 设计理念

基于蓝紫渐变的现代科技感配色，所有菜单相关元素使用统一协调的色彩体系。

---

## 核心颜色

### 主色调
```css
--tech-primary-color: #5B8DEF;      /* 主题蓝 */
--tech-secondary-color: #7c3aed;    /* 紫色 */
```

### 渐变色
```css
--tech-gradient-primary: linear-gradient(135deg, #5B8DEF 0%, #7c3aed 100%);
```

---

## 菜单色彩体系

### 1. 背景渐变层级

#### 层级 1 - 容器背景（最淡）
```css
--tech-gradient-bg-1: linear-gradient(135deg, rgba(91,141,239,0.04), rgba(124,58,237,0.03));
```
**用途：**
- Logo 区域背景
- 左侧菜单容器背景
- 顶部菜单容器背景

**透明度：** 0.04 → 0.03  
**视觉效果：** 非常淡的蓝紫渐变，几乎不可察觉

#### 层级 2 - 悬停背景
```css
--tech-gradient-bg-2: linear-gradient(135deg, rgba(91,141,239,0.06), rgba(124,58,237,0.04));
```
**用途：**
- Logo 区域悬停
- 容器级悬停效果

**透明度：** 0.06 → 0.04  
**视觉效果：** 淡雅的悬停反馈

#### 层级 3 - 强调背景
```css
--tech-gradient-bg-3: linear-gradient(135deg, rgba(91,141,239,0.08), rgba(124,58,237,0.06));
```
**用途：**
- 父级菜单选中状态
- 特殊强调区域

**透明度：** 0.08 → 0.06  
**视觉效果：** 明显的选中反馈

### 2. 交互状态颜色

#### 悬停效果
```css
--tech-hover-bg: rgba(91, 141, 239, 0.06);           /* 标准悬停 */
--tech-hover-bg-light: rgba(91, 141, 239, 0.04);     /* 轻量悬停 */
```

**应用场景：**
- 菜单项悬停：`--tech-hover-bg`
- 顶部布局 Logo 悬停：`--tech-hover-bg-light`
- 子菜单项悬停：`--tech-hover-bg`

#### 激活状态
```css
--tech-active-bg: rgba(91, 141, 239, 0.12);          /* 激活背景 */
--tech-parent-active-bg: rgba(91, 141, 239, 0.08);   /* 父级激活 */
```

**应用场景：**
- 菜单项激活：`var(--tech-gradient-primary)` 完整渐变
- 父级菜单激活：`--tech-parent-active-bg`
- 下拉框选中项：`--tech-active-bg`

---

## 透明度体系

### 层级说明
```
0.03-0.04  →  容器背景（几乎透明）
0.04-0.06  →  轻量悬停（淡雅反馈）
0.06       →  标准悬停（明显反馈）
0.08       →  父级选中（强调状态）
0.12       →  激活选中（清晰对比）
1.00       →  完全不透明（主色按钮、选中项）
```

### 设计原则
1. **层级分明**：每个透明度级别差距约 0.02-0.04
2. **视觉舒适**：背景不遮挡内容，保持可读性
3. **交互清晰**：悬停和选中状态有明显区分
4. **统一协调**：所有元素使用同一套透明度体系

---

## 具体应用

### Logo 区域
```scss
// 默认背景
background: var(--tech-gradient-bg-1);

// 悬停背景（经典布局）
&:hover {
  background: var(--tech-gradient-bg-2);
}

// 悬停背景（顶部布局）
&:hover.v-logo__Top {
  background: var(--tech-hover-bg-light);
}
```

### 左侧菜单容器
```scss
// 垂直渐变
background: linear-gradient(180deg, 
  rgba(91, 141, 239, 0.04) 0%,   // 顶部
  rgba(124, 58, 237, 0.03) 100%  // 底部
);
```

### 顶部菜单容器
```scss
// 水平渐变
background: linear-gradient(90deg, 
  rgba(91, 141, 239, 0.04) 0%,    // 左侧
  rgba(124, 58, 237, 0.03) 50%,   // 中间
  rgba(91, 141, 239, 0.04) 100%   // 右侧
);
```

### 菜单项
```scss
// 默认
background: transparent;

// 悬停
&:hover {
  background: var(--tech-hover-bg);
  color: var(--tech-primary-color);
}

// 激活
&.is-active {
  background: var(--tech-gradient-primary);
  color: white;
}

// 父级激活
.is-active > & {
  background: var(--tech-parent-active-bg);
  color: var(--tech-primary-color);
}
```

---

## 色彩协调原则

### 1. 统一色相
- 所有蓝色使用 `91, 141, 239` (RGB)
- 所有紫色使用 `124, 58, 237` (RGB)
- 避免使用其他蓝紫色调

### 2. 统一渐变方向
- Logo 区域：135deg（斜角）
- 左侧菜单：180deg（从上到下）
- 顶部菜单：90deg（从左到右）
- 保持渐变起止色一致

### 3. 统一透明度递进
- 容器 → 悬停 → 选中，透明度递增
- 每级递增约 0.02-0.04
- 保持视觉层次清晰

### 4. 统一过渡动画
```scss
transition: all 0.25s ease;
```

---

## 对比度检查

### 文字可读性
- 主文字：`#1e293b` 在 0.04 透明度背景上 ✓
- 悬停文字：`#5B8DEF` 在 0.06 透明度背景上 ✓
- 激活文字：`white` 在完整渐变背景上 ✓

### 视觉层次
- 背景 vs 悬停：0.02-0.04 差异，清晰可辨 ✓
- 悬停 vs 选中：0.06 差异，明显区分 ✓
- 父级 vs 子级：0.02 差异，层次分明 ✓

---

## 使用建议

### 1. 新增菜单元素
参照现有透明度体系，选择合适的层级：
- 容器类：使用 `--tech-gradient-bg-1`
- 悬停类：使用 `--tech-hover-bg`
- 选中类：使用 `--tech-parent-active-bg` 或完整渐变

### 2. 自定义颜色
如需调整，只需修改 `var.css` 中的变量：
```css
/* 调整主色调 */
--tech-primary-color: #yourColor;

/* 调整透明度 */
--tech-hover-bg: rgba(91, 141, 239, 0.yourValue);
```

### 3. 保持一致性
- 不要直接使用硬编码的颜色值
- 始终使用 CSS 变量
- 新增颜色前检查是否已有类似定义

---

## 视觉效果总结

✅ **统一性**
- Logo、菜单、顶部栏使用同一套颜色体系
- 所有渐变色基于 #5B8DEF 和 #7c3aed
- 透明度层级统一规划

✅ **协调性**
- 背景色从淡到深层次分明
- 悬停和选中状态区分清晰
- 整体视觉和谐统一

✅ **专业性**
- 科技感十足的蓝紫配色
- 现代化的渐变设计
- 细腻的交互反馈

---

**更新日期：** 2025-10-24  
**色彩版本：** v2.0 统一协调版  
**适用范围：** 全局菜单系统

