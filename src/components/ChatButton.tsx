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
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: "50%",
        backgroundColor: "#000",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
      }}
    >
      <MessageSquareMoreIcon width={24} height={28} />
    </button>
  );
}
