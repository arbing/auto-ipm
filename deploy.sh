#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="auto-ipm"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="$LAUNCH_AGENTS_DIR/com.$PROJECT_NAME.plist"

echo "正在设置 $PROJECT_NAME..."

if ! command -v bun &> /dev/null; then
    echo "错误: bun 未安装。请先安装 bun。"
    echo "访问 https://bun.sh 获取安装说明。"
    exit 1
fi

echo "正在安装依赖..."
cd "$SCRIPT_DIR"
bun install

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "已从 .env.example 创建 .env 文件"
    echo "请编辑 .env 文件并填入您的实际配置:"
    echo "  - 腾讯云凭证"
    echo "  - 安全组ID"
    echo "  - 飞书Webhook URL"
    echo ""
    read -p "编辑完 .env 文件后按回车继续..."
fi

cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.$PROJECT_NAME</string>
    <key>ProgramArguments</key>
    <array>
        <string>$SCRIPT_DIR/node_modules/.bin/bun</string>
        <string>run</string>
        <string>$SCRIPT_DIR/src/main.ts</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$SCRIPT_DIR</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>2</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>$SCRIPT_DIR/logs/auto-ipm.log</string>
    <key>StandardErrorPath</key>
    <string>$SCRIPT_DIR/logs/auto-ipm-error.log</string>
    <key>RunAtLoad</key>
    <false/>
</dict>
</plist>
EOF

mkdir -p "$SCRIPT_DIR/logs"

echo "正在加载LaunchAgent..."
launchctl load "$PLIST_FILE"

echo ""
echo "✅ 部署完成！"
echo ""
echo "脚本将每天凌晨2点自动运行。"
echo "日志文件位置: $SCRIPT_DIR/logs/"
echo ""
echo "手动运行脚本:"
echo "  cd $SCRIPT_DIR && bun run src/main.ts"
echo ""
echo "停止定时任务:"
echo "  launchctl unload $PLIST_FILE"
echo "  rm $PLIST_FILE"