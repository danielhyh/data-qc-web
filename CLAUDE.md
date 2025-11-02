# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中处理代码时提供指导。

## 项目概述

这是一个基于 **Vue 3 + TypeScript + Element Plus** 的 **药物数据质量控制平台**。构建在 YuDao 开源管理框架之上，提供全面的药物数据管理、质量控制规则、批处理和分析功能。

## 开发命令

### 安装与开发
```bash
# 安装依赖 (使用 pnpm，要求 >=8.6.0)
pnpm install

# 本地开发（热重载）
pnpm dev

# 开发服务器（开发环境）
pnpm dev-server
```

### 代码质量与验证
```bash
# TypeScript 类型检查
pnpm ts:check

# ESLint 代码检查
pnpm lint:eslint

# Prettier 代码格式化
pnpm lint:format

# Stylelint 样式检查
pnpm lint:style
```

### 构建
```bash
# 开发环境构建
pnpm build:dev

# 测试环境构建
pnpm build:test

# 预发环境构建
pnpm build:stage

# 生产环境构建
pnpm build:prod
```

**在提交更改前，请始终运行类型检查和代码检查。**

## 架构概述

### 核心技术栈
- **Vue 3.5.12** 配合 Composition API
- **TypeScript 5.3.3** 提供类型安全
- **Vite 5.1.4** 作为构建工具
- **Element Plus 2.9.1** 提供 UI 组件
- **Pinia 2.1.7** 进行状态管理
- **UnoCSS 0.58.5** 提供原子化 CSS

### 关键架构模式

**1. 模块化服务层**
- `src/api/` 中的 API 服务按业务领域组织
- 所有 API 响应使用 TypeScript 接口
- 集中式错误处理和请求拦截器

**2. 组件架构**
- `src/components/` 中的可复用组件
- `src/views/[module]/` 中的特定领域组件
- 一致的组件命名：使用描述性的 PascalCase

**3. 状态管理**
- `src/store/modules/` 中的 Pinia 存储
- 按功能模块化存储（user、app、dict、permission 等）
- 使用 `defineStore` 的 Composition API 模式

**4. 多环境配置**
- 环境特定配置（`.env.local`、`.env.dev`、`.env.prod`）
- 通过 `src/config/` 进行运行时配置
- 功能开关和 API 端点管理

## 业务领域上下文

### 核心模块
- **DataQC** (`src/views/dataqc/`)：药物数据质量控制、批量导入、使用跟踪
- **药物管理** (`src/views/drug/`)：医院数据、目录、入库/出库操作
- **系统** (`src/views/system/`)：用户管理、角色、权限、审计日志
- **AI 集成** (`src/views/ai/`)：聊天、知识库、图像生成、工作流

### 关键业务实体
- **药物数据**：药品信息和元数据
- **医院数据**：医疗机构特定的药物信息
- **质量规则**：数据完整性的可配置验证规则
- **批量操作**：大规模数据导入和处理工作流

## 开发指南

### 文件组织
```
src/api/[domain]/           # 按业务领域划分的 API 服务
src/views/[domain]/         # 按业务领域划分的页面组件
src/components/[feature]/   # 可复用组件
src/types/                  # TypeScript 类型定义
src/utils/                  # 工具函数和助手
```

### 组件模式
- 使用 Composition API (`<script setup lang="ts">`)
- Props 和 emits 使用 TypeScript 接口
- 使用 Element Plus 组件进行一致的表单处理
- 表格组件遵循项目的 Table 包装器模式

### API 服务模式
- 每个领域都有自己的 API 模块（例如 `src/api/dataqc/`）
- 使用 TypeScript 接口定义请求/响应类型
- 遵循 RESTful 约定并进行一致的错误处理
- 利用现有的请求拦截器设置

### 表单和 CRUD 模式
- 使用 `src/components/Form/` 包装器实现一致的表单布局
- 表格操作遵循项目的 CRUD 模式
- 使用模态对话框进行创建/编辑操作
- 使用 Element Plus 规则进行一致的验证

### 国际化
- 所有面向用户的文本都应使用 `$t()` 函数
- 消息键位于 `src/locales/zh-CN.ts` 和 `src/locales/en.ts`
- 遵循现有的嵌套键结构进行组织

## 构建和部署

### 环境特定构建
项目使用多种环境配置：
- **Local**：使用本地 API 端点的开发环境
- **Dev**：开发服务器环境
- **Test**：测试环境
- **Stage**：预发/预生产环境
- **Prod**：生产环境

每个环境都有自己的构建命令和配置文件。

### 包优化
- Vite 自动处理代码分割
- 大型依赖项在适当情况下被外部化
- 生产构建启用压缩
- 配置摇树优化以获得最佳包大小

## 特殊注意事项

### 多租户架构
应用程序支持多租户 SaaS 部署，具有租户特定的数据隔离。

### 权限系统
基于角色的访问控制在整个应用程序中实现。在添加新功能之前，请始终检查现有的权限模式。

### 数据处理
药物数据质量控制领域涉及复杂的数据验证规则和批处理。在修改数据处理逻辑之前，请了解现有的质量控制模式。

### AI 集成
应用程序包含用于聊天、文档处理和工作流自动化的 AI 驱动功能。这些功能与外部 AI 服务集成，需要特定配置。
