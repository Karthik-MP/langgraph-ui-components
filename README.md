# Langgraph UI Chat Components

A React component library for building AI chat interfaces with LangChain/LangGraph integration.

## Features

- 🎨 **Pre-styled chat UI components** - Sidebar, message bubbles, input fields, markdown rendering
- 🔄 **Streaming support** - Real-time AI response streaming
- 📎 **File uploads** - Built-in file handling and metadata
- � **Speech-to-text** - Built-in microphone button with Whisper transcription support
- 🎭 **Custom components** - Inject your own React components into chat messages
- 🧩 **Provider-based architecture** - Flexible state management with React Context
- 📝 **TypeScript** - Full type definitions included
- 🎨 **Tailwind CSS** - Pre-built styles, easy to customize
- 🛑 **Human-in-the-Loop (HITL)** - Built-in interrupt handling for agent approval flows

## Installation

```bash
npm install langgraph-ui-components
```

**Peer dependencies** (install these separately):

```bash
npm install react react-dom @langchain/core @langchain/langgraph @langchain/langgraph-sdk framer-motion lucide-react react-markdown react-spinners rehype-highlight remark-gfm sonner @radix-ui/react-label
```

## Usage

```tsx
import { Sidebar } from 'langgraph-ui-components/components';
import { ChatProvider } from 'langgraph-ui-components/providers';
import 'langgraph-ui-components/styles.css';

function App() {
  return (
    <ChatProvider
      apiUrl="your-api-url"
      assistantId="your-assistant-id"
      identity={{ user_id: "user123", org_id: "org456" }}
    >
      <Sidebar />
    </ChatProvider>
  );
}
```

## Import Paths

Use subpath imports for best auto-import support in VS Code and TypeScript:

```tsx
import { Sidebar, Chat } from 'langgraph-ui-components/components';
import {
  ChatProvider,
  ChatRuntimeProvider,
  ThreadProvider,
  StreamProvider,
  FileProvider,
  CustomComponentProvider,
  useThread,
  useStreamContext,
  useChatRuntime,
  useFileProvider,
  useCustomComponents,
  useChatSuggestions,
} from 'langgraph-ui-components/providers';
import {
  useTools,
  useModels,
} from 'langgraph-ui-components/hooks';
import 'langgraph-ui-components/styles.css';
```

Root import is also supported for backward compatibility:

```tsx
import { Sidebar, ChatProvider, useStreamContext } from 'langgraph-ui-components';
```

### Speech-to-Text Configuration

To enable speech-to-text functionality with your Whisper API backend, configure the `textToSpeechVoice` property in the `identity` object:

```tsx
import { Sidebar } from 'langgraph-ui-components/components';
import { ChatProvider, ChatRuntimeProvider } from 'langgraph-ui-components/providers';
import 'langgraph-ui-components/styles.css';

function App() {
  return (
    <ChatRuntimeProvider
      apiUrl="your-api-url"
      assistantId="your-assistant-id"
      identity={{
        user_id: "user123",
        org_id: "org456",
      }}
    >
      <Sidebar textToSpeechVoice={{
          apiUrl: "https://domain_url.com/v1/audio/transcriptions",
          apiKey: "your-api-key",
          model: "Systran/faster-whisper-large-v3"
        }}/>
    </ChatRuntimeProvider>
  );
}
```

**Speech-to-Text Props:**
- `textToSpeechVoice.apiUrl` (string): The endpoint URL for your Whisper transcription API. 
- `textToSpeechVoice.apiKey` (string): Bearer token for authentication with your Whisper API backend.

The microphone button in the ChatInput component will automatically use these settings for audio transcription.

## Exported Components

- `Sidebar` - Main chat UI with sidebar navigation
- `Chat` - Standalone chat interface with thread history

## Component Props

### Chat Component

The `Chat` component provides a complete chat interface with thread history and file upload support.

```tsx
import { Chat } from 'langgraph-ui-components/components';

<Chat 
  enableToolCallIndicator={true}
  callThisOnSubmit={async () => uploadedFiles}
  handleFileSelect={customFileHandler}
/>
```

