import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTools } from "@/hooks/useTools";

describe("useTools", () => {
  it("returns two default tools (Search and Chat)", () => {
    const { result } = renderHook(() => useTools());
    expect(result.current.tool).toHaveLength(2);
    expect(result.current.tool[0].label).toBe("Search");
    expect(result.current.tool[1].label).toBe("Chat");
  });

  it("default tools have alt text", () => {
    const { result } = renderHook(() => useTools());
    expect(result.current.tool[0].alt).toBe("Search the threads");
    expect(result.current.tool[1].alt).toBe("Start New Chat");
  });

  it("starts with an empty userDefinedTools array", () => {
    const { result } = renderHook(() => useTools());
    expect(result.current.userDefinedTools).toHaveLength(0);
  });

  it("addTool appends a new tool to userDefinedTools", () => {
    const { result } = renderHook(() => useTools());
    const newTool = { label: "Export", alt: "Export data", onClick: () => {} };

    act(() => {
      result.current.addTool(newTool as any);
    });

    expect(result.current.userDefinedTools).toHaveLength(1);
    expect(result.current.userDefinedTools[0].label).toBe("Export");
  });

  it("addTool can be called multiple times and accumulates tools", () => {
    const { result } = renderHook(() => useTools());
    const tool1 = { label: "Export", alt: "Export", onClick: () => {} };
    const tool2 = { label: "Import", alt: "Import", onClick: () => {} };

    act(() => {
      result.current.addTool(tool1 as any);
      result.current.addTool(tool2 as any);
    });

    expect(result.current.userDefinedTools).toHaveLength(2);
    expect(result.current.userDefinedTools[0].label).toBe("Export");
    expect(result.current.userDefinedTools[1].label).toBe("Import");
  });

  it("addTool does NOT modify the default tools array", () => {
    const { result } = renderHook(() => useTools());

    act(() => {
      result.current.addTool({ label: "Extra", alt: "extra", onClick: () => {} } as any);
    });

    // The default list must remain exactly 2 items
    expect(result.current.tool).toHaveLength(2);
    expect(result.current.tool[0].label).toBe("Search");
    expect(result.current.tool[1].label).toBe("Chat");
  });

  it("setUserDefinedTools replaces the entire userDefinedTools array", () => {
    const { result } = renderHook(() => useTools());
    const initial = { label: "Old", alt: "old", onClick: () => {} };
    const replacement = [{ label: "New", alt: "new", onClick: () => {} }];

    act(() => {
      result.current.addTool(initial as any);
    });
    expect(result.current.userDefinedTools).toHaveLength(1);

    act(() => {
      result.current.setUserDefinedTools(replacement as any);
    });

    expect(result.current.userDefinedTools).toHaveLength(1);
    expect(result.current.userDefinedTools[0].label).toBe("New");
  });

  it("setUserDefinedTools can clear all user-defined tools", () => {
    const { result } = renderHook(() => useTools());

    act(() => {
      result.current.addTool({ label: "X", alt: "x", onClick: () => {} } as any);
    });

    act(() => {
      result.current.setUserDefinedTools([]);
    });

    expect(result.current.userDefinedTools).toHaveLength(0);
  });

  it("addTool is referentially stable across re-renders (useCallback)", () => {
    const { result, rerender } = renderHook(() => useTools());
    const firstAddTool = result.current.addTool;

    rerender();

    expect(result.current.addTool).toBe(firstAddTool);
  });

  it("default tool array is the same reference across different hook instances (module-level constant)", () => {
    const { result: r1 } = renderHook(() => useTools());
    const { result: r2 } = renderHook(() => useTools());
    // DEFAULT_TOOLS is defined outside the hook, so both instances share the same array ref
    expect(r1.current.tool).toBe(r2.current.tool);
  });
});
