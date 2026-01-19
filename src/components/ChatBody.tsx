import { useStreamContext } from "@/providers/Stream";
import { logger } from "@/utils/logger";
import { isAiWithToolCalls, isToolMessage } from "@/utils/utils";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import AgentMessage from "./messages/AgentMessage";
import CustomComponentRender from "./messages/CustomComponentRender";
import HumanMessage from "./messages/HumanMessage";
import Thinking from "./Thinking";
import ToolCallFunctions from "./ToolCallFunctions";

export default function ChatBody({ setIsFirstMessage, enableToolCallIndicator }: { setIsFirstMessage?: React.Dispatch<React.SetStateAction<boolean>>, enableToolCallIndicator?: boolean }) {
  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  logger.debug("ChatBody render - messages count:", messages, "isLoading:", isLoading);

  // Memoize messages with stable reference
  const memoMessages = useMemo(() => messages ?? [], [messages]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevMessageCountRef = useRef(0);
  const shouldAutoScrollRef = useRef(true);

  // Get the parent scroll container
  const getScrollContainer = useCallback(() => {
    if (containerRef.current) {
      // Find the parent with overflow-y-auto class
      let parent = containerRef.current.parentElement;
      while (parent) {
        const style = window.getComputedStyle(parent);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          return parent;
        }
        parent = parent.parentElement;
      }
    }
    return null;
  }, []);

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
          {toolMessages.length > 0 && enableToolCallIndicator && (
            <ToolCallFunctions
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
  }, [isLoading, stream, enableToolCallIndicator]);

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

  // Track user scroll position to determine if we should auto-scroll
  useEffect(() => {
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      // Consider "at bottom" if within 100px
      shouldAutoScrollRef.current = distanceFromBottom < 100;
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [getScrollContainer]);

  // Auto-scroll when new messages are added
  useEffect(() => {
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;

    const currentCount = memoMessages.length;
    const hasNewMessage = currentCount > prevMessageCountRef.current;

    if (hasNewMessage) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      shouldAutoScrollRef.current = true;
    }

    prevMessageCountRef.current = currentCount;
  }, [memoMessages, getScrollContainer]);

  // Use MutationObserver to detect DOM changes and auto-scroll during streaming
  useEffect(() => {
    const scrollContainer = getScrollContainer();
    if (!scrollContainer || !isLoading) return;

    const observer = new MutationObserver(() => {
      if (shouldAutoScrollRef.current && scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    });

    // Observe the ChatBody container for changes
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => observer.disconnect();
  }, [isLoading, getScrollContainer]);

  // Use useLayoutEffect to scroll after DOM updates
  useLayoutEffect(() => {
    const scrollContainer = getScrollContainer();
    if (isLoading && shouldAutoScrollRef.current && scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });

  return (
    <div
      ref={containerRef}
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
              {/* Thinking<span className="animate-pulse">...</span> */}
              <Thinking />
            </div>
          )}
        </>
      )}
    </div>
  );
}
