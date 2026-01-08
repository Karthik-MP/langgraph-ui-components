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

## sendMessage Function

The `sendMessage` function is available through the `useStreamContext()` hook and allows you to send messages programmatically to the AI agent.

### Parameters

- `message` (Message | string): The message content. Can be a string for simple text messages or a full Message object for more control.
- `options` (optional object):
  - `isAIMessage` (boolean, optional): If true, the message is intended for the agent only and won't be visible to the user. Defaults to false.
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
await sendMessage("Internal event occurred", { isAIMessage: true });
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
- `Metadata`

## Development Notes

This library is designed to work with LangChain/LangGraph for AI agent interactions. All heavy dependencies are peer dependencies to keep the bundle size small (~50-200 KB).