import { useStreamContext } from "@/providers/Stream";
import { useGeneratedSuggestions } from "@/providers/useChatSuggestions";

export default function Suggestion() {
    const stream = useStreamContext();
    const agentSuggestions = stream.values?.suggestions;

    const { suggestions, onSelect } = useGeneratedSuggestions({
        instructions: "Your are an AI assistant that suggests relevant next actions for users to take in a chat interface.",
        minSuggestions: 2,
        maxSuggestions: 4,
        suggestions: agentSuggestions, // Use agent-provided suggestions if available
    });

    const shortThreshold = 24;
    const mediumThreshold = 48;
    return (
        <div className="p-2">
            <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => {
                    const len = suggestion.length;
                    const sizeClass =
                        len <= shortThreshold
                            ? "max-w-[48%]"
                            : len <= mediumThreshold
                                ? "max-w-[72%]"
                                : "w-full";

                    const handleClick = () => onSelect?.(suggestion);

                    // const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
                    //     if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                    //         e.preventDefault();
                    //         onSelect?.(suggestion);
                    //     }
                    // };

                    return (
                        <div
                            role="button"
                            tabIndex={0}
                            aria-pressed={false}
                            key={`suggestion-${index}-${suggestion.slice(0, 20)}`}
                            onClick={handleClick}
                            // onKeyDown={handleKeyDown}
                            className={`border rounded-xl px-3 py-2 border-zinc-500 text-center break-words ${sizeClass} cursor-pointer hover:bg-zinc-700/5 hover:scale-[1.01] transition transform focus:outline-none focus:ring-2 focus:ring-zinc-500`}
                        >
                            {suggestion}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
