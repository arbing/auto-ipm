interface FeishuMessage {
  msg_type: 'text' | 'post';
  content: {
    text: string;
  };
}

export class FeishuService {
  private webhookUrl: string;
  
  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }
  
  async sendMessage(message: string): Promise<void> {
    if (!this.webhookUrl) {
      throw new Error('未配置飞书Webhook URL');
    }
    
    const payload: FeishuMessage = {
      msg_type: 'text',
      content: {
        text: message
      }
    };
    
    try {
      const response = await fetch(this.webhookUrl, {
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
}