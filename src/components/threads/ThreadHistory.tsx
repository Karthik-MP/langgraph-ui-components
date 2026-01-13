import { useThread } from "@/providers/Thread";
import {
    PanelLeft,
    Plus,
    Search,
    User
} from "lucide-react";
import { useEffect, useState } from "react";

type ThreadHeaderProp = {
    header?: string
}

export default function ThreadHistory({ header = "AI Assistant" }: ThreadHeaderProp) {
    const [collapsed, setCollapsed] = useState(false);
    const { getThreads, setThreads, setThreadsLoading } = useThread();

    useEffect(() => {
        if (typeof window === "undefined") return;
        setThreadsLoading(true);
        getThreads()
            .then(setThreads)
            .catch(console.error)
            .finally(() => setThreadsLoading(false));
    }, []);

    return (
        <aside
            className={`flex h-full flex-col border-r border-white/10 bg-[#0b0b0b]
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-14" : "w-64"}`}
        >
            {/* Top */}
            <div className="flex h-14 items-center mx-2 border-b border-white/10">
                {/* <div className="flex mx-auto gap-2">
                    {header}
                </div> */}
                <div className="flex ml-auto cursor-pointer p-2 hover:bg-white/10 rounded-md">
                    <PanelLeft className="h-5 w-5 text-white/70" onClick={() => setCollapsed(v => !v)} />
                </div>
            </div>

            {/* Primary actions */}
            <div className="flex flex-col gap-1 px-2 py-3">
                <NavItem icon={<Plus />} label="New chat" collapsed={collapsed} />
                <NavItem icon={<Search />} label="Search chats" collapsed={collapsed} />
                {/* <NavItem icon={<Sparkles />} label="GPTs" collapsed={collapsed} /> */}
                {/* <NavItem icon={<Image />} label="Images" collapsed={collapsed} /> */}
                {/* <NavItem icon={<Grid />} label="Apps" collapsed={collapsed} /> */}
            </div>

            {/* Chats (scrollable) */}
            <div className="flex-1 overflow-y-auto px-2">
                {!collapsed && (
                    <>
                        <p className="mb-2 px-2 text-xs uppercase text-white/40">
                            Your chats
                        </p>
                        <div className="space-y-1">
                            <NavItem label="Cover Letter LaTeX Template" collapsed={collapsed} />
                            <NavItem label="MySQL Query Solution" collapsed={collapsed} />
                            <NavItem label="SQL Reporting Solution" collapsed={collapsed} />
                            <NavItem label="Job Application Email Draft" collapsed={collapsed} />
                        </div>
                    </>
                )}

            </div>

            {/* User */}
            <div className="border-t border-white/10 p-2">
                <div className="flex items-center justify-center rounded-md p-2 hover:bg-white/10">
                    <User className="h-5 w-5 text-white/70" />
                    {!collapsed && (
                        <span className="ml-2 text-sm text-white/70">Karthik MP</span>
                    )}
                </div>
            </div>
        </aside>
    );
}

/* ---------- Components ---------- */

function NavItem({
    icon,
    label,
    collapsed,
}: {
    label: string;
    icon?: React.ReactNode;
    collapsed: boolean;
}) {
    return (
        <div
            className="flex items-center gap-3 rounded-md px-2 py-2
        text-white/70 hover:bg-white/10 cursor-pointer"
        >
            <div className="h-5 w-5">{icon}</div>
            {!collapsed && <span className="text-sm">{label}</span>}
        </div>
    );
}

// function ChatItem({
//     title,
//     collapsed,
// }: {
//     title: string;
//     collapsed: boolean;
// }) {
//     return (
//         <div
//             className="flex items-center gap-3 rounded-md px-2 py-2
//         text-white/60 hover:bg-white/10 cursor-pointer"
//         >
//             <MessageSquare className="h-4 w-4 shrink-0" />
//             {!collapsed && (
//                 <span className="truncate text-sm">{title}</span>
//             )}
//         </div>
//     );
// }