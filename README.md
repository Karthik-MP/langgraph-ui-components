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
npm install agentic-chat-components
```

**Peer dependencies** (install these separately):

```bash
npm install react react-dom @langchain/core @langchain/langgraph @langchain/langgraph-sdk framer-motion lucide-react react-markdown react-spinners rehype-highlight remark-gfm sonner @radix-ui/react-label
```

## Usage

```tsx
import { 
  Sidebar,
  ChatProvider, 
  ChatRuntimeProvider,
  ThreadProvider,
  StreamProvider 
} from '@karthik_maganahalli_prakash/chat-components';
import '@karthik_maganahalli_prakash/chat-components/styles.css';

function App() {
  return (
    <ChatProvider>
      <ChatRuntimeProvider>
        <ThreadProvider>
          <StreamProvider>
            <Sidebar />
          </StreamProvider>
        </ThreadProvider>
      </ChatRuntimeProvider>
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

## Types

Full TypeScript definitions available for:
- `ChatIdentity`
- `ChatRuntimeContextValue`
- `FileInfo`
- `Metadata`

## Development Notes

This library is designed to work with LangChain/LangGraph for AI agent interactions. All heavy dependencies are peer dependencies to keep the bundle size small (~50-200 KB).