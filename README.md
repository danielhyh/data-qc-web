# 药品使用监测质量控制平台 - 前端

基于芋道框架（yudao-ui-admin-vue3）二次开发的药品数据质量控制管理后台。

## 技术栈

| 技术 | 版本 |
|------|------|
| Vue | 3.5.12 |
| TypeScript | 5.3.3 |
| Vite | 5.1.4 |
| Element Plus | 2.9.1 |
| Pinia | 2.1.7 |
| UnoCSS | 0.58.5 |
| Vue Router | 4.4.5 |

## 核心业务页面

- `src/views/dataqc/` — 数据质量控制（批量导入、质控规则、使用跟踪）
- `src/views/drug/` — 药品管理（医院数据、目录、出入库）
- `src/views/system/` — 系统管理（用户、角色、权限）

## 快速启动

```bash
# 安装依赖（要求 Node >= 16, pnpm >= 8.6.0）
pnpm install

# 本地开发
pnpm dev

# 连接开发服务器
pnpm dev-server
```

## 构建

```bash
pnpm build:dev     # 开发环境
pnpm build:test    # 测试环境
pnpm build:stage   # 预发环境
pnpm build:prod    # 生产环境
```

## 代码检查

```bash
pnpm ts:check       # TypeScript 类型检查
pnpm lint:eslint     # ESLint
pnpm lint:format     # Prettier
pnpm lint:style      # Stylelint
```

## 部署

```bash
# 生产构建后，使用 nginx 部署
pnpm build:prod
# 产出在 dist-prod/，nginx 配置参考 nginx.conf
```

## 环境配置

- `.env.local` — 本地开发
- `.env.dev` — 开发环境
- `.env.prod` — 生产环境

## 基于芋道框架

本项目基于 [yudao-ui-admin-vue3](https://gitee.com/yudaocode/yudao-ui-admin-vue3) 开发，采用 MIT 开源协议。
