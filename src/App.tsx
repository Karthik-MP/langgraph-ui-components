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

function App() {
  const [identity] = useState<ChatIdentity>({
    // user_id: "68f3b3ba4ce23e5b582b7780",
    org_id: "1",
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
            <FileProvider>
              <Sidebar />
            </FileProvider>
          </StreamProvider>
        </ThreadProvider>
      </ChatRuntimeProvider>
    </React.Suspense>
  );
}

export default App;
