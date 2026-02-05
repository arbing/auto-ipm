import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "fs";
import path from "path";
import { info, error } from "../logger";

const LOG_DIR = path.join(process.cwd(), "logs");
const INFO_LOG = path.join(LOG_DIR, "info.log");
const ERROR_LOG = path.join(LOG_DIR, "error.log");

describe("Logger Module", () => {
  beforeEach(() => {
    // 清理日志文件
    if (fs.existsSync(INFO_LOG)) {
      fs.unlinkSync(INFO_LOG);
    }
    if (fs.existsSync(ERROR_LOG)) {
      fs.unlinkSync(ERROR_LOG);
    }
  });

  afterEach(() => {
    // 清理日志文件
    if (fs.existsSync(INFO_LOG)) {
      fs.unlinkSync(INFO_LOG);
    }
    if (fs.existsSync(ERROR_LOG)) {
      fs.unlinkSync(ERROR_LOG);
    }
  });

  it("should create info.log file when info() is called", () => {
    info("Test info message");
    expect(fs.existsSync(INFO_LOG)).toBe(true);
  });

  it("should create error.log file when error() is called", () => {
    error("Test error message");
    expect(fs.existsSync(ERROR_LOG)).toBe(true);
  });

  it("should write message with timestamp to info.log", () => {
    info("Test info message");
    const content = fs.readFileSync(INFO_LOG, "utf8");
    expect(content).toContain("Test info message");
    // Check timestamp format [YYYY-MM-DDTHH:mm:ss.sssZ]
    expect(content).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
  });

  it("should write message with timestamp to error.log", () => {
    error("Test error message");
    const content = fs.readFileSync(ERROR_LOG, "utf8");
    expect(content).toContain("Test error message");
    // Check timestamp format
    expect(content).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
  });

  it("should append to existing log files", () => {
    info("First message");
    info("Second message");
    const content = fs.readFileSync(INFO_LOG, "utf8");
    expect(content).toContain("First message");
    expect(content).toContain("Second message");
  });
});
