import Suggestion from "@/components/Suggestion";
import ThreadHistory from "@/components/threads/ThreadHistory";
import { useFileProvider } from "@/providers/FileProvider";
import { useStreamContext } from "@/providers/Stream";
import { useThread } from "@/providers/Thread";
import type { ChatSidebarProps } from "@/types/ChatProps";
import type { FileInfo } from "@/types/fileInput";
import { logger } from "@/utils/logger";
import type { Message } from "@langchain/langgraph-sdk";
import { AnimatePresence, motion } from "framer-motion";
import { X, PanelLeft, ScanEye, EyeOff } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import ChatBody from "../../components/ChatBody";
import ChatButton from "../../components/ChatButton";
import ChatInput from "../../components/sidebar/ChatInput";

/**
 * Main sidebar chat interface component.
 * Displays a chat button that opens a sliding sidebar with full chat functionality.
 * 
 * @param header - Custom header text for the chat sidebar (default: "AI Assistant")
 * @param handleFileSelect - Optional custom file selection handler
 * @param callThisOnSubmit - Optional callback invoked before message submission, can return updated file list
 * @param preventSubmit - Optional boolean to prevent all submit actions when true
 * @param leftPanelContent - Optional custom content for the left panel when expanded
 * @param leftPanelOpen - Optional external control for left panel open state
 * @param setLeftPanelOpen - Optional external setter for left panel open state
 * 
 * @example
 * ```tsx
 * <Sidebar 
 *   header="My Custom AI"
 *   preventSubmit={true} // Disables all submit functionality
 *   callThisOnSubmit={async () => {
 *     // Upload files to your backend
 *     return updatedFiles;
 *   }}
 *   leftPanelContent={<div className="text-white">Custom left panel content here!</div>}
 *   leftPanelOpen={isLeftPanelOpen}
 *   setLeftPanelOpen={setIsLeftPanelOpen}
 * />
 * ```
 */
