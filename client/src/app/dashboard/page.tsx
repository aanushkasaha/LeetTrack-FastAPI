"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Stats, HeatmapEntry, Problem, ProblemsResponse } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/Skeleton";
import AddProblemModal from "@/components/dashboard/AddProblemModal";

const DIFF_COLOR: Record<string, string> = {
  Easy: "text-[#00b8a3] bg-[#00b8a3]/10",
  Medium: "text-[#ffc01e] bg-[#ffc01e]/10",
  Hard: "text-[#ff375f] bg-[#ff375f]/10",
};
const STATUS_COLOR: Record<string, string> = {
  Solved: "text-[#00b8a3] bg-[#00b8a3]/10",
  Attempted: "text-[#ffc01e] bg-[#ffc01e]/10",
  Revisit: "text-[#ffa116] bg-[#ffa116]/10",
};

function Heatmap({ data }: { data: HeatmapEntry[] }) {
  const map: Record<string, number> = {};
  data.forEach((d) => (map[d.date] = d.count));
  const cells = [];
  const today = new Date();
  for (let i = 181; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const count = map[key] || 0;
    let bg = "#2e2e2e";
    if (count >= 4) bg = "#00d9c0";
    else if (count === 3) bg = "#00b8a3";
    else if (count === 2) bg = "#0a7a6d";
    else if (count === 1) bg = "#0d4f47";
    cells.push(
      <div
        key={key}
        title={`${key}: ${count}`}
        style={{ background: bg }}
        className="rounded-[2px] aspect-square"
      />
    );
  }
  return (
    <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(26, 1fr)" }}>
      {cells}
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [total, setTotal] = useState(0);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [page, setPage] = useState(1);
  const [difficulty, setDifficulty] = useState("");
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Fix: batch all state updates to avoid cascading renders warning
  const loadStats = useCallback(() => {
    setStatsLoading(true);
    setStatsError("");
    Promise.all([
      api.get("/problems/stats"),
      api.get("/problems/heatmap"),
    ])
      .then(([s, h]) => {
        // Batched in a single synchronous block — React 18 auto-batches these
        setStats(s.data);
        setHeatmap(h.data);
        setStatsLoading(false);
      })
      .catch(() => {
        setStatsError("Failed to load stats");
        setStatsLoading(false);
      });
  }, []);

  const loadProblems = useCallback(() => {
    setTableLoading(true);
    setTableError("");
    const params: Record<string, string | number> = { page, limit: 20 };
    if (difficulty) params.difficulty = difficulty;
    if (search) params.search = search;
    api
      .get<ProblemsResponse>("/problems", { params })
      .then((r) => {
        // Batched — React 18 auto-batches these in async contexts too
        setProblems(r.data.problems);
        setTotal(r.data.total);
        setTableLoading(false);
      })
      .catch(() => {
        setTableError("Failed to load problems");
        setTableLoading(false);
      });
  }, [page, difficulty, search]);

  useEffect(() => {
  void loadStats();
}, [loadStats]);

useEffect(() => {
  void loadProblems();
}, [loadProblems]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const { data } = await api.post("/sync/leetcode");
      setSyncMsg(`Synced ${data.synced} new problems`);
      loadStats();
      loadProblems();
    } catch {
      setSyncMsg("Sync failed — check your LeetCode handle");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {showModal && (
        <AddProblemModal
          onClose={() => setShowModal(false)}
          onAdded={() => {
            loadStats();
            loadProblems();
          }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium text-[#eff1f6]">Dashboard</h1>
          <p className="text-xs text-[#8a8a8a] mt-0.5">Welcome back, {user?.username}</p>
        </div>
        <div className="flex items-center gap-3">
          {syncMsg && <span className="text-xs text-[#8a8a8a]">{syncMsg}</span>}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-xs bg-[#2a2a2a] border border-[#3a3a3a] text-[#8a8a8a] hover:text-[#eff1f6] px-4 py-2 rounded-md transition-colors disabled:opacity-60"
          >
            {syncing ? "Syncing..." : "Sync LeetCode"}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs bg-[#ffa116] text-[#1a1a1a] font-medium px-4 py-2 rounded-md hover:bg-[#e8900f] transition-colors"
          >
            + Add problem
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {statsLoading ? (
          Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
                <Skeleton className="h-3 w-20 mb-3" />
                <Skeleton className="h-7 w-12" />
              </div>
            ))
        ) : statsError ? (
          <div className="col-span-4 text-xs text-[#ff375f] bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
            {statsError}
          </div>
        ) : (
          [
            { label: "Total Solved", value: stats?.total_solved ?? 0, color: "text-[#ffa116]" },
            { label: "Easy", value: stats?.easy ?? 0, color: "text-[#00b8a3]" },
            { label: "Medium", value: stats?.medium ?? 0, color: "text-[#ffc01e]" },
            { label: "Hard", value: stats?.hard ?? 0, color: "text-[#ff375f]" },
          ].map((s) => (
            <div key={s.label} className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#8a8a8a] mb-1.5">{s.label}</p>
              <p className={`text-2xl font-medium ${s.color}`}>{s.value}</p>
            </div>
          ))
        )}
      </div>

      <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
        <p className="text-[10px] uppercase tracking-wider text-[#8a8a8a] mb-3">
          Activity — last 6 months
        </p>
        {statsLoading ? <Skeleton className="h-16 w-full" /> : <Heatmap data={heatmap} />}
      </div>

      <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-wider text-[#8a8a8a]">
            Problems <span className="text-[#5a5a5a]">({total})</span>
          </p>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-md px-3 py-1.5 text-xs text-[#eff1f6] outline-none focus:border-[#ffa116] w-44"
            />
            {["", "Easy", "Medium", "Hard"].map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDifficulty(d);
                  setPage(1);
                }}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  difficulty === d
                    ? "border-[#ffa116] text-[#ffa116] bg-[#ffa116]/10"
                    : "border-[#3a3a3a] text-[#8a8a8a] hover:text-[#eff1f6]"
                }`}
              >
                {d || "All"}
              </button>
            ))}
          </div>
        </div>

        {tableError && (
          <p className="text-xs text-[#ff375f] py-4 text-center">{tableError}</p>
        )}

        {tableLoading ? (
          <div className="space-y-2 py-2">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#3a3a3a]">
                {["#", "Title", "Difficulty", "Topics", "Status", "Solved"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[10px] uppercase tracking-wider text-[#8a8a8a] pb-2.5 px-2 font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {problems.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-xs text-[#5a5a5a] py-8">
                    No problems yet — sync LeetCode or add manually
                  </td>
                </tr>
              )}
              {problems.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#2a2a2a]/40 transition-colors"
                >
                  <td className="px-2 py-2.5 text-xs text-[#5a5a5a]">{p.leetcode_id}</td>
                  <td className="px-2 py-2.5">
                    <a
                      href={`https://leetcode.com/problems/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#eff1f6] hover:text-[#ffa116] transition-colors"
                    >
                      {p.title}
                    </a>
                  </td>
                  <td className="px-2 py-2.5">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${DIFF_COLOR[p.difficulty]}`}>
                      {p.difficulty}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-[10px] text-[#8a8a8a] max-w-[150px] truncate">
                    {p.topics.slice(0, 2).join(", ")}
                  </td>
                  <td className="px-2 py-2.5">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${STATUS_COLOR[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-[10px] text-[#5a5a5a]">
                    {p.solved_at
                      ? new Date(p.solved_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {total > 20 && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#3a3a3a]">
            <p className="text-xs text-[#8a8a8a]">
              Page {page} of {Math.ceil(total / 20)}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="text-xs px-3 py-1.5 rounded-md border border-[#3a3a3a] text-[#8a8a8a] hover:text-[#eff1f6] disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={page >= Math.ceil(total / 20)}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs px-3 py-1.5 rounded-md border border-[#3a3a3a] text-[#8a8a8a] hover:text-[#eff1f6] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}