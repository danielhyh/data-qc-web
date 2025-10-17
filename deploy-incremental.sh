#!/bin/bash
# ============================================================
# 前端增量部署脚本 - 利用浏览器缓存机制
# ============================================================

set -e

# ========== 配置区域(请修改为你的服务器信息) ==========
SERVER_USER="root"
SERVER_HOST="your-server-ip"
REMOTE_DIR="/opt/nginx/html"
LOCAL_DIST="dist"
BUILD_ENV="prod"  # dev/test/stage/prod

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}       前端增量部署脚本${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# ========== 步骤1: 构建前端项目 ==========
echo -e "${YELLOW}[步骤1/4] 构建前端项目 (环境: $BUILD_ENV)...${NC}"

# 记录开始时间
BUILD_START=$(date +%s)

case $BUILD_ENV in
    dev)
        pnpm build:dev
        ;;
    test)
        pnpm build:test
        ;;
    stage)
        pnpm build:stage
        ;;
    prod)
        pnpm build:prod
        ;;
    *)
        echo -e "${RED}错误: 未知的构建环境 $BUILD_ENV${NC}"
        exit 1
        ;;
esac

# 计算构建耗时
BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))

if [ ! -d "$LOCAL_DIST" ]; then
    echo -e "${RED}错误: 构建失败,未找到 $LOCAL_DIST 目录${NC}"
    exit 1
fi

DIST_SIZE=$(du -sh "$LOCAL_DIST" | cut -f1)
echo -e "${GREEN}✓ 构建成功! 耗时: ${BUILD_TIME}秒${NC}"
echo -e "  - 构建大小: ${GREEN}$DIST_SIZE${NC}"
echo ""

# ========== 步骤2: 分析文件变更 ==========
echo -e "${YELLOW}[步骤2/4] 分析文件变更...${NC}"

# 创建临时文件存储本地文件列表
LOCAL_FILES=$(mktemp)
find "$LOCAL_DIST" -type f -exec md5sum {} \; > "$LOCAL_FILES"
LOCAL_FILE_COUNT=$(wc -l < "$LOCAL_FILES")

echo -e "${BLUE}本地文件总数: $LOCAL_FILE_COUNT${NC}"
echo ""

# ========== 步骤3: 增量上传 ==========
echo -e "${YELLOW}[步骤3/4] 增量上传到服务器...${NC}"

# 记录上传开始时间
UPLOAD_START=$(date +%s)

# 使用 rsync 增量同步
# --checksum: 使用校验和而不是时间戳来判断文件是否变更
# --delete: 删除目标目录中源目录没有的文件
# --exclude: 排除不需要同步的文件
echo -e "${BLUE}使用 rsync 增量同步...${NC}"
rsync -avz \
    --checksum \
    --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.DS_Store' \
    --exclude='*.map' \
    --stats \
    --human-readable \
    "$LOCAL_DIST/" \
    ${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}/ \
    2>&1 | tee /tmp/rsync-output.log

# 计算上传耗时
UPLOAD_END=$(date +%s)
UPLOAD_TIME=$((UPLOAD_END - UPLOAD_START))

echo -e "${GREEN}✓ 文件上传完成! 耗时: ${UPLOAD_TIME}秒${NC}"
echo ""

# ========== 步骤4: 分析同步结果 ==========
echo -e "${YELLOW}[步骤4/4] 分析同步结果...${NC}"

# 从 rsync 输出中提取统计信息
if [ -f /tmp/rsync-output.log ]; then
    SENT_SIZE=$(grep "Total bytes sent" /tmp/rsync-output.log | awk '{print $4}')
    if [ -n "$SENT_SIZE" ]; then
        # 转换字节为人类可读格式
        if [ $SENT_SIZE -lt 1024 ]; then
            SENT_READABLE="${SENT_SIZE}B"
        elif [ $SENT_SIZE -lt 1048576 ]; then
            SENT_READABLE="$((SENT_SIZE / 1024))KB"
        else
            SENT_READABLE="$((SENT_SIZE / 1048576))MB"
        fi
        echo -e "${BLUE}实际传输大小: ${GREEN}$SENT_READABLE${NC}"
    fi
fi

# 清理临时文件
rm -f "$LOCAL_FILES" /tmp/rsync-output.log

echo ""

# ========== 完成 ==========
TOTAL_TIME=$((BUILD_TIME + UPLOAD_TIME))

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}           前端增量部署完成!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}部署统计:${NC}"
echo -e "  构建耗时: ${BUILD_TIME}秒"
echo -e "  上传耗时: ${UPLOAD_TIME}秒"
echo -e "  总耗时: ${TOTAL_TIME}秒"
echo -e "  构建环境: ${GREEN}$BUILD_ENV${NC}"
echo ""
echo -e "${BLUE}浏览器缓存优化:${NC}"
echo -e "  ✓ 静态资源使用内容哈希命名"
echo -e "  ✓ 未变更的文件浏览器自动使用缓存"
echo -e "  ✓ 只有变更的文件会重新下载"
echo ""
echo -e "${BLUE}服务器访问地址:${NC}"
echo -e "  http://${SERVER_HOST}"
echo ""
echo -e "${BLUE}建议配置 Nginx 缓存策略:${NC}"
echo -e "  location ~* \\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {"
echo -e "      expires 1y;"
echo -e "      add_header Cache-Control \"public, immutable\";"
echo -e "  }"
echo -e ""
echo -e "  location ~* \\\\.html$ {"
echo -e "      expires -1;"
echo -e "      add_header Cache-Control \"no-cache, no-store, must-revalidate\";"
echo -e "  }"
