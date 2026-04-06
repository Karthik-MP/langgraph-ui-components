import { cn } from "@/utils/tailwindUtil";
import { useState } from "react";
import type {
  AskUserInterruptProps,
  QuestionAnswer,
} from "@/types/AskUserInterrupt";

export default function AskUserInterrupt({ questions, onSubmit }: AskUserInterruptProps) {
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>(() =>
    Object.fromEntries(
      questions.map((q) => [
        q.header,
        { selected: [], freeText: null, skipped: false },
      ])
    )
  );

  const toggleOption = (header: string, label: string, multiSelect: boolean) => {
    setAnswers((prev) => {
      const current = prev[header];
      let selected: string[];
      if (multiSelect) {
        selected = current.selected.includes(label)
          ? current.selected.filter((s) => s !== label)
          : [...current.selected, label];
      } else {
        selected = current.selected[0] === label ? [] : [label];
      }
      return { ...prev, [header]: { ...current, selected, skipped: false } };
    });
  };

  const setFreeText = (header: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [header]: { ...prev[header], freeText: text || null, skipped: false },
    }));
  };

  const isAnswered = (header: string): boolean => {
    const a = answers[header];
    return a.selected.length > 0 || (a.freeText !== null && a.freeText.trim().length > 0);
  };

  const allAnswered = questions.every((q) => isAnswered(q.header));

  const handleSubmit = () => {
    if (!allAnswered) return;
    onSubmit({ answers });
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-sm text-zinc-100">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm.75 4.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.25 7h1.5v4.5h-1.5V7Z" />
        </svg>
        Input needed
      </div>

      {/* Questions */}
      {questions.map((q) => {
        const answer = answers[q.header];
        const hasOptions = q.options && q.options.length > 0;
        const showFreeText = !hasOptions || q.allowFreeformInput;

        return (
          <div key={q.header} className="flex flex-col gap-2 border-t border-zinc-800 pt-3 first:border-t-0 first:pt-0">
            {/* Question header + text */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                {q.header}
              </span>
              <p className="leading-snug text-zinc-200">{q.question}</p>
            </div>

            {/* Options */}
            {hasOptions && (
              <div className="flex flex-wrap gap-1.5">
                {q.options!.map((opt) => {
                  const isSelected = answer.selected.includes(opt.label);
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => toggleOption(q.header, opt.label, q.multiSelect ?? false)}
                      className={cn(
                        "flex flex-col items-start rounded-lg border px-3 py-1.5 text-left text-xs transition-colors",
                        isSelected
                          ? "border-blue-500 bg-blue-500/15 text-blue-300"
                          : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-700"
                      )}
                    >
                      <span className="font-medium">{opt.label}</span>
                      {opt.description && (
                        <span className={cn("mt-0.5 text-[10px]", isSelected ? "text-blue-400" : "text-zinc-500")}>
                          {opt.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Free-text input */}
            {showFreeText && (
              <input
                type="text"
                value={answer.freeText ?? ""}
                onChange={(e) => setFreeText(q.header, e.target.value)}
                placeholder={hasOptions ? "Or type a custom answer…" : "Type your answer…"}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
              />
            )}
          </div>
        );
      })}

      {/* Submit */}
      <button
        type="button"
        disabled={!allAnswered}
        onClick={handleSubmit}
        className={cn(
          "mt-1 self-end rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors",
          allAnswered
            ? "bg-blue-600 text-white hover:bg-blue-500"
            : "cursor-not-allowed bg-zinc-700 text-zinc-500"
        )}
      >
        Submit
      </button>
    </div>
  );
}
