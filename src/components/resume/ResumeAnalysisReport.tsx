import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/common/ProgressBar";
import ATSPieChart from "./ATSPieChart";
import { AlertCircle, CheckCircle2, CircleSlash, Sparkles, TrendingUp } from "lucide-react";

type ScoreMap = {
  atsCompatibility?: number;
  contentStrength?: number;
  impactAchievements?: number;
  keywordOptimization?: number;
  formattingClarity?: number;
  overallScore?: number;
};

type ResumeSectionFeedback = {
  quality?: string;
  issue?: string;
  whyItMatters?: string;
  howToFix?: string;
  exampleBefore?: string;
  exampleAfter?: string;
};

type ResumeAnalysis = {
  scores?: ScoreMap;
  summary?: string;
  overallEvaluation?: string;
  strengths?: string[];
  weaknesses?: string[];
  sections?: Array<{
    name?: string;
    score?: number;
    status?: string;
    issues?: string[];
    suggestions?: string[];
  }>;
  sectionFeedback?: {
    summary?: ResumeSectionFeedback;
    experience?: ResumeSectionFeedback;
    projects?: ResumeSectionFeedback;
  };
  keywords?: {
    present?: string[];
    missing?: string[];
    density?: number;
    recommendations?: string[];
  };
  impactReview?: {
    metricsUsed?: string;
    weakStatements?: string[];
    improvedExamples?: string[];
  };
  formatting?: {
    issues?: Array<{
      type?: string;
      severity?: string;
      description?: string;
      fix?: string;
    }>;
  };
  technicalSkills?: {
    detected?: string[];
    skillLevel?: string;
    missing?: string[];
    suggestions?: string[];
  };
  jobRoleMatching?: {
    bestFitRole?: string;
    matchLevel?: string;
    gaps?: string[];
    suggestions?: string[];
  };
  improvements?: Array<{
    section?: string;
    original?: string;
    improved?: string;
    reason?: string;
    priority?: string;
  }>;
  actionPlan?: string[];
  estimatedATSPassRate?: string;
  estimatedATSPassRateAfterFixes?: string;
  finalInsight?: string;
};

interface ResumeAnalysisReportProps {
  analysis: ResumeAnalysis | null;
  fileName?: string;
  targetRole?: string;
}

const clampScore = (value?: number) => Math.max(0, Math.min(100, Number(value || 0)));

const toList = (value?: string[] | string | null) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
};

const scoreTone = (score: number) => {
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-amber-400";
  return "text-rose-400";
};

const statusBadge = (value?: string) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("excellent") || normalized.includes("good")) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (normalized.includes("needs") || normalized.includes("average")) return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-rose-500/30 bg-rose-500/10 text-rose-300";
};

const PriorityBadge = ({ priority }: { priority?: string }) => {
  const normalized = String(priority || "").toUpperCase();
  const className =
    normalized === "HIGH"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
      : normalized === "MEDIUM"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border-sky-500/30 bg-sky-500/10 text-sky-300";

  return <Badge variant="outline" className={className}>{normalized || "LOW"}</Badge>;
};

