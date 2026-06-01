import { useEffect, useState, useCallback } from "react";
import {
  fetchAdminSummary,
  fetchAiLogs,
  fetchFailedAiRequests,
  type AdminSummaryResponse,
  type AIRequestLogItem,
} from "@/services/adminAnalyticsApi";
import {
  fetchAdminUsers,
  suspendAdminUser,
  unsuspendAdminUser,
  deleteAdminUser,
  type AdminUser,
} from "@/services/adminUserApi";
import { Button } from "@/components/common/Button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const cardClass = "rounded-2xl border border-[rgba(22,160,133,0.25)] bg-[rgba(20,37,62,0.55)] p-4";
const colors = ["#16A085", "#22C55E", "#F59E0B", "#EF4444", "#3B82F6", "#A855F7"];

export default function AdminDashboard() {
  const [summary, setSummary] = useState<AdminSummaryResponse["data"] | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [aiSearch, setAiSearch] = useState("");
  const [aiLogs, setAiLogs] = useState<AIRequestLogItem[]>([]);
  const [failedAiLogs, setFailedAiLogs] = useState<AIRequestLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [summaryRes, usersRes, aiLogsRes, failedRes] = await Promise.all([
        fetchAdminSummary(),
        fetchAdminUsers(userSearch, 1, 10),
        fetchAiLogs(aiSearch, 1, 20),
        fetchFailedAiRequests(),
      ]);

      setSummary(summaryRes.data.data);
      setUsers(usersRes.data.data.items || []);
      setAiLogs(aiLogsRes.data.data.items || []);
      setFailedAiLogs(failedRes.data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  }, [userSearch, aiSearch]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const reloadUsers = async () => {
    const usersRes = await fetchAdminUsers(userSearch, 1, 10);
    setUsers(usersRes.data.data.items || []);
  };

  const handleSuspend = async (id: string) => {
    const reason = window.prompt("Enter suspension reason", "Violation of platform rules");
    if (!reason) return;
    await suspendAdminUser(id, reason);
    await reloadUsers();
  };

  const handleUnsuspend = async (id: string) => {
    await unsuspendAdminUser(id);
    await reloadUsers();
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("Delete this user and related records?");
    if (!ok) return;
    await deleteAdminUser(id);
    await reloadUsers();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
          <p className="text-sm text-[rgba(189,216,233,0.75)]">
            Users, career plans, resume uploads, AI monitoring, and platform analytics.
          </p>
        </div>
        <Button variant="outline" onClick={loadAll} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-900/20 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {summary && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className={cardClass}>
            <p className="text-xs uppercase tracking-wide text-[rgba(189,216,233,0.7)]">Total Users</p>
            <p className="mt-2 text-2xl font-bold text-white">{summary.totals.totalUsers}</p>
          </div>
          <div className={cardClass}>
            <p className="text-xs uppercase tracking-wide text-[rgba(189,216,233,0.7)]">Total Career Plans</p>
            <p className="mt-2 text-2xl font-bold text-white">{summary.totals.totalCareerPlans}</p>
          </div>
          <div className={cardClass}>
            <p className="text-xs uppercase tracking-wide text-[rgba(189,216,233,0.7)]">Resumes Uploaded</p>
            <p className="mt-2 text-2xl font-bold text-white">{summary.totals.totalResumesUploaded}</p>
          </div>
          <div className={cardClass}>
            <p className="text-xs uppercase tracking-wide text-[rgba(189,216,233,0.7)]">Total AI Requests</p>
            <p className="mt-2 text-2xl font-bold text-white">{summary.totals.totalAIRequests}</p>
          </div>
          <div className={cardClass}>
            <p className="text-xs uppercase tracking-wide text-[rgba(189,216,233,0.7)]">Active Users</p>
            <p className="mt-2 text-2xl font-bold text-white">{summary.totals.activeUsers}</p>
          </div>
        </div>
      )}

      {summary && (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className={cardClass}>
            <h2 className="mb-3 text-lg font-bold text-white">Popular Career Roles</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.charts.popularRoles}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="role" stroke="#cbd5e1" />
                  <YAxis stroke="#cbd5e1" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#16A085" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="mb-3 text-lg font-bold text-white">User Growth</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.charts.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="month" stroke="#cbd5e1" />
                  <YAxis stroke="#cbd5e1" />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#22C55E" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="mb-3 text-lg font-bold text-white">AI Usage by Provider</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.aiUsage.byProvider}
                    dataKey="count"
                    nameKey="provider"
                    outerRadius={95}
                    label
                  >
                    {summary.aiUsage.byProvider.map((_, index) => (
                      <Cell key={index} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {summary && (
        <div className={cardClass}>
          <h2 className="mb-3 text-lg font-bold text-white">Plan Creation by Month</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.charts.planCreationStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className={cardClass}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white">User Management</h2>
          <div className="flex gap-2">
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search users"
              className="rounded-lg border border-white/10 bg-[#0b1730] px-3 py-2 text-sm text-white"
            />
            <Button variant="outline" onClick={reloadUsers}>Search</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
                <th className="py-2">Status</th>
                <th className="py-2">Last Active</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-white/5">
                  <td className="py-3">{user.fullName}</td>
                  <td className="py-3">{user.email}</td>
                  <td className="py-3">{user.role}</td>
                  <td className="py-3">{user.isSuspended ? "Suspended" : "Active"}</td>
                  <td className="py-3">{user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : "N/A"}</td>
                  <td className="py-3 flex gap-2">
                    {user.isSuspended ? (
                      <Button variant="outline" onClick={() => handleUnsuspend(user._id)}>Unsuspend</Button>
                    ) : (
                      <Button variant="outline" onClick={() => handleSuspend(user._id)}>Suspend</Button>
                    )}
                    <Button variant="outline" onClick={() => handleDelete(user._id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={cardClass}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white">AI Monitoring</h2>
          <div className="flex gap-2">
            <input
              value={aiSearch}
              onChange={(e) => setAiSearch(e.target.value)}
              placeholder="Search AI logs"
              className="rounded-lg border border-white/10 bg-[#0b1730] px-3 py-2 text-sm text-white"
            />
            <Button variant="outline" onClick={loadAll}>Search</Button>
          </div>
        </div>

        <div className="mb-3 text-sm text-slate-300">
          Failed AI requests: <span className="font-bold text-white">{summary?.aiUsage.failedRequests ?? 0}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="py-2">User</th>
                <th className="py-2">Endpoint</th>
                <th className="py-2">Provider</th>
                <th className="py-2">Status</th>
                <th className="py-2">Latency</th>
                <th className="py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {aiLogs.map((log) => (
                <tr key={log._id} className="border-b border-white/5">
                  <td className="py-3">{log.userId?.fullName || log.userId?.email || "Unknown"}</td>
                  <td className="py-3">{log.endpoint}</td>
                  <td className="py-3">{log.provider || "N/A"}</td>
                  <td className="py-3">{log.status}</td>
                  <td className="py-3">{log.latencyMs}ms</td>
                  <td className="py-3">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="mb-4 text-lg font-bold text-white">Recent Failed AI Requests</h2>
        <div className="space-y-3">
          {failedAiLogs.map((log) => (
            <div key={log._id} className="rounded-xl border border-red-400/20 bg-red-900/10 p-3">
              <p className="text-sm font-semibold text-white">
                {log.endpoint} • {log.provider || "unknown provider"}
              </p>
              <p className="text-xs text-red-200">
                {log.errorCode || "ERROR"}: {log.errorMessage || "Unknown failure"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
