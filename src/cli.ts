#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { fetchAttemptConclusion, fetchFailedJobs, fetchJobs, fetchRuns, fetchWorkflowNames, mapLimit } from "./github.ts";
import { findFlips, jobTiming, summarizeTimings, summarizeWorkflows, type Flip, type Run, type Timing, type TimingSummary } from "./stats.ts";
import { countFlakyJobs, renderReport } from "./report.ts";

const { values } = parseArgs({
  options: {
    repo: { type: "string", default: "metabase/metabase" },
    days: { type: "string", default: "7" },
    // Bot and housekeeping workflows (reminders, backports, label sync) are not CI health.
    exclude: { type: "string", default: "reminder|assign|backport|re-?run|notify|optimi[sz]e|env\\.|label|release|stress" },
    "max-job-lookups": { type: "string", default: "300" },
    "timing-samples": { type: "string", default: "20" },
    out: { type: "string", default: "reports" },
  },
});

const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
if (!token) {
  console.error("Set GITHUB_TOKEN (any token; public data only). Example: GITHUB_TOKEN=$(gh auth token) npm run report");
  process.exit(2);
}

// Count API requests so the scheduled run can be checked against the Actions token's 1,000 per hour.
let requests = 0;
const realFetch = globalThis.fetch;
globalThis.fetch = (...args: Parameters<typeof fetch>) => { requests++; return realFetch(...args); };

const repo = values.repo!;
const exclude = new RegExp(values.exclude!, "i");
const now = new Date();
const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 1000);
const from = new Date(to.getTime() + 1000 - Number(values.days) * 86_400_000);
const day = (d: Date) => d.toISOString().slice(0, 10);
const common = { repo, token };

const names = await fetchWorkflowNames(common);
const runs = await loadRuns();
const summaries = summarizeWorkflows(runs, names);
const candidates = findFlips(runs, { exclude });

// A pass on a re-run is a flip only if the earlier attempt failed; cancelled attempts are re-run too.
const unconfirmed = candidates.filter((f) => !f.confirmed);
console.error(`Checking how the earlier attempt ended for ${unconfirmed.length} re-run passes…`);
const endings = await mapLimit(unconfirmed, 4, (f) => fetchAttemptConclusion({ ...common, runId: f.failedRunId, attempt: f.failedAttempt }));
const failedEarlier = new Set(unconfirmed.filter((_, i) => endings[i] === "failure"));
const flips = candidates.filter((f) => f.confirmed || failedEarlier.has(f));

// Round-robin across workflows, newest flip first, so one busy workflow cannot use the whole lookup budget.
const sampled = roundRobin(flips, Number(values["max-job-lookups"]));
console.error(`${runs.length} runs, ${flips.length} flips; reading failed jobs for ${sampled.length}…`);
const flakyJobs = countFlakyJobs(
  await mapLimit(sampled, 4, async (flip) => ({
    flip,
    jobs: await fetchFailedJobs({ ...common, runId: flip.failedRunId, attempt: flip.failedAttempt }),
  })),
);

console.error("Timing pull request runs from job timestamps…");
const timings = await timePullRequests(runs, Number(values["timing-samples"]));

const report = { repo, from: day(from), to: day(to), generatedAt: new Date().toISOString(), totalRuns: runs.length, summaries, timings, flips, flakyJobs, jobLookups: sampled.length };
mkdirSync(values.out!, { recursive: true });
const base = `${values.out}/${repo.replace("/", "-")}-${day(to)}`;
writeFileSync(`${base}.md`, renderReport(report));
writeFileSync(`${base}.json`, JSON.stringify({ ...report, timings: Object.fromEntries(timings) }, null, 2));
console.error(`Wrote ${base}.md after ${requests} API requests`);

async function loadRuns(): Promise<Run[]> {
  const cache = `.cache/${repo.replace("/", "-")}-${day(from)}-${day(to)}.json`;
  if (existsSync(cache)) return JSON.parse(readFileSync(cache, "utf8"));
  console.error(`Fetching completed runs for ${repo}, ${day(from)} to ${day(to)} (UTC)…`);
  // Six-hour windows keep most queries under GitHub's 1,000-result cap.
  const windows: { from: Date; to: Date }[] = [];
  for (let t = from.getTime(); t <= to.getTime(); t += 6 * 3_600_000) {
    windows.push({ from: new Date(t), to: new Date(Math.min(t + 6 * 3_600_000 - 1000, to.getTime())) });
  }
  const runs = (await mapLimit(windows, 4, (w) => fetchRuns({ ...common, ...w }))).flat();
  mkdirSync(".cache", { recursive: true });
  writeFileSync(cache, JSON.stringify(runs));
  return runs;
}

function roundRobin(all: Flip[], limit: number): Flip[] {
  const queues = new Map<string, Flip[]>();
  for (const f of [...all].sort((a, b) => b.failedRunId - a.failedRunId)) {
    queues.set(f.path, [...(queues.get(f.path) ?? []), f]);
  }
  const out: Flip[] = [];
  while (out.length < limit && [...queues.values()].some((q) => q.length)) {
    for (const q of queues.values()) if (q.length && out.length < limit) out.push(q.shift()!);
  }
  return out;
}

// First-attempt pull request runs only: re-runs and pushes to master would mix in other waits.
async function timePullRequests(all: Run[], perWorkflow: number): Promise<Map<string, TimingSummary>> {
  const byPath = new Map<string, Run[]>();
  for (const r of all) {
    if (r.event !== "pull_request" || r.run_attempt !== 1) continue;
    if (r.conclusion !== "success" && r.conclusion !== "failure") continue;
    if (exclude.test(r.path) || exclude.test(names.get(r.path) ?? r.name)) continue;
    byPath.set(r.path, [...(byPath.get(r.path) ?? []), r]);
  }
  const busiest = [...byPath.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 15);
  const out = new Map<string, TimingSummary>();
  for (const [path, list] of busiest) {
    const latest = list.sort((a, b) => b.id - a.id).slice(0, perWorkflow);
    const timed = await mapLimit(latest, 4, async (r) => jobTiming(r.created_at, await fetchJobs({ ...common, runId: r.id, attempt: 1 })));
    const valid = timed.filter((t): t is Timing => t !== null);
    if (valid.length) out.set(path, summarizeTimings(valid));
  }
  return out;
}
