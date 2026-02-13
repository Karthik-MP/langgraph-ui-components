# Agentic Chat Components

A React component library for building AI chat interfaces with LangChain/LangGraph integration.

## Features

- 🎨 **Pre-styled chat UI components** - Sidebar, message bubbles, input fields, markdown rendering
- 🔄 **Streaming support** - Real-time AI response streaming
- 📎 **File uploads** - Built-in file handling and metadata
- 🎭 **Custom components** - Inject your own React components into chat messages
- 🧩 **Provider-based architecture** - Flexible state management with React Context
- 📝 **TypeScript** - Full type definitions included
- 🎨 **Tailwind CSS** - Pre-built styles, easy to customize

## Installation

```bash
npm install agentic-chat-ui-components
```

**Peer dependencies** (install these separately):

```bash
npm install react react-dom @langchain/core @langchain/langgraph @langchain/langgraph-sdk framer-motion lucide-react react-markdown react-spinners rehype-highlight remark-gfm sonner @radix-ui/react-label
```

## Usage

```tsx
import { 
  Sidebar,
  ChatProvider
} from 'agentic-chat-ui-components';
import 'agentic-chat-ui-components/styles.css';

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

## Exported Components

- `Sidebar` - Main chat UI with sidebar navigation
- `Chat` - Standalone chat interface with thread history

## Component Props

### Chat Component

The `Chat` component provides a complete chat interface with thread history and file upload support.

```tsx
import { Chat } from 'agentic-chat-ui-components';

<Chat 
  enableToolCallIndicator={true}
  callThisOnSubmit={async () => uploadedFiles}
  handleFileSelect={customFileHandler}
/>
```

**Props:**
- `enableToolCallIndicator?: boolean` - Show visual indicators when AI tools are being executed. Default: `false`
- `callThisOnSubmit?: () => Promise<FileInfo[]>` - Custom callback executed before message submission, useful for uploading files to external storage
- `handleFileSelect?: (event: React.ChangeEvent<HTMLInputElement>) => void` - Custom file selection handler to override default behavior

### Sidebar Component

The `Sidebar` component provides a chat interface with collapsible sidebar navigation.

```tsx
import { Sidebar } from 'agentic-chat-ui-components';

<Sidebar 
  supportMultipleAgents={true}
  enableToolCallIndicator={true}
  callThisOnSubmit={async () => uploadedFiles}
  handleFileSelect={customFileHandler}
/>
```

**Props:**
- `supportMultipleAgents?: boolean` - Enables multi-thread mode, allowing users to switch between different conversation threads. When `true`, clicking a thread in ThreadHistory will load that thread's messages. When `false` (default), only a single thread is maintained. Default: `false`
- `enableToolCallIndicator?: boolean` - Show visual indicators when AI tools are being executed. Default: `false`
- `callThisOnSubmit?: () => Promise<{ files?: FileInfo[], contextValues?: Record<string, any> }>` - Custom callback executed before message submission, useful for uploading files to external storage or adding context
- `handleFileSelect?: (event: React.ChangeEvent<HTMLInputElement>) => void` - Custom file selection handler to override default behavior
- `preventSubmit?: boolean` - When `true`, disables all message submission functionality. Useful for read-only or custom submission flows. Default: `false`
- `header?: { title?: string, logoUrl?: string }` - Custom header configuration with title and logo
- `leftPanelContent?: React.ReactNode` - Custom content to display in the left expansion panel
- `leftPanelOpen?: boolean` - External control for left panel open state
- `setLeftPanelOpen?: (open: boolean) => void` - External setter for left panel open state

## Exported Providers

- `ChatProvider` - Core chat state management
- `ChatRuntimeProvider` - Runtime configuration
- `ThreadProvider` - Conversation thread management
- `StreamProvider` - AI streaming responses
- `FileProvider` - File upload handling
- `CustomComponentProvider` - Custom component rendering

## Exported Hooks

- `useThread()` - Access thread state
- `useStreamContext()` - Access streaming state
- `useChatRuntime()` - Access runtime config
- `useFileProvider()` - Access file state
- `useCustomComponents()` - Register custom components
- `useChatSuggestions()` - Display contextual chat suggestions

## useChatSuggestions Hook

The `useChatSuggestions` hook enables intelligent, opt-in chat suggestions for your application. It acts as a configuration hook that **doesn't return anything** but internally registers suggestion settings. The built-in `Suggestion` component (included in `Sidebar`) automatically picks up this configuration and displays suggestions only when the hook is used.

### Key Features

- **Opt-in by default** - Suggestions only appear when you call this hook
- **No return value** - Simply call it to enable suggestions
- **Context-aware** - Pass dependencies for dynamic, contextual suggestions
- **Agent integration** - Automatically uses agent-provided suggestions when available

### Basic Usage

```tsx
import { useChatSuggestions } from 'agentic-chat-ui-components';

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

## sendMessage Function

The `sendMessage` function is available through the `useStreamContext()` hook and allows you to send messages programmatically to the AI agent.

### Parameters

- `message` (Message | string): The message content. Can be a string for simple text messages or a full Message object for more control.
- `options` (optional object):
  - `type` (Message["type"], optional): The message type to use when sending a string message. Defaults to "human" for user messages. Use "system" for agent-only messages.
  - `config` (any, optional): Additional configuration to pass to the agent.

### Usage Example

```tsx
import { useStreamContext } from 'agentic-chat-ui-components';

function MyComponent() {
  const { sendMessage } = useStreamContext();

  const handleSend = async () => {
    await sendMessage("Hello, AI!", { isAIMessage: false });
  };

  return <button onClick={handleSend}>Send Message</button>;
}
```

This will send a user-visible message "Hello, AI!" to the agent.

For agent-only messages:

```tsx
await sendMessage("Internal event occurred", { type: "system" });
```

## Custom Components

You can inject custom React components into chat messages using the `CustomComponentProvider`. Components are registered by name and can be referenced in message content.

### Registering Components via Props

Pass initial components as the `initialComponents` prop to `CustomComponentProvider`:

```tsx
import { CustomComponentProvider } from 'agentic-chat-ui-components';

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
import { useCustomComponents } from 'agentic-chat-ui-components';

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

## Types

Full TypeScript definitions available for:
- `ChatIdentity`
- `ChatRuntimeContextValue`
- `FileInfo`
- `SuggestionsOptions`