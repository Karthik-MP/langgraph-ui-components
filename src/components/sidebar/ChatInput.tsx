import type { FileInfo } from "@/types/fileInput";
import { MoveUp, Paperclip, Loader2, Mic, Square } from "lucide-react";
import {
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useState,
  type DragEvent,
  useRef,
} from "react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

export default function ChatInput({
  input,
  inputFileAccept = ".png,.jpg,.jpeg,.pdf,.docx",
  setInput,
  supportSpeechToText = false,
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
  supportSpeechToText?: boolean;
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

  // Audio recording and transcription
  const { isRecording, recordingTime, isTranscribing, startRecording, stopRecording, transcribeAudio } = useAudioRecorder();

  const handleMicClick = async () => {
    if (isRecording) {
      // Stop recording and transcribe
      const audioBlob = await stopRecording();

      if (audioBlob) {
        try {
          const transcribedText = await transcribeAudio(audioBlob);

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
          {supportSpeechToText && (
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
