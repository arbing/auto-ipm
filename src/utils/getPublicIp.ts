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

export async function getPublicIp(): Promise<string> {
  for (const service of IP_SERVICES) {
    const ip = await fetchIpFromService(service);
    if (ip) {
      console.log(`成功从 ${service} 获取公网IP: ${ip}`);
      return ip;
    }
  }
  
  throw new Error('从所有可用服务获取公网IP失败');
}