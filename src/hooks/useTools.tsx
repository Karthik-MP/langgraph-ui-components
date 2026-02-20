import type { CustomTool } from '@/types/CustomTools';
import { Plus, Search } from 'lucide-react';
import { useCallback, useState } from 'react';

// Static defaults live outside the hook so the array is created once,
// not re-allocated on every render before useState stabilises.
const DEFAULT_TOOLS: CustomTool[] = [
  { label: 'Search', alt: 'Search the threads', onClick: () => {}, icon: <Search /> },
  { label: 'Chat',   alt: 'Start New Chat',     onClick: () => {}, icon: <Plus /> },
];

/**
 * Manages the sidebar tool buttons.
 * Returns the built-in tools alongside any user-registered custom tools.
 *
 * @example
 * ```tsx
 * const { tool, addTool, userDefinedTools } = useTools();
 * addTool({ label: 'Export', icon: <Download />, onClick: handleExport });
 * ```
 */
export function useTools() {
  const [userDefinedTools, setUserDefinedTools] = useState<CustomTool[]>([]);

  // useCallback so consumers that depend on addTool don't re-render unnecessarily.
  const addTool = useCallback((newTool: CustomTool) => {
    setUserDefinedTools((prevTools) => [...prevTools, newTool]);
  }, []);

  return { tool: DEFAULT_TOOLS, addTool, userDefinedTools, setUserDefinedTools };
}

export default useTools;  // keep default export for backwards compatibility