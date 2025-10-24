# 📂 菜单字体样式指南

## 菜单字体体系

### 设计原则
- **清晰易读**：确保菜单文字清晰可辨
- **层级分明**：父级、子级菜单字体有区分
- **状态明确**：默认、悬停、激活状态字体有变化
- **图标协调**：图标大小与文字协调统一

---

## 一级菜单（顶级目录）

### 默认状态
```scss
.el-menu-item,
.el-sub-menu__title {
  font-size: var(--font-size-sm);        // 13px
  font-weight: var(--font-weight-medium); // 500
  line-height: var(--line-height-normal); // 1.5
  letter-spacing: var(--letter-spacing-normal); // 0
  color: var(--tech-text-primary);       // #1e293b
}
```

**特点：**
- 字号：13px（清晰但不过大）
- 字重：500（medium，适中强调）
- 行高：1.5（标准行高，易读）
- 颜色：主要文字色（深灰）

### 激活状态
```scss
.el-menu-item.is-active,
.el-sub-menu.is-active > .el-sub-menu__title {
  font-size: var(--font-size-sm);           // 13px
  font-weight: var(--font-weight-semibold); // 600
  color: white;  // 白色（渐变背景上）
}
```

**特点：**
- 字重：600（semibold，更粗，突出选中）
- 颜色：白色（在渐变背景上清晰可见）

---

## 二级/三级菜单（子菜单）

### 默认状态
```scss
.el-menu .el-menu .el-menu-item {
  font-size: var(--font-size-xs);        // 12px
  font-weight: var(--font-weight-normal); // 400
  line-height: var(--line-height-normal); // 1.5
  padding-left: 48px;
}
```

**特点：**
- 字号：12px（比一级菜单小，体现层级）
- 字重：400（normal，较细，次要层级）
- 左缩进：48px（明确层级关系）

### 激活状态
```scss
.el-menu .el-menu .el-menu-item.is-active {
  font-weight: var(--font-weight-medium); // 500
  color: white;
}
```

**特点：**
- 字重：500（medium，比默认粗一点）
- 圆点指示器：白色 + 蓝色光晕

---

## Logo 区域

### 系统标题
```scss
.logo-title {
  font-size: var(--font-size-sm);         // 13px
  font-weight: var(--font-weight-bold);   // 700
  line-height: var(--line-height-tight);  // 1.2
  letter-spacing: var(--letter-spacing-wide); // 0.02em
  background: linear-gradient(...);
}
```

**特点：**
- 字号：13px（与菜单一致）
- 字重：700（bold，突出品牌）
- 行高：1.2（紧凑，节省空间）
- 字母间距：0.02em（舒展，优雅）
- 渐变文字（科技感）

### 机构名称
```scss
.logo-dept {
  font-size: var(--font-size-xs);        // 12px
  font-weight: var(--font-weight-medium); // 500
  line-height: var(--line-height-normal); // 1.5
  letter-spacing: var(--letter-spacing-normal); // 0
}
```

**特点：**
- 字号：12px（辅助信息）
- 字重：500（medium，不过分强调）
- 徽章样式（圆角背景 + 边框）

---

## 图标系统

### 菜单图标
```scss
.el-menu-item [class^="el-icon"],
.el-sub-menu__title [class^="el-icon"] {
  font-size: 16px;
  margin-right: 8px;
}
```

**特点：**
- 大小：16px（比文字略大，突出）
- 间距：右侧 8px（与文字有呼吸感）
- 颜色：继承文字颜色

### 展开箭头
```scss
.el-sub-menu__icon-arrow {
  font-size: 12px;
  font-weight: var(--font-weight-semibold); // 600
}

/* 展开状态 */
.el-sub-menu.is-opened > .el-sub-menu__title .el-sub-menu__icon-arrow {
  color: var(--tech-primary-color);
  font-weight: var(--font-weight-bold); // 700
}
```

**特点：**
- 大小：12px（小巧，不抢眼）
- 字重：600（semibold，清晰）
- 展开时：蓝色 + 加粗（700）

---

## 字体层级对比

| 元素 | 字号 | 字重 | 行高 | 用途 |
|------|------|------|------|------|
| Logo 标题 | 13px | 700 | 1.2 | 品牌标识 |
| 机构名称 | 12px | 500 | 1.5 | 辅助信息 |
| 一级菜单 | 13px | 500 | 1.5 | 主菜单项 |
| 一级菜单激活 | 13px | 600 | 1.5 | 选中菜单 |
| 二级菜单 | 12px | 400 | 1.5 | 子菜单项 |
| 二级菜单激活 | 12px | 500 | 1.5 | 选中子菜单 |
| 菜单图标 | 16px | - | - | 视觉辅助 |
| 展开箭头 | 12px | 600 | - | 交互提示 |

