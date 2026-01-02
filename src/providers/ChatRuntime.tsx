import { createContext, useContext, type ReactNode } from "react";

export type ChatIdentity = {
  authToken?: string | null; // Bearer token
  user_id?: string | null;
  org_id?: string | null;
  [key: string]: any; // allow future static identity fields
};

export type ChatRuntimeContextValue = {
  apiUrl: string;
  assistantId: string;
  identity?: ChatIdentity;
};

const ChatRuntimeContext = createContext<ChatRuntimeContextValue | undefined>(
  undefined
);

type ChatRuntimeProviderProps = {
  apiUrl: string;
  assistantId: string;
  identity?: ChatIdentity;
  children: ReactNode;
};

export function ChatRuntimeProvider({
  apiUrl,
  assistantId,
  identity,
  children,
}: ChatRuntimeProviderProps) {
  const value: ChatRuntimeContextValue = {
    apiUrl,
    assistantId,
    identity,
  };

  return (
    <ChatRuntimeContext.Provider value={value}>
      {children}
    </ChatRuntimeContext.Provider>
  );
}

export function useChatRuntime(): ChatRuntimeContextValue {
  const context = useContext(ChatRuntimeContext);
  if (!context) {
    throw new Error("useChatRuntime must be used within a ChatRuntimeProvider");
  }
  return context;
}
