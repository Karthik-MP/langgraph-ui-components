import { useStreamContext } from "@/providers/Stream";
import { isAiWithToolCalls, isToolMessage } from "@/utils/utils";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import Thinking from "./Thinking";
import AgentMessage from "./messages/AgentMessage";
import CustomComponentRender from "./messages/CustomComponentRender";
import HumanMessage from "./messages/HumanMessage";

export default function ChatBody({ setIsFirstMessage }: { setIsFirstMessage?: React.Dispatch<React.SetStateAction<boolean>> }) {
  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;
  // console.log("ChatBody render - messages count:", messages, "isLoading:", isLoading);

  // Memoize messages with stable reference
  const memoMessages = useMemo(() => messages ?? [], [messages]);

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const prevMessageCountRef = useRef(0);

  // Set isFirstMessage to false when there are messages
  useEffect(() => {
    if (memoMessages.length > 0 && setIsFirstMessage) {
      setIsFirstMessage(false);
    }
  }, [memoMessages.length, setIsFirstMessage]);

  // Memoize message rendering logic to prevent unnecessary re-renders
  const renderMessage = useCallback((msg: typeof messages[0], index: number, messagesArray: typeof messages) => {
    if (!msg.content.length) return null;

    if (msg.additional_kwargs?.hidden) {
      return null;
    }

    const isLastMessage = index === messagesArray.length - 1;
    const isStreamingThisMessage =
      isLoading && isLastMessage && msg.type === "ai";
    
    // Use message id or fallback to index for key
    const msgKey = msg.id ?? `msg-${index}`;

    if (msg.type === "human") {
      return <HumanMessage key={msgKey} message={msg} />;
    }

    // Skip standalone tool messages
    if (isToolMessage(msg)) {
      return null;
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
      // Handle both string and array content formats
      const hasTextContent = 
        (typeof msg.content === "string" && msg.content.trim()) ||
        (Array.isArray(msg.content) && msg.content.some((c: any) => c.type === "text" && c.text?.trim()));

      return (
        <React.Fragment key={msgKey}>
          {/* 1. Thinking indicator - only show if tool messages exist */}
          {toolMessages.length > 0 && (
            <Thinking
              title="Agent Thinking"
              toolMessages={toolMessages}
            />
          )}
          {/* 2. Agent message (if has text) */}
          {hasTextContent && (
            <AgentMessage
              message={msg}
              isStreaming={isStreamingThisMessage}
            />
          )}
          {/* 3. Custom component */}
          <CustomComponentRender message={msg} thread={stream} />
        </React.Fragment>
      );
    }

    return (
      <React.Fragment key={msgKey}>
        <AgentMessage
          message={msg}
          isStreaming={isStreamingThisMessage}
        />
        <CustomComponentRender message={msg} thread={stream} />
      </React.Fragment>
    );
  }, [isLoading, stream]);

  // Memoize the rendered messages array
  const renderedMessages = useMemo(() => {
    return memoMessages.map((msg, index) => {
      const element = renderMessage(msg, index, memoMessages);
      // Ensure every element has a key, using message id or fallback to index
      if (element && !element.key) {
        return React.cloneElement(element, { key: msg.id ?? `msg-${index}` });
      }
      return element;
    });
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
      className="flex flex-col gap-4 rounded-4xl p-2"
    >
      {memoMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-zinc-500">
          Start a conversation...
        </div>
      ) : (
        <>
          {renderedMessages}
          {/* Show thinking indicator when loading but no AI response yet */}
          {isLoading && memoMessages.length > 0 && memoMessages[memoMessages.length - 1].type === "human" && (
            <div className="flex items-center gap-2">
              {/* <div className="animate rounded-full h-6 w-6 border-b-2 border-zinc-400"></div> */}
               Thinking<span className="animate-pulse">...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
