import type { FormEvent } from "react";
import type { FileInfo } from "./fileInput";

interface headerProps {
    title?: string;
    logoUrl?: string;
}

interface ChatProps {
    inputFileAccept?: string;
    enableToolCallIndicator?: boolean;
    handleFileSelect?: (e: FormEvent) => void;
    callThisOnSubmit?: () => Promise<FileInfo[] | void>;
    header?: headerProps;
}

export interface ChatSidebarProps extends ChatProps {

}

export interface ChatUIProps extends ChatProps {
    // chatProps?: ChatProps;
}