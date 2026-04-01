import { describe, it, expect, vi, afterEach } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logger (dev mode)", () => {
  /**
   * The logger evaluates isProd at module-load time, so we use
   * vi.importActual + dynamic import after setting up the env.
   * In test/vitest environments import.meta.env.MODE is "test" (not
   * "production"), so all log levels are enabled.
   */
  it("calls console.debug with [DEBUG] prefix", async () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const { logger } = await import("@/utils/logger");
    logger.debug("test-debug", 42);
    expect(spy).toHaveBeenCalledWith("[DEBUG]", "test-debug", 42);
  });

  it("calls console.info with [INFO] prefix", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const { logger } = await import("@/utils/logger");
    logger.info("test-info");
    expect(spy).toHaveBeenCalledWith("[INFO]", "test-info");
  });

  it("calls console.warn with [WARN] prefix", async () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { logger } = await import("@/utils/logger");
    logger.warn("test-warn");
    expect(spy).toHaveBeenCalledWith("[WARN]", "test-warn");
  });

  it("calls console.error with [ERROR] prefix", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { logger } = await import("@/utils/logger");
    logger.error("test-error", new Error("boom"));
    expect(spy).toHaveBeenCalledWith("[ERROR]", "test-error", expect.any(Error));
  });

  it("passes multiple arguments through to the underlying console method", async () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const { logger } = await import("@/utils/logger");
    logger.debug("a", "b", "c");
    expect(spy).toHaveBeenCalledWith("[DEBUG]", "a", "b", "c");
  });
});
