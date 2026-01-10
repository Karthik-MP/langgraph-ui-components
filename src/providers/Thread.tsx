import { createContext, useContext, type ReactNode, useState } from "react";

/**
 * Thread context manages the current conversation thread ID and configuration.
 * A thread represents a single conversation session with the AI.
 */

interface ThreadContextType {
  /** Current thread ID, null if no thread exists yet */
  threadId: string | null;
  /** Set or update the current thread ID */
  setThreadId: (id: string) => void;
  /** Thread-specific configuration passed to the LangGraph API */
  configuration: any;
  /** Update thread configuration */
  setConfiguration: (config: any) => void;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

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
  const [threadId, setThreadId] = useState<string | null>(null);
  const [configuration, setConfiguration] = useState<any>();

  return (
    <ThreadContext.Provider
      value={{ threadId, setThreadId, configuration, setConfiguration }}
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
