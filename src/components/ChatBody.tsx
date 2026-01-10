import { useStreamContext } from "@/providers/Stream";
import { Fragment, useCallback, useEffect, useMemo, useRef } from "react";
import AgentMessage from "./messages/AgentMessage";
import HumanMessage from "./messages/HumanMessage";
import { isAiWithToolCalls, isToolMessage } from "@/utils/utils";
import Thinking from "./Thinking";
import CustomComponentRender from "./messages/CustomComponentRender";

export default function ChatBodyComponent() {
  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  // Memoize messages with stable reference
  const memoMessages = useMemo(() => messages ?? [], [messages]);

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const prevMessageCountRef = useRef(0);

  // Memoize message rendering logic to prevent unnecessary re-renders
  const renderMessage = useCallback((msg: typeof messages[0], index: number, messagesArray: typeof messages) => {
    if (!msg.content.length) return null;
    
    // Skip tool messages that follow an AI message with tool calls
    if (
      isToolMessage(msg) &&
      index > 0 &&
      isAiWithToolCalls(messagesArray[index - 1])
    ) {
      return null;
    }

    const isLastMessage = index === messagesArray.length - 1;
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
        nextIndex < messagesArray.length &&
        isToolMessage(messagesArray[nextIndex])
      ) {
        toolMessages.push(messagesArray[nextIndex]);
        nextIndex++;
      }

      // Check if there's text content to display
      const hasTextContent =
        Array.isArray(msg.content) &&
        msg.content.some((c: any) => c.type === "text" && c.text?.trim());

      if (hasTextContent) {
        return (
          <Fragment key={msg.id}>
            <AgentMessage
              message={msg}
              isStreaming={isStreamingThisMessage}
            />
            <CustomComponentRender message={msg} thread={stream} />
          </Fragment>
        );
      } else {
        return (
          <Thinking
            key={msg.id}
            title="Agent Thinking"
            message={msg}
            toolMessages={toolMessages}
          />
        );
      }
    }

    // Standalone tool messages (shouldn't happen in normal flow)
    if (isToolMessage(msg)) {
      return (
        <Thinking key={msg.id} title="Agent Thinking" message={msg} />
      );
    }

    return (
      <Fragment key={msg.id}>
        <CustomComponentRender message={msg} thread={stream} />
        <AgentMessage
          message={msg}
          isStreaming={isStreamingThisMessage}
        />
      </Fragment>
    );
  }, [isLoading, stream]);

  // Memoize the rendered messages array
  const renderedMessages = useMemo(() => {
    return memoMessages.map((msg, index) => renderMessage(msg, index, memoMessages));
  }, [memoMessages, renderMessage]);

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
        renderedMessages
      )}
    </div>
  );
}
