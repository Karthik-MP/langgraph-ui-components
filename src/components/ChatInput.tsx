import { Label } from "@radix-ui/react-label";
import { Plus } from "lucide-react";
import { ClipLoader } from "react-spinners";
import type { FormEvent } from "react";

export default function ChatInput({
  input,
  setInput,
  handleSubmit,
  isLoading = false,
  onCancel,
}: {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}) {
  return (
    <form
      onSubmit={handleSubmit}
      className="grid max-w-3xl grid-rows-[1fr_auto] gap-2 border m-4 rounded-2xl border-white"
    >
      {/* <ContentBlocksPreview blocks={contentBlocks} onRemove={removeBlock} /> */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        // onPaste={handlePaste}
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            !e.shiftKey &&
            !e.metaKey &&
            !e.nativeEvent.isComposing
          ) {
            e.preventDefault();
            const el = e.target as HTMLElement | undefined;
            const form = el?.closest("form");
            form?.requestSubmit();
          }
        }}
        placeholder="Type your message..."
        className="field-sizing-content resize-none border-none bg-transparent p-3.5 pb-0 shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
      />

      <div className="flex items-center gap-6 p-2 pt-4">
        <Label
          htmlFor="file-input"
          className="flex cursor-pointer items-center gap-2"
        >
          <Plus className="size-5 text-gray-600" />
          <span className="text-sm text-gray-600">Upload PDF or Image</span>
        </Label>
        <input
          id="file-input"
          type="file"
          //   onChange={handleFileUpload}
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          className="hidden"
        />
        {isLoading ? (
          <button
            onClick={() => onCancel?.()}
            className="ml-auto"
            style={{ backgroundColor: "#af3939", color: "white" }}
          >
            <ClipLoader size={12} color="white" /> Cancel
          </button>
        ) : (
          <button
            type="submit"
            className="ml-auto transition-all border"
            // disabled={
            //   isLoading || (!input.trim() && contentBlocks.length === 0)
            // }
          >
            Send
          </button>
        )}
      </div>
    </form>
  );
}
