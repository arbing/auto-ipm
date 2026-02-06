# AGENTS.md - auto-ipm 项目指南

本文件为在 auto-ipm 项目中工作的 AI 代理提供开发规范和指南。

## 项目概述

auto-ipm 是一个 CLI 工具，用于自动获取本机公网 IP 并更新腾讯云安全组参数模板。支持飞书群消息通知、定时任务管理和日志记录。

- **运行时**: Bun + TypeScript
- **主入口**: `src/main.ts`
- **编译输出**: `dist/auto-ipm` (独立可执行文件)

## 构建与运行命令

### 基础命令

```bash
# 安装依赖
bun install

# 开发模式运行
bun run dev

# 直接运行（开发）
bun run src/main.ts

# 编译为独立可执行文件
bun build src/main.ts --compile --outfile=dist/auto-ipm

# 运行编译后的可执行文件
./dist/auto-ipm
```

### 定时任务管理命令

```bash
# 直接运行（手动执行IP更新）
./dist/auto-ipm

# 安装定时任务（示例：每天9:30执行）
./dist/auto-ipm cron add "30 9 * * *"

# 查看已安装的定时任务
./dist/auto-ipm cron list

# 卸载所有定时任务
./dist/auto-ipm cron remove
```

### 环境变量配置

项目使用 `.env` 文件配置环境变量，复制 `.env.example` 作为模板：

```bash
cp .env.example .env
```

必需配置项：
- `TENCENT_CLOUD_SECRET_ID` - 腾讯云 Secret ID
- `TENCENT_CLOUD_SECRET_KEY` - 腾讯云 Secret Key  
- `TENCENT_CLOUD_REGION` - 腾讯云区域（如 ap-beijing）
- `ADDRESS_TEMPLATE_ID` - IP 地址模板 ID
- `ADDRESS_TEMPLATE_MEMBER_DESCRIPTION` - 地址模板成员描述

可选配置：
- `FEISHU_WEBHOOK_URL` - 飞书群机器人 Webhook URL

## 代码风格规范

### 通用规范

- **缩进**: 使用 2 空格缩进，不使用 Tab
- **行尾**: 使用 LF (Unix 风格)
- **编码**: UTF-8
- **单行长度**: 建议不超过 120 字符

### TypeScript 规范

#### 类型定义

```typescript
// 推荐：使用 interface 定义对象类型
interface UserInfo {
  id: string;
  name: string;
  email?: string;  // 可选属性使用 ?
}

// 推荐：使用 type 定义联合类型或复杂类型
type IpResponse = {
  ip: string;
  source: 'cip.cc' | 'ip.cn';
};

// 推荐：导出类型时使用 export
export interface Config {
  secretId: string;
  secretKey: string;
  region: string;
}
```

#### 函数定义

```typescript
// 推荐：使用显式返回类型
function getPublicIp(): Promise<string> {
  // 函数实现
}

// 推荐：异步函数返回 Promise<T>
async function fetchIpFromService(url: string): Promise<IpResponse> {
  // 实现
}

// 推荐：可选参数使用 ?
function logMessage(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  // 实现
}
```

#### 变量声明

```typescript
// 推荐：使用 const 声明常量
const CONFIG_FILE_PATH = './.env';

// 推荐：仅当值会改变时使用 let
let retryCount = 0;

// 推荐：避免使用 any，使用具体类型或 unknown
// ❌ 避免
const data: any = response;

// ✅ 推荐
const data: unknown = response;
if (typeof data === 'object' && data !== null) {
  // 处理
}
```

### 命名规范

```typescript
// 变量和函数：camelCase
const publicIp = '1.2.3.4';
function getPublicIp(): string {}

// 常量：UPPER_SNAKE_CASE
const TENCENT_CLOUD_API_URL = 'https://tencentcloud.api.com';

// 类和接口：PascalCase
class IpFetcher {
  // ...
}

interface ConfigLoader {
  // ...
}

// 私有属性：前缀 _
class Service {
  private _config: Config;
}

// 文件命名：kebab-case
// src/ip-fetcher.ts
// src/config-loader.ts
```

### 导入规范

```typescript
// ✅ 推荐：使用命名导入
import { readFileSync } from 'fs';
import { Injectable } from '@nestjs/common';

// ✅ 推荐：类型导入使用 type（TypeScript 3.8+）
import type { Config } from './types';

// ✅ 推荐：排序分组
import fs from 'fs';
import path from 'path';

import type { Request, Response } from 'express';
import { Injectable } from '@nestjs/common';

// ❌ 避免：默认导入与命名导入混用
import fs, { readFileSync } from 'fs';
```

### 错误处理

