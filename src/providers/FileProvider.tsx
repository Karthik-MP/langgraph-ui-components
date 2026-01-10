import type { FileInfo } from "@/types/fileInput";
import { createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction } from "react";

interface FileProviderType {
  /** Array of files currently attached to the chat input */
  fileInput: FileInfo[];
  /** Update the file attachments */
  setFileInput: Dispatch<SetStateAction<FileInfo[]>>;
}

const FileProviderContext = createContext<FileProviderType | undefined>(undefined);

/**
 * Provides file attachment management for chat messages.
 * Stores files selected by the user before sending.
 * 
 * @example
 * ```tsx
 * <FileProvider>
 *   <ChatInput />
 * </FileProvider>
 * ```
 */
export function FileProvider({ children }: { children: ReactNode }) {
  const [fileInput, setFileInput] = useState<FileInfo[]>([]);
  return (
    <FileProviderContext.Provider value={{ fileInput, setFileInput }}>
      {children}
    </FileProviderContext.Provider>
  );
}

/**
 * Hook to access file attachment state.
 * Use this to manage files attached to chat messages.
 * 
 * @throws {Error} If used outside of FileProvider
 * 
 * @example
 * ```tsx
 * const { fileInput, setFileInput } = useFileProvider();
 * ```
 */
export function useFileProvider() {
  const context = useContext(FileProviderContext);
  if (!context) {
    throw new Error("use File Provider inside a FileProvider");
  }
  return context;
}
