/* @refresh reset */
import { useChatRuntime } from "@/providers/ChatRuntime";
import { type Message } from "@langchain/langgraph-sdk";
import { useStream, type UseStream } from "@langchain/langgraph-sdk/react";
import { v4 as uuidv4 } from "uuid";
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
} from "react";
import { toast } from "sonner";
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
      /** Additional config to pass to the agent */
      config?: any;
    }
  ) => Promise<void>;
};

const StreamContext = createContext<StreamContextType | undefined>(undefined);

async function checkGraphStatus(apiUrl: string, authToken: string | null | undefined) {
  try {
    const res = await fetch(`${apiUrl}/info`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });
    return res.ok;
  } catch {
    console.error("Failed to intialize LangGraph Agent");
  }
}

const StreamSession = ({ children }: { children: ReactNode }) => {
  const { apiUrl, assistantId, identity } = useChatRuntime();
  const { threadId, setThreadId, configuration } = useThread();

  const streamValue = useTypedStream({
    apiUrl,
    assistantId,
    threadId, // null initially → LangGraph creates it
    defaultHeaders: identity?.authToken
      ? { Authorization: `Bearer ${identity?.authToken}` }
      : undefined,
    fetchStateHistory: true,
    onCustomEvent: (event, options) => {
      if (isUIMessage(event) || isRemoveUIMessage(event)) {
        options.mutate((prev) => {
          // console.log("UI Event received in StreamProvider:", event);
          const ui = uiMessageReducer(prev.ui ?? [], event);
          return { ...prev, ui };
        });
      }
    },

    onThreadId: (id) => {
      if (id && id !== threadId) {
        setThreadId(id); // store once
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
        config?: any;
      }
    ) => {
      const messageObj: Message =
        typeof message === "string"
          ? ({
            id: uuidv4(),
            type: options?.type ?? "human",
            content: message,
          } as Message)
          : {
            ...message,
          };

      await streamValue.submit(
        { messages: [messageObj] },
        {
          config: {
            ...options?.config,
            configurable: {
              ...identity,
              ...configuration,
              ...(options?.config?.configurable ?? {}),
            },
          },
        }
      );
    },
    [streamValue, identity, configuration]
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

  const value = useMemo(
    () => ({
      ...streamValue,
      sendMessage,
    }),
    [streamValue, sendMessage]
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
