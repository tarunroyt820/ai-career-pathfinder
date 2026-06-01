/**
 * RecommendationPanel Component
 * Displays AI-generated recommendations (skill gaps, resources, insights)
 */

import { CareerPlan } from "@/types/careerPlan";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/common/Button";
import {
  Sparkles,
  BookOpen,
  Target,
  TrendingUp,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { useRefreshPlan } from "@/hooks/useCareerPlans";
import { toast } from "sonner";

interface RecommendationPanelProps {
  plan: CareerPlan;
}

export default function RecommendationPanel({ plan }: RecommendationPanelProps) {
  const [expandedRecommendationId, setExpandedRecommendationId] = useState<
    string | null
  >(null);

  const refreshMutation = useRefreshPlan(plan._id || "");

  const handleRefresh = async () => {
    try {
      await refreshMutation.mutateAsync();
      toast.success("Recommendations refreshed! Check back in a few moments.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to refresh recommendations"
      );
    }
  };

  const recommendations = Array.isArray(plan.recommendations)
    ? plan.recommendations
    : [];

  // Group recommendations by type
  const skillGaps = recommendations.filter((r) => r.type === "SKILL_GAP");
  const resources = recommendations.filter((r) => r.type === "RESOURCE");
  const insights = recommendations.filter((r) => r.type === "MARKET_INSIGHT");

  const isEmpty = recommendations.length === 0;

  // icon/label helpers removed — kept inline where used to avoid react-refresh noise

  return (
    <Card className="rounded-3xl border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Recommendations</CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshMutation.isPending || !plan.aiReady}
          >
            {refreshMutation.isPending ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
        <CardDescription>
          {plan.aiReady
            ? "AI-generated suggestions to accelerate your career path"
            : "AI is analyzing your profile..."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {isEmpty ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-muted/50">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              {plan.aiReady
                ? "No recommendations available yet. Try refreshing."
                : "Recommendations will appear once AI finishes analyzing."}
            </p>
          </div>
        ) : (
          <>
            {/* Skill Gaps */}
            {skillGaps.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-500" />
                  Skill Gaps ({skillGaps.length})
                </h3>
                <div className="space-y-2">
                  {skillGaps.map((rec) => (
                    <div
                      key={rec._id}
                      className="p-3 rounded-lg border border-border/50 hover:border-orange-500/30 bg-orange-500/5 cursor-pointer transition-all"
                      onClick={() =>
                        setExpandedRecommendationId(
                          expandedRecommendationId === rec._id ? null : rec._id ?? null
                        )
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {rec.payload?.skill || "Skill Gap"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Current: {rec.payload?.currentLevel || "Not specified"} →
                            Required: {rec.payload?.requiredLevel || "Not specified"}
                          </p>
                        </div>
                        <div className="text-xs font-semibold px-2 py-1 rounded bg-orange-500/20 text-orange-700 dark:text-orange-300">
                          {Math.round((rec.confidence || 0) * 100)}%
                        </div>
                      </div>
                      {expandedRecommendationId === rec._id && (
                        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-orange-500/20">
                          {rec.payload?.recommendation || "No details available"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resources */}
            {resources.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  Recommended Resources ({resources.length})
                </h3>
                <div className="space-y-2">
                  {resources.map((rec) => (
                    <a
                      key={rec._id}
                      href={rec.payload?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-lg border border-border/50 hover:border-blue-500/30 bg-blue-500/5 cursor-pointer transition-all block group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                            {rec.payload?.title || "Resource"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {rec.payload?.type?.toLowerCase() || "resource"} •{" "}
                            {rec.payload?.rationale || "No description"}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 flex-shrink-0" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Market Insights */}
            {insights.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Market Insights
                </h3>
                <div className="p-4 rounded-lg border border-border/50 bg-green-500/5">
                  {insights.map((rec) => (
                    <div key={rec._id} className="space-y-2 text-sm">
                      {rec.payload?.marketDemand && (
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-300">
                            Market Demand
                          </p>
                          <p className="text-muted-foreground">
                            {rec.payload.marketDemand}
                          </p>
                        </div>
                      )}
                      {rec.payload?.salaryRange && (
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-300">
                            Salary Range
                          </p>
                          <p className="text-muted-foreground">
                            {rec.payload.salaryRange}
                          </p>
                        </div>
                      )}
                      {rec.payload?.growthOpportunities && (
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-300">
                            Growth Opportunities
                          </p>
                          <p className="text-muted-foreground">
                            {rec.payload.growthOpportunities}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Confidence Note */}
        {!isEmpty && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/30">
            AI Confidence: {recommendations.length > 0 ? (
              <>
                {(
                  (recommendations.reduce((sum, r) => sum + (r.confidence || 0), 0) /
                    recommendations.length) *
                  100
                ).toFixed(0)}
                %
              </>
            ) : (
              "N/A"
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
