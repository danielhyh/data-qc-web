# 📝 现代化字体系统

## 设计理念

建立统一、清晰、优雅的字体排版系统，提升可读性和视觉层次感，适配中英文混排场景。

---

## 字体族

### 主字体（正文）
```css
--font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
                     'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', 
                     'Microsoft YaHei', 'Source Han Sans CN', sans-serif;
```

**优先级：**
1. **系统 UI 字体**：`-apple-system`（macOS/iOS）、`Segoe UI`（Windows）
2. **优质西文字体**：`Roboto`、`Helvetica Neue`
3. **优质中文字体**：`PingFang SC`（苹方）、`Hiragino Sans GB`（冬青黑）
4. **常见中文字体**：`Microsoft YaHei`（微软雅黑）
5. **备用字体**：`Source Han Sans CN`（思源黑体）、`sans-serif`

**特点：**
- ✅ 优先使用系统字体，加载速度快
- ✅ 中英文字体协调统一
- ✅ 跨平台兼容性好

### 等宽字体（数字/代码）
```css
--font-family-mono: 'SF Mono', 'Consolas', 'Liberation Mono', 'Menlo', 
                     'Courier', 'PingFang SC', monospace;
```

**用途：**
- 数字展示（价格、数量、统计数据）
- 代码片段
- 表格中的数字列

**特性：**
```css
font-feature-settings: 'tnum' 1, 'zero' 1;
```
- `tnum`：表格数字（等宽）
- `zero`：斜线零（区分字母 O 和数字 0）

---

## 字体大小层级

| 变量 | 大小 | 用途 | 示例 |
|------|------|------|------|
| `--font-size-xs` | 12px | 辅助文字、表格表头 | 提示文字、时间戳 |
| `--font-size-sm` | 13px | 次要文字、按钮 | 表单标签、表格内容 |
| `--font-size-base` | 14px | 正文、默认文字 | 卡片内容、描述文字 |
| `--font-size-md` | 15px | 强调正文、卡片标题 | 表单输入、卡片头部 |
| `--font-size-lg` | 16px | 小标题 | 区块标题、导航项 |
| `--font-size-xl` | 18px | 中标题 | 对话框标题、页面副标题 |
| `--font-size-2xl` | 20px | 大标题 | 页面标题、模块标题 |
| `--font-size-3xl` | 24px | 特大标题 | 首页标题、重要标题 |
| `--font-size-4xl` | 30px | 超大标题 | Landing 页标题 |
| `--font-size-5xl` | 36px | 巨型标题 | 特殊展示标题 |

### 使用原则
- **基准字号**：14px（`--font-size-base`）
- **缩放比例**：1px 递增（小字号）→ 2-6px 递增（大字号）
- **移动端**：可考虑整体放大 1-2px

---

## 行高层级

| 变量 | 值 | 用途 |
|------|-----|------|
| `--line-height-tight` | 1.2 | 大标题、紧凑标题 |
| `--line-height-snug` | 1.375 | 小标题、卡片标题 |
| `--line-height-normal` | 1.5 | 正文、默认文字 |
| `--line-height-relaxed` | 1.625 | 段落、长文本 |
| `--line-height-loose` | 1.75 | 诗歌、特殊排版 |

### 搭配建议
```scss
/* 标题 - 紧凑行高 */
h1, h2 {
  line-height: var(--line-height-tight);  // 1.2
}

/* 正文 - 舒适行高 */
p, .card-body {
  line-height: var(--line-height-relaxed);  // 1.625
}

/* 表格 - 标准行高 */
table td {
  line-height: var(--line-height-normal);  // 1.5
}
```

---

## 字重层级

| 变量 | 值 | 用途 | 示例 |
|------|-----|------|------|
| `--font-weight-light` | 300 | 超轻文字 | 引用文字、装饰文字 |
| `--font-weight-normal` | 400 | 正文 | 段落、描述文字 |
| `--font-weight-medium` | 500 | 强调文字 | 按钮、标签、导航 |
| `--font-weight-semibold` | 600 | 次要标题 | 卡片标题、表单标签 |
| `--font-weight-bold` | 700 | 主要标题 | 页面标题、重要提示 |

### 使用规范
```scss
/* 标题层级 */
h1, h2 {
  font-weight: var(--font-weight-bold);      // 700
}

h3, h4 {
  font-weight: var(--font-weight-semibold);  // 600
}

h5, h6 {
  font-weight: var(--font-weight-medium);    // 500
}

/* 组件 */
.el-button {
  font-weight: var(--font-weight-medium);    // 500
}

.el-card__header {
  font-weight: var(--font-weight-semibold);  // 600
}
```

---

## 字母间距

| 变量 | 值 | 用途 |
|------|-----|------|
| `--letter-spacing-tight` | -0.02em | 大标题（紧凑） |
| `--letter-spacing-normal` | 0 | 正文（默认） |
| `--letter-spacing-wide` | 0.02em | 卡片标题（舒展） |
| `--letter-spacing-wider` | 0.05em | 表格表头（大写字母） |

### 使用场景
```scss
/* 大标题 - 紧凑间距 */
h1, h2 {
  letter-spacing: var(--letter-spacing-tight);  // -0.02em
}

/* 卡片标题 - 舒展间距 */
.el-card__header {
  letter-spacing: var(--letter-spacing-wide);   // 0.02em
}

/* 表格表头 - 加宽间距（大写字母） */
thead th {
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wider);  // 0.05em
}
```

---

## 标题层级系统

### H1 - 页面主标题
```scss
font-size: 30px;
line-height: 1.2;
font-weight: 700;
letter-spacing: -0.02em;
margin-bottom: 1rem;
```
**用途**：页面最高级标题、Landing 页标题

