"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";

interface RevisitProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  next_revisit: string | null;
  revisit_interval_days: number;
  revisit_ease_factor: number;
}

const DIFF_COLOR: Record<string, string> = {
  Easy: "text-[#00b8a3] bg-[#00b8a3]/10",
  Medium: "text-[#ffc01e] bg-[#ffc01e]/10",
  Hard: "text-[#ff375f] bg-[#ff375f]/10",
};

export default function RevisitPage() {
  const [due, setDue] = useState<RevisitProblem[]>([]);
  const [upcoming, setUpcoming] = useState<RevisitProblem[]>([]);
  const [rating, setRating] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([
      api.get<RevisitProblem[]>("/topics/revisit?due_only=true"),
      api.get<RevisitProblem[]>("/topics/revisit?due_only=false"),
    ]).then(([dueRes, allRes]) => {
      setDue(dueRes.data);
      const dueIds = new Set(dueRes.data.map((p) => p.id));
      setUpcoming(allRes.data.filter((p) => !dueIds.has(p.id)));
      setLoading(false);
    }).catch(() => {
      setError("Failed to load revisit queue");
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRate = async (id: string, confidence: number) => {
    setRating((r) => ({ ...r, [id]: confidence }));
    await api.post(`/topics/revisit/${id}/rate`, { confidence });
    setTimeout(load, 400);
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    if (diff <= 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return `In ${diff}d`;
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-base font-medium text-[#eff1f6]">Revisit Queue</h1>
        <p className="text-xs text-[#8a8a8a] mt-0.5">SM-2 spaced repetition — rate 1–5 after each review</p>
      </div>

      {error && <p className="text-xs text-[#ff375f] bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">{error}</p>}

      <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
        <p className="text-[10px] uppercase tracking-wider text-[#8a8a8a] mb-3">Due today <span className="text-[#5a5a5a]">({due.length})</span></p>
        {loading ? (
          <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : due.length === 0 ? (
          <p className="text-xs text-[#5a5a5a] py-4 text-center">Nothing due — great job keeping up!</p>
        ) : (
          due.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-3 border-b border-[#2e2e2e] last:border-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <a href={`https://leetcode.com/problems/${p.slug}`} target="_blank" rel="noreferrer" className="text-sm text-[#eff1f6] hover:text-[#ffa116] transition-colors">{p.title}</a>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${DIFF_COLOR[p.difficulty]}`}>{p.difficulty}</span>
                </div>
                <p className="text-[10px] text-[#8a8a8a]">interval {p.revisit_interval_days}d · ease {p.revisit_ease_factor.toFixed(1)}</p>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => handleRate(p.id, n)} className={`w-7 h-7 rounded text-xs border transition-colors ${rating[p.id] === n ? "border-[#ffa116] bg-[#ffa116]/20 text-[#ffa116]" : "border-[#3a3a3a] bg-[#2a2a2a] text-[#8a8a8a] hover:border-[#ffa116] hover:text-[#ffa116]"}`}>{n}</button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && upcoming.length > 0 && (
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-wider text-[#8a8a8a] mb-3">Upcoming</p>
          {upcoming.slice(0, 10).map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-[#2e2e2e] last:border-0">
              <div className="flex items-center gap-2">
                <a href={`https://leetcode.com/problems/${p.slug}`} target="_blank" rel="noreferrer" className="text-xs text-[#eff1f6] hover:text-[#ffa116] transition-colors">{p.title}</a>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${DIFF_COLOR[p.difficulty]}`}>{p.difficulty}</span>
              </div>
              <span className="text-[10px] text-[#8a8a8a]">{formatDate(p.next_revisit)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}