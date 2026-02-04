export interface Config {
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

export function loadConfig(): Config {
  return {
    tencentCloud: {
      secretId: process.env.TENCENT_CLOUD_SECRET_ID || '',
      secretKey: process.env.TENCENT_CLOUD_SECRET_KEY || '',
      region: process.env.TENCENT_CLOUD_REGION || ''
    },
    addressTemplate: {
      templateId: process.env.ADDRESS_TEMPLATE_ID || '',
      memberDescription: process.env.ADDRESS_TEMPLATE_MEMBER_DESCRIPTION || ''
    },
    feishu: {
      webhookUrl: process.env.FEISHU_WEBHOOK_URL || ''
    }
  };
}

export function validateConfig(config: Config): void {
  const requiredFields = [
    { key: 'tencentCloud.secretId', value: config.tencentCloud.secretId },
    { key: 'tencentCloud.secretKey', value: config.tencentCloud.secretKey },
    { key: 'addressTemplate.templateId', value: config.addressTemplate.templateId },
    { key: 'addressTemplate.memberDescription', value: config.addressTemplate.memberDescription },
    // { key: 'feishu.webhookUrl', value: config.feishu.webhookUrl }
  ];

  const missingFields = requiredFields.filter(field => !field.value);

  if (missingFields.length > 0) {
    throw new Error(`缺少必要的配置字段: ${missingFields.map(f => f.key).join(', ')}`);
  }
}
