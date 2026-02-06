import { getContentString } from "@/utils/utils";
import type { Message } from "@langchain/langgraph-sdk";
import { BotMessageSquare, Loader2 } from "lucide-react";
import React from "react";
import { AgentMarkdown } from "../ui/AgentMarkdown";
import { BranchSwitcher } from "./BranchSwitcher";
import { MessageActions, type MessageFeedback } from "./MessageActions";

function AgentMessage({
  agentName,
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

  return (
    <div className="flex items-start gap-3 w-full group">
      <div
        className="rounded-full size-8 shrink-0 bg-zinc-800 border border-zinc-700 flex items-center justify-center p-2"
        data-alt="AI Avatar"
      >
        <BotMessageSquare className="text-sm" color="white" />
      </div>

      <div className="flex flex-1 flex-col gap-1 items-start min-w-0">
        <span className="text-zinc-500 text-xs ml-1">{agentName || "agent"}</span>
        <div className="text-sm font-normal leading-relaxed rounded-2xl rounded-tl-none px-4 py-2 text-left bg-zinc-900 border border-zinc-800 text-zinc-200 shadow-sm max-w-full break-words overflow-wrap-anywhere markdown-content">
          {content ? (<AgentMarkdown content={content} />) : (
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
            className="ml-1"
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
