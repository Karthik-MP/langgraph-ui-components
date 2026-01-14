import type { FileInfo } from "@/types/fileInput";
import { FileIcon, Paperclip, StepForward, X } from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  type Dispatch,
  type SetStateAction,
} from "react";

export default function ChatInput({
  input,
  inputFileAccept = ".png,.jpg,.jpeg,.pdf,.docx",
  setInput,
  handleSubmit,
  fileInput,
  setFileInput,
  handleFileSelect,
  isLoading = false,
  onCancel,
}: {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  fileInput: FileInfo[];
  setFileInput: Dispatch<SetStateAction<FileInfo[]>>;
  handleFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  inputFileAccept?: string;
  isLoading?: boolean;
  onCancel?: () => void;
}) {
  const canSubmit =
    (input.trim().length > 0 || fileInput.length > 0) && !isLoading;

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex flex-col gap-2 border rounded-xl m-2 bg-zinc-900 border-zinc-800"
    >
      {/* File attachments preview */}
      {fileInput.length > 0 && (
        <div className="flex flex-col gap-2 p-2 bg-zinc-900 border-b border-zinc-700 max-h-48 overflow-y-auto">
          {fileInput.map((file, index) => (
            <div
              key={`file-${index}-${file.fileName}`}
              className="flex items-center justify-between gap-3 bg-zinc-800 p-2 rounded group hover:bg-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileIcon className="text-blue-400 shrink-0" size={20} />
                <div className="flex flex-col min-w-0 overflow-hidden">
                  <span className="text-xs font-medium text-zinc-200 truncate">
                    {file.fileName}
                  </span>
                  <span className="text-[10px] text-zinc-500 truncate">
                    {file.fileType || "Unknown file type"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setFileInput((prev) => prev.filter((_, i) => i !== index))
                }
                className="shrink-0 p-1 rounded hover:bg-zinc-600 transition-colors"
                aria-label="Remove file"
              >
                <X size={16} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Text input */}
      <textarea
        placeholder="Type your message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            !e.shiftKey &&
            !e.metaKey &&
            !e.nativeEvent.isComposing
          ) {
            e.preventDefault();
            if (canSubmit) {
              e.currentTarget.form?.requestSubmit();
            }
          }
        }}
        disabled={isLoading}
        className="w-full field-sizing-content resize-none p-3.5 bg-transparent text-white placeholder-zinc-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        rows={1}
      />

      {/* Footer with controls */}
      <div className="flex justify-between items-center px-1 pb-2">
        <div className="flex gap-1 m-2">
          <label
            htmlFor="file-input"
            className={`cursor-pointer ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Paperclip
              size={24}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded p-1 transition-colors"
            />
          </label>
          <input
            id="file-input"
            type="file"
            multiple
            disabled={isLoading}
            accept={inputFileAccept}
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <div className="flex gap-2 items-center">
          {isLoading && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`focus:outline-none transition-all ${
              canSubmit
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-zinc-700 cursor-not-allowed opacity-50"
            }`}
            style={{ border: "none" }}
          >
            <StepForward size={36} className="text-white rounded p-1" />
          </button>
        </div>
      </div>
    </form>
  );
}
