import { execSync } from "child_process";
import path from "path";
import { info as logInfo, error as logError } from "./logger";

export interface CronJob {
  schedule: string;
  command: string;
}

export function listCronJobs(): CronJob[] {
  try {
    const output = execSync("crontab -l", { encoding: "utf8" });
    const lines = output.split("\n").filter(line => line.trim());
    
    return lines
      .filter(line => line.includes("auto-ipm"))
      .map(line => {
        const parts = line.trim().split(/\s+/);
        const schedule = parts.slice(0, 5).join(" ");
        const command = parts.slice(5).join(" ");
        return { schedule, command };
      });
  } catch {
    return [];
  }
}

export function addCronJob(schedule: string): void {
  const cronParts = schedule.trim().split(/\s+/);
  if (cronParts.length !== 5) {
    throw new Error("无效的 cron 表达式，必须包含 5 个字段");
  }

  const jobs = listCronJobs();
  
  // 获取当前可执行文件的绝对路径
  const currentExecutablePath = process.execPath;
  const workDir = path.dirname(currentExecutablePath);
  
  // 构建带 cd 命令的完整命令
  const fullCommand = `cd ${workDir} && ./${path.basename(currentExecutablePath)}`;
  const newEntry = `${schedule} ${fullCommand}`;

  const existingJob = jobs.find(
    job => job.schedule === schedule && job.command.includes("auto-ipm")
  );

  if (existingJob) {
    logInfo("定时任务已存在");
    return;
  }

  try {
    // 获取现有的非 auto-ipm 条目
    let existingLines = [];
    try {
      const currentCrontab = execSync("crontab -l", { encoding: "utf8" });
      existingLines = currentCrontab
        .split("\n")
        .filter(line => line.trim() && !line.includes("auto-ipm"));
    } catch {
      // 没有现有 crontab
    }

    // 添加新条目
    existingLines.push(newEntry);
    const newCrontab = existingLines.join("\n") + "\n";
    
    execSync(`echo "${newCrontab}" | crontab -`, { encoding: "utf8" });
    logInfo(`定时任务已安装: ${schedule}`);
  } catch (error) {
    logError(`安装定时任务失败: ${error}`);
    throw error;
  }
}

export function removeCronJobs(): void {
  const jobs = listCronJobs();

  if (jobs.length === 0) {
    logInfo("没有找到定时任务");
    return;
  }

  try {
    // 获取所有非 auto-ipm 的行
    let nonAutoIpmLines = [];
    try {
      const currentCrontab = execSync("crontab -l", { encoding: "utf8" });
      nonAutoIpmLines = currentCrontab
        .split("\n")
        .filter(line => line.trim() && !line.includes("auto-ipm"));
    } catch {
      // 没有现有 crontab
    }

    if (nonAutoIpmLines.length > 0) {
      const newCrontab = nonAutoIpmLines.join("\n") + "\n";
      execSync(`echo "${newCrontab}" | crontab -`, { encoding: "utf8" });
    } else {
      // 如果没有剩余的行，清除整个 crontab
      execSync("crontab -r", { encoding: "utf8" });
    }
    
    logInfo("定时任务已卸载");
  } catch (error) {
    logError(`卸载定时任务失败: ${error}`);
    throw error;
  }
}

export function displayCronJobs(): void {
  const jobs = listCronJobs();

  if (jobs.length === 0) {
    logInfo("没有找到定时任务");
  } else {
    jobs.forEach(job => {
      logInfo(`${job.schedule} ${job.command}`);
    });
  }
}