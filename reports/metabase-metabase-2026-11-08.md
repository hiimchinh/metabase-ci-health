# CI health: metabase/metabase, 2026-11-02 to 2026-11-08

55514 completed runs · 417 commits flipped from fail to pass with no code change.
Generated 2026-11-09T09:27:32.055Z from the public GitHub Actions API. Failed jobs read for 300 of the 417 flips.

## Look here first

1. **Run tests**: 410 commits failed and then passed with no code change.
2. **e2e-tests / e2e-group-27-ee / e2e-tests-e2e-group-27-ee**: failed in 20 of those flips, the most of any job. Open its last failed log first.
3. **Run tests**: slowest at p95, 42.7 min from first job start to last job end. Pull requests wait on it.
4. **Mage Tests**: longest wait for a runner at p95, 4.3 min before the first job starts.

## Flaky jobs

Jobs that failed in an attempt whose commit later passed in the same workflow.

| Job | Flips | Workflow |
|---|---:|---|
| e2e-tests / e2e-group-27-ee / e2e-tests-e2e-group-27-ee | 20 | Run tests |
| app-db-tests / MariaDB Latest EE App DB Tests (Part 2) | 18 | Run tests |
| app-db-tests / Postgres Latest Enterprise Tests | 17 | Run tests |
| e2e-tests / e2e-group-28-ee / e2e-tests-e2e-group-28-ee | 16 | Run tests |
| app-db-tests / MySQL 9 EE App DB Tests (Part 2) | 13 | Run tests |
| driver-tests / Postgres 14.x Driver Tests Part 2 | 13 | Run tests |
| driver-tests / Redshift Transforms Python Tests | 13 | Run tests |
| e2e-tests / e2e-group-02-ee / e2e-tests-e2e-group-02-ee | 12 | Run tests |
| e2e-tests / e2e-group-26-ee / e2e-tests-e2e-group-26-ee | 12 | Run tests |
| app-db-tests / Postgres Latest EE App DB Tests (Part 2) | 11 | Run tests |
| loki-tests / loki-run | 11 | Run tests |
| loki-tests / visual-test | 11 | Run tests |
| backend-tests / Java 25 OSS App DB Tests (Part 2) | 10 | Run tests |
| driver-tests / Postgres Latest Driver Tests Part 2 | 10 | Run tests |
| driver-tests / SQL Server 2022 Driver Tests | 10 | Run tests |
| e2e-tests / oss-subset-oss / e2e-tests-oss-subset-oss | 10 | Run tests |
| app-db-tests / MySQL 8 EE App DB Tests (Part 2) | 9 | Run tests |
| app-db-tests / Postgres 14.x EE App DB Tests (Part 2) | 9 | Run tests |
| e2e-tests / e2e-group-20-ee / e2e-tests-e2e-group-20-ee | 9 | Run tests |
| frontend-tests / fe-tests-unit (1) | 9 | Run tests |
| app-db-tests / Postgres Latest EE App DB Tests (Part 3) | 8 | Run tests |
| backend-tests / Java 25 EE App DB Tests (Part 1) | 8 | Run tests |
| driver-tests / BigQuery Driver Tests 0 | 8 | Run tests |
| driver-tests / Redshift EE (Excluding Upload Tests) Part 1 | 8 | Run tests |
| driver-tests / Redshift OSS (Excluding Upload Tests) Part 1 | 8 | Run tests |

## Workflows

Flips and failure rate cover every run in the window. Timings come from job timestamps of the latest runs (sample size in the last column).

| Workflow | Runs | Fail | Flips | p50 min | p95 min | p95 queue min | Sample |
|---|---:|---:|---:|---:|---:|---:|---:|
| Run tests | 2744 | 34% | 410 | 35.7 | 42.7 | 0.1 | 20 |
| Cross-branch migration tests | 165 | 13% | 3 | 9.8 | 11.2 | 0.1 | 20 |
| Lint migrations | 3478 | 0% | 1 | 0.6 | 0.7 | 0.1 | 20 |
| Lint | 2748 | 2% | 1 | 9.2 | 10.1 | 0.2 | 20 |
| CLJS | 2746 | 0% | 1 | 0.4 | 0.5 | 0.2 | 20 |
| Serialization | 2572 | 1% | 1 | 0.4 | 0.4 | 0.1 | 20 |
| OpenAPI Check | 3211 | 0% | 0 | 3.8 | 4.2 | 0.9 | 7 |
| Chromatic Storybook deployment | 2912 | 0% | 0 | 0.4 | 0.4 | 0.1 | 20 |
| Check doc links | 2447 | 3% | 0 | 0.3 | 1.1 | 0.1 | 20 |
| PR Checks | 2445 | 3% | 0 | 0.1 | 0.2 | 0.1 | 20 |
| Mage Tests | 1071 | 3% | 0 | 4.4 | 5.3 | 4.3 | 20 |
| Build scripts | 78 | 0% | 0 | 0.9 | 2.2 | 0.6 | 20 |
| Check pre-resolved aliases | 78 | 0% | 0 | 0.3 | 0.6 | 0.3 | 20 |
| Cleanup caches by a branch | 35 | 0% | 0 | 0.2 | 0.2 | 0.1 | 20 |
| App DB snapshot tests | 9 | 11% | 0 | 3.9 | 4.4 | 1.4 | 7 |
