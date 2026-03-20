import type { FormEvent, Dispatch, SetStateAction } from "react";
import type { FileInfo } from "./fileInput";

export interface headerProps {
    title?: string;
    logoUrl?: string;
}

export interface InterruptPayload {
    actionRequests: Array<{ name: string; args: Record<string, unknown>; description?: string }>;
    reviewConfigs: Array<{ actionName: string; allowedDecisions: string[]; argsSchema?: Record<string, unknown> }>;
}

export interface InterruptActions {
    approve: () => void;
    reject: (reason?: string) => void;
    edit: (editedArgs: Record<string, unknown>) => void;
}

export interface chatBodyProps {
    agentName?: string;
    agentAvatarUrl?: string;
    fontSize?: string;
    renderInterrupt?: (interrupt: InterruptPayload, actions: InterruptActions) => React.ReactNode;
}

export interface CallThisOnSubmitResponse {
    files?: FileInfo[];
    contextValues?: Record<string, unknown>;
}

export interface textToSpeechVoice {
    apiUrl: string;
    apiKey: string;
    model: string;
}

export interface ChatProps {
    inputFileAccept?: string;
    enableToolCallIndicator?: boolean;
    handleFileSelect?: (e: FormEvent) => void;
    callThisOnSubmit?: () => Promise<CallThisOnSubmitResponse | void>;
    header?: headerProps;
    chatBodyProps?: chatBodyProps;
    /** Optional text-to-speech voice configuration */
    textToSpeechVoice?: textToSpeechVoice;
}

export interface ChatSidebarProps extends ChatProps {
    supportChatHistory?: boolean;
    filePreview?: (files: FileInfo[], setFileInput: Dispatch<SetStateAction<FileInfo[]>>) => React.ReactNode;
    s3_upload?: boolean;
    preventSubmit?: boolean;
    banner?: React.ReactNode;
    leftPanelContent?: React.ReactNode;
    leftPanelOpen?: boolean;
    setLeftPanelOpen?: Dispatch<SetStateAction<boolean>>;
    leftPanelInitialWidth?: number;
    leftPanelClassName?: string;
}

export interface ChatUIProps extends ChatProps {
    // chatProps?: ChatProps;
}
