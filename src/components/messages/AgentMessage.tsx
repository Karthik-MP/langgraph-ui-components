import { cn } from "@/utils/tailwindUtil";
import { getContentString } from "@/utils/utils";
import type { Message } from "@langchain/langgraph-sdk";
import { BotMessageSquare, ChevronRight, LoaderCircle, Sparkles, Wrench } from "lucide-react";
import React, { useEffect, useState } from "react";
import { AgentMarkdown } from "../ui/AgentMarkdown";
import { BranchSwitcher } from "./BranchSwitcher";
import { MessageActions, type MessageFeedback } from "./MessageActions";

type ToolStatusEntry = {
  id?: string;
  name?: string;
  label?: string;
  event?: string;
  visible?: boolean;
};

function getReasoningFromKwargs(message: Message | undefined): string | null {
  if (!message) return null;
  const ak = (message as Record<string, unknown>).additional_kwargs as
    | Record<string, unknown>
    | undefined;
  if (
    ak &&
    typeof ak.reasoning_content === "string" &&
    ak.reasoning_content.length > 0
  ) {
    return ak.reasoning_content;
  }
  return null;
}

function AgentActivity({
  reasoningText,
  toolStatuses,
  isStreaming,
  fontSize,
}: {
  reasoningText?: string;
  toolStatuses?: Array<{ key: string; label: string; isCompleted: boolean }>;
  isStreaming?: boolean;
  fontSize?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(!!isStreaming);
  }, [isStreaming]);

  const hasTools = toolStatuses && toolStatuses.length > 0;
  const hasReasoning = !!reasoningText && reasoningText.length > 0;

  if (!hasTools && !hasReasoning && !isStreaming) return null;

  return (
    <div className="my-1">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400/80 transition-colors hover:text-zinc-300"
      >
        {isStreaming ? (
          <LoaderCircle className="size-3 animate-spin" />
        ) : (
          <Sparkles className="size-3" />
        )}
        <span>{isStreaming ? "Thinking" : "Thought"}</span>
        <ChevronRight
          className={cn(
            "size-3 transition-transform duration-200",
            expanded && "rotate-90",
          )}
        />
      </button>
      {expanded && (
        <div className="mt-1.5 border-l-2 border-white/10 pl-4 space-y-1">
          {hasTools && toolStatuses!.map((ts) => (
            <div key={ts.key} className="flex items-center gap-2 text-sm text-zinc-300 py-0.5">
              {!ts.isCompleted && (
                <LoaderCircle className="size-3.5 animate-spin text-zinc-400" />
              )}
              <Wrench className="size-3.5 text-zinc-500" />
              <span>{ts.label}</span>
            </div>
          ))}
          {hasReasoning && (
            <div className="text-sm text-zinc-300">
              <AgentMarkdown fontSize={fontSize}>{reasoningText!}</AgentMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function toToolStatusEntry(value: unknown): ToolStatusEntry | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;

  const visible =
    typeof v.visible === "boolean"
      ? v.visible
      : typeof v.show === "boolean"
        ? v.show
        : typeof v.display === "boolean"
          ? v.display
          : typeof v.hidden === "boolean"
            ? !v.hidden
            : true;

  return {
    id: typeof v.id === "string" ? v.id : undefined,
    name: typeof v.name === "string" ? v.name : undefined,
    label: typeof v.label === "string" ? v.label : undefined,
    event: typeof v.event === "string" ? v.event : undefined,
    visible,
  };
}

function getToolStatusFromKwargs(message: Message | undefined): ToolStatusEntry[] {
  if (!message) return [];
  const ak = (message as Record<string, unknown>).additional_kwargs as
    | Record<string, unknown>
    | undefined;

  if (!ak || !Array.isArray(ak.tool_status)) return [];

  return (ak.tool_status as unknown[])
    .map(toToolStatusEntry)
    .filter((s): s is ToolStatusEntry => s !== null);
}

function hasToolStatusFieldInKwargs(message: Message | undefined): boolean {
  if (!message) return false;
  const ak = (message as Record<string, unknown>).additional_kwargs as
    | Record<string, unknown>
    | undefined;
  if (!ak) return false;
  return Object.prototype.hasOwnProperty.call(ak, "tool_status");
}

function normalizeSemanticKey(value: string | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*event:\s*metadata\s*$/i, "")
    .trim();
}

function shouldRenderToolStatus(status: ToolStatusEntry): boolean {
  if (status.visible === false) return false;

  const labelKey = normalizeSemanticKey(status.label);
  if (labelKey.length === 0) return false;

  // Filter transport/debug noise like "event: metadata".
  if (status.event?.toLowerCase() === "metadata") return false;
  if (/\bevent:\s*metadata\b/i.test(status.label ?? "")) return false;

  return true;
}

function normalizeToolLabel(name: string, input: unknown): string {
  if (!input) return name;
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (trimmed.length === 0) return name;
    return `${name} ${trimmed.slice(0, 80)}${trimmed.length > 80 ? "..." : ""}`;
  }
  if (typeof input === "object") {
    try {
      const json = JSON.stringify(input);
      return `${name} ${json.length > 80 ? `${json.slice(0, 80)}...` : json}`;
    } catch {
      return name;
    }
  }
  return name;
}

function renderContentInline(
  groupedMessages: Message[] | undefined,
  showToolActivity: boolean,
  isActivelyStreaming?: boolean,
  fontSize?: string,
) {
  if (!groupedMessages || groupedMessages.length === 0) return null;

  const timeline = groupedMessages;
  const toolMessages = timeline.filter((m) => m.type === "tool");
  const hasBackendToolStatus = timeline.some((m) => hasToolStatusFieldInKwargs(m));

  const completedToolIds = new Set(
    toolMessages
      .map((m) => (m as Record<string, unknown>).tool_call_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  );
  const completedToolNames = new Set(
    toolMessages
      .map((m) => (m as Record<string, unknown>).name)
      .filter((name): name is string => typeof name === "string" && name.length > 0),
  );

  // ── Collect activity (reasoning + tool statuses) and text content separately ──
  const collectedToolStatuses: Array<{ key: string; label: string; isCompleted: boolean }> = [];
  const reasoningTexts: string[] = [];
  const textParts: React.ReactNode[] = [];
  const renderedToolKeys = new Set<string>();
  let textIdx = 0;

  const collectToolStatusFromKwargs = (message: Message) => {
    if (!showToolActivity) return;
    for (const status of getToolStatusFromKwargs(message)) {
      if (!shouldRenderToolStatus(status)) continue;
      const semanticKey =
        normalizeSemanticKey(status.label) || normalizeSemanticKey(status.name) || "tool";
      if (renderedToolKeys.has(semanticKey)) continue;
      renderedToolKeys.add(semanticKey);
      const label = status.label ?? status.name ?? "Running tool";
      const isCompleted =
        (status.id ? completedToolIds.has(status.id) : false) ||
        (status.name ? completedToolNames.has(status.name) : false) ||
        !isActivelyStreaming;
      collectedToolStatuses.push({ key: semanticKey, label, isCompleted });
    }
  };

  for (const message of timeline) {
    if (message.type !== "ai") continue;

    const content = message.content;
    const kwargsReasoning = getReasoningFromKwargs(message);

    // Collect tool statuses from kwargs
    collectToolStatusFromKwargs(message);

    if (typeof content === "string") {
      if (kwargsReasoning) {
        // When reasoning_content exists in kwargs, the string content is the
        // same thinking text (set by messages-tuple before wrapModelCall clears
        // it). Capture it only as reasoning to avoid duplication.
        reasoningTexts.push(kwargsReasoning);
      } else if (content.length > 0) {
        textParts.push(
          <div key={`text-content-${message.id ?? textIdx}`} className="py-1">
            <AgentMarkdown fontSize={fontSize}>{content}</AgentMarkdown>
          </div>,
        );
        textIdx++;
      }
      continue;
    }

    if (!Array.isArray(content)) {
      if (kwargsReasoning) reasoningTexts.push(kwargsReasoning);
      continue;
    }

    const blocks = content as Record<string, unknown>[];
    let textAccum = "";
    let hasReasoningBlock = false;

    const flushText = () => {
      if (textAccum.length > 0) {
        textParts.push(
          <div key={`text-${message.id ?? textIdx}-${textIdx}`} className="py-1">
            <AgentMarkdown fontSize={fontSize}>{textAccum}</AgentMarkdown>
          </div>,
        );
        textAccum = "";
        textIdx++;
      }
    };

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (block.type === "text" && typeof block.text === "string") {
        textAccum += block.text;
        continue;
      }

      if (
        (block.type === "reasoning" && typeof block.reasoning === "string") ||
        (block.type === "thinking" && typeof block.thinking === "string")
      ) {
        flushText();
        hasReasoningBlock = true;
        const text = (block.reasoning ?? block.thinking) as string;
        reasoningTexts.push(text);
        continue;
      }

      if (showToolActivity && !hasBackendToolStatus && block.type === "tool_use") {
        flushText();
        const toolId = typeof block.id === "string" ? block.id : undefined;
        const toolName = typeof block.name === "string" ? block.name : "tool";
        const semanticKey = normalizeSemanticKey(toolName) || `tool-${i}`;
        if (!renderedToolKeys.has(semanticKey)) {
          renderedToolKeys.add(semanticKey);
          const label = normalizeToolLabel(toolName, (block as Record<string, unknown>).input);
          const isCompleted = toolId ? completedToolIds.has(toolId) : !isActivelyStreaming;
          collectedToolStatuses.push({ key: semanticKey, label, isCompleted });
        }
      }
    }

    if (!hasReasoningBlock && kwargsReasoning) {
      // Same as the string-content case: kwargs reasoning duplicates the
      // text blocks, so discard accumulated text and capture as reasoning only.
      textAccum = "";
      reasoningTexts.push(kwargsReasoning);
    } else {
      flushText();
    }
  }

  // Fallback for legacy payloads without backend tool_status (only after streaming completes)
  if (showToolActivity && !isActivelyStreaming && !hasBackendToolStatus && collectedToolStatuses.length === 0 && textParts.length === 0 && toolMessages.length > 0) {
    for (const toolMessage of toolMessages) {
      collectedToolStatuses.push({
        key: `tool-msg-${toolMessage.id ?? textIdx}`,
        label: "Tool call completed",
        isCompleted: true,
      });
      textIdx++;
    }
  }

  // ── Assemble output: AgentActivity block first, then text content ──
  const parts: React.ReactNode[] = [];
  const hasTextContent = textParts.length > 0;
  const combinedReasoning = reasoningTexts.join("\n\n");
  const hasActivity =
    (showToolActivity && collectedToolStatuses.length > 0) ||
    combinedReasoning.length > 0;
  const activityIsStreaming = !!isActivelyStreaming && !hasTextContent;

  if (hasActivity || activityIsStreaming) {
    parts.push(
      <AgentActivity
        key="agent-activity"
        reasoningText={combinedReasoning || undefined}
        toolStatuses={showToolActivity ? collectedToolStatuses : undefined}
        isStreaming={activityIsStreaming}
        fontSize={fontSize}
      />,
    );
  }

  parts.push(...textParts);

  return parts.length > 0 ? <>{parts}</> : null;
}

function AgentMessage({
  agentName,
  fontSize,
  message,
  groupedMessages,
  showToolActivity = true,
  isStreaming = false,
  onRegenerate,
  feedback,
  onFeedback,
  branch,
  branchOptions,
  onBranchSelect,
}: {
  agentName?: string;
  fontSize?: string;
  message: Message;
  groupedMessages?: Message[];
  showToolActivity?: boolean;
  isStreaming?: boolean;
  onRegenerate?: (parentCheckpoint: any | null | undefined, messageId: string, currentMessage: any) => void;
  feedback?: MessageFeedback;
  onFeedback?: (messageId: string, feedback: MessageFeedback) => void;
  branch?: string;
  branchOptions?: string[];
  onBranchSelect?: (branch: string) => void;
}) {
  const content = getContentString(message?.content);
  const inlineContent = renderContentInline(groupedMessages ?? [message], showToolActivity, isStreaming, fontSize);

  return (
    <div className="agent-message flex flex-col gap-1 w-full group">
      <div className="flex items-center gap-3 w-full">
        <div
          className="rounded-full size-8 shrink-0 bg-zinc-800 flex items-center justify-center p-2"
          data-alt="AI Avatar"
        >
          <BotMessageSquare className="text-xs" color="white" />
        </div>
        <span className="text-zinc-500 text-sm">{agentName || "Agent"}</span>
      </div>
      <div className="flex flex-1 flex-col gap-1 items-start min-w-0">
        <div className="text-content text-foreground" style={fontSize ? { fontSize } : undefined}>
          {inlineContent ? (
            inlineContent
          ) : (
            <>
              <div className="flex items-center gap-2 text-zinc-500">
                {/* <Loader2 className="animate-spin" size={16} /> */}
                <span>Thinking...</span>
              </div>
              {isStreaming && content && (
                <span className="inline-block w-2 h-4 ml-1 bg-zinc-400 animate-pulse" />
              )}
            </>
          )}
        </div>

        {/* Branch switcher - show when multiple branches exist */}
        {!isStreaming && branch && branchOptions && onBranchSelect && branchOptions.length > 1 && (
          <BranchSwitcher
            branch={branch}
            branchOptions={branchOptions}
            onSelect={onBranchSelect}
            isLoading={isStreaming}
          />
        )}

        {/* Show actions only when not streaming and content exists */}
        {!isStreaming && content && (
          <MessageActions
            message={message}
            onRegenerate={onRegenerate}
            feedback={feedback}
            onFeedback={onFeedback}
            className=""
          />
        )}
      </div>
    </div>
  );
}

// Memoize - only re-render if message ID changes or streaming state changes
export default React.memo(AgentMessage, (prevProps, nextProps) => {
  // If it's streaming, we need to re-render to show updates
  if (nextProps.isStreaming) {
    return false; // Always re-render when streaming
  }

  // Otherwise, only re-render if the message ID, feedback, branch, or callbacks changed
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.groupedMessages?.length === nextProps.groupedMessages?.length &&
    prevProps.showToolActivity === nextProps.showToolActivity &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.feedback === nextProps.feedback &&
    prevProps.onRegenerate === nextProps.onRegenerate &&
    prevProps.onFeedback === nextProps.onFeedback &&
    prevProps.branch === nextProps.branch &&
    prevProps.branchOptions?.length === nextProps.branchOptions?.length &&
    prevProps.onBranchSelect === nextProps.onBranchSelect
  );
});
