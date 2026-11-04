import { test } from "node:test";
import assert from "node:assert/strict";
import { percentile, summarizeWorkflows, findFlips, type Run } from "../src/stats.ts";

const t = (min: number) => new Date(Date.UTC(2026, 10, 1, 0, min)).toISOString();
const run = (p: Partial<Run>): Run => ({
  id: 1, name: "Backend", path: ".github/workflows/backend.yml", event: "pull_request",
  head_sha: "a", conclusion: "success", run_attempt: 1,
  created_at: t(0), run_started_at: t(0), updated_at: t(10), ...p,
});

test("percentile uses nearest-rank on sorted values", () => {
  assert.equal(percentile([5, 1, 3, 2, 4], 50), 3);
  assert.equal(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 95), 10);
  assert.equal(percentile([], 50), 0);
});

test("summarizeWorkflows counts outcomes per workflow and prefers the registered workflow name", () => {
  const runs = [
    run({ id: 1, name: "Building PR env for 85629 by @someone", path: ".github/workflows/env.create.yml" }),
    run({ id: 2, name: "Building PR env for 85630 by @other", path: ".github/workflows/env.create.yml", conclusion: "failure" }),
    run({ id: 3, name: "Building PR env for 85631 by @other", path: ".github/workflows/env.create.yml", conclusion: "cancelled" }),
    run({ id: 5, name: "Lint", path: ".github/workflows/lint.yml" }),
  ];
  const [env, lint] = summarizeWorkflows(runs, new Map([[".github/workflows/env.create.yml", "Create PR environment"]]));
  assert.deepEqual(env, { name: "Create PR environment", path: ".github/workflows/env.create.yml", runs: 3, failures: 1, cancelled: 1 });
  assert.equal(lint.name, "Lint");
});

test("summarizeTimings gives nearest-rank p50/p95 for duration and queue", async () => {
  const { summarizeTimings } = await import("../src/stats.ts");
  const s = summarizeTimings([
    { minutes: 10, queueMinutes: 0 }, { minutes: 20, queueMinutes: 1 }, { minutes: 30, queueMinutes: 2 }, { minutes: 40, queueMinutes: 9 },
  ]);
  assert.deepEqual(s, { samples: 4, p50Minutes: 20, p95Minutes: 40, p95QueueMinutes: 9 });
});

test("findFlips flags a commit that failed and then passed in the same workflow", () => {
  const runs = [
    run({ id: 10, head_sha: "x", conclusion: "failure" }),
    run({ id: 11, head_sha: "x", conclusion: "success" }),
    run({ id: 12, head_sha: "y", conclusion: "failure" }), // real failure, never passed
    run({ id: 13, head_sha: "z", conclusion: "success", run_attempt: 2 }), // passed only on re-run
    run({ id: 14, head_sha: "x", name: "Lint", path: ".github/workflows/lint.yml", conclusion: "success" }),
  ];
  const flips = findFlips(runs);
  assert.deepEqual(
    flips.map((f) => [f.workflow, f.head_sha, f.failedRunId, f.failedAttempt]),
    [["Backend", "x", 10, 1], ["Backend", "z", 13, 1]],
  );
});

test("findFlips ignores bot workflows and events that do not test code", async () => {
  const { findFlips: ff } = await import("../src/stats.ts");
  const runs = [
    run({ id: 20, head_sha: "b", conclusion: "failure", path: ".github/workflows/backport-reminder.yml", name: "Backport Reminder" }),
    run({ id: 21, head_sha: "b", conclusion: "success", path: ".github/workflows/backport-reminder.yml", name: "Backport Reminder" }),
    run({ id: 22, head_sha: "c", conclusion: "failure", event: "workflow_run" }),
    run({ id: 23, head_sha: "c", conclusion: "success", event: "workflow_run" }),
    run({ id: 24, head_sha: "d", conclusion: "failure", event: "merge_group" }),
    run({ id: 25, head_sha: "d", conclusion: "success", event: "merge_group" }),
  ];
  assert.deepEqual(ff(runs, { exclude: /reminder/i }).map((f) => f.failedRunId), [24]);
});

test("jobTiming measures from first job start to last job end, and queue from run creation", async () => {
  const { jobTiming } = await import("../src/stats.ts");
  const timing = jobTiming(t(0), [
    { started_at: t(3), completed_at: t(10) },
    { started_at: t(5), completed_at: t(25) },
    { started_at: null, completed_at: null }, // skipped job
  ]);
  assert.deepEqual(timing, { minutes: 22, queueMinutes: 3 });
  assert.equal(jobTiming(t(0), [{ started_at: null, completed_at: null }]), null);
});

test("findFlips marks a failed-then-passed pair as confirmed, a re-run pass as still to confirm", () => {
  const runs = [
    run({ id: 30, head_sha: "p", conclusion: "failure" }),
    run({ id: 31, head_sha: "p", conclusion: "success" }),
    // The earlier attempt may have been cancelled, not failed; the run list cannot tell.
    run({ id: 32, head_sha: "q", conclusion: "success", run_attempt: 2 }),
  ];
  assert.deepEqual(findFlips(runs).map((f) => [f.failedRunId, f.confirmed]), [[30, true], [32, false]]);
});
