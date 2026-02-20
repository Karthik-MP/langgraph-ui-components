import { getContentString } from "@/utils/utils";
import type { AIMessage, Message } from "@langchain/langgraph-sdk";
import React, { useState } from "react";

function ToolCallFunctions({ title, toolMessages, toolCalls }: {
  title?: string;
  toolMessages: Message[];
  toolCalls?: AIMessage["tool_calls"];
}) {
  const [open, setOpen] = useState(false);

  const hasToolMessages = !!toolMessages && toolMessages.length > 0;
  const hasToolCalls = !!toolCalls && toolCalls.length > 0;

  // Only render if there are tool messages or tool calls
  if (!hasToolMessages && !hasToolCalls) return null;

  return (
    <div
      id="accordion-collapse"
      data-accordion="collapse"
      className="w-full rounded-base overflow-hidden shadow-xs border rounded-xl border-zinc-800 max-w-[90%] min-w-25"
    >
      <h2 id="accordion-collapse-heading-1">
        <button
          type="button"
          className="flex items-center justify-between w-full p-2 font-medium gap-3 text-body border-0 outline-none ring-0 appearance-none bg-transparent"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="accordion-collapse-body-1"
        >
          <span>🔷 {title}</span>
          <svg
            data-accordion-icon
            className={`w-5 h-5 shrink-0 transition-transform ${open ? "rotate-0" : "rotate-180"
              }`}
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m5 15 7-7 7 7"
            />
          </svg>
        </button>
      </h2>
      <div
        id="accordion-collapse-body-1"
        className={`${open ? "" : "hidden"}`}
        aria-labelledby="accordion-collapse-heading-1"
      >
        <div className="md:p-5 text-left space-y-3">
          {hasToolMessages && toolMessages.map((toolMsg) => (
            <div key={toolMsg.id} className="border-zinc-700">
              <p className="text-body text-sm">{toolMsg.content ? getContentString(toolMsg.content) : ""}</p>
            </div>
          ))}
          {!hasToolMessages && hasToolCalls && toolCalls?.map((toolCall) => (
            <div key={toolCall.id ?? toolCall.name} className="border-zinc-700">
              <p className="text-body text-sm font-medium">{toolCall.name}</p>
              <pre className="text-xs text-zinc-400 whitespace-pre-wrap mt-1">
                {JSON.stringify(toolCall.args ?? {}, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ToolCallFunctions, (prevProps, nextProps) => {
  return prevProps.toolMessages?.length === nextProps.toolMessages?.length;
});