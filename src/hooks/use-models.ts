import { useChatRuntime } from "@/providers/ChatRuntime";
import { useState, useEffect, useCallback } from "react";

export interface ModelOption {
    id: string;
    name: string;
}

const STORAGE_KEY = "agent-chat:selected-model";

// Safe localStorage wrapper — no-ops in SSR environments (Next.js App Router, Remix, etc.)
const safeStorage = {
  get: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  },
  set: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, value);
  },
};

export function useModels() {
    const { apiUrl, identity } = useChatRuntime();
    const [models, setModels] = useState<ModelOption[]>([]);
    const [selectedModel, setSelectedModelState] = useState<string>(() => {
        return safeStorage.get(STORAGE_KEY) ?? "";
    });
    const [loading, setLoading] = useState(false);

    const fetchModels = useCallback(async () => {
        if (!identity?.authToken) return;
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/agents/models`, {
                headers: { Authorization: `Bearer ${identity.authToken}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            const list: ModelOption[] = (Array.isArray(data.data) ? data.data : [])
                .filter((m: { id: string }) => !/embed|rerank/i.test(m.id))
                .map((m: { id: string; name?: string }) => ({
                    id: m.id,
                    name: m.name ?? m.id,
                }));
            setModels(list);
            if (list.length > 0 && !list.find((m) => m.id === selectedModel)) {
                setSelectedModelState(list[0].id);
                safeStorage.set(STORAGE_KEY, list[0].id);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [apiUrl, identity?.authToken, selectedModel]);

    useEffect(() => {
        fetchModels();
    }, [fetchModels]);

    const setSelectedModel = (id: string) => {
        setSelectedModelState(id);
        safeStorage.set(STORAGE_KEY, id);
    };

    return { models, selectedModel, setSelectedModel, loading };
}