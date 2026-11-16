# CI health: metabase/metabase, 2026-11-09 to 2026-11-15

47408 completed runs · 365 commits flipped from fail to pass with no code change.
Generated 2026-11-16T09:21:06.501Z from the public GitHub Actions API. Failed jobs read for 300 of the 365 flips.

## Look here first

1. **Run tests**: 352 commits failed and then passed with no code change.
2. **driver-tests / SQL Server 2022 Driver Tests**: failed in 31 of those flips, the most of any job. Open its last failed log first.
3. **Run tests**: slowest at p95, 37.1 min from first job start to last job end. Pull requests wait on it.
4. **JS Isolate (musl)**: longest wait for a runner at p95, 0.3 min before the first job starts.

## Flaky jobs

Jobs that failed in an attempt whose commit later passed in the same workflow.

| Job | Flips | Workflow |
|---|---:|---|
| driver-tests / SQL Server 2022 Driver Tests | 31 | Run tests |
| app-db-tests / Postgres Latest EE App DB Tests (Part 2) | 18 | Run tests |
| app-db-tests / Postgres Latest Enterprise Tests | 17 | Run tests |
| driver-tests / Redshift Transforms Python Tests | 14 | Run tests |
| app-db-tests / MariaDB Latest EE App DB Tests (Part 2) | 13 | Run tests |
| app-db-tests / MySQL 9 EE App DB Tests (Part 2) | 12 | Run tests |
| app-db-tests / Postgres Latest EE App DB Tests (Part 3) | 11 | Run tests |
| e2e-tests / oss-subset-oss / e2e-tests-oss-subset-oss | 11 | Run tests |
| loki-tests / loki-run | 11 | Run tests |
| loki-tests / visual-test | 10 | Run tests |
| backend-tests / Java 25 EE App DB Tests (Part 2) | 8 | Run tests |
| backend-tests / Java 25 OSS App DB Tests (Part 2) | 8 | Run tests |
| driver-tests / BigQuery Driver Tests 1 | 8 | Run tests |
| driver-tests / MotherDuck Driver Tests 1 | 8 | Run tests |
| e2e-tests / e2e-group-30-ee / e2e-tests-e2e-group-30-ee | 8 | Run tests |
| frontend-tests / fe-tests-unit (1) | 8 | Run tests |
| i18n | 8 | Lint |
| app-db-tests / Postgres 14.x EE App DB Tests (Part 2) | 7 | Run tests |
| driver-tests / Athena Driver Tests 0 | 7 | Run tests |
| e2e-tests / e2e-group-10-ee / e2e-tests-e2e-group-10-ee | 7 | Run tests |
| e2e-tests / e2e-group-18-ee / e2e-tests-e2e-group-18-ee | 7 | Run tests |
| e2e-tests / e2e-group-21-ee / e2e-tests-e2e-group-21-ee | 7 | Run tests |
| e2e-tests / e2e-group-26-ee / e2e-tests-e2e-group-26-ee | 7 | Run tests |
| e2e-tests / e2e-group-31-ee / e2e-tests-e2e-group-31-ee | 7 | Run tests |
| backend-tests / Java 25 EE App DB Tests (Part 1) | 6 | Run tests |

## Workflows

Flips and failure rate cover every run in the window. Timings come from job timestamps of the latest runs (sample size in the last column).

| Workflow | Runs | Fail | Flips | p50 min | p95 min | p95 queue min | Sample |
|---|---:|---:|---:|---:|---:|---:|---:|
| Run tests | 2381 | 34% | 352 | 32.8 | 37.1 | 0.1 | 20 |
| Lint | 2368 | 5% | 8 | 8.1 | 10.2 | 0.1 | 20 |
| Chromatic Storybook deployment | 2502 | 0% | 2 | 0.3 | 0.4 | 0.1 | 20 |
| Lint migrations | 2971 | 1% | 1 | 0.6 | 0.7 | 0.1 | 20 |
| Serialization | 2261 | 0% | 1 | 0.4 | 0.5 | 0.1 | 20 |
| Cross-branch migration tests | 150 | 7% | 1 | 9.9 | 10.6 | 0.1 | 20 |
| CLJS | 2374 | 1% | 0 | 0.4 | 2.7 | 0.2 | 20 |
| Check doc links | 2109 | 1% | 0 | 1 | 1.1 | 0.1 | 20 |
| PR Checks | 2103 | 2% | 0 | 0.2 | 0.3 | 0.1 | 20 |
| Mage Tests | 194 | 0% | 0 | 4.5 | 5.6 | 0.1 | 20 |
| Check pre-resolved aliases | 52 | 2% | 0 | 0.3 | 0.5 | 0.2 | 20 |
| Build scripts | 51 | 2% | 0 | 1 | 2.5 | 0.1 | 20 |
| Cleanup caches by a branch | 19 | 5% | 0 | 0.2 | 0.4 | 0.2 | 18 |
| Minimal Tests | 16 | 0% | 0 | 0.2 | 0.2 | 0.1 | 12 |
| JS Isolate (musl) | 10 | 80% | 0 | 5.6 | 6.9 | 0.3 | 8 |
