import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React, { type ReactElement } from "react";
import {
  ToolCallRendererProvider,
  useRenderToolCall,
  useRegisterToolCallRenderer,
  ToolCallStatus,
  type ToolCall,
  type ToolMessage,
} from "@/hooks/useRenderToolCall";

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeToolCall(
  name: string,
  args: Record<string, unknown> | string = {},
  id = "tc-1",
): ToolCall {
  return { name, args, id };
}

function makeToolMessage(content: string, tool_call_id = "tc-1"): ToolMessage {
  return { type: "tool", content, tool_call_id };
}

/** Wrapper that provides both the provider and a registered renderer in one go. */
function wrapWithProvider(
  renderers: Record<
    string,
    (
      args: Record<string, unknown>,
      result: string | undefined,
      status: ToolCallStatus,
    ) => ReactElement | null
  > = {},
) {
  return ({ children }: { children: React.ReactNode }) => (
    <ToolCallRendererProvider initialRenderers={renderers}>
      {children}
    </ToolCallRendererProvider>
  );
}

// ── Status resolution ──────────────────────────────────────────────────────────

describe("useRenderToolCall – status resolution", () => {
  it("returns InProgress when isLoading=true and no toolMessage", () => {
    const captured: ToolCallStatus[] = [];

    const wrapper = wrapWithProvider({
      my_tool: (_args, _result, status) => {
        captured.push(status);
        return null;
      },
    });

    const { result } = renderHook(() => useRenderToolCall(), { wrapper });

    act(() => {
      result.current({
        toolCall: makeToolCall("my_tool"),
        isLoading: true,
      });
    });

    expect(captured).toContain(ToolCallStatus.InProgress);
  });

  it("returns Executing when isLoading=false and no toolMessage", () => {
    const captured: ToolCallStatus[] = [];

    const wrapper = wrapWithProvider({
      my_tool: (_args, _result, status) => {
        captured.push(status);
        return null;
      },
    });

    const { result } = renderHook(() => useRenderToolCall(), { wrapper });

    act(() => {
      result.current({ toolCall: makeToolCall("my_tool"), isLoading: false });
    });

    expect(captured).toContain(ToolCallStatus.Executing);
  });

  it("defaults to Executing when isLoading is omitted", () => {
    const captured: ToolCallStatus[] = [];

    const wrapper = wrapWithProvider({
      my_tool: (_args, _result, status) => {
        captured.push(status);
        return null;
      },
    });

    const { result } = renderHook(() => useRenderToolCall(), { wrapper });

    act(() => {
      result.current({ toolCall: makeToolCall("my_tool") });
    });

    expect(captured).toContain(ToolCallStatus.Executing);
  });

  it("returns Complete when toolMessage is provided", () => {
    const captured: ToolCallStatus[] = [];

    const wrapper = wrapWithProvider({
      my_tool: (_args, _result, status) => {
        captured.push(status);
        return null;
      },
    });

    const { result } = renderHook(() => useRenderToolCall(), { wrapper });

    act(() => {
      result.current({
        toolCall: makeToolCall("my_tool"),
        toolMessage: makeToolMessage("done"),
      });
    });

    expect(captured).toContain(ToolCallStatus.Complete);
  });

  it("passes the result string when status is Complete", () => {
    const captured: Array<string | undefined> = [];

    const wrapper = wrapWithProvider({
      my_tool: (_args, result) => {
        captured.push(result);
        return null;
      },
    });

    const { result } = renderHook(() => useRenderToolCall(), { wrapper });

    act(() => {
      result.current({
        toolCall: makeToolCall("my_tool"),
        toolMessage: makeToolMessage("42"),
      });
    });

    expect(captured[0]).toBe("42");
  });

  it("passes undefined result when not Complete", () => {
    const captured: Array<string | undefined> = [];

    const wrapper = wrapWithProvider({
      my_tool: (_args, result) => {
        captured.push(result);
        return null;
      },
    });

    const { result } = renderHook(() => useRenderToolCall(), { wrapper });

    act(() => {
      result.current({ toolCall: makeToolCall("my_tool"), isLoading: true });
    });

    expect(captured[0]).toBeUndefined();
  });

  it("serialises array toolMessage.content to JSON for result", () => {
    const captured: Array<string | undefined> = [];

    const wrapper = wrapWithProvider({
      my_tool: (_args, result) => {
        captured.push(result);
        return null;
      },
    });

    const { result } = renderHook(() => useRenderToolCall(), { wrapper });

    act(() => {
      result.current({
        toolCall: makeToolCall("my_tool"),
        toolMessage: { type: "tool", content: [{ type: "text", text: "hi" }] },
      });
    });

    expect(captured[0]).toBe(JSON.stringify([{ type: "text", text: "hi" }]));
  });
});

// ── Renderer lookup ────────────────────────────────────────────────────────────

