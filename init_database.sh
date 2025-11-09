#!/bin/bash
# Nocodile 数据库快速初始化脚本

echo "🗄️  Nocodile 数据库初始化工具"
echo "=================================="
echo ""

# 检查是否在 Docker 环境
if [ -f /.dockerenv ] || [ -n "$DOCKER_CONTAINER" ]; then
    echo "🐳 检测到 Docker 环境"
    MYSQL_HOST=${MYSQL_HOST:-database}
    MYSQL_PORT=${MYSQL_PORT:-3306}
else
    echo "💻 检测到本地环境"
    MYSQL_HOST=${MYSQL_HOST:-localhost}
    MYSQL_PORT=${MYSQL_PORT:-3306}
fi

# 设置默认值（与 server.py 保持一致）
MYSQL_USER=${MYSQL_USER:-root}
MYSQL_PASSWORD=${MYSQL_PASSWORD:-12345678}
MYSQL_DATABASE=${MYSQL_DATABASE:-Nocodile}

echo "📋 数据库配置:"
echo "   主机: $MYSQL_HOST"
echo "   端口: $MYSQL_PORT"
echo "   用户: $MYSQL_USER"
echo "   数据库: $MYSQL_DATABASE"
echo ""

# 导出环境变量
export MYSQL_HOST
export MYSQL_USER
export MYSQL_PASSWORD
export MYSQL_DATABASE
export MYSQL_PORT

# 获取脚本目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 检查初始化脚本是否存在
INIT_SCRIPT="$SCRIPT_DIR/database/create_object_detection_db.py"

if [ ! -f "$INIT_SCRIPT" ]; then
    echo "❌ 错误: 找不到初始化脚本: $INIT_SCRIPT"
    exit 1
fi

# 检查 Python 是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 Python3，请先安装 Python"
    exit 1
fi

echo "🚀 开始初始化数据库..."
echo ""

# 运行初始化脚本
python3 "$INIT_SCRIPT"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 数据库初始化成功！"
    echo ""
    echo "📝 下一步:"
    echo "   1. 启动后端服务: cd backend && python server.py"
    echo "   2. 或使用 Docker: docker-compose up"
    exit 0
else
    echo ""
    echo "❌ 数据库初始化失败！"
    echo "   请检查错误信息并重试"
    exit 1
fi

