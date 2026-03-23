import ChatBody from "@/components/ChatBody";
import ChatInput from "@/components/sidebar/ChatInput";
import Suggestion from "@/components/Suggestion";
import ThreadHistory from "@/components/threads/ThreadHistory";
import { useChatRuntime } from "@/providers/ChatRuntime";
import { useFileProvider } from "@/providers/FileProvider";
import { useStreamContext } from "@/providers/Stream";
import { useThread } from "@/providers/Thread";
import type { ChatUIProps } from "@/types/ChatProps";
import type { FileInfo } from "@/types/fileInput";
import { buildContentBlocks, readFilesAsBase64 } from "@/utils/submitUtils";
import type { Message } from "@langchain/langgraph-sdk";
import { useEffect, useState, type FormEvent } from "react";
import { v4 as uuidv4 } from "uuid";

export function Chat(chatProps?: ChatUIProps) {
    const { callThisOnSubmit, handleFileSelect, enableToolCallIndicator, chatBodyProps, textToSpeechVoice } = chatProps || {};
    const [isFirstMessage, setIsFirstMessage] = useState(true);
    const [input, setInput] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { fileInput, setFileInput } = useFileProvider();
    const [agents, setAgents] = useState<Array<string>>([]);
    const { fetchCatalog } = useStreamContext();
    const stream = useStreamContext();
    const { assistantId, setAssistantId } = useChatRuntime();
    const isLoading = stream.isLoading;
    const { setMode, threadId } = useThread();

    useEffect(() => {
        // Fetch the agent catalog on component mount
        const fetchAgents = async () => {
            const data = await fetchCatalog() as { agents?: { graph_id?: string }[] } | null;

            const agentList = Array.isArray(data?.agents) ? data.agents : [];
            const agentIds = agentList
                .map((item) => item?.graph_id)
                .filter((id): id is string => typeof id === "string" && id.length > 0);
            setAgents(agentIds);
        };
        fetchAgents();
    }, [fetchCatalog]);

    const handleAgentChange = (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
        const selectedAgent = (event.target as HTMLElement).innerText;
        setAssistantId(selectedAgent);
        setIsDropdownOpen(false);
    }


    // Set thread mode to multi when using Chat
    useEffect(() => {
        setMode("multi");
    }, [setMode]);

    // Update isFirstMessage based on thread messages
    // Only show first message screen when no thread exists AND no messages
    useEffect(() => {
        if (stream.messages && stream.messages.length > 0) {
            setIsFirstMessage(false);
        } else if (!threadId) {
            // Only reset to true if we don't have an active thread
            setIsFirstMessage(true);
        }
        // Don't set to true if we have a threadId but messages are temporarily empty (loading)
    }, [threadId, stream.messages]);

    const defaultHandleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if ((input.trim().length === 0 && fileInput.length === 0) || isLoading)
            return;

        let latestFiles: FileInfo[] = fileInput;
        let contextValues: Record<string, unknown> | undefined = undefined;
        if (callThisOnSubmit) {
            const result = await callThisOnSubmit();
            if (Array.isArray(result?.files) && result.files.length > 0) {
                latestFiles = result.files as FileInfo[];
            }
            if (result && result?.contextValues) contextValues = result.contextValues;
        }

        const contentBlocks = buildContentBlocks(input, latestFiles);

        const newHumanMessage: Message = {
            id: uuidv4(),
            type: "human",
            content: contentBlocks,
        };

        setIsFirstMessage(false);

        // Clear input optimistically, but restore on failure so the user doesn't lose their draft.
        const savedInput = input;
        const savedFileInput = fileInput;
        setInput("");
        setFileInput([]);

        try {
            // Use the unified submitMessage function
            await stream.submitMessage(newHumanMessage, { contextValues: contextValues });
        } catch (err) {
            setInput(savedInput);
            setFileInput(savedFileInput);
            throw err;
        }
    };

    const defaultHandleFileSelect = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = event.target.files;
        if (!files) return;
        const fileDetails = await readFilesAsBase64(files);
        setFileInput((prevFile) => [...prevFile, ...fileDetails]);
    };

    const onFileSelect = handleFileSelect || defaultHandleFileSelect;

    return (
        <div className="flex h-screen w-screen bg-[#0f0f0f] text-white">
            <ThreadHistory header={chatProps?.header || { title: "AI Assistant" }} />
            <main className="flex flex-1 flex-col">
                {/* Header */}
                <header className="flex h-14 items-center justify-between border-b border-white/10 px-6">

                    <button
                        id="dropdownDividerButton"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="inline-flex items-center justify-center text-white bg-brand box-border border rounded-2xl border-transparent hover:bg-brand-strong font-medium leading-5 rounded-base text-sm px-4 py-2.5 bg-zinc-800"
                        type="button"
                    >
                        {assistantId}
                        <svg className="w-4 h-4 ms-1.5 -me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" /></svg>
                    </button>

                    <div id="dropdownDivider" className={`z-10 absolute top-14 bg-neutral-primary-medium bg-zinc-800 rounded-2xl  divide-y divide-default-medium w-44 ${isDropdownOpen ? '' : 'hidden'}`}>
                        <ul className="p-2 text-sm text-body font-medium" aria-labelledby="dropdownDividerButton">
                            {agents.map((agentName) => (
                                <li key={agentName} className="hover:bg-zinc-700 hover:rounded-2xl" onClick={handleAgentChange}>
                                    <span className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">{agentName}</span>
                                </li>
                            ))}
                        </ul>
                        {/* <div className="p-2 text-sm text-body font-medium">
                            <a href="#" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Separated link</a>
                        </div> */}
                    </div>

                </header>

                {/* CONTENT AREA */}
                <div className="relative flex flex-1 overflow-hidden">
                    {isFirstMessage ?
                        <div className="flex flex-1 flex-col items-center justify-center">
                            <h1 className="mb-8 text-2xl font-medium text-white/80">
                                What are you working on?
                            </h1>

                            <div className="w-full max-w-2xl px-4">
                                <ChatInput input={input} setInput={setInput} textToSpeechVoice={textToSpeechVoice} handleSubmit={defaultHandleSubmit} fileInput={fileInput} setFileInput={setFileInput} handleFileSelect={onFileSelect} />
                            </div>
                        </div> :
                        // =========================
                        // CHAT STATE (after message)
                        // =========================
                        <div className="flex h-full w-full flex-col">
                            <div className="flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
                                <div className="mx-auto max-w-3xl px-4 py-6">
                                    <ChatBody setIsFirstMessage={setIsFirstMessage} enableToolCallIndicator={enableToolCallIndicator} chatBodyProps={chatBodyProps} />
                                </div>
                            </div>
                            <div className="mx-auto">
                                <Suggestion />
                            </div>
                            <div className="border-t border-white/10 p-1">
                                <div className="mx-auto max-w-3xl">
                                    <ChatInput input={input} setInput={setInput} textToSpeechVoice={textToSpeechVoice} handleSubmit={defaultHandleSubmit} fileInput={fileInput} setFileInput={setFileInput} handleFileSelect={onFileSelect} />
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </main>
        </div>
    )
}
