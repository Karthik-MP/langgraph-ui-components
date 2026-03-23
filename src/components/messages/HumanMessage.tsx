import { useStreamContext } from "@/providers/Stream";
import type { Message } from "@langchain/langgraph-sdk";
import { Copy, FileIcon, Pencil, Send, X } from "lucide-react";
import React, { useState } from "react";

function HumanMessage({ message, fontSize }: { message: Message; fontSize?: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const thread = useStreamContext();
  const meta = thread.getMessagesMetadata(message);
  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;

  // Extract text and documents from content
  const content = message.content;
  let textContent = "";
  let documents: any[] = [];

  if (typeof content === "string") {
    textContent = content;
  } else if (Array.isArray(content)) {
    textContent = content
      .filter((c: any) => c.type === "text")
      .map((c: any) => (c.type === "text" ? c.text : ""))
      .join("");
    documents = content.filter((c: any) => c.type === "document") ?? [];
  }

  const handleSubmitEdit = () => {
    // Validate that edited text is not empty
    if (!editedText.trim()) {
      return;
    }

    setIsEditing(false);
    // console.log("Send edited message:", editedText);

    const newMessage: Message = { type: "human", content: editedText };
    thread.submit(
      { messages: [newMessage] },
      {
        checkpoint: parentCheckpoint,
        streamMode: ["values"],
        streamSubgraphs: true,
        streamResumable: true,
        optimisticValues: (prev) => {
          const values = meta?.firstSeenState?.values;
          if (!values) return prev;

          return {
            ...values,
            messages: [...(values.messages ?? []), newMessage],
          };
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-1 w-full group my-1">
      <div className="flex flex-1 flex-col gap-2 items-end min-w-0 mr-4">

        {documents.length > 0 && (
          <div className="flex flex-col gap-2 max-w-[90%]">
            {documents.map((doc, idx) => (
              <div
                key={`${message.id}-doc-${idx}`}
                className="flex items-center gap-3 bg-linear-to-br from-zinc-800/90 to-zinc-900/90 backdrop-blur-sm px-4 py-1 rounded-xl border border-zinc-700/50 shadow-md hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer group/file"
              >
                <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 group-hover/file:bg-blue-500/20 transition-colors">
                  <FileIcon size={16} className="text-blue-400 shrink-0" />
                </div>
                <span className="text-sm text-zinc-200 truncate font-medium">
                  {doc.source?.filename || `Document ${idx + 1}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {textContent && (
          <div className="flex flex-col items-end gap-1">
            <div className="relative flex-1 w-full flex justify-end">
              {isEditing ? (
                <div className="flex flex-col gap-2 w-full">
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    onKeyDown={(e)=>{
                      if(e.key === "Enter"){
                        e.preventDefault();
                        handleSubmitEdit();
                      }
                    }}
                    className="font-normal leading-relaxed rounded-2xl px-5 bg-zinc-900 border border-zinc-800 text-white shadow-lg wrap-break-word overflow-wrap-anywhere resize-none focus:outline-none min-h-15"
                    style={fontSize ? { fontSize } : { fontSize: "15px" }}
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedText("");
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={handleSubmitEdit}
                      disabled={!editedText.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="font-normal leading-relaxed rounded-xl py-2 px-4 bg-[#242322] text-white shadow-lg max-w-full break-words overflow-wrap-anywhere" style={fontSize ? { fontSize } : { fontSize: "15px" }}>
                  {textContent}
                </div>
              )}
            </div>
            {!isEditing && (
              <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Pencil
                  size={16}
                  className="text-zinc-500 cursor-pointer hover:text-white"
                  onClick={() => {
                    setIsEditing(true);
                    setEditedText(textContent);
                  }}
                />
                <Copy
                  size={16}
                  className="text-zinc-500 cursor-pointer hover:text-white"
                  onClick={() => {
                    navigator.clipboard.writeText(textContent);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Memoize with deep comparison on message ID
export default React.memo(HumanMessage, (prevProps, nextProps) => {
  return prevProps.message.id === nextProps.message.id && prevProps.fontSize === nextProps.fontSize;
});
