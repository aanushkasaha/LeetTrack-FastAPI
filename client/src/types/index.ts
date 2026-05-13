export interface User {
  id: string;
  username: string;
  email: string;
  leetcode_handle: string | null;
  created_at: string;
}

export interface Problem {
  id: string;
  leetcode_id: number;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: "Solved" | "Attempted" | "Revisit";
  topics: string[];
  companies: string[];
  notes: string | null;
  approach: string | null;
  solved_at: string | null;
  revisit_flag: boolean;
  next_revisit: string | null;
  revisit_interval_days: number;
  revisit_ease_factor: number;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  total_solved: number;
  easy: number;
  medium: number;
  hard: number;
  attempted: number;
  revisit_flagged: number;
}

export interface HeatmapEntry {
  date: string;
  count: number;
}

export interface TopicProblem {
  leetcode_id: number;
  title: string;
  slug: string;
  difficulty: string;
  companies: string[];
  solved: boolean;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  total_problems: number;
  solved_count: number;
  problems: TopicProblem[];
}

export interface ContestRanking {
  attendedContestsCount: number;
  rating: number;
  globalRanking: number;
  totalParticipants: number;
  topPercentage: number;
}

export interface ContestEntry {
  contest: { title: string; startTime: number };
  rating: number;
  ranking: number;
  problemsSolved: number;
  totalProblems: number;
  attended: boolean;
}

export interface ProblemsResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
  problems: Problem[];
}