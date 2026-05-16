/**
 * PlanTimeline Component
 * Displays milestones in a map-style roadmap format
 */

import { CareerRoadmap, Milestone, RoadmapNode } from "@/types/careerPlan";
import { Clock, CheckCircle2, AlertCircle, MapPinned, Flag, Sparkles } from "lucide-react";
import { useState } from "react";
import MilestoneCard from "./MilestoneCard";

interface PlanTimelineProps {
  planId: string;
  milestones: Milestone[];
  roadmap?: CareerRoadmap | null;
  onMilestoneComplete?: (milestoneId: string) => void;
}

export default function PlanTimeline({
  planId,
  milestones,
  roadmap,
  onMilestoneComplete,
}: PlanTimelineProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const safeMilestones = Array.isArray(milestones) ? milestones : [];

  if (safeMilestones.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">
          No milestones yet. AI is still generating your roadmap.
        </p>
      </div>
    );
  }

  const roadmapNodes = [...(roadmap?.nodes || [])].sort((a, b) => a.order - b.order);
  const selectedNode =
    roadmapNodes.find((node) => node.nodeId === selectedNodeId) || roadmapNodes[1] || roadmapNodes[0];
  const selectedMilestone = selectedNode?.milestoneId
    ? safeMilestones.find((milestone) => milestone._id === selectedNode.milestoneId)
    : safeMilestones.find((milestone) => milestone.title === selectedNode?.label);

  const getNodeIcon = (node: RoadmapNode, milestone?: Milestone) => {
    if (node.type === "start") return <MapPinned className="h-4 w-4" />;
    if (node.type === "destination") return <Flag className="h-4 w-4" />;
    if (milestone?.completed) return <CheckCircle2 className="h-4 w-4" />;
    return <Sparkles className="h-4 w-4" />;
  };

  const getNodeStyles = (node: RoadmapNode, milestone?: Milestone) => {
    if (node.type === "start") {
      return "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-200";
    }
    if (node.type === "destination") {
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200";
    }
    if (milestone?.completed) {
      return "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-200";
    }
    return "border-primary/30 bg-primary/5 text-foreground";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Roadmap Map */}
      <div className="lg:col-span-2">
        <div className="rounded-3xl border border-border/50 bg-card/30 p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">
                {roadmap?.title || "Career Roadmap"}
              </p>
              <p className="text-sm text-muted-foreground">
                Start at the first node and follow the connected dots to your destination.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Step-by-step map
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max items-center gap-0 px-2 py-4">
              {roadmapNodes.map((node, index) => {
                const milestone = node.milestoneId
                  ? safeMilestones.find((item) => item._id === node.milestoneId)
                  : safeMilestones.find((item) => item.title === node.label);
                const isSelected = selectedNode?.nodeId === node.nodeId;

                return (
                  <div key={node.nodeId} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId(node.nodeId)}
                      className={`group relative w-56 rounded-3xl border p-4 text-left transition-all hover:-translate-y-1 hover:shadow-lg ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-lg"
                          : getNodeStyles(node, milestone)
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-current/20 bg-background/80">
                          {getNodeIcon(node, milestone)}
                        </div>
                        <span className="rounded-full bg-background/70 px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                          {node.type}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold leading-snug">
                        {node.label}
                      </h4>
                      <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
                        {node.description || "Follow this stop on your career map."}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                        {typeof node.estimateHours === "number" && node.estimateHours > 0 && (
                          <span className="rounded-full bg-background/70 px-2 py-1">
                            ~{node.estimateHours}h
                          </span>
                        )}
                        {milestone?.completed && (
                          <span className="rounded-full bg-green-500/15 px-2 py-1 text-green-700 dark:text-green-300">
                            Completed
                          </span>
                        )}
                      </div>
                    </button>

                    {index < roadmapNodes.length - 1 && (
                      <div className="mx-2 flex items-center gap-1 px-1">
                        <div className="h-[2px] w-10 bg-primary/30" />
                        <div className="h-2 w-2 rounded-full bg-primary/40" />
                        <div className="h-[2px] w-10 bg-primary/30" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Details Panel */}
      <div className="lg:col-span-1">
        {selectedMilestone ? (
          <MilestoneCard
            planId={planId}
            milestone={selectedMilestone}
            onComplete={() => {
              onMilestoneComplete?.(selectedMilestone._id || "");
              setSelectedNodeId(null);
            }}
          />
        ) : (
          <div className="rounded-2xl border border-border/50 p-6 text-center text-muted-foreground">
            <p>Select a roadmap stop to view its details</p>
          </div>
        )}
      </div>
    </div>
  );
}
