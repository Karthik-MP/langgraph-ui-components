import React from "react";
import { ChatRuntimeProvider } from "./ChatRuntime";
import { ThreadProvider } from "./Thread";
import { StreamProvider } from "./Stream";
import { FileProvider } from "./FileProvider";
export interface ChatIdentity {
  user_id: string;
  org_id: string;
}

interface ChatProviderProps {
  apiUrl: string;
  assistantId: string;
  identity: ChatIdentity;
  children: React.ReactNode;
}

export function ChatProvider({
  apiUrl,
  assistantId,
  identity,
  children,
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
            <FileProvider>{children}</FileProvider>
          </StreamProvider>
        </ThreadProvider>
      </ChatRuntimeProvider>
    </React.Suspense>
  );
}
