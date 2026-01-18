import type { FormEvent } from "react";
import type { FileInfo } from "./fileInput";

interface ChatProps {
    inputFileAccept?: string;
    enableToolCallIndicator?: boolean;
    handleFileSelect?: (e: FormEvent) => void;
    callThisOnSubmit?: () => Promise<FileInfo[] | void>;
}

export interface ChatSidebarProps {
    header?: string;
    chatProps?: ChatProps;
}

export interface ChatUIProps extends ChatProps {
    chatProps?: ChatProps;
}