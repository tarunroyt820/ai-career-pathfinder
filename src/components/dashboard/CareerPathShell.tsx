
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/common/Button";
import { Compass, Target, Map, Sparkles, Plus, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { ProgressBar } from "@/components/common/ProgressBar";
import { useEffect, useState } from "react";
import { CareerPlan } from "@/types/careerPlan";
import { toast } from "sonner";
import {
  useGetPlans,
  useCreatePlan,
  useGetPlan,
} from "@/hooks/useCareerPlans";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InputField } from "@/components/common/InputField";
import { PlanTimeline, RecommendationPanel } from "@/components/career";

/**
 * Loading skeleton card
 */
function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-border/30 bg-card/40 p-6 space-y-4 animate-pulse">
      <div className="h-10 w-10 rounded-xl bg-muted/50" />
      <div className="h-5 w-3/4 rounded-lg bg-muted/50" />
      <div className="h-4 w-1/2 rounded-lg bg-muted/40" />
      <div className="h-3 w-full rounded-full bg-muted/30 mt-4" />
      <div className="h-10 w-full rounded-xl bg-muted/30 mt-4" />
    </div>
  );
}

/**
 * Create Plan Modal
 */
function CreatePlanModal({
  onCreated,
}: {
  onCreated: (plan: CareerPlan) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [intensity, setIntensity] = useState("medium");

  const createMutation = useCreatePlan();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !targetRole.trim()) {
      toast.error("Title and target role are required");
      return;
    }

    try {
      const createdPlan = await createMutation.mutateAsync({
        title,
        targetRole,
        timeframe,
        intensity,
      });

      onCreated(createdPlan);
      if (createdPlan.aiJobId && !createdPlan.aiReady) {
        toast.success(`Career plan queued (job ${createdPlan.aiJobId}). AI will update when ready.`);
      } else {
        toast.success("Career plan created! AI is generating recommendations...");
      }
      setTitle("");
      setTargetRole("");
      setTimeframe("");
      setIntensity("medium");
      setOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create plan"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
          <Plus className="h-4 w-4" />
          New Career Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a Career Plan</DialogTitle>
          <DialogDescription>
            Define your career goals and let AI generate a personalized roadmap.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <InputField
            label="Plan Title"
            placeholder="e.g., Become a Senior React Developer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <InputField
            label="Target Role"
            placeholder="e.g., Senior Frontend Engineer"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />
          <InputField
            label="Timeframe (optional)"
            placeholder="e.g., 6 months, 1 year"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          />
          <div>
            <label className="text-sm font-medium">Intensity</label>
            <select
              value={intensity}
              onChange={(e) => setIntensity(e.target.value)}
              className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="low">Low (5-10 hrs/week)</option>
              <option value="medium">Medium (10-20 hrs/week)</option>
              <option value="high">High (20+ hrs/week)</option>
            </select>
          </div>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full"
          >
            {createMutation.isPending ? "Creating..." : "Create Plan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Plan Card - displays a single career plan
 */
function PlanCard({ plan, onClick }: { plan: CareerPlan; onClick: () => void }) {
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-500/10 text-green-700 dark:text-green-300",
    PAUSED: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
    COMPLETED: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    ACTIVE: <Sparkles className="h-4 w-4" />,
    PAUSED: <Clock className="h-4 w-4" />,
    COMPLETED: <CheckCircle2 className="h-4 w-4" />,
  };

  const queuedBadge = (plan: CareerPlan) => {
    if (plan.aiJobId && !plan.aiReady) {
      return (
        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
          Queued
        </span>
      );
    }
    return null;
  };

  const milestonesCompleted = plan.milestones.filter((m) => m.completed).length;
  const totalMilestones = plan.milestones.length;

  return (
    <Card className="rounded-3xl border-border/50 hover:border-primary/30 cursor-pointer transition-all">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            {queuedBadge(plan)}
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${
                statusColors[plan.status] || statusColors.ACTIVE
              }`}
            >
              {statusIcons[plan.status]} {plan.status}
            </span>
          </div>
        </div>
        <CardTitle className="mt-4">{plan.title}</CardTitle>
        <CardDescription>{plan.targetRole}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span className="font-semibold">{plan.overallProgress}%</span>
            </div>
            <ProgressBar value={plan.overallProgress} />
          </div>
          <div className="text-sm text-muted-foreground">
            {milestonesCompleted} of {totalMilestones} milestones completed
          </div>
          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={onClick}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main CareerPathShell Component
 */
export function CareerPathShell() {
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>();
  const plansQuery = useGetPlans();
  const selectedPlanQuery = useGetPlan(selectedPlanId);
  const plans = plansQuery.data || [];
  const hasPlans = plans.length > 0;
  const selectedPlan = selectedPlanQuery.data;

  useEffect(() => {
    if (!selectedPlanId && plans[0]?._id) {
      setSelectedPlanId(plans[0]._id);
    }
  }, [plans, selectedPlanId]);

  // Show loading skeleton while fetching plans
  if (plansQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded-lg bg-muted/40 animate-pulse" />
        <div className="h-4 w-96 rounded-lg bg-muted/30 animate-pulse" />
        <div className="grid gap-6 md:grid-cols-3 mt-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (plansQuery.isError) {
    return (
      <Card className="rounded-3xl border-border/50 p-8">
        <CardTitle className="text-lg">Career Plans Failed To Load</CardTitle>
        <CardDescription className="mt-2">
          {plansQuery.error instanceof Error
            ? plansQuery.error.message
            : "We could not load your career plans right now."}
        </CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Career Path Finder</h2>
          <p className="text-muted-foreground">
            AI-powered career roadmaps tailored to your goals.
          </p>
        </div>
        <div className="flex gap-3">
          {hasPlans && (
            <Button variant="outline" className="gap-2">
              <Compass className="h-4 w-4" />
              Assessment
            </Button>
          )}
          <CreatePlanModal
            onCreated={(plan) => setSelectedPlanId(plan._id)}
          />
        </div>
      </div>

      {/* Empty State */}
      {!hasPlans ? (
        <Card className="rounded-3xl border-border/50 p-12 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-primary/10 p-4 rounded-2xl">
                <Map className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">No Career Plans Yet</h3>
              <p className="text-muted-foreground mt-1">
                Create your first career plan to get AI-powered recommendations
                and a personalized roadmap.
              </p>
            </div>
            <CreatePlanModal
              onCreated={(plan) => setSelectedPlanId(plan._id)}
            />
          </div>
        </Card>
      ) : (
        <>
          {/* Plans Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan._id}
                plan={plan}
                onClick={() => setSelectedPlanId(plan._id)}
              />
            ))}
          </div>

          {/* Selected Plan Details */}
          {selectedPlan && (
            <>
              {/* Plan Overview */}
              <Card className="rounded-3xl border-primary/20 bg-card/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5" />
                    {selectedPlan.title}
                  </CardTitle>
                  <CardDescription>{selectedPlan.targetRole}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Overall Progress</span>
                        <span className="font-semibold">
                          {selectedPlan.overallProgress}%
                        </span>
                      </div>
                      <ProgressBar value={selectedPlan.overallProgress} />
                    </div>
                    {selectedPlan.notes && (
                      <p className="text-sm text-muted-foreground">
                        {selectedPlan.notes}
                      </p>
                    )}
                    {!selectedPlan.aiReady && (
                      <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-300 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            AI is generating your milestones. This may take a few moments...
                          </p>
                          {selectedPlan.aiJobId && (
                            <p className="text-xs text-muted-foreground mt-1">Queue job: {selectedPlan.aiJobId}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Milestones Roadmap with Timeline */}
              <div className="rounded-3xl border border-border/50 bg-card/40 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Map className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">
                    Your Career Roadmap
                  </h3>
                </div>
                <PlanTimeline
                  planId={selectedPlan._id || ""}
                  milestones={selectedPlan.milestones}
                  roadmap={selectedPlan.roadmap}
                />
              </div>

              <Card className="rounded-3xl border-border/50">
                <CardHeader>
                  <CardTitle>Roadmap In Text</CardTitle>
                  <CardDescription>
                    A readable step-by-step path from your starting point to your destination.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedPlan.roadmap?.nodes?.length ? (
                    <div className="space-y-3">
                      {selectedPlan.roadmap.nodes
                        .slice()
                        .sort((a, b) => a.order - b.order)
                        .map((node, index) => (
                          <div
                            key={node.nodeId}
                            className="rounded-2xl border border-border/40 bg-card/40 p-4"
                          >
                            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                              Step {index + 1} · {node.type}
                            </p>
                            <p className="mt-1 text-base font-semibold">{node.label}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {node.description || "Continue through this stage on your roadmap."}
                            </p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Your roadmap text will appear here once milestones are available.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* AI Recommendations */}
              {selectedPlan.aiReady && (
                <RecommendationPanel plan={selectedPlan} />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
