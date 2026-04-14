import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

export type {
  ToolCall,
  ToolMessage,
  ToolCallRenderFn,
  UseRenderToolCallProps,
} from "@/types/ToolCall";
export { ToolCallStatus } from "@/types/ToolCall";

import type { ToolCallRenderFn, UseRenderToolCallProps } from "@/types/ToolCall";
import { ToolCallStatus } from "@/types/ToolCall";

// ── Context ────────────────────────────────────────────────────────────────────

type RendererMap = Record<string, ToolCallRenderFn>;

type ToolCallRendererContextValue = {
  renderers: RendererMap;
  registerRenderer: (toolName: string, render: ToolCallRenderFn) => void;
  unregisterRenderer: (toolName: string) => void;
};

const ToolCallRendererContext = createContext<
  ToolCallRendererContextValue | undefined
>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────────

type ToolCallRendererProviderProps = {
  children: ReactNode;
  /** Pre-populate the registry at mount time (useful for SSR or testing). */
  initialRenderers?: RendererMap;
};

/**
 * Provides a registry of tool-call renderers to the subtree.
 * Place this once near the root of your chat UI (typically alongside
 * ChatRuntimeProvider or StreamProvider).
 *
 * @example
 * ```tsx
 * <ToolCallRendererProvider>
 *   <Chat />
 * </ToolCallRendererProvider>
 * ```
 */
export function ToolCallRendererProvider({
  children,
  initialRenderers = {},
}: ToolCallRendererProviderProps) {
  const [renderers, setRenderers] = useState<RendererMap>(initialRenderers);

  const registerRenderer = useCallback(
    (toolName: string, render: ToolCallRenderFn) => {
      setRenderers((prev) => ({ ...prev, [toolName]: render }));
    },
    [],
  );

  const unregisterRenderer = useCallback((toolName: string) => {
    setRenderers((prev) => {
      const { [toolName]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  return (
    <ToolCallRendererContext.Provider
      value={{ renderers, registerRenderer, unregisterRenderer }}
    >
      {children}
    </ToolCallRendererContext.Provider>
  );
}

// ── Registration hook ──────────────────────────────────────────────────────────

/**
 * Registers a render function for a specific tool name (or `"*"` as a
 * catch-all fallback).  Must be called inside a ToolCallRendererProvider.
 *
 * @example
 * ```tsx
 * useRegisterToolCallRenderer("web_search", (args, result, status) => (
 *   <SearchCard query={args.query} result={result} status={status} />
 * ));
 * // Wildcard — handles any tool without a dedicated renderer:
 * useRegisterToolCallRenderer("*", (_args, _result, status) => (
 *   <GenericToolCard status={status} />
 * ));
 * ```
 */
export function useRegisterToolCallRenderer<TArgs = Record<string, unknown>>(
  toolName: string,
  render: ToolCallRenderFn<TArgs>,
): void {
  const ctx = useContext(ToolCallRendererContext);
  if (!ctx) {
    throw new Error(
      "useRegisterToolCallRenderer must be used within a ToolCallRendererProvider",
    );
  }
  const { registerRenderer, unregisterRenderer } = ctx;

  // Register on mount / when toolName or render changes; unregister on cleanup.
  // Using useEffect prevents setState-during-render infinite loops.
  useEffect(() => {
    registerRenderer(toolName, render as ToolCallRenderFn);
    return () => unregisterRenderer(toolName);
  }, [toolName, render, registerRenderer, unregisterRenderer]);
}

// ── Main hook ──────────────────────────────────────────────────────────────────

/**
 * Returns a renderer function that maps tool calls to React elements.
 *
 * The returned function:
 * 1. Looks up the first matching renderer by tool name (falls back to `"*"`).
 * 2. Safely parses the JSON-encoded tool arguments.
 * 3. Determines the current ToolCallStatus from the inputs.
 * 4. Returns the React element from the matching renderer, or `null` if none
 *    is registered for the tool.
 *
 * Must be called inside a ToolCallRendererProvider.
 *
 * @example
 * ```tsx
 * const renderToolCall = useRenderToolCall();
 * // Inside your message loop:
 * renderToolCall({ toolCall, toolMessage });
 * ```
 */
export function useRenderToolCall(): (
  props: UseRenderToolCallProps,
) => ReactElement | null {
  const ctx = useContext(ToolCallRendererContext);
  if (!ctx) {
    throw new Error(
      "useRenderToolCall must be used within a ToolCallRendererProvider",
    );
  }

  const { renderers } = ctx;

  return useCallback(
    ({ toolCall, toolMessage, isLoading }: UseRenderToolCallProps) => {
      // Exact-match lookup, then wildcard fallback.
      const render = renderers[toolCall.name] ?? renderers["*"];
      if (!render) return null;

      // Safely parse args — they may arrive as a JSON string during streaming.
      let args: Record<string, unknown>;
      try {
        args =
          typeof toolCall.args === "string"
            ? (JSON.parse(toolCall.args) as Record<string, unknown>)
            : toolCall.args ?? {};
      } catch {
        args = {};
      }

      // Resolve status + result.
      let status: ToolCallStatus;
      let result: string | undefined;

      if (toolMessage) {
        status = ToolCallStatus.Complete;
        result =
          typeof toolMessage.content === "string"
            ? toolMessage.content
            : JSON.stringify(toolMessage.content);
      } else if (isLoading) {
        status = ToolCallStatus.InProgress;
      } else {
        status = ToolCallStatus.Executing;
      }

      return render(args, result, status);
    },
    [renderers],
  );
}
