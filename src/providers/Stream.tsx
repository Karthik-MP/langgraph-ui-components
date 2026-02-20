/* @refresh reset */
import { useChatRuntime } from "@/providers/ChatRuntime";
import { logger } from "@/utils/logger";
import { type AIMessage, type Message } from "@langchain/langgraph-sdk";

// Derive the tool-call types from AIMessage since the SDK doesn't re-export them
type ToolCall = NonNullable<AIMessage["tool_calls"]>[number];
type InvalidToolCall = NonNullable<AIMessage["invalid_tool_calls"]>[number];
import { useStream, type UseStream } from "@langchain/langgraph-sdk/react";
import {
  isRemoveUIMessage,
  isUIMessage,
  type RemoveUIMessage,
  type UIMessage,
  uiMessageReducer,
} from "@langchain/langgraph-sdk/react-ui";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useThread } from "./Thread";

export type StateType = {
  messages: Message[];
  ui?: UIMessage[];
  suggestions?: string[];
};

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

type StreamContextType = UseStream<StateType, {
  UpdateType: {

    messages?: Message[] | Message | string;
    ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
  };
  CustomEventType: UIMessage | RemoveUIMessage;
}> & {
  sendMessage: (
    message: Message | string,
    options?: {
      /** If true, message is meant for agent only (not user-visible) */
      type?: Message["type"];
      /** Name field required for function/tool messages */
      name?: string;
      /** If true, message is hidden from user UI */
      hidden?: boolean;
      /** Tool calls associated with this message */
      tool_calls?: ToolCall[];
      /** Invalid tool calls associated with this message */
      invalid_tool_calls?: InvalidToolCall[];
      /** If provided, use this ID for the message instead of generating one */
      tool_call_id?: string;
      /** Additional kwargs to attach to the message */
      additional_kwargs?: Record<string, unknown>;
      /** UI components to display alongside the message */
      ui?: UIMessage[];
      /** Custom ID for the message (will also be used for UI components) */
      id?: string;
      /** Custom context to override/merge with identity */
      context?: Record<string, unknown>;
    }
  ) => Promise<void>;
  submitMessage: (
    message: Message,
    options?: {
      streamMode?: ("values" | "updates" | "messages" | "custom" | "debug")[];
      streamSubgraphs?: boolean;
      streamResumable?: boolean;
      contextValues?: Record<string, unknown>;
    }
  ) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  fetchCatalog: () => Promise<unknown>;
};

const StreamContext = createContext<StreamContextType | undefined>(undefined);

async function checkGraphStatus(apiUrl: string, authToken: string | null | undefined) {
  try {
    const res = await fetch(`${apiUrl}/info`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });
    return res.ok;
  } catch {
    logger.error("Failed to initialize LangGraph Agent");
  }
}

