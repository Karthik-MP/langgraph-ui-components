import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface BranchSwitcherProps {
  branch: string;
  branchOptions: string[];
  onSelect: (branch: string) => void;
  isLoading: boolean;
}

export function BranchSwitcher({
  branch,
  branchOptions,
  onSelect,
  isLoading,
}: BranchSwitcherProps) {
  if (branchOptions.length <= 1) return null;

  const currentIndex = branchOptions.indexOf(branch);
  if (currentIndex === -1) return null;

  const totalBranches = branchOptions.length;

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500">
      <Button
        variant="ghost"
        size="icon"
        className="size-6 p-1 h-6 w-6 hover:bg-zinc-800 hover:text-zinc-300"
        onClick={() => onSelect(branchOptions[currentIndex - 1])}
        disabled={isLoading || currentIndex === 0}
        title="Previous response"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-xs text-zinc-400 font-medium min-w-[3rem] text-center">
        {currentIndex + 1} / {totalBranches}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 p-1 h-6 w-6 hover:bg-zinc-800 hover:text-zinc-300"
        onClick={() => onSelect(branchOptions[currentIndex + 1])}
        disabled={isLoading || currentIndex === totalBranches - 1}
        title="Next response"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
