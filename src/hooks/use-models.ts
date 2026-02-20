import { useChatRuntime } from "@/providers/ChatRuntime";
import { useState, useEffect, useCallback } from "react";
export interface ModelOption {
    id: string;
    name: string;
}

const STORAGE_KEY = "agent-chat:selected-model";

export function useModels() {
    const { apiUrl, identity } = useChatRuntime();
    const [models, setModels] = useState<ModelOption[]>([]);
    const [selectedModel, setSelectedModelState] = useState<string>(() => {
        if (typeof window === "undefined") return "";
        return localStorage.getItem(STORAGE_KEY) ?? "";
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
                localStorage.setItem(STORAGE_KEY, list[0].id);
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
        localStorage.setItem(STORAGE_KEY, id);
    };

    return { models, selectedModel, setSelectedModel, loading };
}