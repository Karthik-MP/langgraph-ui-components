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
    <div className="flex items-end gap-3 justify-end">
      <div className="flex flex-1 flex-col gap-1 items-end">
        <span className="text-zinc-500 text-xs mr-1">You</span>

        {textContent && (
          <div className="text-base font-normal leading-relaxed rounded-2xl rounded-tr-none px-4 py-3 bg-blue-500 text-white shadow-sm max-w-[90%]">
            {textContent}
          </div>
        )}

        {documents.length > 0 && (
          <div className="flex flex-col gap-2 max-w-[90%]">
            {documents.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-800"
              >
                <FileIcon size={16} className="text-blue-400 shrink-0" />
                <span className="text-xs text-zinc-300 truncate">
                  {doc.source?.filename || `Document ${idx + 1}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="size-8 shrink-0 flex items-center justify-center"
        data-alt="User Avatar"
      >
        <CircleUser className="rounded-lg bg-blue-400 text-white" />
      </div>
    </div>
  );
}

// Memoize with deep comparison on message ID
export default React.memo(HumanMessage, (prevProps, nextProps) => {
  return prevProps.message.id === nextProps.message.id;
});
