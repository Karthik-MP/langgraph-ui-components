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

    console.log("Rendering message:", msg, "at index:", index);

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
    
    // Use message id or fallback to index for key
    const msgKey = msg.id ?? `msg-${index}`;

    if (msg.type === "human") {
      return <HumanMessage key={msgKey} message={msg} />;
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
          <React.Fragment key={msgKey}>
            <AgentMessage
              message={msg}
              isStreaming={isStreamingThisMessage}
            />
            <CustomComponentRender message={msg} thread={stream} />
          </React.Fragment>
        );
      } else {
        return (
          <Thinking
            key={msgKey}
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
        <Thinking key={msgKey} title="Agent Thinking" message={msg} />
      );
    }

    return (
      <React.Fragment key={msgKey}>
        <CustomComponentRender message={msg} thread={stream} />
        <AgentMessage
          message={msg}
          isStreaming={isStreamingThisMessage}
        />
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
      className="flex flex-col gap-4 rounded-4xl p-2 bg-black/20"
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
