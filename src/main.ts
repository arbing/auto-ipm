import { vpc } from "tencentcloud-sdk-nodejs-vpc";

interface Config {
  tencentCloud: {
    secretId: string;
    secretKey: string;
    region: string;
  };
  
  addressTemplate: {
    templateId: string;
    memberDescription: string;
  };
  
  feishu: {
    webhookUrl: string;
  };
}

function loadConfig(): Config {
  return {
    tencentCloud: {
      secretId: process.env.TENCENT_CLOUD_SECRET_ID || '',
      secretKey: process.env.TENCENT_CLOUD_SECRET_KEY || '',
      region: process.env.TENCENT_CLOUD_REGION || 'ap-beijing'
    },
    addressTemplate: {
      templateId: process.env.ADDRESS_TEMPLATE_ID || '',
      memberDescription: process.env.ADDRESS_TEMPLATE_MEMBER_DESCRIPTION || 'auto-ipm'
    },
    feishu: {
      webhookUrl: process.env.FEISHU_WEBHOOK_URL || ''
    }
  };
}

function validateConfig(config: Config): void {
  const requiredFields = [
    { key: 'tencentCloud.secretId', value: config.tencentCloud.secretId },
    { key: 'tencentCloud.secretKey', value: config.tencentCloud.secretKey },
    { key: 'addressTemplate.templateId', value: config.addressTemplate.templateId },
    { key: 'addressTemplate.memberDescription', value: config.addressTemplate.memberDescription }
  ];

  const missingFields = requiredFields.filter(field => !field.value);
  
  if (missingFields.length > 0) {
    throw new Error(`缺少必要的配置字段: ${missingFields.map(f => f.key).join(', ')}`);
  }
}

const IP_SERVICES = [
  'https://cip.cc',
  'https://ip.cn'
];

