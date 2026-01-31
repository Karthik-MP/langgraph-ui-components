import type { FormEvent, Dispatch, SetStateAction } from "react";
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
    filePreview?: (files: FileInfo[], setFileInput: Dispatch<SetStateAction<FileInfo[]>>) => React.ReactNode;
    s3_upload?: boolean;
    preventSubmit?: boolean;
    banner?: React.ReactNode;
    leftPanelContent?: React.ReactNode;
    leftPanelOpen?: boolean;
    setLeftPanelOpen?: Dispatch<SetStateAction<boolean>>;
}

export interface ChatUIProps extends ChatProps {
    // chatProps?: ChatProps;
}