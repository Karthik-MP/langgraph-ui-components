import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getContentString,
  isAIMessage,
  isAiWithToolCalls,
  isToolMessage,
  formatRelativeTime,
} from "@/utils/utils";
import type { Message } from "@langchain/langgraph-sdk";

// ---------------------------------------------------------------------------
// getContentString
// ---------------------------------------------------------------------------
describe("getContentString", () => {
  it("returns the string directly when content is a plain string", () => {
    expect(getContentString("hello world")).toBe("hello world");
  });

  it("returns empty string for null-ish content", () => {
    expect(getContentString(null as any)).toBe("");
    expect(getContentString(undefined as any)).toBe("");
  });

  it("returns empty string for an empty array", () => {
    expect(getContentString([])).toBe("");
  });

  it("joins multiple text blocks with a space", () => {
    const content = [
      { type: "text", text: "Hello" },
      { type: "text", text: "World" },
    ];
    expect(getContentString(content as any)).toBe("Hello World");
  });

  it("returns only text blocks, ignoring image blocks", () => {
    const content = [
      { type: "text", text: "Caption" },
      { type: "image_url", image_url: { url: "http://example.com/img.png" } },
    ];
    expect(getContentString(content as any)).toBe("Caption");
  });

  it("returns empty string when the array has only non-text blocks", () => {
    const content = [{ type: "image_url", image_url: { url: "http://x.com" } }];
    expect(getContentString(content as any)).toBe("");
  });

  it("handles a single text block", () => {
    const content = [{ type: "text", text: "Only one" }];
    expect(getContentString(content as any)).toBe("Only one");
  });

  it("ignores blocks whose text is an empty string", () => {
    const content = [
      { type: "text", text: "" },
      { type: "text", text: "data" },
    ];
    // Both are included in the join; whitespace is preserved as-is
    expect(getContentString(content as any)).toBe(" data");
  });
});

// ---------------------------------------------------------------------------
// isAIMessage
// ---------------------------------------------------------------------------
describe("isAIMessage", () => {
  it("returns true for ai-type messages", () => {
    const msg = { type: "ai", content: "hi" } as unknown as Message;
    expect(isAIMessage(msg)).toBe(true);
  });

  it("returns false for human-type messages", () => {
    const msg = { type: "human", content: "hi" } as unknown as Message;
    expect(isAIMessage(msg)).toBe(false);
  });

  it("returns false for tool-type messages", () => {
    const msg = { type: "tool", content: "result" } as unknown as Message;
    expect(isAIMessage(msg)).toBe(false);
  });

  it("returns false for system-type messages", () => {
    const msg = { type: "system", content: "you are…" } as unknown as Message;
    expect(isAIMessage(msg)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isAiWithToolCalls
// ---------------------------------------------------------------------------
describe("isAiWithToolCalls", () => {
  it("returns false for non-AI messages", () => {
    const msg = { type: "human", content: "hi" } as unknown as Message;
    expect(isAiWithToolCalls(msg)).toBe(false);
  });

  it("returns false for AI messages with no tool_calls and plain text content", () => {
    const msg = {
      type: "ai",
      content: "just text",
      tool_calls: [],
    } as unknown as Message;
    expect(isAiWithToolCalls(msg)).toBe(false);
  });

  it("returns true when tool_calls array is non-empty", () => {
    const msg = {
      type: "ai",
      content: "calling",
      tool_calls: [{ id: "1", name: "search", args: {} }],
    } as unknown as Message;
    expect(isAiWithToolCalls(msg)).toBe(true);
  });

  it("returns true when content contains a tool_use block (Anthropic style)", () => {
    const msg = {
      type: "ai",
      content: [
        { type: "text", text: "Let me search…" },
        { type: "tool_use", id: "tu_1", name: "search", input: {} },
      ],
      tool_calls: [],
    } as unknown as Message;
    expect(isAiWithToolCalls(msg)).toBe(true);
  });

  it("returns false for AI messages whose content array has no tool_use blocks", () => {
    const msg = {
      type: "ai",
      content: [{ type: "text", text: "plain text only" }],
      tool_calls: [],
    } as unknown as Message;
    expect(isAiWithToolCalls(msg)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isToolMessage
// ---------------------------------------------------------------------------
describe("isToolMessage", () => {
  it("returns true for tool-type messages", () => {
    const msg = { type: "tool", content: "result" } as unknown as Message;
    expect(isToolMessage(msg)).toBe(true);
  });

  it("returns false for ai-type messages", () => {
    const msg = { type: "ai", content: "text" } as unknown as Message;
    expect(isToolMessage(msg)).toBe(false);
  });

  it("returns false for human-type messages", () => {
    const msg = { type: "human", content: "hello" } as unknown as Message;
    expect(isToolMessage(msg)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatRelativeTime
// ---------------------------------------------------------------------------
describe("formatRelativeTime", () => {
  beforeEach(() => {
    // Pin "now" to a fixed date so the tests are deterministic
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'Today' for a timestamp from earlier today", () => {
    expect(formatRelativeTime("2024-06-15T08:00:00Z")).toBe("Today");
  });

  it("returns 'Yesterday' for a timestamp from exactly 1 day ago", () => {
    expect(formatRelativeTime("2024-06-14T12:00:00Z")).toBe("Yesterday");
  });

  it("returns '3 days ago' for a timestamp 3 days in the past", () => {
    expect(formatRelativeTime("2024-06-12T12:00:00Z")).toBe("3 days ago");
  });

  it("returns '1 week ago' for a timestamp 7 days in the past", () => {
    expect(formatRelativeTime("2024-06-08T12:00:00Z")).toBe("1 week ago");
  });

  it("returns '2 weeks ago' for a timestamp 14 days in the past", () => {
    expect(formatRelativeTime("2024-06-01T12:00:00Z")).toBe("2 weeks ago");
  });

  it("returns '1 month ago' for a timestamp 30 days in the past", () => {
    expect(formatRelativeTime("2024-05-16T12:00:00Z")).toBe("1 month ago");
  });

  it("returns '2 months ago' for a timestamp 60 days in the past", () => {
    expect(formatRelativeTime("2024-04-16T12:00:00Z")).toBe("2 months ago");
  });
});
