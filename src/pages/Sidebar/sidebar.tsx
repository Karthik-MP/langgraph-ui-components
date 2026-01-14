import { v4 as uuidv4 } from "uuid";
import { useEffect, useState, type FormEvent } from "react";
import ChatButton from "../../components/ChatButton";
import { AnimatePresence, motion } from "framer-motion";
import ChatInput from "../../components/sidebar/ChatInput";
import ChatBody from "../../components/ChatBody";
import { useStreamContext } from "@/providers/Stream";
import type { Message } from "@langchain/langgraph-sdk";
import { X } from "lucide-react";
import type { FileInfo } from "@/types/fileInput";
import type { ChatSidebarProps } from "@/types/ChatProps";
import { useFileProvider } from "@/providers/FileProvider";
import Suggestion from "@/components/Suggestion";
import { useThread } from "@/providers/Thread";

/**
 * Main sidebar chat interface component.
 * Displays a chat button that opens a sliding sidebar with full chat functionality.
 * 
 * @param header - Custom header text for the chat sidebar (default: "AI Assistant")
 * @param handleFileSelect - Optional custom file selection handler
 * @param callThisOnSubmit - Optional callback invoked before message submission, can return updated file list
 * 
 * @example
 * ```tsx
 * <Sidebar 
 *   header="My Custom AI"
 *   callThisOnSubmit={async () => {
 *     // Upload files to your backend
 *     return updatedFiles;
 *   }}
 * />
 * ```
 */
export default function Sidebar({
  header = "AI Assistant",
  chatProps,
}: ChatSidebarProps) {

  const { handleFileSelect, callThisOnSubmit } = chatProps ?? {};

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { fileInput, setFileInput } = useFileProvider();

  const stream = useStreamContext();
  const isLoading = stream.isLoading;
  const { setMode } = useThread();

  // Set thread mode to single when using Sidebar
  useEffect(() => {
    setMode("single");
  }, [setMode]);

  const defaultHandleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if ((input.trim().length === 0 && fileInput.length === 0) || isLoading)
      return;

    // console.log("Submitting with input:", input);

    // Call the custom upload and get the latest files
    let latestFiles: FileInfo[] = fileInput;
    if (callThisOnSubmit) {
      const result = await callThisOnSubmit();
      if (result && result.length > 0) latestFiles = result;
    }

    // console.log("Using files for submission:", latestFiles);

    const contentBlocks = [
      ...(input.trim().length > 0 ? [{ type: "text", text: input }] : []),
      ...latestFiles.map((file) => ({
        type: "document" as const,
        ...file,
        cache_control: { type: "ephemeral" as const },
      })),
    ] as unknown as Message["content"];

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: contentBlocks,
    };

    stream.submit(
      { messages: [newHumanMessage] },
      {
        streamMode: ["values"],
        streamSubgraphs: true,
        streamResumable: true,
        optimisticValues: (prev) => ({
          ...prev,
          messages: [...(prev.messages ?? []), newHumanMessage],
        }),
      }
    );

    setInput("");
    setFileInput([]);
  };

  const defaultHandleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    // Convert files to base64 for sending
    const fileDetails: FileInfo[] = await Promise.all(
      Array.from(files).map(async (file) => {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]); // Remove data:...;base64, prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        return {
          fileName: file.name,
          fileType: file.type,
          file: file,
          fileData: base64Data, // Add this to your FileInfo type
        };
      })
    );

    setFileInput((prevFile) => [...prevFile, ...fileDetails]);
  };

  const onFileSelect = handleFileSelect || defaultHandleFileSelect;

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Sidebar */}
            <motion.aside
              className="fixed right-0 top-0 z-50 h-screen w-[520px] bg-black flex flex-col text-white"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              <div className="flex h-full flex-col">
                <div className="flex border-b border-zinc-800 py-4 px-6 justify-between items-center">
                  <div className="text-start text-2xl font-bold">{header}</div>
                  <X
                    className="text-zinc-400 cursor-pointer"
                    onClick={() => setOpen(false)}
                  />
                </div>

                <div className="flex-1 overflow-auto scrollbar-none">
                  <div className="p-4">
                    <ChatBody />
                  </div>
                </div>
                <Suggestion />
                <div className="sticky bottom-0 border-t border-zinc-800 m-2">
                  <ChatInput
                    input={input}
                    inputFileAccept={chatProps?.inputFileAccept}
                    setInput={setInput}
                    handleSubmit={defaultHandleSubmit}
                    isLoading={isLoading}
                    fileInput={fileInput}
                    handleFileSelect={onFileSelect}
                    setFileInput={setFileInput}
                    onCancel={() => stream.stop?.()}
                  />
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <ChatButton isVisible={!open} setOpen={setOpen} />
    </>
  );
}