**Props:**
- `enableToolCallIndicator?: boolean` - Show visual indicators when AI tools are being executed. Default: `false`
- `callThisOnSubmit?: () => Promise<CallThisOnSubmitResponse | void>` - Custom callback executed before message submission, useful for uploading files to external storage. Return `{ files, contextValues }` to attach files or inject context into the message.
- `handleFileSelect?: (event: React.ChangeEvent<HTMLInputElement>) => void` - Custom file selection handler to override default behavior
- `inputFileAccept?: string` - File types accepted by the file input (e.g. `"image/*,.pdf"`)
- `chatBodyProps?: chatBodyProps` - Customize agent name, avatar, and font size (see [chatBodyProps](#chatbodyprops))

### Sidebar Component

The `Sidebar` component provides a chat interface with collapsible sidebar navigation.

```tsx
import { Sidebar } from 'langgraph-ui-components/components';

<Sidebar 
  supportChatHistory={true}
  enableToolCallIndicator={true}
  callThisOnSubmit={async () => uploadedFiles}
  handleFileSelect={customFileHandler}
/>
```

**Props:**
- `supportChatHistory?: boolean` - Enables multi-thread mode, allowing users to switch between different conversation threads. When `true`, clicking a thread in ThreadHistory will load that thread's messages. When `false` (default), only a single thread is maintained. Default: `false`
- `enableToolCallIndicator?: boolean` - Show visual indicators when AI tools are being executed. Default: `false`
- `callThisOnSubmit?: () => Promise<{ files?: FileInfo[], contextValues?: Record<string, any> }>` - Custom callback executed before message submission, useful for uploading files to external storage or adding context
- `handleFileSelect?: (event: React.ChangeEvent<HTMLInputElement>) => void` - Custom file selection handler to override default behavior
- `preventSubmit?: boolean` - When `true`, disables all message submission functionality. Useful for read-only or custom submission flows. Default: `false`
- `header?: { title?: string, logoUrl?: string }` - Custom header configuration with title and logo
- `leftPanelContent?: React.ReactNode` - Custom content to display in the left expansion panel
- `leftPanelOpen?: boolean` - External control for left panel open state
- `setLeftPanelOpen?: (open: boolean) => void` - External setter for left panel open state
- `leftPanelInitialWidth?: number` - Initial width of the left panel in pixels
- `leftPanelClassName?: string` - CSS class name for the left panel container
- `banner?: React.ReactNode` - Optional banner rendered above the chat messages (e.g. an alert or notice)
- `filePreview?: (files: FileInfo[], setFileInput) => React.ReactNode` - Custom file preview renderer for selected files before submission
- `inputFileAccept?: string` - File types accepted by the file input (e.g. `"image/*,.pdf"`)
- `s3_upload?: boolean` - Enable S3 upload mode for file attachments

## Exported Providers

- `ChatProvider` - Core chat state management. Props: `apiUrl`, `assistantId`, `identity?`, `initialMode?` (`"single"` | `"multi"`, default `"single"`), `customComponents?`, `suspenseFallback?`
- `ChatRuntimeProvider` - Runtime configuration
- `ThreadProvider` - Conversation thread management. Props: `initialMode?` (`"single"` | `"multi"`, default `"single"`)
- `StreamProvider` - AI streaming responses
- `FileProvider` - File upload handling
- `CustomComponentProvider` - Custom component rendering

## Exported Hooks

All from `langgraph-ui-components/providers` unless noted:

| Hook | Description |
|------|-------------|
| `useStreamContext()` | Messages, loading state, sendMessage, stop, interrupt — [details](#usestreamcontext) |
| `useThread()` | Thread ID, thread list, deleteThread, updateThread, mode — [details](#usethread) |
| `useChatRuntime()` | apiUrl, assistantId, setAssistantId, identity — [details](#usechatruntime) |
| `useFileProvider()` | `fileInput: FileInfo[]` and `setFileInput` |
| `useCustomComponents()` | Register generative UI and interrupt components — [details](#custom-components) |
| `useChatSuggestions()` | Opt-in chat suggestions — [details](#usechatsuggestions-hook) |
| `useTools()` *(hooks)* | Sidebar tool buttons — [details](#usetools) |
| `useModels()` *(hooks)* | Model list and selection — [details](#usemodels) |

## useChatSuggestions Hook

The `useChatSuggestions` hook enables intelligent, opt-in chat suggestions for your application. It acts as a configuration hook that **doesn't return anything** but internally registers suggestion settings. The built-in `Suggestion` component (included in `Sidebar`) automatically picks up this configuration and displays suggestions only when the hook is used.

### Key Features

- **Opt-in by default** - Suggestions only appear when you call this hook
- **No return value** - Simply call it to enable suggestions
- **Context-aware** - Pass dependencies for dynamic, contextual suggestions
- **Agent integration** - Automatically uses agent-provided suggestions when available

### Basic Usage

```tsx
import { useChatSuggestions } from 'langgraph-ui-components/providers';

function MyComponent() {
  // Simply call the hook - it registers configuration internally
  useChatSuggestions({
    instructions: "Suggest helpful next actions",
    minSuggestions: 1,
    maxSuggestions: 2,
  });

  return <div>Your component content</div>;
}
```

### Without the Hook

If you **don't call** `useChatSuggestions` anywhere in your component tree, **no suggestions will be generated or displayed**. This makes the feature completely opt-in.

### Options

- `instructions` (string, optional): Guidance text for suggestion generation. Default: `"Suggest relevant next actions."`
- `minSuggestions` (number, optional): Minimum number of suggestions to display. Default: `2`
- `maxSuggestions` (number, optional): Maximum number of suggestions to display. Default: `4`

**Note:** The hook returns `void` - it doesn't provide any return values. The internal `Suggestion` component handles display and interaction.

### Agent Integration

When your agent returns suggestions in the response (via the `suggestions` field in state), they're automatically used instead of generating defaults:

```json
{
  "messages": [...],
  "suggestions": ["Show part details", "Update configuration", "Get pricing"]
}
```

The system seamlessly switches between agent-provided suggestions and fallback suggestions based on availability.

### Context-Aware Suggestions

Pass dependencies as the second argument to generate context-aware suggestions:

```tsx
function ChatInterface() {
  const [lastMessage, setLastMessage] = useState('');

  useChatSuggestions(
    {
      instructions: "Suggest based on conversation context",
      maxSuggestions: 3,
    },
    [lastMessage] // Dependencies trigger context-aware generation
  );

  return <div>...</div>;
}
```

When dependencies change, suggestions are regenerated to match the new context.

## useStreamContext

Access the full streaming state and control functions from anywhere inside the provider tree.

```tsx
import { useStreamContext } from 'langgraph-ui-components/providers';

const {
  messages,       // Message[] — all messages in the conversation
  isLoading,      // boolean — true while agent is streaming
  interrupt,      // interrupt payload when agent pauses for human input
  sendMessage,    // send a message programmatically
  submitMessage,  // low-level submit with stream control options
  regenerateMessage, // regenerate an AI response by message ID
  fetchCatalog,   // fetch available agents from /agents/catalog
  stop,           // cancel the current stream
} = useStreamContext();
```

### sendMessage

Send a message programmatically. The message is appended to the conversation and submitted to the agent.

```tsx
// Simple string
await sendMessage("Hello!");

// With options
await sendMessage("Hello!", {
  type: "human",            // message type, defaults to "human"
  hidden: true,             // hide from UI (useful for system-level triggers)
  id: "custom-id",          // custom message ID instead of auto-generated UUID
  context: { key: "val" }, // extra context merged with identity
  additional_kwargs: {},    // custom metadata attached to the message
});
```

| Option | Type | Description |
|--------|------|-------------|
| `type` | `Message["type"]` | Message type (`"human"`, `"system"`, etc.). Default: `"human"` |
| `hidden` | `boolean` | If `true`, message is not shown in the chat UI |
| `id` | `string` | Custom message ID (auto-generated UUID if omitted) |
| `name` | `string` | Required for function/tool messages |
| `tool_call_id` | `string` | ID linking this message to a tool call |
| `tool_calls` | `ToolCall[]` | Tool calls to attach to the message |
| `additional_kwargs` | `Record<string, unknown>` | Custom metadata on the message |
| `ui` | `UIMessage[]` | UI components to display alongside the message |
| `context` | `Record<string, unknown>` | Context values merged with identity for this message |

### submitMessage

Low-level submit with full control over streaming behavior. Use this when you need non-default stream modes.

```tsx
await submitMessage(messageObject, {
  streamMode: ["values", "updates"],  // which stream modes to use
  streamSubgraphs: true,              // include subgraph updates
  streamResumable: true,              // allow stream resumption
  contextValues: { user_role: "admin" }, // extra context for this call
});
```

### regenerateMessage

Regenerate an AI response. Resumes from the checkpoint before the given message ID.

```tsx
await regenerateMessage(messageId);
```

### fetchCatalog

Fetch the list of available agents from your API's `/agents/catalog` endpoint.

```tsx
const catalog = await fetchCatalog();
```

### stop

Cancel the currently active stream.

```tsx
const { stop, isLoading } = useStreamContext();

<button onClick={stop} disabled={!isLoading}>Stop</button>
```

## useThread

Access and manage conversation threads.

```tsx
import { useThread } from 'langgraph-ui-components/providers';

const {
  threadId,           // string | null — current thread ID
  setThreadId,        // switch to a different thread
  threads,            // Thread[] — list of all threads
  getThreads,         // fetch threads from API
  setThreads,         // directly update thread list
  configuration,      // ThreadConfiguration — config passed to LangGraph on each call
  setConfiguration,   // update thread configuration
  mode,               // "single" | "multi"
  setMode,            // switch between single and multi-thread modes
  threadsLoading,     // boolean — true while fetching thread list
  deleteThread,       // delete a thread by ID
  updateThread,       // update thread metadata
} = useThread();
```

### deleteThread

```tsx
await deleteThread(threadId);
// Removes thread from list and clears current threadId if it was the active one
```

### updateThread

```tsx
await updateThread(threadId, { title: "My conversation" });
// Updates metadata on the thread and refreshes the thread list
```

### Thread Configuration

`configuration` is a free-form object passed to the LangGraph API on every stream call. Use it to send per-thread settings your agent reads from `config.configurable`:

```tsx
const { setConfiguration } = useThread();

setConfiguration({
  temperature: 0.7,
  system_prompt: "You are a helpful assistant.",
});
```

### URL-based Thread Loading

Append `?thread=<threadId>` to the page URL to automatically load a specific thread on mount:

```
https://yourapp.com/chat?thread=abc123
```

## useChatRuntime

Access and update the core runtime configuration.

```tsx
import { useChatRuntime } from 'langgraph-ui-components/providers';

const {
  apiUrl,          // string — base API URL
  assistantId,     // string — current assistant/graph ID
  setAssistantId,  // switch to a different assistant at runtime
  identity,        // ChatIdentity | null | undefined
} = useChatRuntime();
```

`setAssistantId` is useful when your app lets users pick which agent to talk to:

```tsx
const { setAssistantId } = useChatRuntime();

<button onClick={() => setAssistantId("support_agent")}>Switch to Support</button>
```

## useTools

Manage the sidebar tool buttons (the icon strip on the left panel).

```tsx
import { useTools } from 'langgraph-ui-components/hooks';

const {
  tool,              // CustomTool[] — built-in tools (Search, Chat)
  addTool,           // add a custom tool button
  userDefinedTools,  // CustomTool[] — tools added via addTool
  setUserDefinedTools, // directly replace user-defined tools
} = useTools();
```

### Adding a Custom Tool

```tsx
import { useTools } from 'langgraph-ui-components/hooks';
import { Download } from 'lucide-react';

function MyApp() {
  const { addTool } = useTools();

  useEffect(() => {
    addTool({
      label: "Export",
      icon: <Download />,
      alt: "Export conversation",   // tooltip text
      onClick: () => handleExport(),
    });
  }, []);
}
```

### CustomTool Type

```typescript
type CustomTool = {
  label: string;                  // display name
  icon: React.ReactElement;       // icon component (e.g. from lucide-react)
  alt?: string;                   // tooltip text
  onClick: () => void;            // click handler
};
```

## useModels

Fetch and manage model selection. Calls `GET /agents/models` on mount and persists the selection to `localStorage`.

```tsx
import { useModels } from 'langgraph-ui-components/hooks';

const {
  models,           // ModelOption[] — available models
  selectedModel,    // string — currently selected model ID
  setSelectedModel, // update selection (also persists to localStorage)
  loading,          // boolean — true while fetching
} = useModels();
```

```tsx
// ModelOption type
type ModelOption = {
  id: string;
  name: string;
};
```

Models with "embed" or "rerank" in their ID are automatically filtered out. Selection persists under the localStorage key `"agent-chat:selected-model"` and is safe for SSR environments.

## Custom Components

You can inject custom React components into chat messages using the `CustomComponentProvider`. Components are registered by name and can be referenced in message content.

### Registering Components via Props

Pass initial components as the `initialComponents` prop to `CustomComponentProvider`:

```tsx
import { CustomComponentProvider } from 'langgraph-ui-components/providers';

const MyCustomButton = ({ text }) => <button>{text}</button>;

function App() {
  return (
    <CustomComponentProvider
      initialComponents={{
        'my-button': MyCustomButton,
      }}
    >
      {/* Your app */}
    </CustomComponentProvider>
  );
}
```

### Registering Components Programmatically

Use the `registerComponent` method from the `useCustomComponents` hook:

```tsx
import { useCustomComponents } from 'langgraph-ui-components/providers';

function RegisterComponent() {
  const { registerComponent } = useCustomComponents();

  useEffect(() => {
    registerComponent('my-button', ({ text }) => <button>{text}</button>);
  }, [registerComponent]);

  return null;
}
```

### Additional Methods

- `registerComponents(components)`: Register multiple components at once.
- `unregisterComponent(name)`: Remove a registered component.

## Human-in-the-Loop (HITL) Interrupts

LangGraph agents can pause mid-execution and ask a human to review or approve an action before continuing. This library has built-in support for rendering these interrupt requests with custom UI.

### How It Works

1. Your agent raises an interrupt with an `actionRequests` payload
2. The library detects `stream.interrupt` and looks up a registered interrupt component by **tool name**
3. Your component receives the interrupt data and action callbacks
4. Calling one of the action callbacks resumes the agent

### Agent-side Interrupt Format

Your LangGraph agent should raise an interrupt with this shape:

```python
from langgraph.types import interrupt

interrupt({
    "actionRequests": [
        {
            "name": "send_email",        # must match the name you register
            "args": {"to": "user@example.com", "subject": "Hello"},
            "description": "Send a welcome email"  # optional
        }
    ],
    "reviewConfigs": [
        {
            "actionName": "send_email",
            "allowedDecisions": ["approve", "reject", "edit"]
        }
    ]
})
```

### Registering an Interrupt Component

Use `registerInterruptComponent` from `useCustomComponents()` to register a component for a specific tool name:

```tsx
import { useCustomComponents } from 'langgraph-ui-components/providers';
import type { InterruptComponentProps } from 'langgraph-ui-components/providers';
import { useEffect } from 'react';

function SendEmailInterrupt({ interrupt, actions }: InterruptComponentProps) {
  const request = interrupt.actionRequests[0];

  return (
    <div className="border rounded p-4">
      <h3>Approve Action: {request.name}</h3>
      <pre>{JSON.stringify(request.args, null, 2)}</pre>
      <div className="flex gap-2 mt-3">
        <button onClick={() => actions.approve()}>Approve</button>
        <button onClick={() => actions.reject("Not needed")}>Reject</button>
        <button onClick={() => actions.edit({ subject: "Updated subject" })}>
          Edit & Approve
        </button>
      </div>
    </div>
  );
}

function App() {
  const { registerInterruptComponent } = useCustomComponents();

  useEffect(() => {
    // Register for the tool name that matches your agent's interrupt
    registerInterruptComponent('send_email', SendEmailInterrupt);
  }, [registerInterruptComponent]);

  return <Sidebar />;
}
```

Or register via `ChatProvider`'s `customComponents` if you prefer props-based setup (note: this is for generative UI components — for interrupts, use `registerInterruptComponent` as above).

### `InterruptComponentProps`

```typescript
interface InterruptComponentProps {
  interrupt: {
    actionRequests: Array<{
      name: string;
      args: Record<string, unknown>;
      description?: string;
    }>;
    reviewConfigs: Array<{
      actionName: string;
      allowedDecisions: string[];
      argsSchema?: Record<string, unknown>;
    }>;
  };
  actions: {
    /** Resume the agent with approval */
    approve: () => void;
    /** Resume the agent with rejection */
    reject: (reason?: string) => void;
    /** Resume the agent with edited arguments */
    edit: (editedArgs: Record<string, unknown>) => void;
  };
}
```

### `useCustomComponents` — Interrupt Methods

- `registerInterruptComponent(toolName, component)` — Register a component to render when the agent interrupts for the given tool name
- `unregisterInterruptComponent(toolName)` — Remove a registered interrupt component

### Accessing Interrupt State Directly

You can also access the raw interrupt from the stream context if you need to build custom logic:

```tsx
import { useStreamContext } from 'langgraph-ui-components/providers';

function MyComponent() {
  const { interrupt, isLoading } = useStreamContext();

  if (!isLoading && interrupt) {
    console.log('Agent paused:', interrupt.value);
  }
}
```

## chatBodyProps

The `chatBodyProps` prop on both `Chat` and `Sidebar` customizes how agent messages are displayed:

```tsx
<Sidebar
  chatBodyProps={{
    agentName: "Aria",
    agentAvatarUrl: "https://example.com/avatar.png",
    fontSize: "15px",
  }}
/>
```

**Props:**
- `agentName?: string` — Display name shown above agent messages. Default: `"Agent"`
- `agentAvatarUrl?: string` — URL for the agent avatar image
- `fontSize?: string` — Font size for message text (e.g. `"14px"`, `"1rem"`)

## Types

Full TypeScript definitions available for:
- `ChatIdentity` — user/org identity + auth token
- `ChatRuntimeContextValue` — `useChatRuntime()` return type
- `FileInfo` — `{ fileName, fileType, file?, fileData?, metadata? }`
- `SuggestionsOptions` — options for `useChatSuggestions`
- `SuggestionConfig` — internal suggestion config shape
- `ThreadMode` — `"single" | "multi"`
- `ThreadConfiguration` — `Record<string, unknown>` passed to LangGraph config
- `ThreadContextType` — `useThread()` return type
- `StateType` — `{ messages, ui?, suggestions? }`
- `CustomComponentContextValue` — `useCustomComponents()` return type
- `InterruptComponentProps` — props for HITL interrupt components
- `CustomTool` — `{ label, icon, alt?, onClick }`
- `ModelOption` — `{ id, name }`
- `ChatProps` — base props shared by Chat and Sidebar
- `ChatSidebarProps` — Sidebar-specific props (extends ChatProps)
- `ChatUIProps` — Chat-specific props (extends ChatProps)
- `CallThisOnSubmitResponse` — `{ files?, contextValues? }`
- `chatBodyProps` — `{ agentName?, agentAvatarUrl?, fontSize? }`
- `headerProps` — `{ title?, logoUrl? }`
- `textToSpeechVoice` — `{ apiUrl, apiKey, model }`

## Keywords

`langgraph ui components` `react` `chat-ui` `ai-components` `chatbot` `sidebar` `streaming` `langchain` `assistant` `chatgpt-ui`