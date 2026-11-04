import { test } from "node:test";
import assert from "node:assert/strict";
import { countFlakyJobs, lookHereFirst, renderReport } from "../src/report.ts";
import type { WorkflowSummary, Flip, TimingSummary } from "../src/stats.ts";

const wf = (p: Partial<WorkflowSummary>): WorkflowSummary => ({ name: "W", path: "w.yml", runs: 10, failures: 0, cancelled: 0, ...p });
const tm = (p: Partial<TimingSummary>): TimingSummary => ({ samples: 40, p50Minutes: 5, p95Minutes: 10, p95QueueMinutes: 0, ...p });
const flip = (workflow: string, id: number): Flip => ({ workflow, path: `${workflow}.yml`, head_sha: String(id), failedRunId: id, failedAttempt: 1, confirmed: true });

test("countFlakyJobs ranks job names by how many flips they failed in", () => {
  const counts = countFlakyJobs([
    { flip: flip("E2E", 1), jobs: ["e2e (3)", "e2e (7)"] },
    { flip: flip("E2E", 2), jobs: ["e2e (3)"] },
    { flip: flip("Backend", 3), jobs: ["be-tests-mysql"] },
  ]);
  assert.deepEqual(counts.map((c) => [c.job, c.flips, c.workflows.join(",")]), [
    ["e2e (3)", 2, "E2E"], ["be-tests-mysql", 1, "Backend"], ["e2e (7)", 1, "E2E"],
  ]);
});

test("lookHereFirst: most-flipping workflow, its top job, slowest p95, longest queue", () => {
  const items = lookHereFirst({
    summaries: [wf({ name: "E2E", path: "E2E.yml" }), wf({ name: "Backend", path: "Backend.yml" }), wf({ name: "Drivers", path: "Drivers.yml" })],
    timings: new Map([["E2E.yml", tm({ p95Minutes: 40, p95QueueMinutes: 1 })], ["Backend.yml", tm({ p95Minutes: 55, p95QueueMinutes: 2 })], ["Drivers.yml", tm({ p95Minutes: 20, p95QueueMinutes: 9 })]]),
    flips: [flip("E2E", 1), flip("E2E", 2), flip("Backend", 3)],
    flakyJobs: [{ job: "e2e (3)", flips: 2, workflows: ["E2E"] }],
  });
  assert.deepEqual(items, [
    "**E2E**: 2 commits failed and then passed with no code change.",
    "**e2e (3)**: failed in 2 of those flips, the most of any job. Open its last failed log first.",
    "**Backend**: slowest at p95, 55 min from first job start to last job end. Pull requests wait on it.",
    "**Drivers**: longest wait for a runner at p95, 9 min before the first job starts.",
  ]);
});

test("renderReport states the window, totals and the sampling in the first lines", () => {
  const md = renderReport({
    repo: "metabase/metabase", from: "2026-10-28", to: "2026-11-03", generatedAt: "2026-11-04T03:00:00Z",
    totalRuns: 20, summaries: [wf({ name: "E2E", path: "E2E.yml", runs: 20 })], timings: new Map(), flips: [flip("E2E", 1)], flakyJobs: [], jobLookups: 1,
  });
  assert.match(md, /^# CI health: metabase\/metabase, 2026-10-28 to 2026-11-03\n/);
  assert.match(md, /20 completed runs · 1 commit flipped from fail to pass with no code change/);
});

test("countFlakyJobs leaves out summary jobs that only repeat a child job's failure", () => {
  const counts = countFlakyJobs([
    { flip: flip("Run tests", 1), jobs: ["e2e-tests / e2e-group-24-ee", "e2e-tests / e2e-tests-result"] },
    { flip: flip("Run tests", 2), jobs: ["driver-tests / drivers-tests-result"] },
  ]);
  assert.deepEqual(counts.map((c) => c.job), ["e2e-tests / e2e-group-24-ee"]);
});
