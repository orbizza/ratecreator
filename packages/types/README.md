# @ratecreator/types

Shared TypeScript type definitions for Rate Creator.

## Installation

```bash
yarn add @ratecreator/types
```

## Usage

```typescript
import type { User, Review, Account } from "@ratecreator/types";
import type { ReviewInput, ReviewFilter } from "@ratecreator/types/review";
import type { Post, Tag } from "@ratecreator/types/content";
```

## Review Types (`@ratecreator/types/review`)

### Category Types

| Type                          | Description                       |
| ----------------------------- | --------------------------------- |
| `Category`                    | Category with hierarchy           |
| `GlossaryCategory`            | Simplified category               |
| `SearchResult`                | Category search result            |
| `CategoryWithColor`           | Category with UI colors           |
| `PopularCategory`             | Trending category                 |
| `PopularCategoryWithAccounts` | Category with associated creators |

### Account Types

| Type                   | Description                      |
| ---------------------- | -------------------------------- |
| `Account`              | Creator account across platforms |
| `PopularAccount`       | Featured creator                 |
| `CreatorData`          | Creator profile data             |
| `SearchAccount`        | Creator in search results        |
| `SearchAccountsParams` | Search filter parameters         |

### Review Types

| Type                 | Description                      |
| -------------------- | -------------------------------- |
| `ReviewFormData`     | Form input for creating review   |
| `ReviewType`         | Full review object with metadata |
| `CommentFormData`    | Comment creation data            |
| `ReviewVoteFormData` | Upvote/downvote data             |

### Enums

| Enum                 | Values                                              |
| -------------------- | --------------------------------------------------- |
| `ReviewStatus`       | PUBLISHED, DRAFT, DELETED                           |
| `VerificationStatus` | IN_PROGRESS, VERIFIED, REJECTED                     |
| `VoteType`           | UPVOTE, DOWNVOTE                                    |
| `Platform`           | YouTube, Twitter, Instagram, Reddit, TikTok, Twitch |

### Validators

| Validator          | Description                      |
| ------------------ | -------------------------------- |
| `ReviewValidator`  | Zod schema for review validation |
| `ContactValidator` | Contact form validation schema   |

## Content Types (`@ratecreator/types/content`)

### Post Types

| Type              | Description              |
| ----------------- | ------------------------ |
| `PostType`        | Blog post full structure |
| `UpdatePostType`  | Post update input        |
| `FetchedPostType` | Post from database       |
| `Tags`            | Tag interface            |
| `Author`          | Author information       |

### Enums

| Enum              | Values                      |
| ----------------- | --------------------------- |
| `ContentType`     | BLOG, GLOSSARY, LEGAL, NEWS |
| `PostStatus`      | DRAFT, PUBLISHED, ARCHIVED  |
| `ContentPlatform` | Platform publishing target  |

### Validators

| Validator           | Description             |
| ------------------- | ----------------------- |
| `TagSchema`         | Tag validation schema   |
| `DateTimeValidator` | DateTime Zod validators |

## Type-Only Imports

Always use type-only imports for better tree-shaking:

```typescript
// Recommended
import type { User } from "@ratecreator/types";

// Also works
import { type User, type Review } from "@ratecreator/types";
```
