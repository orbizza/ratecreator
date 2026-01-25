# Types Package - Project Memory

## What This Package Does

The `types` package provides shared TypeScript type definitions for Rate Creator:

- Domain types (Review, User, Account, etc.)
- API types (request/response)
- Utility types

## Architecture

- **Package**: `@ratecreator/types`
- **Pattern**: Type-only package (no runtime code)

### Exports

```typescript
import type { User, Review, Account } from "@ratecreator/types";
import type { ReviewInput, ReviewFilter } from "@ratecreator/types/review";
import type { Post, Tag } from "@ratecreator/types/content";
```

### Directory Structure

```
src/
├── index.ts          # Main type exports
├── review/           # Review domain types
│   └── index.ts
└── content/          # Content domain types
    └── index.ts
```

## What Has Been Done

### Core Types

- User types (from Clerk and database)
- Account types (creator profiles)
- Review types (ratings, status, etc.)
- Comment types (with threading)
- Vote types

### Review Domain Types

- `ReviewInput`: Create/update review payload
- `ReviewFilter`: Search filter options
- `ReviewStatus`: Status enum
- `Platform`: Platform enum

### Content Domain Types

- `Post`: Blog post type
- `Tag`: Tag type
- `Newsletter`: Newsletter type

## Restrictions

### Type-Only Imports

```typescript
// Correct - type-only import
import type { User } from "@ratecreator/types";

// Also correct
import { type User, type Review } from "@ratecreator/types";
```

### Naming Conventions

- Use PascalCase for type names
- Suffix input types with `Input`
- Suffix response types with `Response`
- Match Prisma model names where applicable

## What Needs To Be Done

- [ ] Complete all domain types
- [ ] API request/response types
- [ ] Validation schemas (Zod)
- [ ] Type guards and assertions
- [ ] Generic utility types
- [ ] JSDoc documentation

## Key Files

| File                   | Purpose              |
| ---------------------- | -------------------- |
| `src/index.ts`         | Main type exports    |
| `src/review/index.ts`  | Review domain types  |
| `src/content/index.ts` | Content domain types |
