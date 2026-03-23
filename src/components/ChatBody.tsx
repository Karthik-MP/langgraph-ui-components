import { useStreamContext } from "@/providers/Stream";
import { useCustomComponents } from "@/providers/CustomComponentProvider";
import type { chatBodyProps } from "@/types/ChatProps";
import { logger } from "@/utils/logger";
import { isAiWithToolCalls, isToolMessage } from "@/utils/utils";
import type { Message } from "@langchain/langgraph-sdk";
import type { TodoItem } from "@/providers/Stream";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import AgentMessage from "./messages/AgentMessage";
import CustomComponentRender from "./messages/CustomComponentRender";
import HumanMessage from "./messages/HumanMessage";
import type { MessageFeedback } from "./messages/MessageActions";
import Thinking from "./Thinking";

export default function ChatBody({ setIsFirstMessage, enableToolCallIndicator = true, chatBodyProps }: { setIsFirstMessage?: React.Dispatch<React.SetStateAction<boolean>>, enableToolCallIndicator?: boolean, chatBodyProps?: chatBodyProps }) {
  const stream = useStreamContext();
  const { interruptComponents } = useCustomComponents();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  // State to track message feedback (likes/dislikes)
  const [messageFeedback, setMessageFeedback] = useState<Record<string, MessageFeedback>>({});

  logger.debug("ChatBody render - messages count:", messages, "isLoading:", isLoading);

  // Memoize messages with stable reference
  const memoMessages = useMemo(() => messages ?? [], [messages]);

  const uiMessageIds = useMemo(() => {
    const ids = new Set<string>();
    const uiMessages = stream.values?.ui;
    if (!Array.isArray(uiMessages)) return ids;

    for (const ui of uiMessages) {
      const uiObj = ui as unknown as Record<string, unknown>;
      const metadata =
        uiObj.metadata && typeof uiObj.metadata === "object"
          ? (uiObj.metadata as Record<string, unknown>)
          : undefined;

      const candidates = [
        typeof uiObj.id === "string" ? uiObj.id : undefined,
        typeof metadata?.id === "string" ? metadata.id : undefined,
        typeof metadata?.message_id === "string" ? metadata.message_id : undefined,
      ];

      for (const candidate of candidates) {
        if (candidate) ids.add(candidate);
      }
    }

    return ids;
  }, [stream.values?.ui]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevMessageCountRef = useRef(0);
  const shouldAutoScrollRef = useRef(true);
  const frozenTodosByGroupRef = useRef<Map<string, TodoItem[]>>(new Map());

  const normalizeTodos = useCallback((todos: unknown): TodoItem[] => {
    if (!Array.isArray(todos)) return [];

    return todos
      .map((todo, index) => {
        if (!todo || typeof todo !== "object") return null;
        const t = todo as Record<string, unknown>;
        const status = t.status;
        if (
          typeof t.content !== "string" ||
          (status !== "pending" && status !== "in_progress" && status !== "completed")
        ) {
          return null;
        }

        return {
          id: t.id && typeof t.id === "string" ? t.id : `todo-${index}`,
          content: t.content,
          status,
          updatedAt: t.updatedAt instanceof Date || typeof t.updatedAt === "string" || typeof t.updatedAt === "number"
            ? (t.updatedAt as string | number | Date)
            : undefined,
          run_id: typeof t.run_id === "string" ? t.run_id : undefined,
          runId: typeof t.runId === "string" ? t.runId : undefined,
          messageId: typeof t.messageId === "string" ? t.messageId : undefined,
          checkpoint: typeof t.checkpoint === "string" ? t.checkpoint : undefined,
        } as TodoItem;
      })
      .filter((todo): todo is TodoItem => todo !== null);
  }, []);

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

  // Handler for HITL interrupt responses
  const handleInterruptRespond = useCallback((response: any) => {
    stream.submit(null, {
      command: { resume: response },
      streamMode: ["values", "messages-tuple", "updates", "custom"],
      streamSubgraphs: true,
    });
  }, [stream]);

  // Build interrupt actions for custom renderers
  const interruptActions = useMemo(() => {
    const interrupt = stream.interrupt;
    if (!interrupt) return null;
    const payload = interrupt.value as any;
    const actionRequests = payload?.actionRequests ?? [];
    return {
      approve: () => {
        handleInterruptRespond({
          decisions: actionRequests.map(() => ({ type: "approve" as const })),
        });
      },
      reject: (reason?: string) => {
        handleInterruptRespond({
          decisions: actionRequests.map(() => ({
            type: "reject" as const,
            message: reason || undefined,
          })),
        });
      },
      edit: (editedArgs: Record<string, unknown>) => {
        const action = actionRequests[0];
        handleInterruptRespond({
          decisions: [
            {
              type: "edit" as const,
              editedAction: {
                name: action?.name ?? "",
                args: { ...action?.args, ...editedArgs },
              },
            },
          ],
        });
      },
    };
  }, [stream.interrupt, handleInterruptRespond]);

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
    const hasCustomComponentForMessage = (message: Message) =>
      typeof message.id === "string" && uiMessageIds.has(message.id);

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
        // Only render separately if THIS message owns custom UI (needs its own group).
        // Otherwise it was already consumed by the previous group's forward scan.
        const currentHasCustomUi = hasCustomComponentForMessage(msg);
        if (!currentHasCustomUi) {
          return null;
        }
      }
    }

    const groupedTimelineMessages: Message[] = [msg];
    let nextIndex = index + 1;

    while (nextIndex < messagesArray.length) {
      const nextMsg = messagesArray[nextIndex];

      if (isToolMessage(nextMsg)) {
        groupedTimelineMessages.push(nextMsg);
        nextIndex++;
      } else if (nextMsg.type === "ai") {
        if (hasCustomComponentForMessage(nextMsg)) {
          // Sub-agent/custom UI messages should be rendered in their own section
          // to avoid parent-bubble flicker and reparenting during streaming.
          break;
        }
        groupedTimelineMessages.push(nextMsg);
        nextIndex++;
      } else {
        // Stop at human messages or other types
        break;
      }
    }

    const groupedAiMessages = groupedTimelineMessages.filter((m) => m.type === "ai");

    // Merge content from all AI messages, preserving reasoning blocks.
    // Deduplicate identical text content (subgraph messages can duplicate parent messages).
    const hasArrayContent = groupedAiMessages.some((m) => Array.isArray(m.content));
    const seenTexts = new Set<string>();
    const mergedContent: Message["content"] = hasArrayContent
      ? groupedAiMessages.flatMap((m) => {
          if (Array.isArray(m.content)) {
            return (m.content as any[]).filter((block: any) => {
              if (block.type === "text" && typeof block.text === "string") {
                if (seenTexts.has(block.text)) return false;
                seenTexts.add(block.text);
              }
              return true;
            });
          }
          if (typeof m.content === "string" && m.content.length > 0) {
            if (seenTexts.has(m.content)) return [];
            seenTexts.add(m.content);
            return [{ type: "text", text: m.content }];
          }
          return [];
        })
      : (() => {
          const unique: string[] = [];
          for (const m of groupedAiMessages) {
            const text = typeof m.content === "string" ? m.content : "";
            if (text && !seenTexts.has(text)) {
              seenTexts.add(text);
              unique.push(text);
            }
          }
          return unique.join("\n\n");
        })();

    // Extract plain-text portion for legacy checks
    const combinedContent = hasArrayContent
      ? (mergedContent as any[])
          .map((c: any) => (c.type === "text" ? (c.text as string) : ""))
          .filter(Boolean)
          .join(" ")
      : (mergedContent as string);

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
      groupedAiMessages.some((m) => {
        const ak = (m as Record<string, unknown>).additional_kwargs as Record<string, unknown> | undefined;
        return typeof ak?.reasoning_content === "string" && (ak.reasoning_content as string).length > 0;
      });

    const hasKwargsToolStatus = groupedAiMessages.some((m) => {
      const ak = (m as Record<string, unknown>).additional_kwargs as Record<string, unknown> | undefined;
      return Array.isArray(ak?.tool_status) && (ak.tool_status as unknown[]).length > 0;
    });
    const hasToolMessages = groupedTimelineMessages.some((m) => isToolMessage(m));
    const hasToolCalls = enableToolCallIndicator && (
      groupedAiMessages.some((m) => isAiWithToolCalls(m)) ||
      hasKwargsToolStatus ||
      hasToolMessages
    );
    const hasAnyDisplayableContent =
      !!combinedContent ||
      hasThinkingContent ||
      hasKwargsReasoning ||
      hasToolCalls;

    const isLastMessageGroup = nextIndex >= messagesArray.length;
    const isStreamingThisMessage = isLoading && isLastMessageGroup;

    const groupKey = groupedAiMessages
      .map((m) => m.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0)
      .join("|") || msgKey;

    const todosForGroup = (() => {
      const frozen = frozenTodosByGroupRef.current.get(groupKey);
      if (!isStreamingThisMessage && frozen && frozen.length > 0) {
        return frozen;
      }

      if (isStreamingThisMessage) {
        const live = normalizeTodos(stream.values?.todos);
        if (live.length > 0) {
          frozenTodosByGroupRef.current.set(groupKey, live);
          return live;
        }
      }

      for (let i = groupedAiMessages.length - 1; i >= 0; i--) {
        const aiMeta = stream.getMessagesMetadata(groupedAiMessages[i]);
        const aiValues = aiMeta?.firstSeenState?.values as { todos?: unknown } | undefined;
        const snapshot = normalizeTodos(aiValues?.todos);
        if (snapshot.length > 0) {
          if (!frozen || frozen.length === 0) {
            frozenTodosByGroupRef.current.set(groupKey, snapshot);
          }
          return frozen ?? snapshot;
        }
      }

      if (frozen && frozen.length > 0) {
        return frozen;
      }

      return [];
    })();

    // Show Thinking animation whenever streaming with no displayable content yet (plain chat or tool-call)
    const showThinkingIndicator = isStreamingThisMessage && !hasAnyDisplayableContent;

    return (
      <React.Fragment key={msgKey}>
        {/* 1. Thinking indicator - show when streaming with no content yet (no icon shown) */}
        {showThinkingIndicator && (
          <Thinking />
        )}
        {/* 2. Agent message — pass full mergedContent and grouped timeline for in-order rendering */}
        {hasAnyDisplayableContent && (
          <AgentMessage
            agentName={chatBodyProps?.agentName}
            fontSize={chatBodyProps?.fontSize}
            message={combinedMessage}
            groupedMessages={groupedTimelineMessages}
            showToolActivity={enableToolCallIndicator}
            isStreaming={isStreamingThisMessage}
            onRegenerate={handleRegenerate}
            feedback={msg.id ? messageFeedback[msg.id] : undefined}
            onFeedback={handleFeedback}
            branch={meta?.branch}
            branchOptions={meta?.branchOptions}
            onBranchSelect={handleBranchSelect}
            todos={todosForGroup}
          />
        )}
        {/* 3. Custom component (from all messages in the group) */}
        {groupedAiMessages.map((m) => (
          <CustomComponentRender key={m.id} message={m} thread={stream} />
        ))}
      </React.Fragment>
    );
  }, [isLoading, stream, normalizeTodos, enableToolCallIndicator, handleRegenerate, messageFeedback, handleFeedback, handleBranchSelect, uiMessageIds]);

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
          {/* Show HITL interrupt card when agent is paused for approval */}
          {/* Show thinking indicator when loading and last message is human (no AI response yet) */}
          {isLoading && memoMessages.length > 0 &&
            memoMessages[memoMessages.length - 1].type === "human" && (
              <Thinking />
            )}
          {!isLoading && stream.interrupt && interruptActions && (() => {
            const payload = stream.interrupt.value as any;
            const toolName = payload?.actionRequests?.[0]?.name;
            const InterruptComponent = toolName ? interruptComponents[toolName] : undefined;
            if (!InterruptComponent) return null;
            return <InterruptComponent interrupt={payload} actions={interruptActions} />;
          })()}
        </>
      )}

    </div>
  );
}
