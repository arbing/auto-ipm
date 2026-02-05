import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const INFO_LOG = path.join(LOG_DIR, "info.log");
const ERROR_LOG = path.join(LOG_DIR, "error.log");

export function info(message: string): void {
  // 控制台输出（不包含时间戳）
  process.stdout.write(message + "\n");
  
  // 文件输出（包含时间戳）
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(INFO_LOG, formatted);
}

export function error(message: string): void {
  // 控制台输出（不包含时间戳）
  process.stderr.write(message + "\n");
  
  // 文件输出（包含时间戳）
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(ERROR_LOG, formatted);
}