```typescript
// ✅ 推荐：使用 try-catch 处理异步错误
async function fetchIp(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org');
    return await response.text();
  } catch (error) {
    console.error('Failed to fetch IP:', error);
    throw new Error('IP fetch failed');
  }
}

// ✅ 推荐：创建自定义错误类
class ConfigurationError extends Error {
  constructor(message: string, public readonly missingKey: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// ✅ 推荐：验证输入参数
function validateConfig(config: Record<string, string>): void {
  const required = ['TENCENT_CLOUD_SECRET_ID', 'TENCENT_CLOUD_SECRET_KEY'];
  for (const key of required) {
    if (!config[key]) {
      throw new ConfigurationError(`Missing required config: ${key}`, key);
    }
  }
}
```

### 日志记录

```typescript
// ✅ 推荐：使用项目已有的日志模块
import { logger } from './utils/logger';

// ✅ 推荐：不同级别日志
logger.info('Starting IP update process');
logger.warn('Retrying IP fetch, attempt ' + attempt);
logger.error('Failed to update Tencent Cloud template', error);
```

### 注释规范

```typescript
// ✅ 推荐：使用 JSDoc 注释公共 API
/**
 * 获取本机公网 IP 地址
 * @param sources - 要尝试的 IP 获取源列表
 * @returns 公网 IP 地址
 * @throws {IpFetchError} 所有源都无法获取 IP 时抛出
 */
function getPublicIp(sources: string[] = ['cip.cc', 'ip.cn']): Promise<string> {
  // 实现
}

// ✅ 推荐：复杂逻辑添加行内注释
function parseCronExpression(expr: string): CronParts {
  const parts = expr.split(' '); // 将表达式拆分为5个字段
  if (parts.length !== 5) {
    throw new Error('Invalid cron expression');
  }
  // 验证每个字段的有效范围
  // ...
}

// ❌ 避免：注释显而易见的内容
// i 递增
i++;
```

### 代码组织

```
src/
├── main.ts              # 程序入口
├── config/              # 配置相关
│   ├── index.ts
│   └── loader.ts
├── services/            # 业务逻辑
│   ├── ip-fetcher.ts
│   └── tencent-cloud.ts
├── utils/                # 工具函数
│   ├── logger.ts
│   └── validator.ts
├── types/                # 类型定义
│   └── index.ts
└── cli/                  # 命令行处理
    └── commands.ts
```

## 腾讯云 API 集成规范

### 客户端初始化

```typescript
// ✅ 推荐：使用配置对象初始化客户端
import { vpc } from 'tencentcloud-sdk-nodejs-vpc';

const client = new vpc.Client({
  credential: {
    secretId: process.env.TENCENT_CLOUD_SECRET_ID!,
    secretKey: process.env.TENCENT_CLOUD_SECRET_KEY!,
  },
  region: process.env.TENCENT_CLOUD_REGION || 'ap-beijing',
  profile: {
    httpProfile: {
      endpoint: 'vpc.tencentcloudapi.com',
    },
  },
});
```

### API 调用模式

```typescript
// ✅ 推荐：封装 API 调用函数
async function updateAddressTemplate(
  templateId: string,
  memberDescription: string,
  newIp: string
): Promise<void> {
  const params = {
    AddressTemplateId: templateId,
    Filters: [
      {
        Name: 'address-template-member-description',
        Values: [memberDescription],
      },
    ],
    // ...
  };

  await client.ModifyAddressTemplateGroupAttribute(params);
}

// ✅ 推荐：处理 API 错误
try {
  await client.DescribeAddressTemplateMembers(params);
} catch (error) {
  if (error.code === 'ResourceNotFound') {
    throw new Error('Address template not found');
  }
  throw error;
}
```

## 测试指南

当前项目未配置测试框架。如需添加测试，建议：

```bash
# 安装 bun test（如果使用 Bun 内置测试）
bun test

# 运行单个测试文件
bun test src/utils/logger.test.ts

# 运行匹配特定模式的测试
bun test --filter "logger"
```

## 依赖管理

### 添加依赖

```bash
# 生产依赖
bun add <package-name>

# 开发依赖
bun add -d <package-name> --dev
```

### 主要依赖

- `tencentcloud-sdk-nodejs-vpc`: 腾讯云 VPC SDK
- `yargs`: 命令行参数解析
- `typescript`: 开发依赖，类型支持

## 常见任务

### 添加新的 IP 获取源

1. 在 `src/services/ip-fetcher.ts` 中创建新函数
2. 实现 `fetchIp()` 接口
3. 添加到源列表中
4. 添加错误处理和回退逻辑

### 添加新的 CLI 命令

1. 在 `src/cli/commands.ts` 中添加命令处理
2. 使用 yargs API 注册命令
3. 添加命令帮助信息

### 修改日志配置

1. 编辑 `src/utils/logger.ts`
2. 修改日志级别或输出格式
3. 确保不影响现有日志调用