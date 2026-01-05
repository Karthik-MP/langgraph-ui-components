import { useChatRuntime } from "@/providers/ChatRuntime";
import { type Message } from "@langchain/langgraph-sdk";
import { useStream } from "@langchain/langgraph-sdk/react";
import {
  type RemoveUIMessage,
  type UIMessage,
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

type StreamContextType = ReturnType<typeof useTypedStream> & {
  submit: ReturnType<typeof useTypedStream>["submit"];
};

const StreamContext = createContext<StreamContextType | undefined>(undefined);

async function checkGraphStatus(apiUrl: string, token: string | null) {
  try {
    const res = await fetch(`${apiUrl}/info`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.ok;
  } catch {
    return false;
  }
}

const StreamSession = ({ children }: { children: ReactNode }) => {
  const { apiUrl, assistantId, identity } = useChatRuntime();
  const { threadId, setThreadId, configuration } = useThread();

  const streamValue = useTypedStream({
    apiUrl,
    assistantId,
    threadId, // null initially → LangGraph creates it
    defaultHeaders: identity?.token
      ? { Authorization: `Bearer ${identity?.token}` }
      : undefined,
    fetchStateHistory: true,

    onThreadId: (id) => {
      if (id && id !== threadId) {
        setThreadId(id); // store once
      }
    },

    onUpdateEvent: (data, options) => {
      // options.mutate(() => {
      //   const updates: Partial<StateType> = {};
      //   let hasUpdate = false;

      //   Object.values(data).forEach((value) => {
      //     if (typeof value === "object" && value !== null) {
      //       Object.assign(updates, value);
      //       hasUpdate = true;
      //     }
      //   });

      //   return hasUpdate ? updates : {};
      // });

      // updates existing streaming object instead of re-creating
      // options.mutate((prev) => ({
      //   ...prev,
      //   ...data,
      // }));

      if (data.messages) {
        options.mutate((prev) => {
          const incoming = Array.isArray(data.messages)
            ? (data.messages as Message[])
            : ([...prev.messages, data.messages as Message] as Message[]);
          return ({
            ...prev,
            messages: incoming,
          }) as Partial<StateType>;
        });
      }
    },
  });

  /**
   * SINGLE THREAD submit
   * user_id + org_id ALWAYS passed
   */
  const submit = useCallback(
    (
      input: Parameters<typeof streamValue.submit>[0],
      options?: Parameters<typeof streamValue.submit>[1]
    ) => {
      return streamValue.submit(input, {
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
    },
    [streamValue, configuration]
  );

  useEffect(() => {
    checkGraphStatus(apiUrl, identity?.token).then((ok) => {
      if (!ok) {
        toast.error("Failed to connect to LangGraph server", {
          description: `Unable to reach ${apiUrl}`,
          duration: 10000,
        });
      }
    });
  }, [apiUrl, identity?.token]);

  const value = useMemo(
    () => ({
      ...streamValue,
      submit,
    }),
    [streamValue, submit]
  );

  return (
    <StreamContext.Provider value={value}>{children}</StreamContext.Provider>
  );
};

export function StreamProvider({ children }: { children: ReactNode }) {
  return <StreamSession>{children}</StreamSession>;
}

export function useStreamContext(): StreamContextType {
  const ctx = useContext(StreamContext);
  if (!ctx) {
    throw new Error("useStreamContext must be used within StreamProvider");
  }
  return ctx;
}
