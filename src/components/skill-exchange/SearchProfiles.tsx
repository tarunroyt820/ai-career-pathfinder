import { useState } from "react";
import { Button } from "@/components/common/Button";
import { searchProfiles, SkillProfile } from "@/services/skillExchangeApi";
import { RequestExchangeModal } from "./RequestExchangeModal";

export function SearchProfiles() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<'all' | 'name' | 'skill' | 'user'>('all');
  const [results, setResults] = useState<SkillProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [page] = useState(1);
  const [limit] = useState(20);
  const [requestOpen, setRequestOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");

  const doSearch = async () => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await searchProfiles(q.trim(), type, page, limit);
      setResults(res.profiles || []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Search failed', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md bg-[#0b1120] p-3 text-white"
          placeholder="Search by name, user ID, or skill..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
        />
        <select className="rounded-md bg-[#0b1120] p-3 text-white" value={type} onChange={(e) => setType(e.target.value as any)}>
          <option value="all">All</option>
          <option value="name">Name</option>
          <option value="user">User ID</option>
          <option value="skill">Skill</option>
        </select>
        <Button onClick={doSearch} disabled={loading}>{loading ? 'Searching...' : 'Search'}</Button>
      </div>

      <div className="grid gap-3">
        {results.length === 0 && !loading && <div className="text-sm text-[rgba(189,216,233,0.72)]">No results</div>}
        {results.map((p) => {
          const userId = typeof p.userId === 'string' ? p.userId : (p.userId as any)?._id;
          return (
            <div key={userId} className="rounded-xl border border-[rgba(255,255,255,0.06)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{typeof p.userId === 'string' ? userId : (p.userId as any)?.fullName || 'User'}</div>
                  <div className="text-sm text-[rgba(189,216,233,0.72)]">{p.bio || 'No bio'}</div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => { setTargetUserId(String(userId)); setRequestOpen(true); }}>Request</Button>
                </div>
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">
                {(p.skillsOffered || []).slice(0, 6).map((s) => (
                  <div key={s.name} className="rounded-full bg-[rgba(124,92,255,0.12)] px-3 py-1 text-sm text-[rgba(202,189,255,0.9)]">{s.name}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <RequestExchangeModal open={requestOpen} targetUserId={targetUserId} onClose={() => setRequestOpen(false)} onSuccess={() => {}} />
    </div>
  );
}

export default SearchProfiles;
