import { type Thread } from "@langchain/langgraph-sdk";
import { createContext, useCallback, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { validate } from "uuid";
import { useChatRuntime } from "./ChatRuntime";
import { createClient } from "./client";
import { logger } from "@/utils/logger";

/**
 * Thread context manages the current conversation thread ID and configuration.
 * A thread represents a single conversation session with the AI.
 */

export type ThreadMode = "single" | "multi";

/**
 * Typed configuration object passed to the LangGraph API on each stream call.
 * Use `Record<string, unknown>` instead of `any` so consumers are forced to
 * narrow values before using them, preventing silent runtime errors.
 */
export type ThreadConfiguration = Record<string, unknown>;

export interface ThreadContextType {
  /** Current thread ID, null if no thread exists yet */
  threadId: string | null;
  /** Set or update the current thread ID */
  setThreadId: (id: string | null) => void;
  /** List of existing threads */
  threads: Thread[];
  /** Function to fetch existing threads from the API */
  getThreads: () => Promise<Thread[]>;
  /** Function to update the list of threads */
  setThreads: Dispatch<SetStateAction<Thread[]>>;
  /** Thread-specific configuration passed to the LangGraph API */
  configuration: ThreadConfiguration | undefined;
  /** Update thread configuration */
  setConfiguration: (config: ThreadConfiguration) => void;
  /** Whether threads are currently being loaded */
  threadsLoading: boolean;
  /** Set the loading state for threads */
  setThreadsLoading: Dispatch<SetStateAction<boolean>>;

  mode: ThreadMode;
  setMode: Dispatch<SetStateAction<ThreadMode>>;
  /** Delete a thread by ID */
  deleteThread: (threadId: string) => Promise<void>;
  /** Update thread metadata */
  updateThread: (threadId: string, metadata: Record<string, unknown>) => Promise<void>;
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

  const { apiUrl, assistantId, identity } = useChatRuntime();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);

  const [threadId, setThreadId] = useState<string | null>(null);
  const [configuration, setConfiguration] = useState<ThreadConfiguration | undefined>();

  const [mode, setMode] = useState<ThreadMode>("single");

  // Extract thread ID from URL query parameter on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const threadFromUrl = searchParams.get("thread");
    if (threadFromUrl) {
      setThreadId(threadFromUrl);
    }
  }, []);


  const getThreads = useCallback(async (): Promise<Thread[]> => {
    if (!apiUrl || !assistantId) return [];
    if (!identity?.authToken) {
      logger.error("No authToken available for getThreads");
      return [];
    }
    const client = createClient(apiUrl, identity?.authToken ?? undefined);

    const threads = await client.threads.search({
      metadata: {
        ...getThreadSearchMetadata(assistantId),
      },
      limit: 100,
    });

    return Array.isArray(threads) ? threads : [];
  }, [apiUrl, assistantId, identity]);

  const deleteThread = useCallback(async (threadIdToDelete: string) => {
    if (!apiUrl) return;
    if (!identity?.authToken) {
      logger.error("No authToken available for deleteThread");
      return;
    }
    const client = createClient(apiUrl, identity?.authToken ?? undefined);

    await client.threads.delete(threadIdToDelete);

    // Update local state
    setThreads(prev => prev.filter(t => t.thread_id !== threadIdToDelete));

    // Clear current thread if it was deleted
    if (threadId === threadIdToDelete) {
      setThreadId(null);
    }
  }, [apiUrl, threadId, identity]);

  const updateThread = useCallback(async (threadIdToUpdate: string, metadata: Record<string, unknown>) => {
    if (!apiUrl) return;
    if (!identity?.authToken) {
      logger.error("No authToken available for updateThread");
      return;
    }
    const client = createClient(apiUrl, identity?.authToken ?? undefined);

    await client.threads.update(threadIdToUpdate, { metadata });

    // Refresh threads to get updated data
    const updatedThreads = await getThreads();
    setThreads(updatedThreads);
  }, [apiUrl, getThreads, identity]);

  return (
    <ThreadContext.Provider
      value={{ mode, setMode, threadId, setThreadId, getThreads, threads, setThreads, configuration, setConfiguration, threadsLoading, setThreadsLoading, deleteThread, updateThread }}
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