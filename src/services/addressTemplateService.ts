import { vpc } from "tencentcloud-sdk-nodejs-vpc";
import { loadConfig } from "../config/config";

interface AddressInfo {
  Address: string;
  Description?: string;
}

export class AddressTemplateService {
  private client: any;
  private region: string;
  
  constructor() {
    const config = loadConfig();
    this.region = config.tencentCloud.region;
    
    this.client = new vpc.v20170312.Client({
      credential: {
        secretId: config.tencentCloud.secretId,
        secretKey: config.tencentCloud.secretKey,
      },
      region: this.region,
      profile: {
        httpProfile: {
          endpoint: "vpc.tencentcloudapi.com",
        },
      },
    });
  }
  
  async getAddressTemplateMember(templateId: string, memberDescription: string): Promise<string | null> {
    try {
      console.log(`正在查询地址模板 ${templateId} 中描述为 "${memberDescription}" 的成员...`);
      
      const params = {
        Filters: [
          {
            Name: "address-template-id",
            Values: [templateId]
          }
        ],
        NeedMemberInfo: true
      };
      
      const data = await this.client.DescribeAddressTemplates(params);
      
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
  
  async updateAddressTemplateMember(templateId: string, memberDescription: string, currentIp: string | null, newIp: string): Promise<void> {
    try {
      console.log(`正在更新地址模板 ${templateId} 中描述为 "${memberDescription}" 的成员，新IP: ${newIp}`);
      
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
      
      await this.client.ModifyTemplateMember(params);
      
      console.log(`地址模板成员更新成功`);
    } catch (error) {
      console.error('更新地址模板成员时发生错误:', error);
      throw new Error(`更新地址模板成员失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}