describe("useRenderToolCall – renderer lookup", () => {
  it("returns null when no renderer is registered for the tool", () => {
    const wrapper = wrapWithProvider({});
    const { result } = renderHook(() => useRenderToolCall(), { wrapper });

    let output: ReturnType<typeof result.current> = null;
    act(() => {
      output = result.current({ toolCall: makeToolCall("unknown_tool") });
    });

    expect(output).toBeNull();
  });

  it("uses exact-match renderer when available", () => {
    const exactRender = vi.fn().mockReturnValue(null);
    const wildcardRender = vi.fn().mockReturnValue(null);

    const wrapper = wrapWithProvider({
      my_tool: exactRender,
      "*": wildcardRender,
    });

    const { result } = renderHook(() => useRenderToolCall(), { wrapper });

    act(() => {
      result.current({ toolCall: makeToolCall("my_tool") });
    });

    expect(exactRender).toHaveBeenCalledTimes(1);
    expect(wildcardRender).not.toHaveBeenCalled();
  });

  it("falls back to wildcard '*' renderer when no exact match", () => {
    const wildcardRender = vi.fn().mockReturnValue(null);

    const wrapper = wrapWithProvider({ "*": wildcardRender });

    const { result } = renderHook(() => useRenderToolCall(), { wrapper });

    act(() => {
      result.current({ toolCall: makeToolCall("unknown_tool") });
    });

    expect(wildcardRender).toHaveBeenCalledTimes(1);
  });

  it("returns null when there is no exact match AND no wildcard", () => {
    const wrapper = wrapWithProvider({ other_tool: () => null });
    const { result } = renderHook(() => useRenderToolCall(), { wrapper });

    let output: ReturnType<typeof result.current> = <></>;
    act(() => {
      output = result.current({ toolCall: makeToolCall("missing") });
    });

    expect(output).toBeNull();
  });
});

// ── Argument parsing ───────────────────────────────────────────────────────────

describe("useRenderToolCall – argument parsing", () => {
  it("passes parsed args object to the renderer", () => {
    const captured: Record<string, unknown>[] = [];

    const wrapper = wrapWithProvider({
      my_tool: (args) => {
        captured.push(args);
        return null;
      },
    });

    const { result } = renderHook(() => useRenderToolCall(), { wrapper });

    act(() => {
      result.current({
        toolCall: makeToolCall("my_tool", { query: "hello" }),
      });
    });

    expect(captured[0]).toEqual({ query: "hello" });
  });

  it("parses JSON-string args", () => {
    const captured: Record<string, unknown>[] = [];

    const wrapper = wrapWithProvider({
      my_tool: (args) => {
        captured.push(args);
        return null;
      },
    });

    const { result } = renderHook(() => useRenderToolCall(), { wrapper });

    act(() => {
      result.current({
        toolCall: makeToolCall("my_tool", '{"key":"val"}'),
      });
    });

    expect(captured[0]).toEqual({ key: "val" });
  });

  it("falls back to empty object on malformed JSON string args", () => {
    const captured: Record<string, unknown>[] = [];

    const wrapper = wrapWithProvider({
      my_tool: (args) => {
        captured.push(args);
        return null;
      },
    });

    const { result } = renderHook(() => useRenderToolCall(), { wrapper });

    act(() => {
      result.current({
        toolCall: makeToolCall("my_tool", "{broken json"),
      });
    });

    expect(captured[0]).toEqual({});
  });
});

// ── useRegisterToolCallRenderer ────────────────────────────────────────────────

describe("useRegisterToolCallRenderer", () => {
  it("registers a renderer that useRenderToolCall can resolve", async () => {
    const render = vi.fn().mockReturnValue(null);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToolCallRendererProvider>{children}</ToolCallRendererProvider>
    );

    const { result } = renderHook(
      () => {
        useRegisterToolCallRenderer("dyn_tool", render);
        return useRenderToolCall();
      },
      { wrapper },
    );

    // useEffect registration is async — wait one tick.
    await act(async () => {});

    act(() => {
      result.current({ toolCall: makeToolCall("dyn_tool") });
    });

    expect(render).toHaveBeenCalled();
  });

  it("throws when used outside ToolCallRendererProvider", () => {
    expect(() => {
      renderHook(() =>
        useRegisterToolCallRenderer("tool", () => null),
      );
    }).toThrow("useRegisterToolCallRenderer must be used within a ToolCallRendererProvider");
  });
});

// ── Error boundary ─────────────────────────────────────────────────────────────

describe("useRenderToolCall – error boundary", () => {
  it("throws when used outside ToolCallRendererProvider", () => {
    expect(() => {
      renderHook(() => useRenderToolCall());
    }).toThrow("useRenderToolCall must be used within a ToolCallRendererProvider");
  });
});
