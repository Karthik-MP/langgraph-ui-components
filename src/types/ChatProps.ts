import type { FormEvent } from "react";
import type { FileInfo } from "./fileInput";

interface ChatProps {
    inputFileAccept?: string;
    handleFileSelect?: (e: FormEvent) => void;
    callThisOnSubmit?: () => Promise<FileInfo[] | void>;
}

export interface ChatSidebarProps {
    header?: string;
    chatProps?: ChatProps;
}

export interface ChatUIProps extends ChatProps {
}