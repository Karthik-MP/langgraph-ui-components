import "./index.css";

// ─── Components ──────────────────────────────────────────────────────────────
export { default as Sidebar } from "./pages/Sidebar/sidebar";
export { Chat } from "./pages/Chat/Chat";

// ─── Providers ───────────────────────────────────────────────────────────────
export { ChatProvider } from "./providers/ChatProvider";
export { ChatRuntimeProvider } from "./providers/ChatRuntime";
export { ThreadProvider } from "./providers/Thread";
export { StreamProvider } from "./providers/Stream";
export { FileProvider } from "./providers/FileProvider";
export { CustomComponentProvider } from "./providers/CustomComponentProvider";
export type { CustomComponentContextValue } from "./providers/CustomComponentProvider";

// ─── Hooks ────────────────────────────────────────────────────────────────────
export { useTools } from "./hooks/useTools";
export { default as useToolsDefault } from "./hooks/useTools"; // backwards compat
export { useThread } from "./providers/Thread";
export { useStreamContext } from "./providers/Stream";
export { useChatRuntime } from "./providers/ChatRuntime";
export { useFileProvider } from "./providers/FileProvider";
export { useCustomComponents } from "./providers/CustomComponentProvider";
export { useChatSuggestions } from "./providers/useChatSuggestions";
export { useModels } from "./hooks/use-models";

// ─── Types: Provider / context shapes ────────────────────────────────────────
// ChatIdentity is defined in ChatRuntime — ChatProvider re-exports it.
// Import from either location; both resolve to the same type.
export type { ChatIdentity } from "./providers/ChatRuntime";
export type { ChatRuntimeContextValue } from "./providers/ChatRuntime";
export type { ThreadMode, ThreadConfiguration, ThreadContextType } from "./providers/Thread";
export type { StateType } from "./providers/Stream";
export type { SuggestionsOptions, SuggestionConfig } from "./providers/useChatSuggestions";

// ─── Types: Component props ───────────────────────────────────────────────────
// Every public component's props interface is exported so consumers can type
// their wrapper components without duplicating interface definitions.
export type {
  ChatProps,
  ChatSidebarProps,
  ChatUIProps,
  CallThisOnSubmitResponse,
  chatBodyProps,
  headerProps,
  textToSpeechVoice,
} from "./types/ChatProps";

// ─── Types: Domain objects ────────────────────────────────────────────────────
export type { FileInfo } from "./types/fileInput";
export type { CustomTool } from "./types/CustomTools";
export type { ModelOption } from "./hooks/use-models";