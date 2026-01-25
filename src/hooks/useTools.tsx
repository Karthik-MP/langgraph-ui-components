import type { CustomTool } from '@/types/CustomTools';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';

export default function useTools() {
    const defaultTools: CustomTool[] = [
        { label: 'New chat', alt: 'Start New Chat', onClick: () => { }, icon: <Plus /> },
        { label: 'Search', alt: 'Search the threads', onClick: () => { }, icon: <Search /> },
    ]
    const [tool, setTools] = useState<CustomTool[]>(defaultTools);

    const addTool = (newTool: CustomTool) => {
        setTools((prevTools) => [...prevTools, newTool]);
    }
    return { tool, addTool };
}
