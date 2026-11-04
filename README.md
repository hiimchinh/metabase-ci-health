# metabase-ci-health

A weekly CI health report for [metabase/metabase](https://github.com/metabase/metabase), built only from public GitHub Actions data.

**Latest report:** [28 Oct to 3 Nov 2026](reports/metabase-metabase-2026-11-03.md). 366 commits failed and then passed with no code change, 352 of them in `Run tests`. The Loki visual tests failed in 35 of the 300 flips read, more than any other job.

## Why this exists

Metabase's CI Engineer posting asks for someone who will "keep the broader engineering team informed about the state of CI health without being asked" and who finds "patterns in flakiness before they erode confidence in the test suite" ([job post](https://jobs.lever.co/metabase/ee8203b5-2cf7-4eae-afd6-3f9724761ad9)). About 70 engineers wait on the same pipelines, so one flaky job costs re-runs, review time and trust, many times a day.

This repo is my first pass at that job from the outside. It answers three questions every week:

1. **Which jobs flip?** A commit that fails and then passes in the same workflow, with no code change, points at a flaky test or flaky infrastructure, not at the change. The report lists the jobs that failed in those attempts, ranked by how often.
2. **Where do pull requests wait?** p50 and p95 time per workflow from the first job start to the last job end, so the slow tail is visible, not hidden by the average.
3. **Where do runners run out?** p95 time from "run created" to "first job started", per workflow.

## Run it

Needs Node 22.18 or newer and any GitHub token (public data only). No dependencies.

```bash
GITHUB_TOKEN=$(gh auth token) node src/cli.ts --days 7
```

It writes `reports/metabase-metabase-<date>.md` and a `.json` with the raw figures. `--repo owner/name` runs it on any repository. A [scheduled workflow](.github/workflows/weekly-report.yml) regenerates the report every Monday and commits it.

```bash
node --test test/*.test.ts   # 22 tests, about 5 seconds
```

## What this proves for the role, and what it does not

It proves that I can read a large, unfamiliar CI setup through its data, define a flakiness signal that holds up (same commit, same workflow, different result), handle GitHub's API limits (the 1,000-result cap per query is split away automatically), and turn the numbers into a short list of where to look first.

It does not prove the fix. From outside I cannot see Metabase's quarantine decisions, the Cypress or Clojure test internals, or runner costs. A flip can also come from a real dependency outage that day. The report is a pointer for a human to open the failing job, not a verdict.

## How I would roll it out inside the team

1. **Baseline:** run it for two weeks without telling anyone, to learn the normal flip rate and p95 per workflow.
2. **Shadow:** post the weekly report in the CI channel, with the top three jobs and an owner suggestion for each. No gates yet.
3. **Gate:** once the numbers are trusted, fail the weekly check when a job's flip count rises above its baseline, and open an issue with the `.Test/Quarantined` label for a human to confirm.
4. **Kill switch:** the gate is one workflow; disabling it in the Actions UI stops it without touching any test.

## Method

- Data: `GET /repos/{repo}/actions/runs?status=completed&created=<window>`, in six-hour windows, four requests at a time. A window that still holds more than 1,000 runs is split in half until it fits.
- Workflow names come from `GET /actions/workflows`, because run names can carry PR titles and authors.
- Excluded: bot and housekeeping workflows (reminders, backports, label sync, release, stress tests; regex in `--exclude`) and runs not triggered by code (`schedule`, `workflow_dispatch`, comments). They are not CI health.
- Flip: the same workflow path and head SHA have both a failed and a successful run, or a run that passed on `run_attempt > 1` whose earlier attempt **failed** (checked with `GET /actions/runs/{id}/attempts/{n}`; a cancelled attempt that is re-run is not a flip). Failed job names come from `GET /actions/runs/{id}/attempts/{n}/jobs` for the failed attempt. Up to 300 flips are read, taken in turn from each workflow, newest first, so one busy workflow cannot fill the sample. Matrix summary jobs (`…-result`) are left out of the ranking, because they fail whenever a child job fails.
- Timing: the 15 busiest workflows on pull requests, the latest 20 first-attempt runs each. Run time is first job start to last job end; queue is run creation to first job start. Both come from job timestamps, because a run's `updated_at` moves when someone re-runs it days later. Both are wall-clock, not billed minutes.
- Percentiles use nearest rank.
- GitHub 5xx answers and dropped connections are retried five times, about 30 seconds in all. When the rate limit runs out, the client waits for the reset time.

## About me

I'm Chinh Hoang, a backend and full-stack engineer (Go, TypeScript, Postgres). I own the CI and deploy pipelines for the products I run: every pipeline has a wall-clock budget checked from GitHub's own run data, merges wait for green CI, and releases deploy with zero downtime. I built this repo with Claude Code for implementation and reviewed every change myself.
