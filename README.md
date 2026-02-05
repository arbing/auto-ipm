# IP白名单自动更新工具

自动获取本机公网IP并更新腾讯云安全组参数模板的工具。

## 功能

- 获取当前公网IP（国内服务 cip.cc + ip.cn）
- 查询/更新腾讯云安全组参数模板指定描述的成员IP
- 支持飞书群消息通知
- 编译为独立可执行文件，加载`.env`环境变量，直接运行
- 支持定时任务管理，通过命令行安装/卸载/查看定时任务
- 支持日志记录，分为标准输出日志和错误日志

## 快速开始

```bash
# 安装依赖
bun install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件填入配置

# 手动运行测试
bun run src/main.ts

# 编译为可执行文件
bun build src/main.ts --compile --outfile=dist/auto-ipm

# 运行可执行文件
cd dist
./auto-ipm
```

## 环境变量

```env
TENCENT_CLOUD_SECRET_ID=腾讯云SecretId
TENCENT_CLOUD_SECRET_KEY=腾讯云SecretKey
TENCENT_CLOUD_REGION=ap-beijing

ADDRESS_TEMPLATE_ID=地址模板ID
ADDRESS_TEMPLATE_MEMBER_DESCRIPTION=成员描述

FEISHU_WEBHOOK_URL=飞书Webhook地址
```

## 定时任务管理

```bash
# 直接运行
./auto-ipm

# 安装定时任务（每天9点30执行一次）
./auto-ipm cron add "30 9 * * *"

# 卸载定时任务
./auto-ipm cron remove

# 查看定时任务
./auto-ipm cron list
```

## 日志

- `logs/info.log` - 标准输出
- `logs/error.log` - 错误日志
