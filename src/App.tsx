import React, { useState } from "react";
import "./App.css";
import Sidebar from "./pages/Sidebar/sidebar";
import {
  ChatRuntimeProvider,
  type ChatIdentity,
} from "./providers/ChatRuntime";
import { ThreadProvider } from "./providers/Thread";
import { StreamProvider } from "./providers/Stream";
import { FileProvider } from "./providers/FileProvider";
import { CustomComponentProvider } from "./providers/CustomComponentProvider";
import useChatSuggestions, { SuggestionProvider } from "./providers/useChatSuggestions";
import { Chat } from "./pages/Chat/Chat";

function ChatWrapper({ children }: { children?: React.ReactNode }) {
  useChatSuggestions({
    instructions: "Suggest helpful next actions",
    minSuggestions: 1,
    maxSuggestions: 2,
  });

  return (<>
    {/* <Sidebar supportMultipleAgents={true} /> */}
    <Chat />
  </>
  )

}

function App() {
  const [identity] = useState<ChatIdentity>({
    user_id: "68f3b3ba4ce23e5b582b7780",
    org_id: "1",
    quote_id: "695b5cfcc4d07dc56f093d92",
  });
  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <ChatRuntimeProvider
        apiUrl={"https://agents.3ya.io"}
        assistantId={"v3ya_external_agent"}
        identity={identity}
      >
        <ThreadProvider>
          <StreamProvider>
            <CustomComponentProvider>
              <SuggestionProvider>
                <FileProvider>
                  <ChatWrapper />
                </FileProvider>
              </SuggestionProvider>
            </CustomComponentProvider>
          </StreamProvider>
        </ThreadProvider>
      </ChatRuntimeProvider>
    </React.Suspense>
  );
}

export default App;
