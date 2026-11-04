import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchRuns, fetchFailedJobs } from "../src/github.ts";

// Fake GitHub: 1,500 runs spread over 15 hours, one per 36 s. The API refuses to page past
// 1,000 results per query, so the client has to split the window itself.
const start = Date.parse("2026-11-01T00:00:00Z");
const all = Array.from({ length: 1500 }, (_, i) => ({
  id: i + 1, name: "Backend", path: "p", event: "push", head_sha: String(i), conclusion: "success",
  run_attempt: 1, status: "completed",
  created_at: new Date(start + i * 36_000).toISOString(),
  run_started_at: new Date(start + i * 36_000).toISOString(),
  updated_at: new Date(start + i * 36_000 + 60_000).toISOString(),
}));

function fakeFetch(calls: string[]) {
  return async (url: string) => {
    calls.push(url);
    const u = new URL(url);
    const [from, to] = u.searchParams.get("created")!.split("..").map(Date.parse);
    const page = Number(u.searchParams.get("page"));
    const per = Number(u.searchParams.get("per_page"));
    const hits = all.filter((r) => { const c = Date.parse(r.created_at); return c >= from && c <= to; });
    if (page * per > 1000) return new Response(JSON.stringify({ message: "Only the first 1000 search results are available" }), { status: 422 });
    const body = { total_count: hits.length, workflow_runs: hits.slice((page - 1) * per, page * per) };
    return new Response(JSON.stringify(body), { status: 200 });
  };
}

test("fetchRuns returns every run once even when a window holds more than 1,000", async () => {
  const calls: string[] = [];
  const runs = await fetchRuns({
    repo: "metabase/metabase", from: new Date(start), to: new Date(start + 15 * 3600_000 - 1000),
    token: "t", fetchImpl: fakeFetch(calls),
  });
  assert.equal(runs.length, 1500);
  assert.equal(new Set(runs.map((r) => r.id)).size, 1500);
  assert.ok(calls.every((c) => !c.includes("page=11")), "never asks past the 1,000 cap");
});

test("fetchFailedJobs returns names of failed jobs for one attempt", async () => {
  const fetchImpl = async (url: string) => {
    assert.match(url, /\/actions\/runs\/42\/attempts\/1\/jobs/);
    return new Response(JSON.stringify({ jobs: [
      { name: "be-tests-postgres", conclusion: "failure" },
      { name: "lint", conclusion: "success" },
      { name: "e2e (3)", conclusion: "failure" },
    ] }), { status: 200 });
  };
  assert.deepEqual(await fetchFailedJobs({ repo: "metabase/metabase", runId: 42, attempt: 1, token: "t", fetchImpl }), ["be-tests-postgres", "e2e (3)"]);
});

test("mapLimit keeps input order and never runs more than the limit at once", async () => {
  const { mapLimit } = await import("../src/github.ts");
  let inFlight = 0, peak = 0;
  const out = await mapLimit([30, 10, 20, 5, 1], 2, async (ms) => {
    inFlight++; peak = Math.max(peak, inFlight);
    await new Promise((r) => setTimeout(r, ms));
    inFlight--;
    return ms * 2;
  });
  assert.deepEqual(out, [60, 20, 40, 10, 2]);
  assert.equal(peak, 2);
});

test("fetchWorkflowNames maps workflow file paths to their registered names", async () => {
  const { fetchWorkflowNames } = await import("../src/github.ts");
  const fetchImpl = async (url: string) => {
    assert.match(url, /\/actions\/workflows\?per_page=100&page=1$/);
    return new Response(JSON.stringify({ total_count: 2, workflows: [
      { path: ".github/workflows/run-tests.yml", name: "Run tests" },
      { path: ".github/workflows/env.create.yml", name: "Create PR environment" },
    ] }), { status: 200 });
  };
  const names = await fetchWorkflowNames({ repo: "metabase/metabase", token: "t", fetchImpl });
  assert.equal(names.get(".github/workflows/env.create.yml"), "Create PR environment");
  assert.equal(names.size, 2);
});

test("fetchJobs returns name, conclusion and timestamps for one attempt", async () => {
  const { fetchJobs } = await import("../src/github.ts");
  const fetchImpl = async () => new Response(JSON.stringify({ jobs: [
    { name: "lint", conclusion: "success", started_at: "2026-11-01T00:01:00Z", completed_at: "2026-11-01T00:05:00Z", id: 9 },
  ] }), { status: 200 });
  assert.deepEqual(await fetchJobs({ repo: "r/r", runId: 1, attempt: 1, token: "t", fetchImpl }), [
    { name: "lint", conclusion: "success", started_at: "2026-11-01T00:01:00Z", completed_at: "2026-11-01T00:05:00Z" },
  ]);
});

