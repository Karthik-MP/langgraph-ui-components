import React from "react";
import { ChatRuntimeProvider } from "./ChatRuntime";
import { CustomComponentProvider } from "./CustomComponentProvider";
import { FileProvider } from "./FileProvider";
import { StreamProvider } from "./Stream";
import { ThreadProvider } from "./Thread";
import { SuggestionProvider } from "./useChatSuggestions";

/**
 * Identity information for authenticating and identifying the chat user.
 * Used for routing messages and maintaining user context in the chat system.
 */
export interface ChatIdentity {
  /** Unique identifier for the user */
  user_id: string;
  /** Organization identifier for multi-tenant applications */
  org_id: string;
}

interface ChatProviderProps {
  /** Base URL for the LangGraph API endpoint */
  apiUrl: string;
  /** Unique identifier for the assistant/agent to communicate with */
  assistantId: string;
  /** User and organization identity information */
  identity?: ChatIdentity | null;
  /** Child components that will have access to chat context */
  children: React.ReactNode;
  /** Optional custom React components to render in chat messages */
  customComponents?: Record<string, React.FunctionComponent | React.ComponentClass>;
  /** Fallback UI message while agent is down */
  fallbackMessage?: string
}

/**
 * Main provider component that wraps all chat-related contexts.
 * This is the recommended way to set up the chat system as it includes all necessary providers
 * in the correct order: Runtime, Thread, Stream, Suggestions, Custom Components, and File handling.
 * 
 * @example
 * ```tsx
 * <ChatProvider
 *   apiUrl="https://api.example.com"
 *   assistantId="my-assistant"
 *   identity={{ user_id: "user123", org_id: "org456" }}
 * >
 *   <YourChatUI />
 * </ChatProvider>
 * ```
 */
export function ChatProvider({
  apiUrl,
  assistantId,
  identity,
  children,
  customComponents,
  fallbackMessage
}: ChatProviderProps) {
  return (
    <React.Suspense fallback={<div>Loading chat...</div>}>
      <ChatRuntimeProvider
        apiUrl={apiUrl}
        assistantId={assistantId}
        identity={identity}
      >
        <ThreadProvider>
          <StreamProvider fallbackMessage={fallbackMessage}>
            <SuggestionProvider>
              <CustomComponentProvider initialComponents={customComponents}>
                <FileProvider>{children}</FileProvider>
              </CustomComponentProvider>
            </SuggestionProvider>
          </StreamProvider>
        </ThreadProvider>
      </ChatRuntimeProvider>
    </React.Suspense>
  );
}