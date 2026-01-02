import { createContext, useContext, type ReactNode, useState } from "react";

/**
 * This context ONLY stores a single threadId.
 * No fetching, no listing, no switching.
 */

interface ThreadContextType {
  threadId: string | null;
  setThreadId: (id: string) => void;
  configuration: any;
  setConfiguration: (config: any) => void;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

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

export function useThread() {
  const context = useContext(ThreadContext);
  if (!context) {
    throw new Error("useThread must be used within a ThreadProvider");
  }
  return context;
}
