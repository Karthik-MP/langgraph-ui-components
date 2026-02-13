import useTools from "@/hooks/useTools";
import { useThread } from "@/providers/Thread";
import { getContentString } from "@/utils/utils";
import type { Thread } from "@langchain/langgraph-sdk";
import {
    Archive,
    MoreVertical,
    PanelLeft,
    Pencil,
    Share2,
    Trash2
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ThreadHeaderProp = {
    title?: string;
}

export default function ThreadHistory({ header, isSidebar }: { header?: ThreadHeaderProp, isSidebar?: boolean }) {
    const [collapsed, setCollapsed] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { threads, getThreads, setThreadId, setThreads, setThreadsLoading } = useThread();
    const { tool } = useTools();

    useEffect(() => {
        if (typeof window === "undefined") return;
        setThreadsLoading(true);
        getThreads()
            .then(setThreads)
            .catch(console.error)
            .finally(() => setThreadsLoading(false));
    }, []);

    // Filter threads based on search query
    const filteredThreads = threads.filter((t) => {
        if (!searchQuery.trim()) return true;

        const searchLower = searchQuery.toLowerCase();
        const threadName = (t.metadata?.name as string) || "";

        // Check thread name
        if (threadName.toLowerCase().includes(searchLower)) return true;

        // Check first message content
        const threadValues = t.values as any;
        if (threadValues?.messages?.[0]) {
            const firstMessageContent = getContentString(threadValues.messages[0].content);
            if (firstMessageContent.toLowerCase().includes(searchLower)) return true;
        }

        return false;
    });

    return (
        <aside
            className={`flex h-full flex-col ${isSidebar ? "" : "border-r"} border-white/10 bg-zinc transition-all duration-300 ease-in-out ${collapsed ? "w-14" : "w-72"}`}>
            {/* Top */}
            <div className="flex h-14 items-center border-b border-white/10">
                {!collapsed && header && (
                    <div className="flex gap-2 text-white/70 mx-2 text-lg font-medium">
                        {header.title}
                    </div>
                )}
                {!isSidebar && (<div className="flex ml-auto mx-2 cursor-pointer p-2 hover:bg-white/10 rounded-md">
                    <PanelLeft className="h-5 w-5 text-white/70" onClick={() => setCollapsed(v => !v)} />
                </div>)}
            </div>

            {/* Primary actions */}
            <div className="flex flex-col gap-1 px-2 py-3">

                {tool.map((t, index) => {
                    // Override onClick for specific tools
                    let handleClick = t.onClick;
                    if (t.label === 'New chat') {
                        handleClick = () => setThreadId(null);
                    } else if (t.label === 'Search') {
                        handleClick = () => setSearchOpen(true);
                    }

                    // Show search input instead of search button when searchOpen is true
                    if (t.label === 'Search' && !collapsed && searchOpen) {
                        return (
                            <div key={index} className="px-2 py-2">
                                <input
                                    type="text"
                                    placeholder="Search chats..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onBlur={() => {
                                        if (!searchQuery.trim()) {
                                            setSearchOpen(false);
                                        }
                                    }}
                                    autoFocus
                                    className="w-full bg-zinc-800 text-white/80 text-sm px-3 py-2 rounded-md outline-none focus:ring-1 focus:ring-zinc-600 placeholder:text-white/40"
                                />
                            </div>
                        );
                    }

                    return (
                        <NavItem
                            key={index}
                            icon={t.icon}
                            label={t.label}
                            alt={t.alt}
                            collapsed={collapsed}
                            onClick={handleClick}
                        />
                    );
                })}
            </div>

            {/* Chats (scrollable) */}
            <div className="flex-1 flex flex-col px-2 overflow-hidden">
                {!collapsed && (
                    <>
                        <p className="mb-2 px-2 text-xs uppercase text-white/40">
                            Your chats {searchQuery && `(${filteredThreads.length})`}
                        </p>
                        <div className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden thread-scrollbar">
                            <ThreadList threads={filteredThreads} />
                        </div>
                    </>
                )}

            </div>

            {/* User */}
            {/* <div className="border-t border-white/10 p-2">
                <div className="flex items-center justify-center rounded-md p-2 hover:bg-white/10">
                    <User className="h-5 w-5 text-white/70" />
                    {!collapsed && (
                        <span className="ml-2 text-sm text-white/70">Karthik MP</span>
                    )}
                </div>
            </div> */}
        </aside>
    );
}

/* ---------- Components ---------- */

function NavItem({
    icon,
    label,
    alt,
    collapsed,
    onClick
}: {
    label: string;
    icon?: React.ReactNode;
    alt?: string;
    collapsed: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            className="flex items-center gap-3 rounded-md px-2 py-2
        text-white/70 hover:bg-white/10 cursor-pointer"
            onClick={onClick}
            title={alt || label}
        >
            <div className="h-5 w-5">{icon}</div>
            {!collapsed && <span className="text-sm">{label}</span>}
        </button>
    );
}