### H2 - 页面副标题
```scss
font-size: 24px;
line-height: 1.2;
font-weight: 700;
letter-spacing: -0.02em;
margin-bottom: 0.875rem;
```
**用途**：页面次级标题、模块标题

### H3 - 区块标题
```scss
font-size: 20px;
line-height: 1.375;
font-weight: 600;
margin-bottom: 0.75rem;
```
**用途**：卡片区块标题、表单分组标题

### H4 - 小标题
```scss
font-size: 18px;
line-height: 1.375;
font-weight: 600;
margin-bottom: 0.625rem;
```
**用途**：对话框标题、侧边栏标题

### H5、H6 - 辅助标题
```scss
font-size: 16px / 14px;
line-height: 1.5;
font-weight: 500;
color: var(--tech-text-secondary);
margin-bottom: 0.5rem;
```
**用途**：列表标题、小组件标题

---

## 工具类

### 字号工具类
```html
<div class="text-xs">12px 文字</div>
<div class="text-sm">13px 文字</div>
<div class="text-base">14px 文字（默认）</div>
<div class="text-lg">16px 文字</div>
<div class="text-xl">18px 文字</div>
```

### 字重工具类
```html
<span class="font-light">300 轻</span>
<span class="font-normal">400 常规</span>
<span class="font-medium">500 中等</span>
<span class="font-semibold">600 半粗</span>
<span class="font-bold">700 粗体</span>
```

### 颜色工具类
```html
<p class="text-primary">#1e293b 主要文字</p>
<p class="text-secondary">#64748b 次要文字</p>
<p class="text-tertiary">#94a3b8 辅助文字</p>
<p class="text-brand">#5B8DEF 品牌色</p>
```

---

## 组件字体应用

### 卡片
```scss
.el-card__header {
  font-size: var(--font-size-md);      // 15px
  font-weight: var(--font-weight-semibold);  // 600
  letter-spacing: var(--letter-spacing-wide);
}

.el-card__body {
  font-size: var(--font-size-base);    // 14px
  line-height: var(--line-height-relaxed);  // 1.625
}
```

### 表格
```scss
thead th {
  font-size: var(--font-size-xs);      // 12px
  font-weight: var(--font-weight-semibold);  // 600
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wider);  // 0.05em
}

tbody td {
  font-size: var(--font-size-sm);      // 13px
  line-height: var(--line-height-normal);  // 1.5
}
```

### 按钮
```scss
.el-button {
  font-size: var(--font-size-sm);      // 13px
  font-weight: var(--font-weight-medium);  // 500
  letter-spacing: var(--letter-spacing-normal);
  line-height: var(--line-height-snug);  // 1.375
}
```

### 表单标签
```scss
.el-form-item__label {
  font-size: var(--font-size-sm);      // 13px
  font-weight: var(--font-weight-medium);  // 500
  line-height: var(--line-height-normal);  // 1.5
}
```

---

## 数字显示优化

### 等宽数字
```scss
.stat-value,
.price,
.quantity {
  font-family: var(--font-family-mono);
  font-feature-settings: 'tnum' 1, 'zero' 1;
  font-weight: var(--font-weight-semibold);
}
```

**示例：**
```html
<div class="stat-value font-mono">
  1,234,567
</div>
```

### 大数字展示
```scss
.display-number {
  font-size: var(--font-size-4xl);     // 30px
  font-weight: var(--font-weight-bold);  // 700
  line-height: var(--line-height-tight);  // 1.2
  font-family: var(--font-family-mono);
}
```

---

## 特殊样式

### 链接
```scss
a {
  color: var(--tech-primary-color);
  text-decoration: none;
  transition: color 0.2s ease;
  
  &:hover {
    color: var(--tech-secondary-color);
  }
}
```

### 代码
```scss
code, kbd, samp, pre {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  background: rgba(91, 141, 239, 0.08);
  padding: 0.125em 0.375em;
  border-radius: 4px;
}
```

### 强调
```scss
strong, b {
  font-weight: var(--font-weight-semibold);  // 600
}

em, i {
  font-style: italic;
  color: var(--tech-text-secondary);
}
```

---

## 可读性优化

### 文字渲染
```css
html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  -webkit-text-size-adjust: 100%;
}
```

### 段落间距
```scss
p {
  margin-bottom: 1rem;
  line-height: var(--line-height-relaxed);  // 1.625
}
```

### 列表间距
```scss
ul, ol {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
  
  li {
    margin-bottom: 0.25rem;
    line-height: var(--line-height-relaxed);
  }
}
```

---

## 响应式建议

### 移动端调整
```scss
@media (max-width: 768px) {
  html {
    font-size: 13px;  /* 基准字号缩小 */
  }
  
  h1, .h1 {
    font-size: var(--font-size-3xl);  /* 标题缩小 */
  }
  
  h2, .h2 {
    font-size: var(--font-size-2xl);
  }
}
```

### 平板端优化
```scss
@media (min-width: 769px) and (max-width: 1024px) {
  html {
    font-size: 13.5px;
  }
}
```

---

## 使用建议

### 1. 统一使用 CSS 变量
```scss
/* ✅ 推荐 */
.title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

/* ❌ 不推荐 */
.title {
  font-size: 16px;
  font-weight: 600;
}
```

### 2. 保持层级清晰
- 页面最多使用 H1-H4
- 避免层级跳跃（H1 → H3）
- 标题和正文要有明显对比

### 3. 注意中英文混排
- 英文单词前后留空格
- 数字与单位之间留空格
- 标点符号使用中文标点

### 4. 性能优化
- 优先使用系统字体
- 避免加载过多 Web 字体
- 使用 `font-display: swap` 防止文字闪烁

---

**更新日期：** 2025-10-24  
**版本：** v1.0 现代化字体系统  
**适用范围：** 全局排版系统

