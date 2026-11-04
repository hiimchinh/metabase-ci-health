export type Run = {
  id: number;
  name: string;
  path: string;
  event: string;
  head_sha: string;
  conclusion: string | null;
  run_attempt: number;
  created_at: string;
  run_started_at: string;
  updated_at: string;
};

export type WorkflowSummary = {
  name: string;
  path: string;
  runs: number;
  failures: number;
  cancelled: number;
};

export type Timing = { minutes: number; queueMinutes: number };
export type TimingSummary = { samples: number; p50Minutes: number; p95Minutes: number; p95QueueMinutes: number };
export type JobTimes = { started_at: string | null; completed_at: string | null };

export type Flip = {
  workflow: string;
  path: string;
  head_sha: string;
  failedRunId: number;
  failedAttempt: number;
  /** false when only a re-run pass was seen: the earlier attempt may have been cancelled, not failed. */
  confirmed: boolean;
};

const FINISHED = new Set(["success", "failure"]);
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Nearest-rank percentile; 0 for an empty list. */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.max(0, rank - 1)];
}

/**
 * Per-workflow outcome counts. A run's own updated_at moves long after it finishes, so durations
 * are not taken from runs; they come from job timestamps (see jobTiming).
 */
export function summarizeWorkflows(runs: Run[], names: Map<string, string> = new Map()): WorkflowSummary[] {
  const byPath = new Map<string, Run[]>();
  for (const r of runs) byPath.set(r.path, [...(byPath.get(r.path) ?? []), r]);
  return [...byPath.values()].map((group) => ({
    name: names.get(group[0].path) ?? group[0].name,
    path: group[0].path,
    runs: group.length,
    failures: group.filter((r) => r.conclusion === "failure").length,
    cancelled: group.filter((r) => r.conclusion === "cancelled").length,
  }));
}

/** Wall-clock from the first job start to the last job end; queue from run creation to first job start. */
export function jobTiming(createdAt: string, jobs: JobTimes[]): Timing | null {
  const ran = jobs.filter((j) => j.started_at && j.completed_at);
  if (ran.length === 0) return null;
  const first = Math.min(...ran.map((j) => Date.parse(j.started_at!)));
  const last = Math.max(...ran.map((j) => Date.parse(j.completed_at!)));
  return { minutes: round1((last - first) / 60_000), queueMinutes: round1((first - Date.parse(createdAt)) / 60_000) };
}

export function summarizeTimings(timings: Timing[]): TimingSummary {
  return {
    samples: timings.length,
    p50Minutes: percentile(timings.map((t) => t.minutes), 50),
    p95Minutes: percentile(timings.map((t) => t.minutes), 95),
    p95QueueMinutes: percentile(timings.map((t) => t.queueMinutes), 95),
  };
}

/**
 * A flip is one commit whose result changed without a code change: the same workflow failed and
 * passed on the same head SHA, or passed only on a re-run (run_attempt > 1). Both point at flaky
 * tests or flaky infrastructure rather than at the change under test.
 */
const CODE_EVENTS = new Set(["pull_request", "push", "merge_group"]);

export function findFlips(runs: Run[], opts: { exclude?: RegExp } = {}): Flip[] {
  const groups = new Map<string, Run[]>();
  for (const r of runs) {
    if (!CODE_EVENTS.has(r.event)) continue;
    if (opts.exclude && (opts.exclude.test(r.path) || opts.exclude.test(r.name))) continue;
    const key = `${r.path}\u0000${r.head_sha}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const flips: Flip[] = [];
  for (const group of groups.values()) {
    const failed = group.find((r) => r.conclusion === "failure");
    const passed = group.some((r) => r.conclusion === "success");
    const rerunPass = group.find((r) => r.conclusion === "success" && r.run_attempt > 1);
    if (failed && passed) {
      flips.push({ workflow: failed.name, path: failed.path, head_sha: failed.head_sha, failedRunId: failed.id, failedAttempt: failed.run_attempt, confirmed: true });
    } else if (rerunPass) {
      flips.push({ workflow: rerunPass.name, path: rerunPass.path, head_sha: rerunPass.head_sha, failedRunId: rerunPass.id, failedAttempt: rerunPass.run_attempt - 1, confirmed: false });
    }
  }
  return flips.sort((a, b) => a.workflow.localeCompare(b.workflow) || a.failedRunId - b.failedRunId);
}
