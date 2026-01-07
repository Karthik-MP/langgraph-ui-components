import React from "react";
import { ChatRuntimeProvider } from "./ChatRuntime";
import { ThreadProvider } from "./Thread";
import { StreamProvider } from "./Stream";
import { FileProvider } from "./FileProvider";
import { CustomComponentProvider } from "./CustomComponentProvider";

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
            <CustomComponentProvider initialComponents={customComponents}>
              <FileProvider>{children}</FileProvider>
            </CustomComponentProvider>
          </StreamProvider>
        </ThreadProvider>
      </ChatRuntimeProvider>
    </React.Suspense>
  );
}