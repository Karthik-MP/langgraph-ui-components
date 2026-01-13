import { getApiKey, type Thread } from "@langchain/langgraph-sdk";
import { useQueryState } from "nuqs";
import { createContext, useCallback, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { validate } from "uuid";
import { createClient } from "./client";
/**
 * Thread context manages the current conversation thread ID and configuration.
 * A thread represents a single conversation session with the AI.
 */

interface ThreadContextType {
  /** Current thread ID, null if no thread exists yet */
  threadId: string | null;
  /** Set or update the current thread ID */
  setThreadId: (id: string) => void;
  /** List of existing threads */
  threads: Thread[];
  /** Function to fetch existing threads from the API */
  getThreads: () => Promise<Thread[]>;
  /** Function to update the list of threads */
  setThreads: Dispatch<SetStateAction<Thread[]>>;
  /** Thread-specific configuration passed to the LangGraph API */
  configuration: any;
  /** Update thread configuration */
  setConfiguration: (config: any) => void;
  /** Whether threads are currently being loaded */
  threadsLoading: boolean;
  /** Set the loading state for threads */
  setThreadsLoading: Dispatch<SetStateAction<boolean>>;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

function getThreadSearchMetadata(
  assistantId: string,
): { graph_id: string } | { assistant_id: string } {
  if (validate(assistantId)) {
    return { assistant_id: assistantId };
  } else {
    return { graph_id: assistantId };
  }
}

/**
 * Provides thread management for chat conversations.
 * Stores the current thread ID and configuration.
 * 
 * @example
 * ```tsx
 * <ThreadProvider>
 *   <YourChatComponent />
 * </ThreadProvider>
 * ```
 */
export function ThreadProvider({ children }: { children: ReactNode }) {
  const [apiUrl] = useQueryState("apiUrl");
  const [assistantId] = useQueryState("assistantId");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);

  const [threadId, setThreadId] = useState<string | null>(null);
  const [configuration, setConfiguration] = useState<any>();


  const getThreads = useCallback(async (): Promise<Thread[]> => {
    if (!apiUrl || !assistantId) return [];
    const client = createClient(apiUrl, getApiKey("") ?? undefined);

    const threads = await client.threads.search({
      metadata: {
        ...getThreadSearchMetadata(assistantId),
      },
      limit: 100,
    });

    return threads;
  }, [apiUrl, assistantId]);

  return (
    <ThreadContext.Provider
      value={{ threadId, setThreadId, getThreads, threads, setThreads, configuration, setConfiguration, threadsLoading, setThreadsLoading }}
    >
      {children}
    </ThreadContext.Provider>
  );
}

/**
 * Hook to access the current thread context.
 * Use this to get or set the thread ID and configuration.
 * 
 * @throws {Error} If used outside of ThreadProvider
 * 
 * @example
 * ```tsx
 * const { threadId, setThreadId, configuration, setConfiguration } = useThread();
 * ```
 */
export function useThread() {
  const context = useContext(ThreadContext);
  if (!context) {
    throw new Error("useThread must be used within a ThreadProvider");
  }
  return context;
}