export default function Sidebar(props: ChatSidebarProps) {

  const { handleFileSelect, callThisOnSubmit, enableToolCallIndicator, header, inputFileAccept, filePreview, s3_upload, preventSubmit, leftPanelContent, leftPanelOpen: externalLeftPanelOpen, setLeftPanelOpen: externalSetLeftPanelOpen, chatBodyProps, supportMultipleAgents = false } = props;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [internalLeftPanelOpen, setInternalLeftPanelOpen] = useState(false);
  const [threadHistoryOpen, setThreadHistoryOpen] = useState(false);
  const { fileInput, setFileInput } = useFileProvider();

  const leftPanelOpen = externalLeftPanelOpen !== undefined ? externalLeftPanelOpen : internalLeftPanelOpen;
  const setLeftPanelOpen = externalSetLeftPanelOpen || setInternalLeftPanelOpen;

  const stream = useStreamContext();
  const isLoading = stream.isLoading;
  const { setMode } = useThread();

  // Set thread mode to single when using Sidebar
  // useEffect(() => {
  //   setMode("single");
  // }, [setMode]);


  useEffect(() => {
    if (supportMultipleAgents) {
      setMode("multi");
    } else {
      setMode("single");
    }
  }, [setMode, supportMultipleAgents]);

  const defaultHandleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (preventSubmit || (input.trim().length === 0 && fileInput.length === 0) || isLoading)
      return;

    // Call the custom upload and get the latest files
    let latestFiles: FileInfo[] = fileInput;
    let contextValues: Record<string, any> | undefined = undefined;
    if (callThisOnSubmit) {
      const result = await callThisOnSubmit();
      if (Array.isArray(result?.files) && result.files.length > 0) {
        latestFiles = result.files as FileInfo[];
      }
      if (result && result?.contextValues) contextValues = result.contextValues;
    }
    logger.debug("Using files for submission:", latestFiles);
    // Create content blocks based on upload type
    let contentBlocks: any;
    if (s3_upload) {
      // For S3 uploads, send the text input (if any) as a text block
      // and include each uploaded file as a separate `document` block.
      contentBlocks = [
        ...(input.trim().length > 0 ? [{ type: "text", text: input.trim() }] : []),
        ...latestFiles.map((file) => ({
          type: "document" as const,
          source: { filename: file.fileName, filetype: file.fileType },
        })),
      ];
    } else {
      contentBlocks = [
        ...(input.trim().length > 0 ? [{ type: "text", text: input }] : []),
        ...latestFiles.map((file) => ({
          type: "document" as const,
          ...file,
          cache_control: { type: "ephemeral" as const },
        })),
      ];
    }
    logger.debug("Constructed content blocks:", contentBlocks);
    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: contentBlocks,
    };

    // Use the unified submitMessage function
    await stream.submitMessage(newHumanMessage, { contextValues: contextValues });

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
          fileData: base64Data,
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
              className={`fixed right-0 top-0 z-50 h-screen flex bg-[#0f0f0f] text-white/70 ${threadHistoryOpen ? "w-[calc(25vw+280px)]" : "w-[25vw]"
                }`}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              <AnimatePresence>
                {leftPanelOpen && (
                  <motion.div
                    className="absolute right-full top-0 h-full w-[25vw]"
                    initial={{ x: "0" }}
                    animate={{ x: 0 }}
                    exit={{ x: "0%" }}
                    transition={{ type: "spring", stiffness: 400, damping: 40 }}
                  >
                    {leftPanelContent || (
                      <>
                        <h3 className="text-lg font-semibold mb-4 text-white">Left Panel</h3>
                        <p className="text-zinc-300">This is the left extension panel. You can add any content here.</p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex h-full flex-col flex-1">
                <div className="flex py-3 px-6 justify-between items-center border-b border-zinc-700/30">
                  <div className="flex items-center gap-3">
                    {/* Vertically centered left panel toggle */}
                    {leftPanelContent && (
                      <div className="flex items-start gap-3">
                        {leftPanelOpen ? (
                          <EyeOff
                            className="cursor-pointer transition-transform h-5"
                            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                          />
                        ) : (
                          <ScanEye
                            className="cursor-pointer transition-transform h-5"
                            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                          />
                        )}
                      </div>
                    )}
                    {header?.logoUrl && (
                      <img
                        src={header?.logoUrl}
                        alt={header?.title ? `${header.title} logo` : "AI Assistant logo"}
                        className="h-8 w-8 object-contain rounded-sm"
                      />
                    )}
                    <div className="text-start text-xl font-bold">{header?.title || "AI Assistant"}</div>

                  </div>
                  <div className="flex items-end gap-3">
                    {supportMultipleAgents && !threadHistoryOpen && <PanelLeft
                      className="h-5 text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors"
                      onClick={() => setThreadHistoryOpen(!threadHistoryOpen)}
                    />}
                    <X
                      className="text-zinc-400 cursor-pointer"
                      onClick={() => setOpen(false)}
                    />
                  </div>
                </div>
                <div className="flex-1 relative">
                  <div className="absolute inset-0 overflow-auto scrollbar-none">
                    <div className="pb-20 p-2">
                      <ChatBody enableToolCallIndicator={enableToolCallIndicator} chatBodyProps={chatBodyProps} />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-transparent px-4 pointer-events-none z-10">
                    <div className="pointer-events-auto">
                      <Suggestion />
                    </div>
                  </div>
                </div>
                <div className="sticky bottom-0">
                  <ChatInput
                    input={input}
                    inputFileAccept={inputFileAccept}
                    setInput={setInput}
                    handleSubmit={defaultHandleSubmit}
                    isLoading={isLoading}
                    fileInput={fileInput}
                    handleFileSelect={onFileSelect}
                    setFileInput={setFileInput}
                    onCancel={() => stream.stop?.()}
                    filePreview={filePreview}
                  />
                </div>
              </div>              <AnimatePresence>
                {threadHistoryOpen && (
                  <motion.div
                    className="h-full w-[280px] shadow-2xl border-l border-white/10"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <ThreadHistory isSidebar={true} header={{ title: "Sessions" }} onClose={() => setThreadHistoryOpen(false)} />
                  </motion.div>
                )}
              </AnimatePresence>            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <ChatButton isVisible={!open} setOpen={setOpen} />
    </>
  );
}
