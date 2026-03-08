import { cn } from "@/utils/tailwindUtil";
import { getContentString } from "@/utils/utils";
import type { Message } from "@langchain/langgraph-sdk";
import { BotMessageSquare, ChevronRight, Loader2, LoaderCircle, Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";
import { AgentMarkdown } from "../ui/AgentMarkdown";
import { BranchSwitcher } from "./BranchSwitcher";
import { MessageActions, type MessageFeedback } from "./MessageActions";

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

function InlineThinking({ text, isStreaming, fontSize }: { text: string; isStreaming?: boolean; fontSize?: string }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(!!isStreaming);
  }, [isStreaming]);

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
        <div className="mt-1.5 border-l-2 border-white/10 pl-4 text-sm text-zinc-300">
          <AgentMarkdown fontSize={fontSize}>{text}</AgentMarkdown>
        </div>
      )}
    </div>
  );
}

function renderContentInline(message: Message | undefined, isActivelyStreaming?: boolean, fontSize?: string) {
  if (!message) return null;
  const content = message.content;
  const parts: React.ReactNode[] = [];

  const kwargsReasoning = getReasoningFromKwargs(message);
  if (kwargsReasoning) {
    const hasTextContent =
      typeof content === "string"
        ? content.length > 0
        : Array.isArray(content) &&
          (content as Record<string, unknown>[]).some(
            (b) =>
              b.type === "text" &&
              typeof b.text === "string" &&
              (b.text as string).length > 0,
          );
    parts.push(
      <InlineThinking
        key="kwargs-reasoning"
        text={kwargsReasoning}
        isStreaming={isActivelyStreaming && !hasTextContent}
        fontSize={fontSize}
      />,
    );
  }

  if (typeof content === "string") {
    if (content.length > 0) {
      parts.push(
        <div key="text-content" className="py-1">
          <AgentMarkdown fontSize={fontSize}>{content}</AgentMarkdown>
        </div>,
      );
    }
    return parts.length > 0 ? <>{parts}</> : null;
  }

  if (!Array.isArray(content)) return null;

  const blocks = content as Record<string, unknown>[];
  let textAccum = "";
  let idx = 0;

  const flushText = () => {
    if (textAccum.length > 0) {
      parts.push(
        <div key={`text-${idx}`} className="py-1">
          <AgentMarkdown fontSize={fontSize}>{textAccum}</AgentMarkdown>
        </div>,
      );
      textAccum = "";
      idx++;
    }
  };

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === "text" && typeof block.text === "string") {
      textAccum += block.text;
    } else if (
      (block.type === "reasoning" && typeof block.reasoning === "string") ||
      (block.type === "thinking" && typeof block.thinking === "string")
    ) {
      flushText();
      const text = (block.reasoning ?? block.thinking) as string;
      const hasTextAfter = blocks.slice(i + 1).some(
        (b) =>
          b.type === "text" &&
          typeof b.text === "string" &&
          (b.text as string).length > 0,
      );
      const isThisBlockStreaming = isActivelyStreaming && !hasTextAfter;
      parts.push(
        <InlineThinking key={`thinking-${idx}`} text={text} isStreaming={isThisBlockStreaming} fontSize={fontSize} />,
      );
      idx++;
    }
  }

  flushText();
  return parts.length > 0 ? <>{parts}</> : null;
}

function AgentMessage({
  agentName,
  fontSize,
  message,
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
  isStreaming?: boolean;
  onRegenerate?: (parentCheckpoint: any | null | undefined, messageId: string, currentMessage: any) => void;
  feedback?: MessageFeedback;
  onFeedback?: (messageId: string, feedback: MessageFeedback) => void;
  branch?: string;
  branchOptions?: string[];
  onBranchSelect?: (branch: string) => void;
}) {
  const content = getContentString(message?.content);
  const inlineContent = renderContentInline(message, isStreaming, fontSize);

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
                <Loader2 className="animate-spin" size={16} />
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
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.feedback === nextProps.feedback &&
    prevProps.onRegenerate === nextProps.onRegenerate &&
    prevProps.onFeedback === nextProps.onFeedback &&
    prevProps.branch === nextProps.branch &&
    prevProps.branchOptions?.length === nextProps.branchOptions?.length &&
    prevProps.onBranchSelect === nextProps.onBranchSelect
  );
});
