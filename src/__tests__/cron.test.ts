import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { execSync } from "child_process";
import { listCronJobs, addCronJob, removeCronJobs } from "../cron";

describe("Cron Module", () => {
  beforeEach(() => {
    // 清理所有 auto-ipm 相关的定时任务
    try {
      execSync("crontab -l | grep -v 'auto-ipm' | crontab -");
    } catch {
      // Ignore errors if no crontab exists
    }
  });

  afterEach(() => {
    // 清理所有 auto-ipm 相关的定时任务
    try {
      execSync("crontab -l | grep -v 'auto-ipm' | crontab -");
    } catch {
      // Ignore errors
    }
  });

  it("should return empty array when no cron jobs exist", () => {
    const jobs = listCronJobs();
    expect(jobs).toEqual([]);
  });

  it("should add a new cron job", () => {
    const schedule = "0 9 * * *";
    addCronJob(schedule);
    
    const jobs = listCronJobs();
    expect(jobs.length).toBe(1);
    expect(jobs[0].schedule).toBe(schedule);
    expect(jobs[0].command).toContain("auto-ipm");
  });

  it("should not add duplicate cron jobs", () => {
    const schedule = "0 9 * * *";
    addCronJob(schedule);
    addCronJob(schedule);
    
    const jobs = listCronJobs();
    expect(jobs.length).toBe(1);
  });

  it("should remove all auto-ipm cron jobs", () => {
    addCronJob("0 9 * * *");
    addCronJob("30 18 * * 1-5");
    
    let jobs = listCronJobs();
    expect(jobs.length).toBe(2);
    
    removeCronJobs();
    
    jobs = listCronJobs();
    expect(jobs.length).toBe(0);
  });

  it("should handle removing when no jobs exist", () => {
    // Should not throw error
    expect(() => removeCronJobs()).not.toThrow();
  });
});
