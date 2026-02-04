import { getPublicIp } from './utils/getPublicIp';
import { FeishuService } from './services/feishuService';
import { AddressTemplateService } from './services/addressTemplateService';
import { loadConfig, validateConfig } from './config/config';

async function main(): Promise<void> {
  try {
    const config = loadConfig();
    validateConfig(config);
    
    console.log('开始自动IP管理...');
    
    const currentIp = await getPublicIp();
    console.log(`当前公网IP: ${currentIp}`);
    
    const feishuService = new FeishuService(config.feishu.webhookUrl);
    const addressTemplateService = new AddressTemplateService();
    
    const existingIp = await addressTemplateService.getAddressTemplateMember(
      config.addressTemplate.templateId,
      config.addressTemplate.memberDescription
    );
    
    const needsUpdate = !existingIp || existingIp !== `${currentIp}/32`;
    
    if (needsUpdate) {
      console.log('IP已发生变化，正在更新地址模板成员...');
      await addressTemplateService.updateAddressTemplateMember(
        config.addressTemplate.templateId,
        config.addressTemplate.memberDescription,
        existingIp,
        currentIp
      );
      
      await feishuService.sendMessage(`✅ 自动IP管理器: 成功更新地址模板成员，新IP为 ${currentIp}`);
      console.log('地址模板成员更新成功');
    } else {
      console.log('IP未发生变化，无需更新');
      await feishuService.sendMessage(`ℹ️ 自动IP管理器: IP未变化 (${currentIp})，无需更新`);
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('自动IP管理发生错误:', errorMessage);
    
    try {
      const config = loadConfig();
      if (config.feishu.webhookUrl) {
        const feishuService = new FeishuService(config.feishu.webhookUrl);
        await feishuService.sendMessage(`❌ 自动IP管理器: 执行失败，错误信息: ${errorMessage}`);
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