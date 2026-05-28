import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/common/Button";
import { createGlobalLearningRequest } from "@/services/skillExchangeApi";
import { inputClass } from "./shared";

type LearningRequestDraft = {
  skillWanted: string;
  goalTitle: string;
  description: string;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  preferredDuration: number;
  budgetCredits: number;
};

const initialDraft: LearningRequestDraft = {
  skillWanted: "",
  goalTitle: "",
  description: "",
  experienceLevel: "beginner",
  preferredDuration: 60,
  budgetCredits: 0,
};

export function GlobalLearningRequestModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [draft, setDraft] = useState<LearningRequestDraft>(initialDraft);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await createGlobalLearningRequest(draft);
      toast.success(`Learning request posted. ${result.recipientsNotified} matched users notified.`);
      setDraft(initialDraft);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[32px] border border-[rgba(22,160,133,0.35)] bg-[#0A0E27] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#7fe7d2]">
              Community Learning Request
            </p>
            <h3 className="mt-2 text-2xl font-black text-white">Ask the community for guided help</h3>
            <p className="mt-2 text-sm text-[rgba(189,216,233,0.74)]">
              Post a learning goal, notify matched mentors, and convert the first acceptance into a direct request thread.
            </p>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className={inputClass}
              placeholder="Skill you want to learn"
              value={draft.skillWanted}
              onChange={(event) => setDraft((current) => ({ ...current, skillWanted: event.target.value }))}
              required
            />
            <input
              className={inputClass}
              placeholder="Goal title"
              value={draft.goalTitle}
              onChange={(event) => setDraft((current) => ({ ...current, goalTitle: event.target.value }))}
              required
            />
          </div>

          <textarea
            rows={5}
            className={inputClass}
            placeholder="Describe what you want to achieve, what you already know, and how a mentor could help."
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <select
              className={inputClass}
              value={draft.experienceLevel}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  experienceLevel: event.target.value as "beginner" | "intermediate" | "advanced",
                }))
              }
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <input
              className={inputClass}
              type="number"
              min={15}
              step={15}
              placeholder="Preferred minutes"
              value={draft.preferredDuration}
              onChange={(event) =>
                setDraft((current) => ({ ...current, preferredDuration: Number(event.target.value) }))
              }
              required
            />

            <input
              className={inputClass}
              type="number"
              min={0}
              step={1}
              placeholder="Optional credits"
              value={draft.budgetCredits}
              onChange={(event) =>
                setDraft((current) => ({ ...current, budgetCredits: Number(event.target.value) }))
              }
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Posting..." : "Post Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
