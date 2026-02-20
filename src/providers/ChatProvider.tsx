import React from "react";
import type { ChatIdentity } from "./ChatRuntime";
import { ChatRuntimeProvider } from "./ChatRuntime";
import { CustomComponentProvider } from "./CustomComponentProvider";
import { FileProvider } from "./FileProvider";
import { StreamProvider } from "./Stream";
import { ThreadProvider } from "./Thread";
import { SuggestionProvider } from "./useChatSuggestions";

// Re-export the canonical ChatIdentity so consumers can import it from either location.
export type { ChatIdentity };

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
  /**
   * Fallback UI shown while the chat providers are lazy-loading.
   * Defaults to a plain `<div>Loading chat...</div>` if not provided.
   */
  suspenseFallback?: React.ReactNode;
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
  suspenseFallback = <div>Loading chat...</div>,
}: ChatProviderProps) {
  return (
    <React.Suspense fallback={suspenseFallback}>
      <ChatRuntimeProvider
        apiUrl={apiUrl}
        assistantId={assistantId}
        identity={identity}
      >
        <ThreadProvider>
          <StreamProvider>
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