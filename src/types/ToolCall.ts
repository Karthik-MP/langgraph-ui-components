import type { ReactElement } from "react";

/** Mirrors the tool-call shape from @langchain/langgraph-sdk AIMessage */
export type ToolCall = {
  name: string;
  args: Record<string, unknown> | string;
  id?: string;
  type?: string;
};

/** Minimal tool-result message shape */
export type ToolMessage = {
  type: "tool";
  content: string | unknown[];
  tool_call_id?: string;
  id?: string;
};

/**
 * Lifecycle phase of a tool call:
 * - `InProgress`  — arguments are still being streamed.
 * - `Executing`   — arguments are fully resolved; the tool is running.
 * - `Complete`    — execution finished and a result is available.
 */
export const ToolCallStatus = {
  InProgress: "in_progress",
  Executing: "executing",
  Complete: "complete",
} as const;

export type ToolCallStatus = (typeof ToolCallStatus)[keyof typeof ToolCallStatus];

/**
 * Render function signature supplied when registering a tool renderer.
 * Receives the parsed args, the result string (only when Complete), and the
 * current status.
 */
export type ToolCallRenderFn<TArgs = Record<string, unknown>> = (
  args: TArgs,
  result: string | undefined,
  status: ToolCallStatus,
) => ReactElement | null;

/** Input props accepted by the renderer function returned from useRenderToolCall. */
export type UseRenderToolCallProps = {
  /** The tool call object containing the tool name and its JSON-encoded args. */
  toolCall: ToolCall;
  /**
   * The tool result message, if available.
   * When present the status is resolved to Complete.
   */
  toolMessage?: ToolMessage;
  /**
   * Pass `true` while the tool call's arguments are still being streamed.
   * Drives the InProgress vs Executing distinction when no toolMessage exists.
   */
  isLoading?: boolean;
};
