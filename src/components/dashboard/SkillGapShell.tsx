import { useEffect, useState } from "react";
import { Brain, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCareerPlan } from "@/services/careerPlanApi";
import { getProfile } from "@/services/profileApi";
import { generateSkillGapAnalysis } from "@/services/skillGapApi";
import { CareerPlan } from "@/types/careerPlan";
import { UserProfile } from "@/types/profile";

const TARGET_ROLES = [
  "Senior Frontend Engineer",
  "Full-Stack Developer",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Product Manager",
];

export function SkillGapShell() {
  const [targetRole, setTargetRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [careerPlan, setCareerPlan] = useState<CareerPlan | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [skillGaps, setSkillGaps] = useState<string[]>([]);
  const [matchedSkills, setMatchedSkills] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([getCareerPlan(), getProfile()])
      .then(([plan, profile]) => {
        setCareerPlan(plan);
        setUserProfile(profile);
        if (plan?.skillGapReport) {
          setAnalysis(plan.skillGapReport);
        } else if ((plan?.skillGapAnalysis?.length ?? 0) > 0) {
          setAnalysis((plan?.skillGapAnalysis ?? []).map((gap) => `- ${gap}`).join("\n"));
        }
      })
      .catch(async () => {
        try {
          const profile = await getProfile();
          setUserProfile(profile);
        } catch {
          // Handle gracefully.
        }
      });
  }, []);

  useEffect(() => {
    if (!careerPlan || !userProfile) return;

    const required = careerPlan.recommendedSkills || [];
    const userSkills = (userProfile.skills || []).map((skill) => skill.toLowerCase());

    const gaps = required.filter((skill) => !userSkills.includes(skill.toLowerCase()));
    const matched = required.filter((skill) => userSkills.includes(skill.toLowerCase()));

    setSkillGaps(gaps);
    setMatchedSkills(matched);
  }, [careerPlan, userProfile]);

  const fetchSkillGapAnalysis = async (role: string) => {
    const result = await generateSkillGapAnalysis(role);
    setAnalysis(result.analysis);
    setSkillGaps(result.missingSkills || []);
    setMatchedSkills(result.existingSkills || []);
  };

  const runAnalysis = async () => {
    const role = customRole || targetRole;

    if (!role) {
      toast.error("Please select or enter a target role");
      return;
    }

    setLoading(true);

    try {
      if (careerPlan?.skillGapReport) {
        setAnalysis(careerPlan.skillGapReport);
      } else if (careerPlan && (careerPlan.skillGapAnalysis?.length ?? 0) > 0) {
        setAnalysis((careerPlan.skillGapAnalysis ?? []).map((gap) => `- ${gap}`).join("\n"));
      } else {
        await fetchSkillGapAnalysis(role);
      }
    } catch {
      toast.error("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in space-y-8 fade-in duration-700">
      <div>
        <h2 className="text-3xl font-black tracking-tight">Skill Gap Analysis</h2>
        <p className="mt-1 text-lg text-muted-foreground">
          Find out exactly what skills you need for your dream role.
        </p>
      </div>

      <Card className="rounded-[2.5rem] border-border/40 bg-card/60 backdrop-blur-sm">
        <CardHeader className="p-8">
          <CardTitle className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            Choose Your Target Role
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 p-8 pt-0">
          <div className="flex flex-wrap gap-3">
            {TARGET_ROLES.map((role) => (
              <button
                key={role}
                onClick={() => {
                  setTargetRole(role);
                  setCustomRole("");
                }}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                  targetRole === role && !customRole
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Or type a custom role..."
              value={customRole}
              onChange={(event) => {
                setCustomRole(event.target.value);
                setTargetRole("");
              }}
              className="h-12 flex-1 rounded-2xl border border-border/40 bg-background px-5 text-sm font-semibold text-foreground transition-colors focus:border-primary/50 focus:outline-none"
            />

            <Button
              onClick={runAnalysis}
              disabled={loading}
              className="h-12 rounded-2xl px-8 font-black uppercase tracking-widest shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Analysing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyse
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {skillGaps.length > 0 || matchedSkills.length > 0 ? (
        <Card className="rounded-[2.5rem] border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader className="p-8">
            <CardTitle className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              Plan vs Profile Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 p-8 pt-0 md:grid-cols-2">
            <div className="rounded-3xl bg-muted/20 p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Skills You Have</h3>
              <div className="mt-4 space-y-2">
                {matchedSkills.length ? (
                  matchedSkills.map((skill, index) => (
                    <p key={index} className="text-sm font-semibold text-foreground">{skill}</p>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No matched skills found yet.</p>
                )}
              </div>
            </div>
            <div className="rounded-3xl bg-muted/20 p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Skills You Need</h3>
              <div className="mt-4 space-y-2">
                {skillGaps.length ? (
                  skillGaps.map((skill, index) => (
                    <p key={index} className="text-sm font-semibold text-foreground">{skill}</p>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Your saved plan skills are already covered.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : careerPlan ? (
        <Card className="rounded-[2.5rem] border-border/40 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-8">
            <p className="text-sm font-medium text-muted-foreground">Loading your skill gap analysis...</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[2.5rem] border-border/40 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-8">
            <p className="text-sm font-medium text-muted-foreground">Generate a career plan first to see your skill gaps.</p>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <Card className="rounded-[2.5rem] border-primary/20 bg-card/60 backdrop-blur-sm">
          <CardHeader className="p-8">
            <CardTitle className="flex items-center gap-3 text-primary">
              <Brain className="h-6 w-6" />
              Your Skill Gap Report
            </CardTitle>
          </CardHeader>

          <CardContent className="p-8 pt-0">
            <div className="prose-custom whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {analysis}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
