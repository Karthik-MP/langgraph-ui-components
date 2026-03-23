import type { TodoItem } from "@/providers/Stream";
import { CheckCircle2, Circle, Loader2, Sparkles } from "lucide-react";

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    iconClass: "text-emerald-400",
    textClass: "text-zinc-400 line-through",
  },
  in_progress: {
    icon: Loader2,
    iconClass: "text-blue-400 animate-spin",
    textClass: "text-zinc-100",
  },
  pending: {
    icon: Circle,
    iconClass: "text-zinc-500",
    textClass: "text-zinc-400",
  },
} as const;

export default function TodoList({ todos }: { todos: TodoItem[] }) {
  if (!todos.length) return null;

  const completed = todos.filter((t) => t.status === "completed").length;
  const inProgress = todos.find((t) => t.status === "in_progress");
  const percentage = Math.round((completed / todos.length) * 100);

  return (
    <div className="mb-3 w-full max-w-full rounded-2xl border border-zinc-700/60 bg-zinc-950/35 px-4 py-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-zinc-200">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300/90" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-300">Agent Plan</span>
          </div>
          <p className="mt-1 truncate text-xs text-zinc-400">
            {inProgress ? `Now: ${inProgress.content}` : "Wrapping up remaining steps"}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-700/80 bg-zinc-900/70 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
          {completed}/{todos.length} done
        </div>
      </div>

      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-zinc-800/80">
        <div
          className="h-full rounded-full bg-linear-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <ul className="space-y-1.5">
        {todos.map((todo, i) => {
          const config = statusConfig[todo.status];
          const Icon = config.icon;
          return (
            <li
              key={i}
              className="group flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/45 px-2.5 py-2 transition-colors duration-200 hover:border-zinc-700/80"
            >
              <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${config.iconClass}`} />
              <span className={`line-clamp-1 text-xs ${config.textClass}`}>
                {todo.content}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
