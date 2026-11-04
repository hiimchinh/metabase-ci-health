# CI health: metabase/metabase, 2026-10-28 to 2026-11-03

49662 completed runs · 365 commits flipped from fail to pass with no code change.
Generated 2026-11-04T15:33:42.615Z from the public GitHub Actions API. Failed jobs read for 150 of the 365 flips.

## Look here first

1. **Run tests**: 352 commits failed and then passed with no code change.
2. **loki-tests / loki-run**: failed in 18 of those flips, the most of any job. Open its last failed log first.
3. **Run tests**: slowest at p95, 48 min from first job start to last job end. Pull requests wait on it.
4. **Cross-branch migration tests**: longest wait for a runner at p95, 1.5 min before the first job starts.

## Flaky jobs

Jobs that failed in an attempt whose commit later passed in the same workflow.

| Job | Flips | Workflow |
|---|---:|---|
| loki-tests / loki-run | 18 | Run tests |
| loki-tests / visual-test | 18 | Run tests |
| app-db-tests / MySQL 9 EE App DB Tests (Part 2) | 8 | Run tests |
| e2e-tests / e2e-group-24-ee / e2e-tests-e2e-group-24-ee | 8 | Run tests |
| e2e-tests / e2e-group-25-ee / e2e-tests-e2e-group-25-ee | 8 | Run tests |
| e2e-tests / e2e-group-32-ee / e2e-tests-e2e-group-32-ee | 8 | Run tests |
| lint | 8 | Lint |
| app-db-tests / Postgres Latest EE App DB Tests (Part 2) | 7 | Run tests |
| e2e-tests / e2e-group-34-ee / e2e-tests-e2e-group-34-ee | 7 | Run tests |
| e2e-tests / oss-subset-oss / e2e-tests-oss-subset-oss | 7 | Run tests |
| app-db-tests / MySQL 8 EE App DB Tests (Part 2) | 6 | Run tests |
| app-db-tests / Postgres 14.x EE App DB Tests (Part 2) | 5 | Run tests |
| app-db-tests / Postgres Latest Enterprise Tests | 5 | Run tests |
| e2e-tests / e2e-group-10-ee / e2e-tests-e2e-group-10-ee | 5 | Run tests |
| app-db-tests / Postgres 14.x EE App DB Tests (Part 3) | 4 | Run tests |
| app-db-tests / Postgres Latest EE App DB Tests (Part 3) | 4 | Run tests |
| e2e-tests / e2e-group-30-ee / e2e-tests-e2e-group-30-ee | 4 | Run tests |
| app-db-tests / MariaDB 10.6 EE App DB Tests (Part 2) | 3 | Run tests |
| app-db-tests / MariaDB Latest EE App DB Tests (Part 2) | 3 | Run tests |
| app-db-tests / MariaDB Latest Enterprise Tests | 3 | Run tests |
| backend-tests / Java 25 EE App DB Tests (Part 2) | 3 | Run tests |
| driver-tests / BigQuery Driver Tests 1 | 3 | Run tests |
| driver-tests / Postgres 14.x Transforms Python Tests | 3 | Run tests |
| driver-tests / Snowflake Driver Tests 1 | 3 | Run tests |
| driver-tests / SQL Server 2022 Driver Tests | 3 | Run tests |

## Workflows

Flips and failure rate cover every run in the window. Timings come from job timestamps of the latest runs (sample size in the last column).

| Workflow | Runs | Fail | Flips | p50 min | p95 min | p95 queue min | Sample |
|---|---:|---:|---:|---:|---:|---:|---:|
| Run tests | 2365 | 29% | 352 | 7.4 | 48 | 0.2 | 10 |
| Lint | 2322 | 3% | 8 | 9.7 | 11.2 | 1.1 | 10 |
| Cross-branch migration tests | 124 | 10% | 2 | 12.4 | 15 | 1.5 | 10 |
| CLJS | 2366 | 0% | 1 | 0.4 | 2.5 | 0.1 | 10 |
| PR Checks | 2016 | 5% | 1 | 0.2 | 0.2 | 0.3 | 10 |
| Update Loki Snapshots | 679 | 0% | 1 | – | – | – | – |
| Lint migrations | 3033 | 0% | 0 | 0.6 | 0.7 | 0.1 | 10 |
| Chromatic Storybook deployment | 2433 | 0% | 0 | 0.4 | 0.5 | 0.2 | 10 |
| Serialization | 2165 | 0% | 0 | 0.4 | 0.5 | 0.9 | 10 |
| Check doc links | 2054 | 3% | 0 | 1.1 | 1.8 | 0.1 | 10 |
| Mage Tests | 1997 | 2% | 0 | 4.3 | 6.5 | 0.1 | 10 |
| Check pre-resolved aliases | 167 | 0% | 0 | 0.8 | 1.9 | 0.3 | 10 |
| Build scripts | 167 | 0% | 0 | 1.3 | 4.2 | 0.1 | 10 |
| Minimal Tests | 54 | 0% | 0 | 0.2 | 0.4 | 0.2 | 10 |
| Add Issue References to PR | 42 | 0% | 0 | 0.3 | 0.3 | 0.1 | 10 |
| Loki Visual Regression Testing | 38 | 0% | 0 | 0.2 | 0.4 | 0.1 | 10 |
