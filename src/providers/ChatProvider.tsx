import React from "react";
import { ChatRuntimeProvider } from "./ChatRuntime";
import { CustomComponentProvider } from "./CustomComponentProvider";
import { FileProvider } from "./FileProvider";
import { StreamProvider } from "./Stream";
import { ThreadProvider } from "./Thread";
import { SuggestionProvider } from "./useChatSuggestions";

export interface ChatIdentity {
  user_id: string;
  org_id: string;
}

interface ChatProviderProps {
  apiUrl: string;
  assistantId: string;
  identity: ChatIdentity;
  children: React.ReactNode;
  customComponents?: Record<string, React.FunctionComponent | React.ComponentClass>;
}

export function ChatProvider({
  apiUrl,
  assistantId,
  identity,
  children,
  customComponents,
}: ChatProviderProps) {
  return (
    <React.Suspense fallback={<div>Loading chat...</div>}>
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