function ThreadList({
    threads,
    onThreadClick,
}: {
    threads: Thread[];
    onThreadClick?: (threadId: string) => void;
}) {

    const { threadId, setThreadId, deleteThread, updateThread } = useThread();
    const [hoveredThread, setHoveredThread] = useState<string | null>(null);
    const [dropdownThread, setDropdownThread] = useState<string | null>(null);
    const [editingThread, setEditingThread] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownThread(null);
            }
        };

        if (dropdownThread) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownThread]);

    // Focus input when editing starts
    useEffect(() => {
        if (editingThread && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingThread]);

    const handleRenameSubmit = async (thread: Thread) => {
        const threadValues = thread.values as any;
        const originalName = thread.metadata?.name ||
            (threadValues?.messages?.[0] ? getContentString(threadValues.messages[0].content) : thread.thread_id);

        if (editValue.trim() && editValue.trim() !== originalName) {
            try {
                await updateThread(thread.thread_id, {
                    ...thread.metadata,
                    name: editValue.trim()
                });
            } catch (error) {
                console.error('Failed to rename thread:', error);
                alert('Failed to rename thread. Please try again.');
            }
        }
        setEditingThread(null);
        setEditValue("");
    };

    const handleRenameCancel = () => {
        setEditingThread(null);
        setEditValue("");
    };

    const handleMenuAction = async (action: string, thread: Thread) => {
        setDropdownThread(null);

        try {
            switch (action) {
                case 'rename': {
                    const threadValues = thread.values as any;
                    const currentName: string = (thread.metadata?.name as string) ||
                        (threadValues?.messages?.[0] ? getContentString(threadValues.messages[0].content) : thread.thread_id);
                    setEditValue(currentName);
                    setEditingThread(thread.thread_id);
                    break;
                }
                case 'share': {
                    // Create shareable link with current URL + thread ID
                    const shareableLink = `${window.location.origin}${window.location.pathname}?thread=${thread.thread_id}`;
                    await navigator.clipboard.writeText(shareableLink);
                    alert('Thread link copied to clipboard!');
                    break;
                }
                case 'archive': {
                    await updateThread(thread.thread_id, {
                        ...thread.metadata,
                        archived: true
                    });
                    break;
                }
                case 'delete': {
                    if (confirm('Are you sure you want to delete this thread? This action cannot be undone.')) {
                        await deleteThread(thread.thread_id);
                    }
                    break;
                }
            }
        } catch (error) {
            console.error(`Failed to ${action} thread:`, error);
            alert(`Failed to ${action} thread. Please try again.`);
        }
    };

    return (
        <div className="flex h-full w-full flex-col items-start justify-start gap-2">
            {threads.map((t) => {
                let itemText: string = (t.metadata?.name as string) || t.thread_id;
                if (
                    !t.metadata?.name &&
                    typeof t.values === "object" &&
                    t.values &&
                    "messages" in t.values &&
                    Array.isArray((t.values as any).messages) &&
                    (t.values as any).messages?.length > 0
                ) {
                    const firstMessage = (t.values as any).messages[0];
                    itemText = getContentString(firstMessage.content);
                }

                const isEditing = editingThread === t.thread_id;

                return (
                    <div
                        key={t.thread_id}
                        className="relative w-full rounded-xl hover:bg-zinc-800 group"
                        onMouseEnter={() => setHoveredThread(t.thread_id)}
                        onMouseLeave={() => setHoveredThread(null)}
                    >
                        <div className="flex items-center gap-1 px-2 py-1">
                            {isEditing ? (
                                <input
                                    ref={editInputRef}
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleRenameSubmit(t);
                                        } else if (e.key === 'Escape') {
                                            handleRenameCancel();
                                        }
                                    }}
                                    onBlur={() => handleRenameSubmit(t)}
                                    className="flex-1 bg-zinc-700 text-white/80 text-sm px-2 py-1 rounded outline-none focus:ring-1 focus:ring-zinc-500"
                                />
                            ) : (
                                <button
                                    className="flex-1 items-start justify-start text-left font-normal min-w-0"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onThreadClick?.(t.thread_id);
                                        if (t.thread_id === threadId) return;
                                        setThreadId(t.thread_id);
                                    }}
                                >
                                    <p className="truncate text-ellipsis text-sm text-white/80">{itemText}</p>
                                </button>
                            )}

                            {!isEditing && hoveredThread === t.thread_id && (
                                <button
                                    className="flex-shrink-0 p-1 rounded-md hover:bg-zinc-700"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDropdownThread(dropdownThread === t.thread_id ? null : t.thread_id);
                                    }}
                                >
                                    <MoreVertical className="h-4 w-4 text-white/60" />
                                </button>
                            )}
                        </div>

                        {/* Dropdown Menu */}
                        {dropdownThread === t.thread_id && (
                            <div
                                ref={dropdownRef}
                                className="absolute right-2 top-8 z-50 w-48 rounded-md bg-zinc-800 border border-white/10 shadow-lg py-1">
                                <button
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-zinc-700"
                                    onClick={() => handleMenuAction('rename', t)}
                                >
                                    <Pencil className="h-4 w-4" />
                                    Rename
                                </button>
                                <button
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-zinc-700"
                                    onClick={() => handleMenuAction('share', t)}
                                >
                                    <Share2 className="h-4 w-4" />
                                    Share
                                </button>
                                {/* <button
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-zinc-700"
                                    onClick={() => handleMenuAction('archive', t)}
                                >
                                    <Archive className="h-4 w-4" />
                                    Archive
                                </button> */}
                                <div className="my-1 border-t border-white/10" />
                                <button
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-700"
                                    onClick={() => handleMenuAction('delete', t)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}