---

## 状态变化对比

### 一级菜单状态
```
默认：  13px / 500 / #1e293b
悬停：  13px / 500 / #5B8DEF
激活：  13px / 600 / white (渐变背景)
```

### 二级菜单状态
```
默认：  12px / 400 / #1e293b
悬停：  12px / 400 / #5B8DEF
激活：  12px / 500 / white (渐变背景)
```

### 展开箭头状态
```
折叠：  12px / 600 / #94a3b8
展开：  12px / 700 / #5B8DEF
```

---

## 响应式调整

### 移动端（< 768px）
```scss
@media (max-width: 768px) {
  .el-menu-item,
  .el-sub-menu__title {
    font-size: 14px;  // 增大 1px，便于点击
  }
  
  .el-menu .el-menu .el-menu-item {
    font-size: 13px;  // 增大 1px
  }
  
  .el-menu-item [class^="el-icon"] {
    font-size: 18px;  // 图标增大，便于识别
  }
}
```

### 平板端（768px - 1024px）
```scss
@media (min-width: 768px) and (max-width: 1024px) {
  // 保持桌面端字号，确保一致性
}
```

---

## 可读性优化

### 最小点击区域
```scss
.el-menu-item,
.el-sub-menu__title {
  min-height: 40px;  // 确保至少 40px 高度
  padding: 8px 16px; // 足够的内边距
}
```

### 文字截断
```scss
.el-menu-item,
.el-sub-menu__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### 对比度
```scss
/* 确保文字与背景对比度 > 4.5:1 */
color: var(--tech-text-primary);  // #1e293b (深色)
background: transparent;          // 浅色背景

/* 激活状态对比度 > 7:1 */
color: white;                     // 白色文字
background: var(--tech-gradient-primary); // 深色渐变
```

---

## 动画过渡

### 字重过渡
```scss
.el-menu-item,
.el-sub-menu__title {
  transition: all 0.25s ease;
  
  &:hover,
  &.is-active {
    // 字重变化平滑过渡
    // 注意：font-weight 本身不支持过渡
    // 但颜色、背景可以过渡
  }
}
```

### 颜色过渡
```scss
.el-menu-item {
  color: var(--tech-text-primary);
  transition: color 0.25s ease;
  
  &:hover {
    color: var(--tech-primary-color);
  }
}
```

---

## 使用示例

### HTML 结构
```html
<el-menu>
  <!-- 一级菜单 -->
  <el-menu-item index="1">
    <el-icon><IconHome /></el-icon>
    <span>首页</span>
  </el-menu-item>
  
  <!-- 带子菜单的一级菜单 -->
  <el-sub-menu index="2">
    <template #title>
      <el-icon><IconSetting /></el-icon>
      <span>系统设置</span>
    </template>
    
    <!-- 二级菜单 -->
    <el-menu-item index="2-1">
      <span>用户管理</span>
    </el-menu-item>
    <el-menu-item index="2-2">
      <span>角色管理</span>
    </el-menu-item>
  </el-sub-menu>
</el-menu>
```

### 样式效果
- **一级菜单**：13px / 中等字重 / 清晰图标
- **二级菜单**：12px / 普通字重 / 圆点指示器
- **激活状态**：加粗字体 / 渐变背景 / 白色文字

---

## 设计建议

### 1. 保持一致性
- 所有菜单使用统一的字体族
- 统一的字号层级体系
- 统一的字重变化规则

### 2. 突出层级
- 一级菜单略大（13px）
- 二级菜单略小（12px）
- 激活状态加粗

### 3. 图标协调
- 图标大小（16px）> 文字（13px）
- 图标与文字垂直居中对齐
- 图标与文字间距适中（8px）

### 4. 状态明确
- 默认：中等字重
- 悬停：颜色变化
- 激活：字重 + 颜色 + 背景

### 5. 可访问性
- 文字对比度 > 4.5:1
- 最小点击区域 40px
- 支持键盘导航

---

## 注意事项

1. **不要过度强调**
   - 避免所有菜单都用粗体
   - 避免字号过大影响布局

2. **保持呼吸感**
   - 菜单项之间有适当间距
   - 图标与文字有间距
   - 不要过于拥挤

3. **考虑长文本**
   - 使用 text-overflow: ellipsis
   - 提供 title 提示
   - 考虑换行处理（子菜单）

4. **测试不同场景**
   - 短文本（"首页"）
   - 中等文本（"系统管理"）
   - 长文本（"药品质量控制管理系统"）

---

**更新日期：** 2025-10-24  
**版本：** v1.0 菜单字体规范  
**适用范围：** 左侧菜单、顶部菜单、Logo 区域