const SectionCard = ({
  title,
  feedback,
}: {
  title: string;
  feedback?: ResumeSectionFeedback;
}) => (
  <Card className="rounded-[2rem] border-border/40 bg-card/60 backdrop-blur-sm">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center justify-between gap-3 text-base">
        <span>{title}</span>
        <Badge variant="outline" className={statusBadge(feedback?.quality)}>
          {feedback?.quality || "Not rated"}
        </Badge>
      </CardTitle>
      {feedback?.issue && <CardDescription>{feedback.issue}</CardDescription>}
    </CardHeader>
    <CardContent className="space-y-3 text-sm">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Why it matters</p>
        <p className="mt-1 text-muted-foreground">{feedback?.whyItMatters || "No explanation provided in the analysis."}</p>
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">How to fix</p>
        <p className="mt-1 text-muted-foreground">{feedback?.howToFix || "No fix suggested in the analysis."}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-muted/20 p-3">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Before</p>
          <p className="mt-1 text-sm text-foreground">{feedback?.exampleBefore || "Not provided."}</p>
        </div>
        <div className="rounded-2xl bg-muted/20 p-3">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">After</p>
          <p className="mt-1 text-sm text-foreground">{feedback?.exampleAfter || "Not provided."}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export function ResumeAnalysisReport({ analysis, fileName, targetRole }: ResumeAnalysisReportProps) {
  const scores = analysis?.scores || {};
  const atsScore = clampScore(scores.atsCompatibility);
  const contentScore = clampScore(scores.contentStrength);
  const impactScore = clampScore(scores.impactAchievements);
  const keywordScore = clampScore(scores.keywordOptimization);
  const formattingScore = clampScore(scores.formattingClarity);
  const finalScore = clampScore(scores.overallScore || atsScore);
  const ringPercent = Math.max(0, Math.min(100, finalScore));

  const sectionFeedback = analysis?.sectionFeedback || {};
  const keywordPresent = toList(analysis?.keywords?.present);
  const keywordMissing = toList(analysis?.keywords?.missing);
  const keywordRecommendations = toList(analysis?.keywords?.recommendations);
  const technicalDetected = toList(analysis?.technicalSkills?.detected);
  const technicalMissing = toList(analysis?.technicalSkills?.missing);
  const technicalSuggestions = toList(analysis?.technicalSkills?.suggestions);
  const jobGaps = toList(analysis?.jobRoleMatching?.gaps);
  const jobSuggestions = toList(analysis?.jobRoleMatching?.suggestions);
  const actionPlan = toList(analysis?.actionPlan);
  const improvements = analysis?.improvements || [];
  const formattingIssues = analysis?.formatting?.issues || [];
  const weakStatements = toList(analysis?.impactReview?.weakStatements);
  const improvedExamples = toList(analysis?.impactReview?.improvedExamples);
  const presentStrengths = toList(analysis?.strengths);
  const presentWeaknesses = toList(analysis?.weaknesses);

  return (
    <div className="space-y-6">
      <Card className="rounded-[2.5rem] border-border/40 bg-card/70 shadow-xl shadow-black/5 backdrop-blur-sm">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                <Sparkles className="h-3 w-3" /> ATS Dashboard
              </p>
              <CardTitle className="mt-3 text-2xl font-black tracking-tight">Resume Analysis Report</CardTitle>
              <CardDescription>
                {fileName ? `File: ${fileName}` : "Ready for resume review"}
                {targetRole ? ` • Target role: ${targetRole}` : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <CircleSlash className="h-4 w-4" /> Visual ATS summary
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="rounded-[2rem] border border-border/40 bg-background/50 p-6">
              <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full p-4">
                <ATSPieChart percent={Math.round(atsScore)} size={176} strokeWidth={22} />
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm font-semibold text-foreground">ATS Compatibility</p>
                <p className="mt-1 text-sm text-muted-foreground">{analysis?.summary || "Your resume is being evaluated for ATS compatibility, keyword alignment, and clarity."}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: "Content Quality", value: contentScore },
                  { label: "Impact & Achievements", value: impactScore },
                  { label: "Keyword Optimization", value: keywordScore },
                  { label: "Formatting & Clarity", value: formattingScore },
                  { label: "ATS Compatibility", value: atsScore },
                  { label: "Final Score", value: finalScore },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
                    <p className={`mt-2 text-2xl font-black ${scoreTone(item.value)}`}>{item.value}/100</p>
                    <ProgressBar value={item.value} className="mt-3" />
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-primary">Quick insight</p>
                    <p className="mt-1 text-sm text-foreground">
                      {analysis?.overallEvaluation || analysis?.summary || "Your resume is moderately ATS-friendly but can be improved with stronger keywords, impact metrics, and cleaner section wording."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-[2.5rem] border-border/40 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Overall Evaluation</CardTitle>
          <CardDescription>Professional summary of your resume positioning.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>{analysis?.overallEvaluation || "This resume shows potential but needs tighter ATS alignment and stronger proof of impact to stand out in screening systems."}</p>
          <p>{analysis?.summary || "The core experience is solid, but the document should be refined to better match job descriptions and highlight achievements clearly."}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="rounded-[2rem] border-border/40 bg-card/60">
          <CardHeader className="pb-3"><CardTitle className="text-base">Key Strengths</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-foreground">
              {(presentStrengths.length ? presentStrengths : ["Add 3-5 strengths from the analysis."]).map((item) => (
                <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-border/40 bg-card/60">
          <CardHeader className="pb-3"><CardTitle className="text-base">Key Weaknesses</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-foreground">
              {(presentWeaknesses.length ? presentWeaknesses : ["Add 3-5 weaknesses from the analysis."]).map((item) => (
                <li key={item} className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 text-rose-400" />{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-border/40 bg-card/60">
          <CardHeader className="pb-3"><CardTitle className="text-base">ATS Score Prediction</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-foreground">
            <p>Current ATS pass rate: <span className="font-black">{analysis?.estimatedATSPassRate || `${atsScore}%`}</span></p>
            <p>Expected after improvements: <span className="font-black">{analysis?.estimatedATSPassRateAfterFixes || `${Math.min(100, finalScore + 12)}%`}</span></p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-border/40 bg-card/60">
        <CardHeader>
          <CardTitle>Section-wise Feedback</CardTitle>
          <CardDescription>Detailed review of the most important resume sections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SectionCard title="Summary Section" feedback={sectionFeedback.summary || {
            quality: analysis?.sections?.find((section) => String(section.name || "").toLowerCase().includes("summary"))?.status,
            issue: analysis?.sections?.find((section) => String(section.name || "").toLowerCase().includes("summary"))?.issues?.[0],
            whyItMatters: "This is the first section recruiters and ATS systems inspect for relevance.",
            howToFix: "Make the summary role-specific, concise, and impact-driven.",
            exampleBefore: "Passionate developer with experience in web applications.",
            exampleAfter: "Frontend developer with 2+ years of experience building scalable React applications and improving user workflows.",
          }} />
          <SectionCard title="Experience Section" feedback={sectionFeedback.experience || {
            quality: analysis?.sections?.find((section) => String(section.name || "").toLowerCase().includes("experience"))?.status,
            issue: analysis?.sections?.find((section) => String(section.name || "").toLowerCase().includes("experience"))?.issues?.[0],
            whyItMatters: "Experience demonstrates real-world impact and helps the resume pass screening filters.",
            howToFix: "Add metrics, outcomes, and stronger action verbs.",
            exampleBefore: "Worked on improving application performance.",
            exampleAfter: "Improved application load speed by 32% by optimizing component rendering and reducing unnecessary API calls.",
          }} />
          <SectionCard title="Projects Section" feedback={sectionFeedback.projects || {
            quality: analysis?.sections?.find((section) => String(section.name || "").toLowerCase().includes("project"))?.status,
            issue: analysis?.sections?.find((section) => String(section.name || "").toLowerCase().includes("project"))?.issues?.[0],
            whyItMatters: "Projects prove practical execution when professional experience is limited.",
            howToFix: "Describe the problem, your contribution, the tech stack, and the result.",
            exampleBefore: "Built a career path app using React and Node.js.",
            exampleAfter: "Built a career path platform using React, Node.js, and MongoDB that generated personalized roadmaps and progress tracking.",
          }} />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-[2.5rem] border-border/40 bg-card/60">
          <CardHeader>
            <CardTitle>Keywords & ATS Optimization</CardTitle>
            <CardDescription>How well the resume matches searchable role terms.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Present keywords</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(keywordPresent.length ? keywordPresent : ["No keywords detected"]).map((item) => <Badge key={item} variant="secondary" className="rounded-full">{item}</Badge>)}
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Missing keywords</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(keywordMissing.length ? keywordMissing : ["Add role-specific keywords"]).map((item) => <Badge key={item} variant="outline" className="rounded-full border-amber-500/30 bg-amber-500/10 text-amber-300">{item}</Badge>)}
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Suggestions</p>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                {(keywordRecommendations.length ? keywordRecommendations : ["Mirror language from the job description and place it naturally in summary, skills, and experience."]).map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-border/40 bg-card/60">
          <CardHeader>
            <CardTitle>Impact & Achievements Review</CardTitle>
            <CardDescription>Whether your resume proves results instead of only responsibilities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p><span className="font-black text-foreground">Metrics used:</span> {analysis?.impactReview?.metricsUsed || "Limited use of numbers and measurable outcomes."}</p>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Weak statements</p>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                {(weakStatements.length ? weakStatements : ["Add specific metrics and business outcomes to each bullet point."]).map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Improved examples</p>
              <ul className="mt-2 space-y-2 text-foreground">
                {(improvedExamples.length ? improvedExamples : ["Turn responsibilities into measurable achievements."]).map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-[2.5rem] border-border/40 bg-card/60">
          <CardHeader>
            <CardTitle>Formatting & Readability</CardTitle>
            <CardDescription>Small layout issues that can reduce ATS clarity and recruiter speed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Issues</p>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                {(formattingIssues.length ? formattingIssues.map((issue) => issue.description || issue.type || "Formatting issue") : ["Keep headings, spacing, and bullets consistent across the document."]).map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Fixes</p>
              <ul className="mt-2 space-y-2 text-foreground">
                {(formattingIssues.length ? formattingIssues.map((issue) => issue.fix || "Apply a clearer structure and consistent bullet style.") : ["Use one bullet style, keep section order stable, and avoid dense paragraphs."]).map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-border/40 bg-card/60">
          <CardHeader>
            <CardTitle>Technical Skills Evaluation</CardTitle>
            <CardDescription>How the detected skill set lines up with the intended role.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p><span className="font-black text-foreground">Skill level:</span> {analysis?.technicalSkills?.skillLevel || "Intermediate to strong"}</p>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Skills detected</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(technicalDetected.length ? technicalDetected : ["Add detected skills from the resume analysis."]).map((item) => <Badge key={item} variant="secondary" className="rounded-full">{item}</Badge>)}
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Missing skills</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(technicalMissing.length ? technicalMissing : ["Add skills commonly required for the target role."]).map((item) => <Badge key={item} variant="outline" className="rounded-full border-amber-500/30 bg-amber-500/10 text-amber-300">{item}</Badge>)}
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Suggestions</p>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                {(technicalSuggestions.length ? technicalSuggestions : ["Group skills into core, supporting, and advanced categories."]).map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-border/40 bg-card/60">
        <CardHeader>
          <CardTitle>Job Role Matching</CardTitle>
          <CardDescription>Best-fit role and how close the resume is to a target posting.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 text-sm">
          <div className="rounded-2xl bg-muted/20 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Best-fit role</p>
            <p className="mt-2 font-black text-foreground">{analysis?.jobRoleMatching?.bestFitRole || targetRole || "Frontend / Full-Stack Developer"}</p>
          </div>
          <div className="rounded-2xl bg-muted/20 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Match level</p>
            <p className="mt-2 font-black text-foreground">{analysis?.jobRoleMatching?.matchLevel || "High"}</p>
          </div>
          <div className="rounded-2xl bg-muted/20 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Main gaps</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {(jobGaps.length ? jobGaps : ["Add tighter keyword alignment and measurable outcomes."]).map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
          <div className="md:col-span-3 rounded-2xl border border-border/40 bg-background/50 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Suggestions</p>
            <ul className="mt-2 space-y-2 text-muted-foreground">
              {(jobSuggestions.length ? jobSuggestions : ["Tailor the summary, skills, and project bullets to each job description."]).map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-[2.5rem] border-border/40 bg-card/60">
          <CardHeader>
            <CardTitle>Action Plan</CardTitle>
            <CardDescription>What to fix next, sorted by priority.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">High Priority</p>
              <ul className="mt-2 space-y-2 text-sm text-foreground">
                {(improvements.filter((item) => String(item.priority || "").toUpperCase() === "HIGH").length ? improvements.filter((item) => String(item.priority || "").toUpperCase() === "HIGH").map((item, index) => <li key={`${item.section || "high"}-${index}`}>• {item.improved || item.reason || item.original || "Critical resume fix"}</li>) : actionPlan.slice(0, 3).map((item) => <li key={item}>• {item}</li>) || [<li key="high-default">• Add measurable achievements and target keywords.</li>])}
              </ul>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Medium Priority</p>
              <ul className="mt-2 space-y-2 text-sm text-foreground">
                {(improvements.filter((item) => String(item.priority || "").toUpperCase() === "MEDIUM").length ? improvements.filter((item) => String(item.priority || "").toUpperCase() === "MEDIUM").map((item, index) => <li key={`${item.section || "medium"}-${index}`}>• {item.improved || item.reason || item.original || "Medium resume fix"}</li>) : actionPlan.slice(3, 6).map((item) => <li key={item}>• {item}</li>) || [<li key="medium-default">• Improve section wording and formatting consistency.</li>])}
              </ul>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Low Priority</p>
              <ul className="mt-2 space-y-2 text-sm text-foreground">
                {(improvements.filter((item) => String(item.priority || "").toUpperCase() === "LOW").length ? improvements.filter((item) => String(item.priority || "").toUpperCase() === "LOW").map((item, index) => <li key={`${item.section || "low"}-${index}`}>• {item.improved || item.reason || item.original || "Minor resume fix"}</li>) : actionPlan.slice(6, 9).map((item) => <li key={item}>• {item}</li>) || [<li key="low-default">• Polish spacing and reduce repeated phrases.</li>])}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-border/40 bg-card/60">
          <CardHeader>
            <CardTitle>Final Insight</CardTitle>
            <CardDescription>Last recommendation for improving resume performance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>{analysis?.finalInsight || "Your resume has a good foundation, but it will perform better when rewritten with stronger metrics, role-specific keywords, and cleaner structure."}</p>
            <p>{analysis?.estimatedATSPassRate && analysis?.estimatedATSPassRateAfterFixes ? `Current pass rate: ${analysis.estimatedATSPassRate}. Expected after improvements: ${analysis.estimatedATSPassRateAfterFixes}.` : "Focus first on ATS keywords and measurable outcomes; those changes usually produce the fastest screening lift."}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
