"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Topic } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";

const DIFF_COLOR: Record<string, string> = {
  Easy: "text-[#00b8a3] bg-[#00b8a3]/10",
  Medium: "text-[#ffc01e] bg-[#ffc01e]/10",
  Hard: "text-[#ff375f] bg-[#ff375f]/10",
};

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api.get<Topic[]>("/topics")
      .then((r) => { setTopics(r.data); setLoading(false); })
      .catch(() => { setError("Failed to load topics"); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await api.post("/topics/seed");
      load();
    } catch {
      setError("Seeding failed");
    } finally {
      setSeeding(false);
    }
  };

  const toggle = (id: string) => setExpanded((e) => (e === id ? null : id));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium text-[#eff1f6]">Topic Sheet</h1>
          <p className="text-xs text-[#8a8a8a] mt-0.5">NeetCode 150 + Striver SDE Sheet</p>
        </div>
        {!loading && topics.length === 0 && !error && (
          <button onClick={handleSeed} disabled={seeding} className="text-xs bg-[#ffa116] text-[#1a1a1a] font-medium px-4 py-2 rounded-md hover:bg-[#e8900f] transition-colors disabled:opacity-60">
            {seeding ? "Seeding..." : "Seed topics"}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-[#ff375f] bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array(9).fill(0).map((_, i) => (
            <div key={i} className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-1 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {topics.map((t) => {
            const pct = t.total_problems > 0 ? (t.solved_count / t.total_problems) * 100 : 0;
            const isOpen = expanded === t.id;
            return (
              <div key={t.id} className="bg-[#242424] border border-[#3a3a3a] rounded-lg overflow-hidden">
                <div className="p-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors" onClick={() => toggle(t.id)}>
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-[#eff1f6]">{t.name}</p>
                    <span className="text-[10px] text-[#8a8a8a] ml-2 mt-0.5">{isOpen ? "▲" : "▼"}</span>
                  </div>
                  <p className="text-xs text-[#8a8a8a] mb-3">{t.solved_count} / {t.total_problems} solved</p>
                  <div className="h-1 bg-[#2e2e2e] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct === 100 ? "#00b8a3" : "#ffa116" }} />
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-[#3a3a3a]">
                    {t.problems.map((p) => (
                      <div key={p.leetcode_id} className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2a2a] last:border-0 hover:bg-[#2a2a2a]/40 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-4 h-4 flex-shrink-0 rounded-full flex items-center justify-center text-[9px] ${p.solved ? "bg-[#00b8a3]/20 text-[#00b8a3]" : "bg-[#2e2e2e] text-[#5a5a5a]"}`}>
                            {p.solved ? "✓" : "·"}
                          </span>
                          <a href={`https://leetcode.com/problems/${p.slug}`} target="_blank" rel="noreferrer" className="text-xs text-[#eff1f6] hover:text-[#ffa116] truncate transition-colors">{p.title}</a>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${DIFF_COLOR[p.difficulty]}`}>{p.difficulty}</span>
                          {p.companies.slice(0, 2).map((c) => (
                            <span key={c} className="text-[10px] bg-[#2e2e2e] text-[#8a8a8a] px-1.5 py-0.5 rounded">{c}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}