async function fetchCatalog(apiUrl: string, authToken: string | null | undefined) {
  try {
    const res = await fetch(`${apiUrl}/agents/catalog`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    return null;
  }
  catch {
    logger.error("Failed to fetch LangGraph Catalog");
    return null;
  }
}

async function sleep(ms = 6000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const StreamSession = ({ children }: { children: ReactNode }) => {
  const { apiUrl, assistantId, identity } = useChatRuntime();
  const { mode, threadId, setThreadId, getThreads, setThreads, configuration } = useThread();

  // Store local-only AI messages that shouldn't trigger backend calls
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  // Store local-only UI components
  const [localUI, setLocalUI] = useState<UIMessage[]>([]);
  // Track if catalog has been fetched to prevent duplicate calls
  const [catalogFetched, setCatalogFetched] = useState(false);
  const [catalogCache, setCatalogCache] = useState<unknown>(null);

  const streamValue = useTypedStream({
    apiUrl,
    assistantId,
    threadId: mode === "multi" ? threadId : null,
    defaultHeaders: identity?.authToken
      ? { Authorization: `Bearer ${identity?.authToken}` }
      : undefined,
    fetchStateHistory: true,
    onCustomEvent: (event, options) => {
      if (isUIMessage(event) || isRemoveUIMessage(event)) {
        options.mutate((prev) => {
          logger.debug("UI Event received in StreamProvider:", event);
          const ui = uiMessageReducer(prev.ui ?? [], event);
          return { ...prev, ui };
        });
      }
    },

    onThreadId: (id) => {
      if (!id) return;
      if (mode === "single") {
        // lock once
        if (!threadId) setThreadId(id);
      } else {
        // switch freely
        setThreadId(id);
        // Refetch threads list when thread ID changes.
        // Wait for some seconds before fetching so we're able to get the new thread that was created.
        sleep().then(() => getThreads().then(setThreads).catch((err) => logger.error("Failed to refresh threads:", err)));
      }
    },
  });

  /**
   * Send a message to the agent programmatically
   * Useful for triggering agent actions without user-visible messages
   * e.g., "login completed", "card clicked: {id}"
   */
  const sendMessage = useCallback(
    async (
      message: Message | string,
      options?: {
        type?: Message["type"];
        name?: string;
        hidden?: boolean;
        tool_calls?: ToolCall[];
        invalid_tool_calls?: InvalidToolCall[];
        tool_call_id?: string;
        additional_kwargs?: Record<string, unknown>;
        ui?: UIMessage[];
        id?: string; // Allow passing custom ID
        context?: Record<string, unknown>; // Allow passing custom context to override identity
      }
    ) => {
      // Use provided ID or generate new one
      const messageId = options?.id || uuidv4();

      const messageObj: Message =
        typeof message === "string"
          ? ({
            id: messageId, // Use the determined ID
            type: options?.type ?? "human",
            content: message,
            ...(options?.name && { name: options.name }),
            ...(options?.tool_calls && { tool_calls: options.tool_calls }),
            ...(options?.invalid_tool_calls && { invalid_tool_calls: options.invalid_tool_calls }),
            ...(options?.tool_call_id && { tool_call_id: options.tool_call_id }),
            ...((options?.additional_kwargs || options?.hidden) && {
              additional_kwargs: {
                ...(options?.hidden && { hidden: true }),
                ...(options?.additional_kwargs ?? {}),
              }
            }),
          } as Message)
          : {
            ...message,
            id: messageId, // Override with determined ID
            // Allow overriding message fields with options
            ...(options?.tool_calls && { tool_calls: options.tool_calls }),
            ...(options?.additional_kwargs && {
              additional_kwargs: {
                ...message.additional_kwargs,
                ...options.additional_kwargs,
              }
            }),
          };

      // console.log("Sending message via sendMessage:", messageObj); → converted to debug log
      logger.debug("Sending message via sendMessage:", messageObj);

      // If message type is "ai", just append to local state without submitting to agent
      // This is useful for injecting initial messages or system messages that don't need agent processing
      if (options?.type === "ai") {
        setLocalMessages((prev) => [...prev, messageObj]);
        logger.debug("Appended AI message to localMessages:", options?.ui);
        // Also store any UI components, linking them to the message id
        if (options.ui && options.ui.length > 0) {
          const uiWithMessageId = options.ui.map((ui, index) => ({
            ...ui,
            id: messageId, // Link to the message ID so CustomComponentRender can find it
            // Ensure each UI component has a unique identifier for React keys
            _key: (ui as UIMessage & { _key?: string })._key || `${messageId}-ui-${index}`,
          })) as UIMessage[];
          setLocalUI((prev) => [...prev, ...uiWithMessageId]);
        }
        return;
      }

      // For non-AI messages, submit to the agent
      const currentMessages = streamValue.messages || [];
      // Merge identity with custom context, custom context takes precedence
      const mergedContext = options?.context
        ? { ...identity, ...options.context, ...configuration }
        : identity || {};

      await streamValue.submit(
        { messages: [...currentMessages, messageObj] },
        {
          context: mergedContext,
        }
      );
    },
    [streamValue, identity, configuration, setLocalMessages, setLocalUI]
  );

  // Combine stream messages with local AI messages, deduplicating by ID
  const combinedMessages = useMemo(() => {
    const allMessages = [...localMessages, ...(streamValue.messages || [])];
    // Deduplicate by message ID, keeping the first occurrence
    const seen = new Set<string>();
    return allMessages.filter(msg => {
      if (!msg.id) return true; // Keep messages without IDs
      if (seen.has(msg.id)) return false;
      seen.add(msg.id);
      return true;
    });
  }, [localMessages, streamValue.messages]);

  // Combine local UI with stream UI, deduplicating by unique key
  const combinedUI = useMemo(() => {
    logger.debug("Combining local UI with stream UI:", localUI, streamValue.values?.ui);
    const allUI = [...localUI, ...(streamValue.values?.ui || [])];
    // Deduplicate by _key or id+name combination
    const seen = new Set<string>();
    return allUI.filter(ui => {
      const key = (ui as UIMessage & { _key?: string })._key || `${ui.id}-${ui.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [localUI, streamValue.values?.ui]);

  const submitMessage = useCallback(
    async (
      message: Message,
      options?: {
        streamMode?: ("values" | "updates" | "messages" | "custom" | "debug")[];
        streamSubgraphs?: boolean;
        streamResumable?: boolean;
        contextValues?: Record<string, unknown>;
      }
    ) => {
      // Get ALL current messages (including local AI messages)
      const allCurrentMessages = combinedMessages || [];

      await streamValue.submit(
        { messages: [...allCurrentMessages, message] },
        {
          context: { ...identity, ...options?.contextValues },
          streamMode: options?.streamMode || ["values"],
          streamSubgraphs: options?.streamSubgraphs ?? true,
          streamResumable: options?.streamResumable ?? true,
          optimisticValues: (prev) => ({
            ...prev,
            messages: [...allCurrentMessages, message],
          }),
        }
      );
    },
    [streamValue, identity, combinedMessages]
  );

  /**
   * Regenerate an AI response by finding the last human message before the specified AI message
   * and resubmitting from that point
   */
  const regenerateMessage = useCallback(
    async (messageId: string) => {
      const allMessages = combinedMessages || [];
      const messageIndex = allMessages.findIndex((msg) => msg.id === messageId);

      if (messageIndex === -1) {
        logger.error("Message not found for regeneration:", messageId);
        return;
      }

      // Find the last human message before this AI message
      let lastHumanIndex = messageIndex - 1;
      while (lastHumanIndex >= 0 && allMessages[lastHumanIndex].type !== "human") {
        lastHumanIndex--;
      }

      if (lastHumanIndex === -1) {
        logger.error("No human message found before AI message:", messageId);
        return;
      }

      // Get all messages up to and including the last human message
      const messagesToKeep = allMessages.slice(0, lastHumanIndex + 1);

      // Remove the last human message from the list since we'll resubmit it
      const messagesBeforeHuman = messagesToKeep.slice(0, -1);
      const humanMessage = messagesToKeep[messagesToKeep.length - 1];

      // Clear local messages that came after the human message
      setLocalMessages((prev) =>
        prev.filter((msg) => {
          const msgIndex = allMessages.findIndex((m) => m.id === msg.id);
          return msgIndex < lastHumanIndex;
        })
      );

      // Clear local UI that came after the human message  
      setLocalUI((prev) =>
        prev.filter((ui) => {
          const msgIndex = allMessages.findIndex((m) => m.id === ui.id);
          return msgIndex < lastHumanIndex;
        })
      );

      // Resubmit from the human message
      await streamValue.submit(
        { messages: [...messagesBeforeHuman, humanMessage] },
        {
          streamMode: ["values"],
          streamSubgraphs: true,
          streamResumable: true,
        }
      );
    },
    [combinedMessages, streamValue, identity, configuration, setLocalMessages, setLocalUI]
  );

  useEffect(() => {
    checkGraphStatus(apiUrl, identity?.authToken).then((ok) => {
      if (!ok) {
        toast.error("Failed to connect to LangGraph server", {
          description: `Unable to reach ${apiUrl}`,
          duration: 10000,
        });
      }
    });
  }, [apiUrl, identity?.authToken]);

  const fetchCatalogMemoized = useCallback(async () => {
    // Return cached data if already fetched
    if (catalogFetched && catalogCache !== null) {
      return catalogCache;
    }

    // Fetch catalog only once
    if (!catalogFetched) {
      setCatalogFetched(true);
      const data = await fetchCatalog(apiUrl, identity?.authToken);
      setCatalogCache(data);
      return data;
    }

    return catalogCache;
  }, [apiUrl, identity?.authToken, catalogFetched, catalogCache]);

  const value = useMemo(
    () => ({
      ...streamValue,
      messages: combinedMessages, // Override with combined messages
      values: {
        ...streamValue.values,
        ui: combinedUI, // Override with combined UI
      },
      sendMessage,
      submitMessage,
      regenerateMessage,
      fetchCatalog: fetchCatalogMemoized,
    }),
    [streamValue, combinedMessages, combinedUI, sendMessage, submitMessage, regenerateMessage, fetchCatalogMemoized]
  );

  return (
    <StreamContext.Provider value={value}>{children}</StreamContext.Provider>
  );
};

/**
 * Provides streaming message functionality for real-time AI responses.
 * Manages message state, handles streaming updates, and provides submit/sendMessage functions.
 * 
 * @example
 * ```tsx
 * <StreamProvider>
 *   <ChatInterface />
 * </StreamProvider>
 * ```
 */
export function StreamProvider({ children }: { children: ReactNode }) {
  return <StreamSession>{children}</StreamSession>;
}

/**
 * Hook to access the streaming context.
 * Provides access to messages, loading state, and functions to submit messages.
 * 
 * @throws {Error} If used outside of StreamProvider
 * 
 * @example
 * ```tsx
 * const { messages, isLoading, submit, sendMessage } = useStreamContext();
 * ```
 */
export function useStreamContext(): StreamContextType {
  const ctx = useContext(StreamContext);
  if (!ctx) {
    throw new Error("useStreamContext must be used within StreamProvider");
  }
  return ctx;
}