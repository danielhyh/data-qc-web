@echo off
chcp 65001 >nul
setlocal

REM ========== 配置区域(请修改为你的服务器信息) ==========
set SERVER_USER=root
set SERVER_HOST=你的服务器IP
set REMOTE_DIR=/opt/nginx/html

echo ================================================
echo     前端手动部署 - Windows 环境 (固定 prod)
echo ================================================
echo.

REM ========== 步骤1: 构建前端 ==========
echo [1/2] 构建前端项目 (prod 环境)...
echo.
call pnpm build:prod

if not exist "dist" (
    echo.
    echo ❌ 构建失败,未找到 dist 目录
    pause
    exit /b 1
)

echo.
echo ✓ 构建成功!
echo.
dir dist | find "个文件"
echo.

REM ========== 步骤2: 打包上传 ==========
echo [2/2] 打包并上传到服务器...
echo.

echo 正在打包 dist 目录...
tar -czf dist.tar.gz dist/

if not exist "dist.tar.gz" (
    echo.
    echo ❌ 打包失败
    pause
    exit /b 1
)

echo ✓ 打包成功!
echo.

echo 正在上传到服务器...
scp dist.tar.gz %SERVER_USER%@%SERVER_HOST%:/tmp/

echo.
echo 正在解压覆盖...
ssh %SERVER_USER%@%SERVER_HOST% "cd %REMOTE_DIR% && tar -xzf /tmp/dist.tar.gz --strip-components=1 && rm /tmp/dist.tar.gz"

echo.
echo 清理本地打包文件...
del dist.tar.gz

echo.
echo ================================================
echo       前端部署完成!
echo ================================================
echo.
echo 访问地址: http://%SERVER_HOST%
echo.
echo 注意: 如果浏览器有缓存,按 Ctrl+F5 强制刷新
echo.
pause


