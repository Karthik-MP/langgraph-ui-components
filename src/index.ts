// Import for default export
import { default as Sidebar } from "./pages/Sidebar/sidebar";
import { Chat } from "./pages/Chat/Chat";
import { ChatProvider } from "./providers/ChatProvider";
import { ChatRuntimeProvider } from "./providers/ChatRuntime";
import { ThreadProvider } from "./providers/Thread";
import { StreamProvider } from "./providers/Stream";
import { FileProvider } from "./providers/FileProvider";
import { CustomComponentProvider } from "./providers/CustomComponentProvider";
import useTools from "./hooks/useTools";
import { useThread } from "./providers/Thread";
import { useStreamContext } from "./providers/Stream";
import { useChatRuntime } from "./providers/ChatRuntime";
import { useFileProvider } from "./providers/FileProvider";
import { useCustomComponents } from "./providers/CustomComponentProvider";
import { useChatSuggestions } from "./providers/useChatSuggestions";

// Main components
export { default as Sidebar } from "./pages/Sidebar/sidebar";
export { Chat } from "./pages/Chat/Chat";
// Providers
export { ChatProvider } from "./providers/ChatProvider";
export { ChatRuntimeProvider } from "./providers/ChatRuntime";
export { ThreadProvider } from "./providers/Thread";
export { StreamProvider } from "./providers/Stream";
export { FileProvider } from "./providers/FileProvider";
export { CustomComponentProvider } from "./providers/CustomComponentProvider";

// Hooks
export { default as useTools } from "./hooks/useTools";
export { useThread } from "./providers/Thread";
export { useStreamContext } from "./providers/Stream";
export { useChatRuntime } from "./providers/ChatRuntime";
export { useFileProvider } from "./providers/FileProvider";
export { useCustomComponents } from "./providers/CustomComponentProvider";
export { useChatSuggestions } from "./providers/useChatSuggestions";

// Types
export type { ChatIdentity } from "./providers/ChatProvider";
export type { ChatRuntimeContextValue } from "./providers/ChatRuntime";
export type { FileInfo } from "./types/fileInput";
export type { SuggestionsOptions } from "./providers/useChatSuggestions";
export type { CustomTool } from "./types/CustomTools";