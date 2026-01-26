import type { CustomTool } from '@/types/CustomTools';
import { Plus, Search } from 'lucide-react';
import { createContext, useContext, useState, type ReactNode } from 'react';

interface ToolsContextType {
    tools: CustomTool[];
    addTool: (newTool: CustomTool) => void;
    removeTool: (label: string) => void;
}

const ToolsContext = createContext<ToolsContextType | undefined>(undefined);

export function ToolsProvider({ children }: { children: ReactNode }) {
    const defaultTools: CustomTool[] = [
        { label: 'New chat', alt: 'Start New Chat', onClick: () => { }, icon: <Plus /> },
        { label: 'Search', alt: 'Search the threads', onClick: () => { }, icon: <Search /> },
    ];
    
    const [tools, setTools] = useState<CustomTool[]>(defaultTools);

    const addTool = (newTool: CustomTool) => {
        setTools((prevTools) => {
            // Prevent duplicates based on label
            const exists = prevTools.some(tool => tool.label === newTool.label);
            if (exists) {
                console.warn(`Tool with label "${newTool.label}" already exists`);
                return prevTools;
            }
            return [...prevTools, newTool];
        });
    };

    const removeTool = (label: string) => {
        setTools((prevTools) => prevTools.filter(tool => tool.label !== label));
    };

    return (
        <ToolsContext.Provider value={{ tools, addTool, removeTool }}>
            {children}
        </ToolsContext.Provider>
    );
}

export function useTools() {
    const context = useContext(ToolsContext);
    if (context === undefined) {
        throw new Error('useTools must be used within a ToolsProvider');
    }
    return context;
}
