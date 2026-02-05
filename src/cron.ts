import { execSync } from "child_process";
import path from "path";
import { info as logInfo, error as logError } from "./logger";

const SCRIPT_PATH = path.resolve(process.cwd(), "auto-ipm");

export interface CronJob {
  schedule: string;
  command: string;
}

export function listCronJobs(): CronJob[] {
  try {
    const output = execSync("crontab -l", { encoding: "utf8" });
    const lines = output.split("\n").filter((line) => line.trim());

    return lines
      .filter((line) => line.includes("auto-ipm"))
      .map((line) => {
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
  const jobs = listCronJobs();
  const newEntry = `${schedule} ${SCRIPT_PATH}`;

  // 检查是否已存在完全相同的条目
  const existingJob = jobs.find(
    (job) => job.schedule === schedule && job.command.includes("auto-ipm"),
  );

  if (existingJob) {
    logInfo("定时任务已存在");
    return;
  }

  // 将新条目添加到 crontab
  try {
    const currentCrontab = execSync("crontab -l 2>/dev/null || echo ''", {
      encoding: "utf8",
    });
    const newCrontab = currentCrontab.trim() + "\n" + newEntry + "\n";

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

  // 移除所有 auto-ipm 相关的 cron 条目
  try {
    execSync("crontab -l | grep -v 'auto-ipm' | crontab -", {
      encoding: "utf8",
    });
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
    jobs.forEach((job) => {
      logInfo(`${job.schedule} ${job.command}`);
    });
  }
}
