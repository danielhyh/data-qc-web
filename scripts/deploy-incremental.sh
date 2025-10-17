#!/bin/bash
# 前端增量部署脚本

set -e

# ========== 配置区域 ==========
SERVER_USER="root"
SERVER_HOST="your-server-ip"
SERVER_PATH="/opt/nginx/html"
LOCAL_DIST="dist"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}前端增量部署脚本${NC}"
echo -e "${GREEN}================================${NC}"

# 检查 dist 目录
if [ ! -d "$LOCAL_DIST" ]; then
    echo -e "${RED}错误: 未找到 $LOCAL_DIST 目录,请先构建项目${NC}"
    exit 1
fi

echo -e "${YELLOW}开始增量同步...${NC}"

# 使用 rsync 增量上传
# --delete: 删除目标目录中源目录没有的文件
# --exclude: 排除不需要同步的文件
rsync -avz \
    --progress \
    --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.DS_Store' \
    --checksum \
    "$LOCAL_DIST/" \
    ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

echo -e "${GREEN}部署完成!${NC}"

# 显示变更统计
echo -e "${YELLOW}变更统计:${NC}"
rsync -avz \
    --dry-run \
    --stats \
    --exclude='.git' \
    --exclude='node_modules' \
    "$LOCAL_DIST/" \
    ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/
