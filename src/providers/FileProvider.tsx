import type { FileInfo } from "@/types/types";
import { createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction } from "react";

interface FileProviderType {
  fileInput: FileInfo[];
  setFileInput: Dispatch<SetStateAction<FileInfo[]>>;
}

const FileProviderContext = createContext<FileProviderType | undefined>(undefined);

export function FileProvider({ children }: { children: ReactNode }) {
  const [fileInput, setFileInput] = useState<FileInfo[]>([]);
  return (
    <FileProviderContext.Provider value={{ fileInput, setFileInput }}>
      {children}
    </FileProviderContext.Provider>
  );
}

export function useFileProvider() {
  const context = useContext(FileProviderContext);
  if (!context) {
    throw new Error("use File Provider inside a FileProvider");
  }
  return context;
}
