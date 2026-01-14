/* @refresh reset */
import { useChatRuntime } from "@/providers/ChatRuntime";
import { type Message } from "@langchain/langgraph-sdk";
import { useStream } from "@langchain/langgraph-sdk/react";
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
import { v4 as uuidv4 } from "uuid";
import { useThread } from "./Thread";

export type StateType = {
  messages: Message[];
  ui?: UIMessage[];
  suggestions?: string[];
};

async function sleep(ms = 4000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

type StreamContextType = ReturnType<typeof useTypedStream> & {
  submit: ReturnType<typeof useTypedStream>["submit"];
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

const StreamSession = ({ fallbackMessage, children }: { fallbackMessage?: string; children: ReactNode }) => {
  const { apiUrl, assistantId, identity } = useChatRuntime();
  const { mode, threadId, setThreadId, configuration } = useThread();

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
          // console.log("UI Event received in StreamProvider:", event);
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
      }
    },
  });

  /**
   * SINGLE THREAD submit
   * user_id + org_id ALWAYS passed
   */
  const submit = useCallback(
    async (
      input: Parameters<typeof streamValue.submit>[0],
      options?: Parameters<typeof streamValue.submit>[1]
    ) => {
      try {
        return await streamValue.submit(input, {
          ...options,
          config: {
            ...(options?.config ?? {}),
            configurable: {
              ...identity,
              ...configuration,
              ...(options?.config?.configurable ?? {}),
            },
          },
        });
      } catch (error) {
        console.error("Agent API failed:", error);

        // Add fallback message as an AI response
        const errorMessage = fallbackMessage || "Agent is down. Will get back to you soon! Try again later.";

        sendMessage(errorMessage, { type: "system" });
      }
    },
    [streamValue, identity, configuration, fallbackMessage]
  );

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

      await submit(
        { messages: [messageObj] },
        {
          config: options?.config,
        }
      );
    },
    [submit]
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
      submit,
      sendMessage,
    }),
    [streamValue, submit, sendMessage]
  );

  return (
    <StreamContext.Provider value={value}>{children}</StreamContext.Provider>
  );
};

/**
 * Provides streaming message functionality for real-time AI responses.
 * Manages message state, handles streaming updates, and provides submit/sendMessage functions.
 * 
 * @param fallbackMessage - Optional custom message to display when agent API fails (default: "Agent is down. Will get back to you soon! Try again later.")
 * 
 * @example
 * ```tsx
 * <StreamProvider fallbackMessage="Our AI is currently offline. Please try again soon.">
 *   <ChatInterface />
 * </StreamProvider>
 * ```
 */
export function StreamProvider({ fallbackMessage, children }: { fallbackMessage?: string; children: ReactNode }) {
  return <StreamSession fallbackMessage={fallbackMessage}>{children}</StreamSession>;
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
