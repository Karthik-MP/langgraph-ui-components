import { parsePartialJson } from "@langchain/core/output_parsers";
import { useStreamContext } from "@/providers/Stream";
import type { chatBodyProps } from "@/types/ChatProps";
import { logger } from "@/utils/logger";
import { isAiWithToolCalls, isToolMessage } from "@/utils/utils";
import type { AIMessage, Message } from "@langchain/langgraph-sdk";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import AgentMessage from "./messages/AgentMessage";
import CustomComponentRender from "./messages/CustomComponentRender";
import HumanMessage from "./messages/HumanMessage";
import type { MessageFeedback } from "./messages/MessageActions";
import Thinking from "./Thinking";
import ToolCallFunctions from "./ToolCallFunctions";

export default function ChatBody({ setIsFirstMessage, enableToolCallIndicator, chatBodyProps }: { setIsFirstMessage?: React.Dispatch<React.SetStateAction<boolean>>, enableToolCallIndicator?: boolean, chatBodyProps?: chatBodyProps }) {
  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  // State to track message feedback (likes/dislikes)
  const [messageFeedback, setMessageFeedback] = useState<Record<string, MessageFeedback>>({});

  logger.debug("ChatBody render - messages count:", messages, "isLoading:", isLoading);

  // Memoize messages with stable reference
  const memoMessages = useMemo(() => messages ?? [], [messages]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevMessageCountRef = useRef(0);
  const shouldAutoScrollRef = useRef(true);

  // Handler for message feedback
  const handleFeedback = useCallback((messageId: string, feedback: MessageFeedback) => {
    setMessageFeedback(prev => ({
      ...prev,
      [messageId]: feedback,
    }));
  }, []);

  // Handler for message regeneration
  const handleRegenerate = useCallback(async (
    parentCheckpoint: any | null | undefined,
  ) => {
    if (!parentCheckpoint) {
      console.error("No parent checkpoint available for regeneration");
      return;
    }

    await stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
      streamSubgraphs: true,
      streamResumable: true,
    });
  }, [stream]);

  // Handler for selecting a different branch
  const handleBranchSelect = useCallback((branch: string) => {
    stream.setBranch(branch);
  }, [stream]);

  const getToolCallsFromContent = useCallback((content: Message["content"]): AIMessage["tool_calls"] => {
    if (!Array.isArray(content)) return [];
    const toolCallContents = content.filter(
      (c) => typeof c === "object" && c !== null && (c as any).type === "tool_use" && (c as any).id,
    ) as Array<Record<string, any>>;

    return toolCallContents.map((tc) => {
      let args: Record<string, any> = {};
      if (tc?.input) {
        if (typeof tc.input === "string") {
          try {
            args = parsePartialJson(tc.input) ?? {};
          } catch {
            args = {};
          }
        } else if (typeof tc.input === "object") {
          args = tc.input as Record<string, any>;
        }
      }
      return {
        name: tc.name ?? "",
        id: tc.id ?? "",
        args,
        type: "tool_call",
      };
    });
  }, []);

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
    const isCurrentlyStreamingMessage = isLoading && index === messagesArray.length - 1 && msg.type === "ai";
    if (!msg.content.length && !isAiWithToolCalls(msg) && !isCurrentlyStreamingMessage) return null;

    if (msg.additional_kwargs?.hidden) {
      return null;
    }

    // Use message id or fallback to index for key
    const msgKey = msg.id ?? `msg-${index}`;

    if (msg.type === "human") {
      return <HumanMessage key={msgKey} message={msg} fontSize={chatBodyProps?.fontSize} />;
    }

    // Skip standalone tool messages
    if (isToolMessage(msg)) {
      return null;
    }

    // Skip if this AI message was already combined with a previous one
    if (msg.type === "ai" && index > 0) {
      // Check if previous non-tool message is also an AI message
      let prevIndex = index - 1;
      while (prevIndex >= 0 && isToolMessage(messagesArray[prevIndex])) {
        prevIndex--;
      }

      if (prevIndex >= 0 && messagesArray[prevIndex].type === "ai") {
        // This is a consecutive AI message, skip it (it will be combined with the previous one)
        return null;
      }
    }

    // Collect all consecutive AI messages and tool messages
    const groupedMessages = [msg];
    const toolMessages = [];
    let nextIndex = index + 1;

    while (nextIndex < messagesArray.length) {
      const nextMsg = messagesArray[nextIndex];

      if (isToolMessage(nextMsg)) {
        toolMessages.push(nextMsg);
        nextIndex++;
      } else if (nextMsg.type === "ai") {
        // Combine consecutive AI messages
        groupedMessages.push(nextMsg);
        nextIndex++;
      } else {
        // Stop at human messages or other types
        break;
      }
    }

    // Merge content from all AI messages, preserving r/reasoning blocks
    const hasArrayContent = groupedMessages.some(m => Array.isArray(m.content));
    const mergedContent: Message["content"] = hasArrayContent
      ? groupedMessages.flatMap(m => {
          if (Array.isArray(m.content)) return m.content as any[];
          if (typeof m.content === "string" && m.content.length > 0)
            return [{ type: "text", text: m.content }];
          return [];
        })
      : groupedMessages
          .map(m => (typeof m.content === "string" ? m.content : ""))
          .filter(Boolean)
          .join("\n\n");

    // Extract plain-text portion for legacy checks (tool-call extraction, etc.)
    const combinedContent = hasArrayContent
      ? (mergedContent as any[])
          .map((c: any) => (c.type === "text" ? (c.text as string) : ""))
          .filter(Boolean)
          .join(" ")
      : (mergedContent as string);

    const toolCallsFromContent = groupedMessages
      .flatMap((m) => {
        const calls = getToolCallsFromContent(m.content);
        return calls || [];
      })
      .filter((tc): tc is NonNullable<typeof tc> => tc != null && tc !== undefined);

    // Create a combined message object preserving full content (including thinking blocks)
    const combinedMessage = {
      ...msg,
      content: mergedContent,
    };

    // Get branch metadata from thread
    const meta = msg ? stream.getMessagesMetadata(msg) : undefined;

    // Determine if there is any displayable content (text OR thinking/reasoning blocks)
    const hasThinkingContent = hasArrayContent
      ? (mergedContent as any[]).some(
          (b: any) =>
            (b.type === "thinking" && (b.thinking as string)?.length > 0) ||
            (b.type === "reasoning" && (b.reasoning as string)?.length > 0),
        )
      : false;
    const hasKwargsReasoning =
      typeof (msg as any).additional_kwargs?.reasoning_content === "string" &&
      ((msg as any).additional_kwargs.reasoning_content as string).length > 0;
    const hasAnyDisplayableContent = !!combinedContent || hasThinkingContent || hasKwargsReasoning;

    const isLastMessageGroup = nextIndex >= messagesArray.length;
    const isStreamingThisMessage = isLoading && isLastMessageGroup;

    // Check if the first message in the group has tool calls
    const hasToolCalls = isAiWithToolCalls(msg) || toolCallsFromContent.length > 0;

    // Show Thinking animation whenever streaming with no displayable content yet (plain chat or tool-call)
    const showThinkingIndicator = isStreamingThisMessage && !hasAnyDisplayableContent;

    return (
      <React.Fragment key={msgKey}>
        {/* 1. Thinking indicator - show when streaming with no content yet (no icon shown) */}
        {showThinkingIndicator && (
          <Thinking />
        )}
        {enableToolCallIndicator && hasToolCalls && (
          <ToolCallFunctions
            title="Agent Thinking"
            toolMessages={toolMessages}
            toolCalls={toolCallsFromContent}
          />
        )}
        {/* 2. Agent message — pass full mergedContent so thinking/reasoning blocks are preserved */}
        {hasAnyDisplayableContent && (
          <AgentMessage
            agentName={chatBodyProps?.agentName}
            fontSize={chatBodyProps?.fontSize}
            // agentAvatarUrl={chatBodyProps?.agentAvatarUrl}
            message={combinedMessage}
            isStreaming={isStreamingThisMessage}
            onRegenerate={handleRegenerate}
            feedback={msg.id ? messageFeedback[msg.id] : undefined}
            onFeedback={handleFeedback}
            branch={meta?.branch}
            branchOptions={meta?.branchOptions}
            onBranchSelect={handleBranchSelect}
          />
        )}
        {/* 3. Custom component (from all messages in the group) */}
        {groupedMessages.map((m) => (
          <CustomComponentRender key={m.id} message={m} thread={stream} />
        ))}
      </React.Fragment>
    );
  }, [isLoading, stream, enableToolCallIndicator, handleRegenerate, messageFeedback, handleFeedback, handleBranchSelect]);

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
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-5 w-5 border-2 border-zinc-500 border-t-transparent rounded-full" />
              <span>Loading conversation...</span>
            </div>
          ) : (
            "Start a conversation..."
          )}
        </div>
      ) : (
        <>
          {renderedMessages}
          {/* Show thinking indicator when loading and no AI response has started yet */}
          {isLoading && memoMessages.length > 0 && (() => {
            const lastMsg = memoMessages[memoMessages.length - 1];
            // Show if last message is human or if last AI has no content (only tool calls)
            return lastMsg.type === "human" ||
              (lastMsg.type === "ai" && !lastMsg.content && isAiWithToolCalls(lastMsg));
          })() && (
              <Thinking />
            )}
        </>
      )}

    </div>
  );
}
