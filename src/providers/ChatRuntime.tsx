/* @refresh reset */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Identity information for the chat runtime.
 * Supports authentication tokens and custom identity fields.
 */
export type ChatIdentity = {
  /** Optional bearer token for API authentication */
  authToken?: string | null;
  /** Optional user identifier */
  user_id?: string | null;
  /** Optional organization identifier */
  org_id?: string | null;
  /** Allow additional custom identity fields */
  [key: string]: unknown;
};

/**
 * Context value containing core chat runtime configuration.
 * This includes API connection details and user identity.
 */
export type ChatRuntimeContextValue = {
  /** Base URL for the LangGraph API */
  apiUrl: string;
  /** Unique identifier for the assistant/agent */
  assistantId: string;
  /** Function to update the assistant ID */
  setAssistantId: (assistantId: string) => void;
  /** Optional user identity and authentication information */
  identity?: ChatIdentity | null;
};

const ChatRuntimeContext = createContext<ChatRuntimeContextValue | undefined>(
  undefined
);

type ChatRuntimeProviderProps = {
  /** Base URL for the LangGraph API endpoint */
  apiUrl: string;
  /** Unique identifier for the assistant/agent */
  assistantId: string;
  /** Optional user identity and authentication information */
  identity?: ChatIdentity | null;
  /** Child components that will have access to the runtime context */
  children: ReactNode;
};

/**
 * Provides core runtime configuration for the chat system.
 * This should be one of the outermost providers in your component tree.
 * 
 * @example
 * ```tsx
 * <ChatRuntimeProvider
 *   apiUrl="https://api.example.com"
 *   assistantId="my-assistant"
 *   identity={{ user_id: "user123" }}
 * >
 *   <App />
 * </ChatRuntimeProvider>
 * ```
 */
export function ChatRuntimeProvider({
  apiUrl,
  assistantId: initialAssistantId,
  identity,
  children,
}: ChatRuntimeProviderProps) {
  
  const [assistantId, setAssistantId] = useState(initialAssistantId);

  const value: ChatRuntimeContextValue = useMemo(() => ({
    apiUrl,
    assistantId,
    setAssistantId,
    identity,
  }), [apiUrl, assistantId, identity]);

  return (
    <ChatRuntimeContext.Provider value={value}>
      {children}
    </ChatRuntimeContext.Provider>
  );
}

/**
 * Hook to access the chat runtime context.
 * Returns API configuration and user identity information.
 * 
 * @throws {Error} If used outside of ChatRuntimeProvider
 * 
 * @example
 * ```tsx
 * const { apiUrl, assistantId, identity } = useChatRuntime();
 * ```
 */
export function useChatRuntime(): ChatRuntimeContextValue {
  const context = useContext(ChatRuntimeContext);
  if (!context) {
    throw new Error("useChatRuntime must be used within a ChatRuntimeProvider");
  }
  return context;
}
