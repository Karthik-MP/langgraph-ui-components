import type { FileInfo } from "@/types/fileInput";
import { MoveUp, Paperclip, Loader2, Mic, Square, ChevronDown, Check } from "lucide-react";
import React, {
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useState,
  type DragEvent,
  useRef,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import type { textToSpeechVoice } from "@/types/ChatProps";
import { useModels } from "@/hooks/use-models";
import { cn } from "@/utils/tailwindUtil";

export default function ChatInput({
  input,
  inputFileAccept = ".png,.jpg,.jpeg,.pdf,.docx",
  setInput,
  textToSpeechVoice,
  handleSubmit,
  fileInput,
  setFileInput,
  handleFileSelect,
  isLoading = false,
  onCancel,
  filePreview,
}: {
  input: string;
  setInput: (value: string) => void;
  textToSpeechVoice?: textToSpeechVoice;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  fileInput: FileInfo[];
  setFileInput: Dispatch<SetStateAction<FileInfo[]>>;
  handleFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  inputFileAccept?: string;
  isLoading?: boolean;
  onCancel?: () => void;
  filePreview?: (files: FileInfo[], setFileInput: Dispatch<SetStateAction<FileInfo[]>>) => React.ReactNode;
}) {
  const canSubmit =
    (input.trim().length > 0 || fileInput.length > 0) && !isLoading;

  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { models, selectedModel, setSelectedModel } = useModels();
  const modelItems = models.map((m) => ({ id: m.id, label: m.name || m.id }));

  // Audio recording and transcription
  const { isRecording, recordingTime, isTranscribing, startRecording, stopRecording, transcribeAudio } = useAudioRecorder();

  const handleMicClick = async () => {
    if (isRecording) {
      // Stop recording and transcribe
      const audioBlob = await stopRecording();

      if (audioBlob) {
        try {
          const transcribedText = await transcribeAudio(audioBlob, textToSpeechVoice?.apiKey || "", textToSpeechVoice?.apiUrl || "", textToSpeechVoice?.model || "Systran/faster-whisper-small");

          if (transcribedText) {
            setInput(transcribedText);
            // Expand textarea to fit content
            if (textareaRef.current) {
              setTimeout(() => {
                if (textareaRef.current) {
                  textareaRef.current.style.height = "auto";
                  const maxHeight = 300;
                  textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, maxHeight) + "px";
                }
              }, 0);
            }
          }
        } catch (error) {
          alert("Failed to transcribe audio. Please try again.");
        }
      }
    } else {
      // Start recording
      await startRecording();
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    handleSubmit(e);
    // Reset textarea height to initial size
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const acceptedFiles = files.filter(file => {
      if (!inputFileAccept) return true;
      const acceptTypes = inputFileAccept.split(',').map(type => type.trim());
      return acceptTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type.match(type.replace('*', '.*'));
      });
    });

    if (acceptedFiles.length === 0) return;

    const fileDetails: FileInfo[] = await Promise.all(
      acceptedFiles.map(async (file) => {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
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

  return (
    <form
      onSubmit={onSubmit}
      className={`relative flex flex-col  border rounded-xl m-2 bg-zinc-900 border-zinc-800 transition-colors ${isDragOver ? 'border-blue-500 bg-zinc-800' : ''
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* File attachments preview */}
      {filePreview && filePreview(fileInput, setFileInput)}

      {/* Text input */}
      <textarea
        ref={textareaRef}
        placeholder="Type your message..."
        value={input}
        onChange={(e) => {
          setInput(e.target.value)
          const maxHeight = 300; // max height in pixels
          e.target.style.height = "auto"; // reset height
          e.target.style.height = Math.min(e.target.scrollHeight, maxHeight) + "px";
        }}
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
        className="w-full field-sizing-content resize-none px-2.5 pt-2.5 bg-transparent text-white placeholder-zinc-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed overflow-y-auto thread-scrollbar"
        rows={1}
      />

      {/* Footer with controls */}
      <div className="flex justify-between items-center px-1 pb-2">
        <div className="flex gap-1 m-2">
          <label
            htmlFor="file-input"
            className={`cursor-pointer ${isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            <Paperclip
              size={30}
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

          {/* Microphone Button */}
          {textToSpeechVoice?.apiKey && textToSpeechVoice?.apiUrl && textToSpeechVoice?.model && (
            <button
              type="button"
              onClick={handleMicClick}
              disabled={isLoading || isTranscribing}
              className={`${isRecording
                ? "text-red-500 hover:bg-red-900/20"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                } rounded p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isRecording ? `Recording... ${recordingTime}s` : "Record audio"}
            >
              {isRecording ? <Square size={24} className="animate-pulse" /> : <Mic size={24} />}
            </button>
          )}
        </div>

        <div className="flex gap-2 items-center">
          {isTranscribing && (
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <Loader2 size={14} className="animate-spin" />
              Transcribing...
            </span>
          )}

          {modelItems.length > 1 && (
            <DropdownSelector
              items={modelItems}
              selected={selectedModel}
              onSelect={setSelectedModel}
              placeholder="Model"
              maxWidth={160}
            />
          )}

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
            className="focus:outline-none transition-all bg-zinc-300 border rounded-full p-1 mx-2 cursor-pointer"
            style={{ border: "none" }}
          >
            {isLoading ? (
              <Loader2 size={24} className="animate-spin text-black p-1" />
            ) : (
              <MoveUp size={24} className="text-black p-1" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

function DropdownSelector<T extends { id: string; label: string }>({
  items,
  selected,
  onSelect,
  placeholder,
  maxWidth = 160,
  maxLength = 20,
  dropDown = false,
}: {
  items: T[];
  selected: string;
  onSelect: (id: string) => void;
  placeholder: string;
  maxWidth?: number;
  maxLength?: number;
  dropDown?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    if (dropDown) {
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    } else {
      setMenuStyle({
        position: "fixed",
        bottom: window.innerHeight - rect.top + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, [open, dropDown]);

  const selectedItem = items.find((i) => i.id === selected);
  const fullLabel = selectedItem?.label || placeholder;
  const displayLabel =
    fullLabel.length > maxLength
      ? `${fullLabel.slice(0, Math.max(0, maxLength - 1))}…`
      : fullLabel;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <span className="truncate" style={{ maxWidth }} title={fullLabel}>
          {displayLabel}
        </span>
        <ChevronDown className={cn("size-3 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className="z-9999 min-w-55 max-h-77 overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                item.id === selected && "bg-accent/50 font-medium",
              )}
            >
              <span className="truncate">{item.label}</span>
              {item.id === selected && <Check className="size-4 shrink-0 text-primary" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}