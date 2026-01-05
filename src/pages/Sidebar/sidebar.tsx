import { v4 as uuidv4 } from "uuid";
import { useState, useEffect, type FormEvent } from "react";
import ChatButton from "../../components/ChatButton";
import { AnimatePresence, motion } from "framer-motion";
import ChatInput, { type FileInfo } from "../../components/sidebar/ChatInput";
import ChatBody from "../../components/ChatBody";
import { useThread } from "@/providers/Thread";
import { useStreamContext } from "@/providers/Stream";
import type { Message } from "@langchain/langgraph-sdk";
import { X } from "lucide-react";

export default function Sidebar({
  header = "AI Assistant",
}: {
  header?: string;
}) {
  const { setConfiguration } = useThread();

  useEffect(() => {
    setConfiguration({ stage: "FILE_UPLOAD" });
  }, [setConfiguration]);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [fileInput, setFileInput] = useState<FileInfo[]>([]);

  const stream = useStreamContext();
  const isLoading = stream.isLoading;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (input.trim().length === 0 || isLoading) return;

    // Build content blocks including files
    const contentBlocks = [
      ...(input.trim().length > 0 ? [{ type: "text", text: input }] : []),
      // Add file attachments if any
      ...fileInput.map((file) => ({
        type: "document" as const,
        source: {
          type: "base64" as const,
          media_type: file.fileType,
          data: file.fileData || "", // You need to add fileData to FileInfo
        },
        // Include filename for reference
        cache_control: { type: "ephemeral" as const },
      })),
    ] as unknown as Message["content"];
    // ...existing code...

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

    // Clear inputs after submit
    setInput("");
    setFileInput([]);
  };

  const handleFileSelect = async (
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
          fileData: base64Data, // Add this to your FileInfo type
        };
      })
    );

    setFileInput((prevFile) => [...prevFile, ...fileDetails]);
  };

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

                <div className="sticky bottom-0 border-t border-zinc-800">
                  <ChatInput
                    input={input}
                    setInput={setInput}
                    handleSubmit={handleSubmit}
                    isLoading={isLoading}
                    fileInput={fileInput}
                    handleFileSelect={handleFileSelect}
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
