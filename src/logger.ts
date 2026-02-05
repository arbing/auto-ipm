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
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] ${message}\n`;
  process.stdout.write(formatted);
  fs.appendFileSync(INFO_LOG, formatted);
}

export function error(message: string): void {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] ${message}\n`;
  process.stderr.write(formatted);
  fs.appendFileSync(ERROR_LOG, formatted);
}
