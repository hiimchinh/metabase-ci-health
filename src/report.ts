import type { Flip, TimingSummary, WorkflowSummary } from "./stats.ts";

export type FlakyJob = { job: string; flips: number; workflows: string[] };
export type ReportInput = {
  repo: string; from: string; to: string; generatedAt: string; totalRuns: number;
  summaries: WorkflowSummary[]; timings: Map<string, TimingSummary>; flips: Flip[]; flakyJobs: FlakyJob[]; jobLookups: number;
};

// Matrix summary jobs ("e2e-tests-result") fail whenever a child fails; counting them hides the child.
const SUMMARY_JOB = /[-_ ]results?$/i;

export function countFlakyJobs(samples: { flip: Flip; jobs: string[] }[]): FlakyJob[] {
  const byJob = new Map<string, FlakyJob>();
  for (const { flip, jobs } of samples) {
    for (const job of new Set(jobs.filter((j) => !SUMMARY_JOB.test(j)))) {
      const entry = byJob.get(job) ?? { job, flips: 0, workflows: [] };
      entry.flips += 1;
      if (!entry.workflows.includes(flip.workflow)) entry.workflows.push(flip.workflow);
      byJob.set(job, entry);
    }
  }
  return [...byJob.values()].sort((a, b) => b.flips - a.flips || a.job.localeCompare(b.job));
}

const flipCounts = (flips: Flip[]) => {
  const m = new Map<string, number>();
  for (const f of flips) m.set(f.path, (m.get(f.path) ?? 0) + 1);
  return m;
};

/** Pointers ordered by kind of cost: wasted re-runs, then developer wait, then runner shortage. */
export function lookHereFirst(r: Pick<ReportInput, "summaries" | "timings" | "flips" | "flakyJobs">): string[] {
  const items: string[] = [];
  const name = (path: string) => r.summaries.find((s) => s.path === path)?.name ?? path;
  const topFlip = [...flipCounts(r.flips).entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  if (topFlip) items.push(`**${name(topFlip[0])}**: ${topFlip[1]} commits failed and then passed with no code change.`);
  const job = r.flakyJobs[0];
  if (job) items.push(`**${job.job}**: failed in ${job.flips} of those flips, the most of any job. Open its last failed log first.`);
  const timed = [...r.timings.entries()];
  const slowest = timed.sort((a, b) => b[1].p95Minutes - a[1].p95Minutes)[0];
  if (slowest) items.push(`**${name(slowest[0])}**: slowest at p95, ${slowest[1].p95Minutes} min from first job start to last job end. Pull requests wait on it.`);
  const queued = timed.sort((a, b) => b[1].p95QueueMinutes - a[1].p95QueueMinutes)[0];
  if (queued && queued[1].p95QueueMinutes > 0) items.push(`**${name(queued[0])}**: longest wait for a runner at p95, ${queued[1].p95QueueMinutes} min before the first job starts.`);
  return items;
}

const pct = (n: number, d: number) => (d === 0 ? "0%" : `${Math.round((n / d) * 100)}%`);

export function renderReport(r: ReportInput): string {
  const flips = flipCounts(r.flips);
  const flipsWord = r.flips.length === 1 ? "commit flipped" : "commits flipped";
  const rows = [...r.summaries]
    .filter((s) => flips.has(s.path) || r.timings.has(s.path))
    .sort((a, b) => (flips.get(b.path) ?? 0) - (flips.get(a.path) ?? 0) || b.runs - a.runs);
  const cell = (path: string, k: keyof TimingSummary) => (r.timings.has(path) ? String(r.timings.get(path)![k]) : "–");
  return [
    `# CI health: ${r.repo}, ${r.from} to ${r.to}`,
    "",
    `${r.totalRuns} completed runs · ${r.flips.length} ${flipsWord} from fail to pass with no code change.`,
    `Generated ${r.generatedAt} from the public GitHub Actions API. Failed jobs read for ${r.jobLookups} of the ${r.flips.length} flips.`,
    "",
    "## Look here first",
    "",
    ...lookHereFirst(r).map((s, i) => `${i + 1}. ${s}`),
    "",
    "## Flaky jobs",
    "",
    "Jobs that failed in an attempt whose commit later passed in the same workflow.",
    "",
    "| Job | Flips | Workflow |",
    "|---|---:|---|",
    ...r.flakyJobs.slice(0, 25).map((j) => `| ${j.job} | ${j.flips} | ${j.workflows.join(", ")} |`),
    "",
    "## Workflows",
    "",
    "Flips and failure rate cover every run in the window. Timings come from job timestamps of the latest runs (sample size in the last column).",
    "",
    "| Workflow | Runs | Fail | Flips | p50 min | p95 min | p95 queue min | Sample |",
    "|---|---:|---:|---:|---:|---:|---:|---:|",
    ...rows.slice(0, 20).map((s) =>
      `| ${s.name} | ${s.runs} | ${pct(s.failures, s.runs)} | ${flips.get(s.path) ?? 0} | ${cell(s.path, "p50Minutes")} | ${cell(s.path, "p95Minutes")} | ${cell(s.path, "p95QueueMinutes")} | ${cell(s.path, "samples")} |`),
    "",
  ].join("\n");
}
