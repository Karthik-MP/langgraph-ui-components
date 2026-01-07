import type { Message } from "@langchain/langgraph-sdk";
import { CircleUser, FileIcon } from "lucide-react";
import React from "react";

function HumanMessage({ message }: { message: Message }) {
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

  return (
    <div className="flex items-end gap-3 justify-end w-full group">
      <div className="flex flex-1 flex-col gap-2 items-end min-w-0">
        <span className="text-zinc-400 text-xs font-medium mr-1 opacity-80">
          You
        </span>

        {textContent && (
          <div className="relative">
            <div className="text-[15px] font-normal leading-relaxed rounded-2xl rounded-tr-sm px-5 py-3.5 bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 max-w-full break-words overflow-wrap-anywhere transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.01]">
              {textContent}
            </div>
          </div>
        )}

        {documents.length > 0 && (
          <div className="flex flex-col gap-2 max-w-[90%]">
            {documents.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-zinc-700/50 shadow-md hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer group/file"
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
      </div>

      <div
        className="size-9 shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/20 group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-all duration-200"
        data-alt="User Avatar"
      >
        <CircleUser className="text-white" size={20} />
      </div>
    </div>
  );
}

// Memoize with deep comparison on message ID
export default React.memo(HumanMessage, (prevProps, nextProps) => {
  return prevProps.message.id === nextProps.message.id;
});
