import { MessageSquareMoreIcon } from "lucide-react";

export default function ChatButton({
  isVisible,
  setOpen,
}: {
  isVisible: boolean;
  setOpen: (value: boolean) => void;
}) {
  if (!isVisible) return null;
  return (
    <button
      onClick={() => setOpen(true)}
      aria-label="Open chat"
      className="fixed bottom-5 right-5 w-14 h-14 rounded-full bg-black text-white border-0 cursor-pointer flex items-center justify-center z-9999 shadow-lg hover:shadow-xl transition-shadow"
    >
      <MessageSquareMoreIcon width={24} height={28} />
    </button>
  );
}
