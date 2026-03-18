# Test Coverage Report

> Last updated: 2026-03-18
> All tests passing: 874/874

## Summary

| Package/App             | Test Files | Tests   | Status          |
| ----------------------- | ---------- | ------- | --------------- |
| `apps/web` (API routes) | 5          | 93      | All passing     |
| `apps/workers`          | 2          | 29      | All passing     |
| `packages/actions`      | 26         | 665     | All passing     |
| `packages/db`           | 4          | 68      | All passing     |
| `packages/auth`         | 1          | 7       | All passing     |
| `packages/ui`           | 1          | 10      | All passing     |
| **Total**               | **39**     | **874** | **All passing** |

## Test Files by Package

### apps/web (API Route Tests)

| File                      | Tests | Covers                                                                  |
| ------------------------- | ----- | ----------------------------------------------------------------------- |
| `accounts.test.ts`        | 17    | Account CRUD, caching (setex), Cache-Control headers, platform handlers |
| `categories.test.ts`      | 16    | Category listing, hierarchy, popular categories, caching (setex)        |
| `metadata.test.ts`        | 8     | URL metadata extraction                                                 |
| `reviews.test.ts`         | 38    | Review CRUD, pagination, filtering                                      |
| `search-accounts.test.ts` | 14    | ES search, filters, pagination, sort, Cache-Control                     |

### apps/workers (Processor + Route Tests)

| File                    | Tests | Covers                                                                                             |
| ----------------------- | ----- | -------------------------------------------------------------------------------------------------- |
| `processors.test.ts`    | 18    | Review rating calculation, MongoDB aggregation, Redis cache update, ES elastic update, retry logic |
| `clerk-webhook.test.ts` | 11    | Svix verification, Pub/Sub publishing, error handling, header validation                           |

### packages/db (Client Tests)

| File                           | Tests | Covers                                                                         |
| ------------------------------ | ----- | ------------------------------------------------------------------------------ |
| `elasticsearch-client.test.ts` | 42    | Search, CRUD, function_score query, AND semantics, sort, facets, range parsing |
| `mongo-client.test.ts`         | 8     | Connection, singleton, error handling                                          |
| `redis-client.test.ts`         | 10    | Connection, TLS, error handling                                                |
| `text-number-format.test.ts`   | 8     | Number formatting utilities                                                    |

### packages/actions (Server Action Tests)

| File                                 | Tests | Covers                                                                        |
| ------------------------------------ | ----- | ----------------------------------------------------------------------------- |
| `addAccount.test.ts`                 | 15    | Account creation, Pub/Sub publishing                                          |
| `analytics.test.ts`                  | 12    | Analytics data fetching                                                       |
| `author.test.ts`                     | 9     | Author creation, findFirst, update                                            |
| `cache.test.ts`                      | 14    | Hybrid cache (local + Redis), TTL, invalidation                               |
| `calendar.test.ts`                   | 8     | Calendar data                                                                 |
| `categoryActions.test.ts`            | 18    | Category CRUD, hierarchy, caching                                             |
| `claimAccount.test.ts`               | 12    | Account claiming flow                                                         |
| `commentActions.test.ts`             | 35    | Comments CRUD, threading, voting                                              |
| `contactAction.test.ts`              | 8     | Contact form submission                                                       |
| `createReview.test.ts`               | 22    | Review creation, Pub/Sub, Redis cache invalidation                            |
| `creatorActions.test.ts`             | 45    | Creator profiles, YouTube refresh trigger, caching                            |
| `crudPosts.test.ts`                  | 21    | Blog post CRUD                                                                |
| `crudTags.test.ts`                   | 15    | Tag management                                                                |
| `dashboard.test.ts`                  | 12    | Dashboard stats                                                               |
| `ensureCreatorRole.test.ts`          | 8     | Role assignment                                                               |
| `fetchPosts.test.ts`                 | 18    | Post fetching, pagination                                                     |
| `fetchReviewsActions.test.ts`        | 25    | Review fetching, filtering, author inclusion                                  |
| `members.test.ts`                    | 10    | Member management                                                             |
| `metadata.test.ts`                   | 15    | URL metadata parsing                                                          |
| `mostPopularCategoryActions.test.ts` | 20    | Multi-layer caching (local + Redis), parallel category fetch, MongoDB lookups |
| `roles.test.ts`                      | 8     | Role checks                                                                   |
| `searchCreator.test.ts`              | 12    | ES search integration                                                         |
| `translate.test.ts`                  | 8     | Translation actions                                                           |
| `uploadCrud.test.ts`                 | 10    | File upload                                                                   |
| `voteActions.test.ts`                | 30    | Vote CRUD, counts, toggle                                                     |
| `youtubeRefresh.test.ts`             | 13    | Rate limiting, YouTube API fetch, DB update, cache invalidation               |

### packages/auth

| File            | Tests | Covers         |
| --------------- | ----- | -------------- |
| `roles.test.ts` | 7     | Role utilities |

### packages/ui

| File                       | Tests | Covers              |
| -------------------------- | ----- | ------------------- |
| `metadata-baseUrl.test.ts` | 10    | Base URL resolution |

## Coverage Gaps (Remaining)

### Not Tested (medium priority)

| Area                                | Files                                                              | Reason                                        |
| ----------------------------------- | ------------------------------------------------------------------ | --------------------------------------------- |
| Worker: user-sync processor         | `apps/workers/src/processors/user-sync.ts`                         | Clerk event processing (create/update/delete) |
| Worker: refresh-scheduler           | `apps/workers/src/processors/refresh-scheduler.ts`                 | Cron trigger logic, batch scheduling          |
| Worker: elastic-account-sync        | `apps/workers/src/processors/elastic-account-sync.ts`              | Full document indexing to ES                  |
| Worker: platform refresh processors | `apps/workers/src/processors/{instagram,reddit,tiktok}-refresh.ts` | Platform-specific API fetch                   |
| Worker: data-fetch processor        | `apps/workers/src/processors/data-fetch.ts`                        | New account data fetching                     |
| Worker: translate/categorise        | `apps/workers/src/processors/{translate,categorise-*}.ts`          | Vertex AI integration                         |

### Not Tested (low priority)

| Area           | Files                                      | Reason                                    |
| -------------- | ------------------------------------------ | ----------------------------------------- |
| UI components  | `packages/ui/src/components/**`            | React component testing needs JSDOM setup |
| Hooks          | `packages/hooks/src/*.ts`                  | Custom hooks need React test utils        |
| Store atoms    | `packages/store/src/atoms/**`              | Recoil atom testing                       |
| Pub/Sub client | `packages/db/src/clients/pubsub-client.ts` | GCP dependency                            |

## Running Tests

```bash
# Run all tests
npx vitest run

# Run specific test file
npx vitest run packages/db/src/__tests__/elasticsearch-client.test.ts

# Run with coverage report
npx vitest run --coverage

# Watch mode
npx vitest
```

## Change Log

| Date        | Tests Added   | Total            | Notes                                                                                        |
| ----------- | ------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| 2026-03-18  | +64 new tests | 874              | Worker processors, clerk webhook, YouTube refresh, popular categories, fixed 27 broken tests |
| Pre-session | —             | 810              | Baseline after fixing broken tests                                                           |
| Pre-session | —             | 731 (27 failing) | Original state before this session                                                           |
