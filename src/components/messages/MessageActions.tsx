import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tailwindUtil";
import { useStreamContext } from "@/providers/Stream";
import type { Message } from "@langchain/langgraph-sdk";
import { Check, Copy, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export type MessageFeedback = "like" | "dislike" | null;

interface MessageActionsProps {
  message: Message;
  onRegenerate?: (parentCheckpoint: any | null | undefined, messageId: string, currentMessage: any) => void;
  feedback?: MessageFeedback;
  onFeedback?: (messageId: string, feedback: MessageFeedback) => void;
  className?: string;
}

export function MessageActions({
  message,
  onRegenerate,
  feedback,
  onFeedback,
  className,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const thread = useStreamContext();
  const meta = thread.getMessagesMetadata(message);
  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;

  const handleCopy = async () => {
    try {
      let textContent = "";
      
      if (typeof message.content === "string") {
        textContent = message.content;
      } else if (Array.isArray(message.content)) {
        textContent = message.content
          .map((c: any) => (c.type === "text" ? c.text : ""))
          .filter(Boolean)
          .join("\n");
      }

      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
      console.error("Copy failed:", error);
    }
  };

  const handleRegenerate = async () => {
    if (!onRegenerate || !parentCheckpoint || !message.id) return;
    
    try {
      setIsRegenerating(true);
      await onRegenerate(parentCheckpoint, message.id, message);
    } catch (error) {
      toast.error("Failed to regenerate");
      console.error("Regenerate failed:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleLike = () => {
    if (!onFeedback || !message.id) return;
    // Toggle like: if already liked, set to null; otherwise, set to like
    const newFeedback = feedback === "like" ? null : "like";
    onFeedback(message.id, newFeedback);
  };

  const handleDislike = () => {
    if (!onFeedback || !message.id) return;
    // Toggle dislike: if already disliked, set to null; otherwise, set to dislike
    const newFeedback = feedback === "dislike" ? null : "dislike";
    onFeedback(message.id, newFeedback);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
        className
      )}
    >
      {/* Copy Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        className="h-7 w-7 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
        title="Copy message"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>

      {/* Regenerate Button */}
      {onRegenerate && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="h-7 w-7 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          title="Regenerate response"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isRegenerating && "animate-spin")}
          />
        </Button>
      )}

      {/* Feedback Buttons */}
      {onFeedback && (
        <>
          {/* Like Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            className={cn(
              "h-7 w-7 hover:bg-zinc-800",
              feedback === "like"
                ? "text-green-500 hover:text-green-400"
                : "text-zinc-500 hover:text-zinc-300"
            )}
            title="Good response"
          >
            <ThumbsUp
              className={cn(
                "h-3.5 w-3.5",
                feedback === "like" && "fill-current"
              )}
            />
          </Button>

          {/* Dislike Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDislike}
            className={cn(
              "h-7 w-7 hover:bg-zinc-800",
              feedback === "dislike"
                ? "text-red-500 hover:text-red-400"
                : "text-zinc-500 hover:text-zinc-300"
            )}
            title="Bad response"
          >
            <ThumbsDown
              className={cn(
                "h-3.5 w-3.5",
                feedback === "dislike" && "fill-current"
              )}
            />
          </Button>
        </>
      )}
    </div>
  );
}
