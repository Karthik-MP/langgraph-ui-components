import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useStreamContext } from "./Stream";

export type SuggestionsOptions = {
    instructions?: string;
    minSuggestions?: number;
    maxSuggestions?: number;
};

// Internal type that includes agent suggestions (not exposed to users)
type InternalSuggestionsOptions = SuggestionsOptions & {
    suggestions?: string[]; // External suggestions (e.g., from agent)
};

type SuggestionConfig = {
    options: SuggestionsOptions;
    deps: any[];
    isEnabled: boolean;
};

type SuggestionContextValue = {
    config: SuggestionConfig | null;
    setConfig: (config: SuggestionConfig | null) => void;
};

const SuggestionContext = createContext<SuggestionContextValue | undefined>(undefined);

// Provider component
export function SuggestionProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<SuggestionConfig | null>(null);

    return (
        <SuggestionContext.Provider value={{ config, setConfig }}>
            {children}
        </SuggestionContext.Provider>
    );
}

// Hook for internal use to get the suggestion config
export function useSuggestionConfig() {
    const context = useContext(SuggestionContext);
    if (!context) {
        return { config: null, setConfig: () => {} };
    }
    return context;
}

// Public hook - only registers configuration, doesn't return anything
export function useChatSuggestions(
    opts: SuggestionsOptions = {},
    deps: any[] = []
): void {
    const context = useSuggestionConfig();

    useEffect(() => {
        // Register the configuration
        context.setConfig({
            options: opts,
            deps,
            isEnabled: true,
        });

        // Cleanup on unmount
        return () => {
            context.setConfig(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(opts), JSON.stringify(deps)]);
}

// Internal hook for generating suggestions (used by Suggestion component)
export function useGeneratedSuggestions(
    opts: InternalSuggestionsOptions = {}
) {
    const { suggestions: externalSuggestions } = opts;
    const { sendMessage } = useStreamContext();
    const { config } = useSuggestionConfig();

    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Merge user config with component defaults
    const instructions = config?.options?.instructions ?? opts.instructions ?? "Suggest relevant next actions.";
    const minSuggestions = config?.options?.minSuggestions ?? opts.minSuggestions ?? 2;
    const maxSuggestions = config?.options?.maxSuggestions ?? opts.maxSuggestions ?? 4;
    const deps = config?.deps ?? [];
    const isEnabled = config?.isEnabled ?? false;

    // Create a stable key for deps
    const depsKey = JSON.stringify(deps);

    useEffect(() => {
        // Only generate suggestions if the hook was called by the user
        if (!isEnabled) {
            setSuggestions([]);
            setLoading(false);
            return;
        }

        let mounted = true;
        setLoading(true);
        setSuggestions([]);

        // If external suggestions provided, use them directly
        if (externalSuggestions && externalSuggestions.length > 0) {
            setSuggestions(externalSuggestions);
            setLoading(false);
            return;
        }

        const base = [
            "Ask for clarification about the user's goals.",
            "Summarize the previous message in one sentence.",
            "Suggest next steps for implementing the feature.",
            "Ask whether they want code examples.",
            "Propose a refactor to improve readability.",
            "Offer to run tests and show results."
        ];

        // If last dependency is a string, create context-aware suggestions
        const contextual: string[] = [];
        if (deps.length > 0) {
            const last = deps[deps.length - 1];
            if (typeof last === "string" && last.trim().length > 0) {
                contextual.push(`Follow up on: "${last.slice(0, 120)}"`);
                contextual.push(`Ask a clarifying question about: "${last.slice(0, 80)}"`);
            }
        }

        // Choose a slice of suggestions between min/max
        const count = Math.max(minSuggestions, Math.min(maxSuggestions, Math.floor(Math.random() * (maxSuggestions - minSuggestions + 1)) + minSuggestions));

        const selected = [...contextual, ...base]
            .filter(Boolean)
            .slice(0, count);

        // Simulate async latency
        const t = setTimeout(() => {
            if (!mounted) return;
            const final = instructions ? selected.map(s => `${s}`) : selected;
            setSuggestions(final);
            setLoading(false);
        }, 150);

        return () => {
            mounted = false;
            clearTimeout(t);
        };
    }, [depsKey, instructions, minSuggestions, maxSuggestions, externalSuggestions, isEnabled]);

    const onSelect = useCallback((suggestion: string) => {
        // Send the selected suggestion as a user message
        sendMessage(suggestion, { isAIMessage: false });
    }, [sendMessage]);

    return { suggestions, loading, onSelect } as const;
}

export default useChatSuggestions;