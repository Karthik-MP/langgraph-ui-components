import { useStreamContext } from "@/providers/Stream";
import { useEffect, useMemo, useRef } from "react";
import AgentMessage from "./messages/AgentMessage";
import HumanMessage from "./messages/HumanMessage";
import { isAiWithToolCalls, isToolMessage } from "@/utils/utils";
import Thinking from "./Thinking";
import { CustomComponentRender } from "./messages/CustomComponentRender";

export default function ChatBodyComponent() {
  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  // Memoize messages with stable reference
  const memoMessages = useMemo(() => messages ?? [], [messages]);

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const prevMessageCountRef = useRef(0);

  // Auto-scroll only when new messages are added or content updates
  useEffect(() => {
    const currentCount = memoMessages.length;
    const hasNewMessage = currentCount > prevMessageCountRef.current;

    if (messagesRef.current && (hasNewMessage || isLoading)) {
      const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      // Only auto-scroll if user is near bottom
      if (isNearBottom || hasNewMessage) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    }

    prevMessageCountRef.current = currentCount;
  }, [memoMessages, isLoading]);

  return (
    <div
      ref={messagesRef}
      className="flex flex-col gap-4 rounded-4xl p-2 bg-black/20"
    >
      {memoMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-zinc-500">
          Start a conversation...
        </div>
      ) : (
        memoMessages.map((msg, index) => {
          if (!msg.content.length) return null;
          // Skip tool messages that follow an AI message with tool calls
          // They'll be rendered together with the AI message
          if (
            isToolMessage(msg) &&
            index > 0 &&
            isAiWithToolCalls(memoMessages[index - 1])
          ) {
            return null;
          }

          const isLastMessage = index === memoMessages.length - 1;
          const isStreamingThisMessage =
            isLoading && isLastMessage && msg.type === "ai";

          if (msg.type === "human") {
            return <HumanMessage key={msg.id} message={msg} />;
          }

          // Group AI message with tool calls and subsequent tool messages
          if (isAiWithToolCalls(msg)) {
            const toolMessages = [];
            let nextIndex = index + 1;
            while (
              nextIndex < memoMessages.length &&
              isToolMessage(memoMessages[nextIndex])
            ) {
              toolMessages.push(memoMessages[nextIndex]);
              nextIndex++;
            }

            // Check if there's text content to display
            const hasTextContent = Array.isArray(msg.content) && msg.content.some(
              (c: any) => c.type === "text" && c.text?.trim()
            );

            return (
              <>
                {hasTextContent ? (
                  <>
                    <AgentMessage
                      key={`${msg.id}-text`}
                      message={msg}
                      isStreaming={isStreamingThisMessage}
                    />
                    <CustomComponentRender message={msg} thread={stream} />
                  </>
                ) : (
                  <Thinking
                    key={msg.id}
                    title="Agent Thinking"
                    message={msg}
                    toolMessages={toolMessages}
                  />
                )}
              </>
            );
          }

          // Standalone tool messages (shouldn't happen in normal flow)
          if (isToolMessage(msg)) {
            return (
              <Thinking key={msg.id} title="Agent Thinking" message={msg} />
            );
          }

          return (
            <>
              <CustomComponentRender message={msg} thread={stream} />
              <AgentMessage
                key={msg.id}
                message={msg}
                isStreaming={isStreamingThisMessage}
              />
            </>
          );
        })
      )}
    </div>
  );
}
