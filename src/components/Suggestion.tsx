import { useStreamContext } from "@/providers/Stream";
import { useGeneratedSuggestions } from "@/providers/useChatSuggestions";
import { LiquidButton } from "@/components/ui/button";

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

                    return (
                        <LiquidButton
                            key={`suggestion-${index}-${suggestion.slice(0, 20)}`}
                            size="sm"
                            className={`${sizeClass} text-center break-words`}
                            onClick={handleClick}
                        >
                            <span>{suggestion}</span>
                        </LiquidButton>
                    );
                })}
            </div>
        </div>
    );
}
