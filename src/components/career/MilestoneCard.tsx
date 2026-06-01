/**
 * MilestoneCard Component
 * Displays individual milestone details with completion capability
 */

import { Milestone } from "@/types/careerPlan";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/common/Button";
import { CheckCircle2, FileText, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import { useCompleteMilestone } from "@/hooks/useCareerPlans";
import { toast } from "sonner";

interface MilestoneCardProps {
  planId: string;
  milestone: Milestone;
  onComplete?: () => void;
}

export default function MilestoneCard({
  planId,
  milestone,
  onComplete,
}: MilestoneCardProps) {
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);

  const completeMutation = useCompleteMilestone(planId);

  const handleAddEvidence = async () => {
    if (!evidenceUrl.trim()) {
      toast.error("Please enter an evidence URL");
      return;
    }

    try {
      await completeMutation.mutateAsync({
        milestoneId: milestone._id || "",
        evidence: [evidenceUrl],
        notes,
      });

      toast.success("Milestone completed!");
      setEvidenceUrl("");
      setNotes("");
      setIsAddingEvidence(false);
      onComplete?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to complete milestone"
      );
    }
  };

  const priorityColors: Record<string, string> = {
    HIGH: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
    MEDIUM: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20",
    LOW: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
  };

  const typeEmojis: Record<string, string> = {
    skill: "🎯",
    project: "🚀",
    certification: "📜",
    other: "⭐",
  };

  return (
    <Card className="rounded-2xl border-border/50 sticky top-6">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <span>{typeEmojis[milestone.type] || "⭐"}</span>
              {milestone.title}
            </CardTitle>
            <CardDescription className="mt-2">{milestone.notes}</CardDescription>
          </div>
          {milestone.completed && (
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metadata */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated Effort:</span>
            <span className="font-medium">{milestone.estimateHours} hours</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Priority:</span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium border ${
                priorityColors[milestone.priority] || priorityColors.MEDIUM
              }`}
            >
              {milestone.priority}
            </span>
          </div>
          {milestone.dueDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date:</span>
              <span className="font-medium">
                {new Date(milestone.dueDate).toLocaleDateString()}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium capitalize">{milestone.type}</span>
          </div>
        </div>

        {/* Evidence */}
        {milestone.evidence && milestone.evidence.length > 0 && (
          <div className="pt-2 border-t border-border/30">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Evidence
            </h4>
            <div className="space-y-1">
              {milestone.evidence.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 truncate"
                >
                  <LinkIcon className="h-3 w-3 flex-shrink-0" />
                  {url}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Completion Actions */}
        {!milestone.completed ? (
          <div className="pt-2 border-t border-border/30 space-y-3">
            {!isAddingEvidence ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsAddingEvidence(true)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Complete
              </Button>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Evidence URL (optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/project"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    className="w-full text-sm rounded border border-input bg-background px-2 py-2 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Completion Notes (optional)
                  </label>
                  <textarea
                    placeholder="What you learned, completed, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-sm rounded border border-input bg-background px-2 py-2 focus:outline-none focus:border-primary resize-none h-16"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={completeMutation.isPending}
                    onClick={handleAddEvidence}
                    className="flex-1"
                  >
                    {completeMutation.isPending ? "Saving..." : "Confirm"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={completeMutation.isPending}
                    onClick={() => {
                      setIsAddingEvidence(false);
                      setEvidenceUrl("");
                      setNotes("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="pt-2 border-t border-border/30">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-300">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                Completed on {new Date(milestone.completedAt || "").toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
