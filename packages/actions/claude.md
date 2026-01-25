# Actions Package - Project Memory

## What This Package Does

The `actions` package contains server actions and API logic for Rate Creator:
- Server-side mutations
- Data fetching utilities
- File upload handlers
- Domain-specific actions (review, content)

## Architecture

- **Package**: `@ratecreator/actions`
- **Pattern**: Next.js Server Actions

### Exports

```typescript
import { uploadFile } from "@ratecreator/actions"
import { createReview, updateReview } from "@ratecreator/actions/review"
import { createPost, publishPost } from "@ratecreator/actions/content"
```

### Directory Structure

```
src/
├── index.ts          # Main exports
├── upload-crud.ts    # File upload logic
├── review/           # Review actions
│   └── index.ts
└── content/          # Content actions
    └── index.ts
```

## What Has Been Done

### Upload Actions
- File upload to Digital Ocean Spaces
- Image validation and processing
- URL generation for uploaded files

### Review Actions
- Review CRUD operations
- Comment management
- Vote handling
- Kafka event publishing

### Content Actions
- Blog post CRUD
- Tag management
- Newsletter operations

## Restrictions

### Server Actions Pattern
```typescript
"use server"

export async function createReview(data: ReviewInput) {
  // Server-side only code
  const user = await auth()
  if (!user) throw new Error("Unauthorized")

  // Create review...
}
```

### Error Handling
- All actions should throw typed errors
- Use proper HTTP status semantics
- Log errors for debugging

### Authentication
- All mutation actions require authentication
- Use `auth()` from Clerk for user context

## What Needs To Be Done

- [ ] Complete review actions implementation
- [ ] Moderation actions
- [ ] Bulk operations
- [ ] Rate limiting
- [ ] Input validation with Zod
- [ ] Audit logging
- [ ] Unit tests

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Main exports |
| `src/upload-crud.ts` | File upload logic |
| `src/review/index.ts` | Review domain actions |
| `src/content/index.ts` | Content domain actions |
