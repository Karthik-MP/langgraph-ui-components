import { createContext, useCallback, useContext, useEffect, useState, useMemo, useRef } from "react";
import { useStreamContext } from "./Stream";

export type SuggestionsOptions = {
    instructions?: string;
    minSuggestions?: number;
    maxSuggestions?: number;
    suggestions?: string[];
};

type InternalSuggestionsOptions = SuggestionsOptions & {
    suggestions?: string[]; 
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

export function SuggestionProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<SuggestionConfig | null>(null);

    const contextValue = useMemo(() => ({ config, setConfig }), [config]);

    return (
        <SuggestionContext.Provider value={contextValue}>
            {children}
        </SuggestionContext.Provider>
    );
}

export function useSuggestionConfig() {
    const context = useContext(SuggestionContext);
    if (!context) {
        throw new Error("useSuggestionConfig must be used within a SuggestionProvider");
    }
    return context;
}


export function useChatSuggestions(
    opts: SuggestionsOptions = {},
    deps: any[] = []
): void {
    const { setConfig } = useSuggestionConfig();

    const optsKey = useMemo(() => JSON.stringify(opts), [opts.instructions, opts.minSuggestions, opts.maxSuggestions]);
    const depsKey = useMemo(() => JSON.stringify(deps), [deps.length, ...deps]);

    useEffect(() => {
        setConfig({
            options: opts,
            deps,
            isEnabled: true,
        });

        return () => {
            setConfig(null);
        };
    }, [optsKey, depsKey]);
}

export function useGeneratedSuggestions(
    opts: InternalSuggestionsOptions = {}
) {
    const { suggestions: externalSuggestions } = opts;
    const { sendMessage } = useStreamContext();
    const { config } = useSuggestionConfig();

    const [suggestions, setSuggestions] = useState<string[]>([]);
    // const [loading, setLoading] = useState(false);

    // Merge user config with component defaults
    const instructions = config?.options?.instructions ?? opts.instructions ?? "Suggest relevant next actions.";
    const minSuggestions = config?.options?.minSuggestions ?? opts.minSuggestions ?? 2;
    const maxSuggestions = config?.options?.maxSuggestions ?? opts.maxSuggestions ?? 4;
    const userSuggestions = config?.options?.suggestions ?? opts.suggestions;
    const deps = config?.deps ?? [];
    const isEnabled = config?.isEnabled ?? false;

    const depCounterRef = useRef(0);
    const depMapRef = useRef(new WeakMap<object, number>());

    const depsKey = useMemo(() => {
        return deps.map(d => {
            if (d === null) return 'null';
            if (d === undefined) return 'undefined';
            const type = typeof d;
            if (type === 'object' || type === 'function') {
                if (!depMapRef.current.has(d as object)) {
                    depMapRef.current.set(d as object, depCounterRef.current++);
                }
                return `ref:${depMapRef.current.get(d as object)}`;
            }
            // For primitives, use direct value
            return `${type}:${String(d)}`;
        }).join('|');
    }, [deps]);

    useEffect(() => {
        if (!isEnabled) {
            setSuggestions([]);
            // setLoading(false);
            return;
        }

        let mounted = true;
        // setLoading(true);
        setSuggestions([]);

        if (externalSuggestions && externalSuggestions.length > 0) {
            setSuggestions(externalSuggestions);
            // setLoading(false);
            return;
        }

        if (userSuggestions && userSuggestions.length > 0) {
            setSuggestions(userSuggestions);
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

        const contextual: string[] = [];
        if (deps.length > 0) {
            const last = deps[deps.length - 1];
            if (typeof last === "string" && last.trim().length > 0) {
                contextual.push(`Follow up on: "${last.slice(0, 120)}"`);
                contextual.push(`Ask a clarifying question about: "${last.slice(0, 80)}"`);
            }
        }

        const count = Math.max(minSuggestions, Math.min(maxSuggestions, Math.floor(Math.random() * (maxSuggestions - minSuggestions + 1)) + minSuggestions));

        const selected = [...contextual, ...base]
            .filter(Boolean)
            .slice(0, count);

        const t = setTimeout(() => {
            if (!mounted) return;
            const final = instructions ? selected.map(s => `${s}`) : selected;
            setSuggestions(final);
            // setLoading(false);
        }, 150);

        return () => {
            mounted = false;
            clearTimeout(t);
        };
    }, [depsKey, instructions, minSuggestions, maxSuggestions, externalSuggestions, userSuggestions, isEnabled]);

    const onSelect = useCallback((suggestion: string) => {
        sendMessage(suggestion, { type: "human" });
    }, [sendMessage]);

    return { suggestions, onSelect } as const;
}

export default useChatSuggestions;