async function fetchIpFromService(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'auto-ipm/1.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return null;
    }
    
    const text = await response.text();
    let ip = '';
    
    const match = text.match(/(\d+\.\d+\.\d+\.\d+)/);
    if (match) {
      ip = match[1];
    }
    
    if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)) {
      return ip;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function getPublicIp(): Promise<string> {
  for (const service of IP_SERVICES) {
    const ip = await fetchIpFromService(service);
    if (ip) {
      console.log(`成功从 ${service} 获取公网IP: ${ip}`);
      return ip;
    }
  }
  
  throw new Error('从所有可用服务获取公网IP失败');
}

interface FeishuMessage {
  msg_type: 'text' | 'post';
  content: {
    text: string;
  };
}

async function sendFeishuMessage(webhookUrl: string, message: string): Promise<void> {
  if (!webhookUrl) {
    throw new Error('未配置飞书Webhook URL');
  }
  
  const payload: FeishuMessage = {
    msg_type: 'text',
    content: {
      text: message
    }
  };
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`发送消息到飞书失败: ${response.status} ${response.statusText}`);
    }
    
    console.log('消息已成功发送到飞书');
  } catch (error) {
    throw new Error(`发送消息到飞书失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

interface AddressInfo {
  Address: string;
  Description?: string;
}

async function getAddressTemplateMember(templateId: string, memberDescription: string, config: Config): Promise<string | null> {
  try {
    console.log(`正在查询地址模板 ${templateId} 中描述为 "${memberDescription}" 的成员...`);
    
    const client = new vpc.v20170312.Client({
      credential: {
        secretId: config.tencentCloud.secretId,
        secretKey: config.tencentCloud.secretKey,
      },
      region: config.tencentCloud.region,
      profile: {
        httpProfile: {
          endpoint: "vpc.tencentcloudapi.com",
        },
      },
    });
    
    const params = {
      Filters: [
        {
          Name: "address-template-id",
          Values: [templateId]
        }
      ],
      NeedMemberInfo: true
    };
    
    const data = await client.DescribeAddressTemplates(params);
    
    if (!data) {
      throw new Error('API返回空响应');
    }
    
    if (!data.AddressTemplateSet) {
      console.log('AddressTemplateSet字段不存在，检查模板ID是否正确');
      return null;
    }
    
    if (data.AddressTemplateSet.length === 0) {
      console.log(`未找到地址模板: ${templateId}`);
      return null;
    }
    
    const template = data.AddressTemplateSet[0];
    
    if (template.AddressExtraSet) {
      for (const addressInfo of template.AddressExtraSet) {
        if (addressInfo.Description === memberDescription) {
          console.log(`找到匹配描述 "${memberDescription}" 的IP: ${addressInfo.Address}`);
          return addressInfo.Address;
        }
      }
    }
    
    console.log(`未找到描述为 "${memberDescription}" 的成员`);
    return null;
  } catch (error) {
    console.error('查询地址模板成员时发生错误:', error);
    throw new Error(`查询地址模板成员失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function updateAddressTemplateMember(templateId: string, memberDescription: string, currentIp: string | null, newIp: string, config: Config): Promise<void> {
  try {
    console.log(`正在更新地址模板 ${templateId} 中描述为 "${memberDescription}" 的成员，新IP: ${newIp}`);
    
    const client = new vpc.v20170312.Client({
      credential: {
        secretId: config.tencentCloud.secretId,
        secretKey: config.tencentCloud.secretKey,
      },
      region: config.tencentCloud.region,
      profile: {
        httpProfile: {
          endpoint: "vpc.tencentcloudapi.com",
        },
      },
    });
    
    const originalMembers = [];
    const newMembers = [];
    
    if (currentIp) {
      originalMembers.push({
        Member: currentIp,
        Description: memberDescription
      });
      newMembers.push({
        Member: `${newIp}/32`,
        Description: memberDescription
      });
    } else {
      newMembers.push({
        Member: `${newIp}/32`,
        Description: memberDescription
      });
    }
    
    const params = {
      TemplateId: templateId,
      OriginalTemplateMember: originalMembers,
      TemplateMember: newMembers
    };
    
    await client.ModifyTemplateMember(params);
    
    console.log(`地址模板成员更新成功`);
  } catch (error) {
    console.error('更新地址模板成员时发生错误:', error);
    throw new Error(`更新地址模板成员失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main(): Promise<void> {
  try {
    const config = loadConfig();
    validateConfig(config);
    
    console.log('开始自动IP管理...');
    
    const currentIp = await getPublicIp();
    console.log(`当前公网IP: ${currentIp}`);
    
    const existingIp = await getAddressTemplateMember(
      config.addressTemplate.templateId,
      config.addressTemplate.memberDescription,
      config
    );
    
    const needsUpdate = !existingIp || existingIp !== `${currentIp}/32`;
    
    if (needsUpdate) {
      console.log('IP已发生变化，正在更新地址模板成员...');
      await updateAddressTemplateMember(
        config.addressTemplate.templateId,
        config.addressTemplate.memberDescription,
        existingIp,
        currentIp,
        config
      );
      
      await sendFeishuMessage(config.feishu.webhookUrl, `✅ 自动IP管理器: 成功更新地址模板成员，新IP为 ${currentIp}`);
      console.log('地址模板成员更新成功');
    } else {
      console.log('IP未发生变化，无需更新');
      await sendFeishuMessage(config.feishu.webhookUrl, `ℹ️ 自动IP管理器: IP未变化 (${currentIp})，无需更新`);
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('自动IP管理发生错误:', errorMessage);
    
    try {
      const config = loadConfig();
      if (config.feishu.webhookUrl) {
        await sendFeishuMessage(config.feishu.webhookUrl, `❌ 自动IP管理器: 执行失败，错误信息: ${errorMessage}`);
      }
    } catch (feishuError) {
      console.error('发送错误消息到飞书失败:', feishuError);
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}