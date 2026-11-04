# CI health: metabase/metabase, 2026-10-28 to 2026-11-03

49662 completed runs · 366 commits flipped from fail to pass with no code change.
Generated 2026-11-04T15:22:47.087Z from the public GitHub Actions API. Failed jobs read for 300 of the 366 flips.

## Look here first

1. **Run tests**: 352 commits failed and then passed with no code change.
2. **loki-tests / visual-test**: failed in 35 of those flips, the most of any job. Open its last failed log first.
3. **Run tests**: slowest at p95, 46.4 min from first job start to last job end. Pull requests wait on it.
4. **Cross-branch migration tests**: longest wait for a runner at p95, 1.5 min before the first job starts.

## Flaky jobs

Jobs that failed in an attempt whose commit later passed in the same workflow.

| Job | Flips | Workflow |
|---|---:|---|
| loki-tests / visual-test | 35 | Run tests |
| loki-tests / loki-run | 34 | Run tests |
| app-db-tests / MariaDB Latest EE App DB Tests (Part 2) | 14 | Run tests |
| app-db-tests / MySQL 9 EE App DB Tests (Part 2) | 14 | Run tests |
| e2e-tests / e2e-group-25-ee / e2e-tests-e2e-group-25-ee | 14 | Run tests |
| e2e-tests / e2e-group-34-ee / e2e-tests-e2e-group-34-ee | 14 | Run tests |
| e2e-tests / oss-subset-oss / e2e-tests-oss-subset-oss | 14 | Run tests |
| app-db-tests / Postgres Latest EE App DB Tests (Part 2) | 13 | Run tests |
| e2e-tests / e2e-group-03-ee / e2e-tests-e2e-group-03-ee | 13 | Run tests |
| e2e-tests / e2e-group-24-ee / e2e-tests-e2e-group-24-ee | 13 | Run tests |
| e2e-tests / e2e-group-30-ee / e2e-tests-e2e-group-30-ee | 12 | Run tests |
| e2e-tests / e2e-group-32-ee / e2e-tests-e2e-group-32-ee | 12 | Run tests |
| app-db-tests / Postgres 14.x EE App DB Tests (Part 3) | 11 | Run tests |
| e2e-tests / e2e-group-18-ee / e2e-tests-e2e-group-18-ee | 11 | Run tests |
| driver-tests / BigQuery Driver Tests 1 | 10 | Run tests |
| e2e-tests / e2e-group-02-ee / e2e-tests-e2e-group-02-ee | 10 | Run tests |
| e2e-tests / e2e-group-10-ee / e2e-tests-e2e-group-10-ee | 9 | Run tests |
| e2e-tests / e2e-group-22-ee / e2e-tests-e2e-group-22-ee | 9 | Run tests |
| e2e-tests / e2e-group-29-ee / e2e-tests-e2e-group-29-ee | 9 | Run tests |
| lint | 9 | Lint |
| app-db-tests / MySQL 8 EE App DB Tests (Part 2) | 8 | Run tests |
| app-db-tests / Postgres 14.x EE App DB Tests (Part 2) | 8 | Run tests |
| app-db-tests / Postgres Latest EE App DB Tests (Part 3) | 8 | Run tests |
| backend-tests / Java 25 OSS App DB Tests (Part 1) | 8 | Run tests |
| e2e-tests / e2e-group-07-ee / e2e-tests-e2e-group-07-ee | 8 | Run tests |

## Workflows

Flips and failure rate cover every run in the window. Timings come from job timestamps of the latest runs (sample size in the last column).

| Workflow | Runs | Fail | Flips | p50 min | p95 min | p95 queue min | Sample |
|---|---:|---:|---:|---:|---:|---:|---:|
| Run tests | 2365 | 29% | 352 | 34.6 | 46.4 | 0.1 | 20 |
| Lint | 2322 | 3% | 9 | 9.6 | 11.2 | 1.1 | 20 |
| Cross-branch migration tests | 124 | 10% | 2 | 11.1 | 14.7 | 1.5 | 20 |
| CLJS | 2366 | 0% | 1 | 0.4 | 0.6 | 0.1 | 20 |
| PR Checks | 2016 | 5% | 1 | 0.2 | 0.3 | 0.2 | 20 |
| Update Loki Snapshots | 679 | 0% | 1 | – | – | – | – |
| Lint migrations | 3033 | 0% | 0 | 0.6 | 0.7 | 0.1 | 20 |
| Chromatic Storybook deployment | 2433 | 0% | 0 | 0.4 | 0.6 | 0.2 | 20 |
| Serialization | 2165 | 0% | 0 | 0.5 | 0.9 | 0.4 | 20 |
| Check doc links | 2054 | 3% | 0 | 1.1 | 1.8 | 0.1 | 20 |
| Mage Tests | 1997 | 2% | 0 | 4.4 | 6.5 | 0.1 | 20 |
| Check pre-resolved aliases | 167 | 0% | 0 | 0.6 | 1.8 | 0.2 | 20 |
| Build scripts | 167 | 0% | 0 | 1.1 | 3.3 | 0.1 | 20 |
| Minimal Tests | 54 | 0% | 0 | 0.2 | 0.2 | 0.1 | 20 |
| Add Issue References to PR | 42 | 0% | 0 | 0.3 | 0.3 | 0.1 | 20 |
| Loki Visual Regression Testing | 38 | 0% | 0 | 0.3 | 0.4 | 0.2 | 20 |