test("a GitHub 5xx is retried; the next good answer is used", async () => {
  const { fetchJobs } = await import("../src/github.ts");
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    if (calls === 1) return new Response('{"message":"Server Error"}', { status: 502 });
    return new Response(JSON.stringify({ jobs: [{ name: "lint", conclusion: "failure", started_at: null, completed_at: null }] }), { status: 200 });
  };
  const jobs = await fetchJobs({ repo: "r/r", runId: 1, attempt: 1, token: "t", fetchImpl });
  assert.equal(calls, 2);
  assert.equal(jobs[0].name, "lint");
});

test("a GitHub 404 is not retried", async () => {
  const { fetchJobs } = await import("../src/github.ts");
  let calls = 0;
  const fetchImpl = async () => { calls++; return new Response('{"message":"Not Found"}', { status: 404 }); };
  await assert.rejects(fetchJobs({ repo: "r/r", runId: 1, attempt: 1, token: "t", fetchImpl }), /GitHub 404/);
  assert.equal(calls, 1);
});

test("fetchJobs reads every page of a run with more jobs than one page holds", async () => {
  const { fetchJobs } = await import("../src/github.ts");
  const jobs = Array.from({ length: 120 }, (_, i) => ({ name: `job ${i}`, conclusion: "success", started_at: null, completed_at: null }));
  const fetchImpl = async (url: string) => {
    const u = new URL(url);
    const perPage = Number(u.searchParams.get("per_page"));
    if (perPage > 50) return new Response('{"message":"Server Error"}', { status: 502 }); // what GitHub does on a 199-job run
    const page = Number(u.searchParams.get("page") ?? "1");
    return new Response(JSON.stringify({ total_count: 120, jobs: jobs.slice((page - 1) * perPage, page * perPage) }), { status: 200 });
  };
  const got = await fetchJobs({ repo: "r/r", runId: 1, attempt: 1, token: "t", fetchImpl });
  assert.equal(got.length, 120);
  assert.equal(got[119].name, "job 119");
});

test("a connection dropped mid-answer is retried", async () => {
  const { fetchJobs } = await import("../src/github.ts");
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    if (calls === 1) throw new TypeError("terminated"); // undici: "other side closed"
    return new Response(JSON.stringify({ total_count: 1, jobs: [{ name: "lint", conclusion: "failure", started_at: null, completed_at: null }] }), { status: 200 });
  };
  const jobs = await fetchJobs({ repo: "r/r", runId: 1, attempt: 1, token: "t", fetchImpl });
  assert.equal(calls, 2);
  assert.equal(jobs.length, 1);
});

test("fetchAttemptConclusion reads how one attempt of a run ended", async () => {
  const { fetchAttemptConclusion } = await import("../src/github.ts");
  const urls: string[] = [];
  const fetchImpl = async (url: string) => { urls.push(url); return new Response(JSON.stringify({ id: 7, run_attempt: 1, conclusion: "cancelled" }), { status: 200 }); };
  assert.equal(await fetchAttemptConclusion({ repo: "r/r", runId: 7, attempt: 1, token: "t", fetchImpl }), "cancelled");
  assert.match(urls[0], /\/repos\/r\/r\/actions\/runs\/7\/attempts\/1$/);
});

test("an exhausted rate limit waits for the reset time and then retries", async () => {
  const { fetchJobs } = await import("../src/github.ts");
  let calls = 0;
  const reset = String(Math.ceil(Date.now() / 1000) + 1);
  const fetchImpl = async () => {
    calls++;
    if (calls === 1) {
      return new Response('{"message":"API rate limit exceeded"}', { status: 403, headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": reset } });
    }
    return new Response(JSON.stringify({ total_count: 1, jobs: [{ name: "lint", conclusion: "failure", started_at: null, completed_at: null }] }), { status: 200 });
  };
  const started = Date.now();
  const jobs = await fetchJobs({ repo: "r/r", runId: 1, attempt: 1, token: "t", fetchImpl });
  assert.equal(jobs.length, 1);
  assert.ok(Date.now() >= Number(reset) * 1000, "must not retry before the reset time");
  assert.ok(Date.now() - started < 5000);
});
