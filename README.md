# 自动IP管理器 (Auto IP Manager)

自动获取本机公网IP并更新腾讯云地址模板的工具，支持飞书通知。

## 功能特性

- 自动获取当前机器的公网IP地址（使用国内服务 cip.cc 和 ip.cn）
- 根据成员描述信息查询地址模板中的特定IP
- 当IP发生变化时自动更新指定描述的地址模板成员
- 成功和失败都会发送通知到飞书群
- 支持macOS系统定时任务（LaunchAgent）

## 技术栈

- 运行时: [Bun](https://bun.sh)
- 语言: TypeScript
- 依赖: 腾讯云官方VPC SDK、内置HTTP客户端

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd auto-ipm
```

### 2. 安装依赖

```bash
bun install
```

### 3. 配置环境变量

复制环境变量模板并编辑：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入以下信息：

```env
# 腾讯云配置
TENCENT_CLOUD_SECRET_ID=your_secret_id_here
TENCENT_CLOUD_SECRET_KEY=your_secret_key_here
TENCENT_CLOUD_REGION=ap-beijing

# 地址模板配置
ADDRESS_TEMPLATE_ID=ipm-xxxxxxxx
ADDRESS_TEMPLATE_MEMBER_DESCRIPTION=auto-ipm

# 飞书 webhook URL
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/your-webhook-id
```

### 4. 手动测试

```bash
bun run src/main.ts
```

### 5. 一键部署定时任务

```bash
./deploy.sh
```

脚本会：
- 安装项目依赖
- 创建日志目录
- 设置每天凌晨2点自动运行
- 配置标准输出和错误日志

## 配置说明

### 腾讯云配置

- `TENCENT_CLOUD_SECRET_ID`: 腾讯云API密钥ID
- `TENCENT_CLOUD_SECRET_KEY`: 腾讯云API密钥
- `TENCENT_CLOUD_REGION`: 地域，默认为 `ap-beijing`

### 地址模板配置

- `ADDRESS_TEMPLATE_ID`: 要更新的地址模板ID（如 `ipm-xxxxxxxx`）
- `ADDRESS_TEMPLATE_MEMBER_DESCRIPTION`: 要管理的模板成员描述信息，默认为 `auto-ipm`

### 飞书配置

- `FEISHU_WEBHOOK_URL`: 飞书自定义机器人Webhook URL

## API 使用说明

### DescribeAddressTemplates
- 通过 `address-template-id` 过滤器查询指定的地址模板
- 设置 `NeedMemberInfo: true` 以获取包含描述信息的详细成员列表 (`AddressExtraSet`)
- 根据 `Description` 字段匹配特定的模板成员

### ModifyTemplateMember
- 修改地址模板的特定成员
- 需要提供原始成员信息（包含Description）和新成员信息
- 支持添加新成员（当原成员不存在时）或更新现有成员

## 公网IP获取服务

- **主服务**: `https://cip.cc` - 国内快速IP查询服务
- **备选服务**: `https://ip.cn` - 国内IP查询服务
- **超时设置**: 5秒超时，确保脚本不会长时间等待
- **User-Agent**: `auto-ipm/1.0` 用于识别请求来源

## 工作流程

1. 获取当前公网IP（优先使用 cip.cc，失败则使用 ip.cn）
2. 查询地址模板中具有指定描述的成员
3. 比较当前IP与模板中的IP
4. 如果不同，更新模板成员为新IP
5. 发送成功/失败通知到飞书

## 定时任务管理

### 查看定时任务状态

```bash
launchctl list | grep auto-ipm
```

### 停止定时任务

```bash
launchctl unload ~/Library/LaunchAgents/com.auto-ipm.plist
rm ~/Library/LaunchAgents/com.auto-ipm.plist
```

### 日志文件

- 标准输出日志: `logs/auto-ipm.log`
- 错误日志: `logs/auto-ipm-error.log`

## 注意事项

1. 确保腾讯云账号有修改地址模板的权限
2. 飞书Webhook URL需要在飞书群中创建自定义机器人获取
3. 脚本默认每天凌晨2点运行，可以在 `deploy.sh` 中修改时间
4. 公网IP获取使用国内服务 `cip.cc` 和 `ip.cn`，提高访问速度和可靠性
5. 地址模板成员必须有描述信息才能被管理

## 故障排除

如果遇到问题，请检查：
- 环境变量是否正确配置
- 腾讯云API密钥是否有足够权限
- 网络连接是否正常
- 日志文件中的错误信息

## 许可证

MIT License