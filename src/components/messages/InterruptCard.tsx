import { cn } from "@/utils/tailwindUtil";
import { AlertTriangle, Check, X } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../ui/button";

interface ActionRequest {
  name: string;
  args: Record<string, unknown>;
  description?: string;
}

interface ReviewConfig {
  actionName: string;
  allowedDecisions: ("approve" | "reject" | "edit")[];
  argsSchema?: Record<string, unknown>;
}

interface HITLRequest {
  actionRequests: ActionRequest[];
  reviewConfigs: ReviewConfig[];
}

interface ApproveDecision {
  type: "approve";
}

interface RejectDecision {
  type: "reject";
  message?: string;
}

type Decision = ApproveDecision | RejectDecision;

interface HITLResponse {
  decisions: Decision[];
}

export function InterruptCard({
  interrupt,
  onRespond,
}: {
  interrupt: HITLRequest;
  onRespond: (response: HITLResponse) => void;
}) {
  const [isResponding, setIsResponding] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const actionRequests = interrupt.actionRequests ?? [];
  const reviewConfigs = interrupt.reviewConfigs ?? [];

  const allowedDecisions = reviewConfigs.length > 0
    ? reviewConfigs[0].allowedDecisions
    : ["approve", "reject"];

  const description = actionRequests.length > 0 && actionRequests[0].description
    ? actionRequests[0].description
    : "An action requires your approval before proceeding.";

  const handleApprove = () => {
    setIsResponding(true);
    onRespond({
      decisions: actionRequests.map(() => ({ type: "approve" as const })),
    });
  };

  const handleReject = () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    setIsResponding(true);
    onRespond({
      decisions: actionRequests.map(() => ({
        type: "reject" as const,
        message: rejectReason || undefined,
      })),
    });
  };

  if (isResponding) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center gap-3 w-full">
        <div className="rounded-full size-8 shrink-0 bg-amber-900/30 flex items-center justify-center p-2">
          <AlertTriangle className="text-xs text-amber-400" size={16} />
        </div>
        <span className="text-zinc-400 text-sm">Approval Required</span>
      </div>

      <div className="flex flex-1 flex-col gap-3 items-start min-w-0 mt-1">
        <div className="w-full rounded-lg border border-amber-500/20 bg-amber-950/20 p-4">
          <p className="text-sm text-zinc-200">{description}</p>

          {showRejectInput && (
            <div className="mt-3">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (optional)"
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none"
                rows={2}
              />
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            {allowedDecisions.includes("approve") && (
              <Button
                variant="default"
                size="sm"
                onClick={handleApprove}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Check className="size-3.5" />
                Approve
              </Button>
            )}
            {allowedDecisions.includes("reject") && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReject}
                className={cn(
                  "border-zinc-700 text-zinc-300 hover:bg-zinc-800",
                  showRejectInput && "bg-red-900/30 border-red-500/30 text-red-300 hover:bg-red-900/40"
                )}
              >
                <X className="size-3.5" />
                {showRejectInput ? "Confirm Reject" : "Reject"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
