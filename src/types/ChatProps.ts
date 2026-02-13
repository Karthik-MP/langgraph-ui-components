import type { FormEvent, Dispatch, SetStateAction } from "react";
import type { FileInfo } from "./fileInput";

export interface headerProps {
    title?: string;
    logoUrl?: string;
}

export interface chatBodyProps {
    agentName?: string;
    agentAvatarUrl?: string;
}

export interface CallThisOnSubmitResponse {
    files?: FileInfo[];
    contextValues?: Record<string, any>;
}

interface ChatProps {
    inputFileAccept?: string;
    enableToolCallIndicator?: boolean;
    handleFileSelect?: (e: FormEvent) => void;
    callThisOnSubmit?: () => Promise<CallThisOnSubmitResponse | void>;
    header?: headerProps;
    chatBodyProps?: chatBodyProps;
}

export interface ChatSidebarProps extends ChatProps {
    supportMultipleAgents?: boolean;
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
