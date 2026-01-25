# @ratecreator/actions

Server actions and API logic for Rate Creator. Contains Next.js server actions for mutations and data fetching.

## Installation

```bash
yarn add @ratecreator/actions
```

## Usage

```typescript
import { uploadFile } from "@ratecreator/actions"
import { createReview, fetchReviewsActions } from "@ratecreator/actions/review"
import { createPost, fetchPosts } from "@ratecreator/actions/content"
```

## Main Exports

| Export | Description |
|--------|-------------|
| `uploadFile` | Upload file to Digital Ocean Spaces |

## Review Actions (`@ratecreator/actions/review`)

### Category Actions
| Action | Description |
|--------|-------------|
| `getCategoryData()` | Fetch all categories (24h Redis cache) |
| `singleCategoryAction(slug)` | Get single category details |
| `mostPopularCategoryActions()` | Fetch trending categories |

### Creator Actions
| Action | Description |
|--------|-------------|
| `searchCreator(query, filters)` | Search creators with Algolia |
| `creatorActions.getCreator(id)` | Get creator profile |
| `creatorActions.getCreatorByHandle(handle)` | Get creator by username |

### Review Actions
| Action | Description |
|--------|-------------|
| `createReview(data)` | Create new review (validates, authenticates, publishes Kafka event) |
| `updateReview(id, data)` | Update existing review |
| `deleteReview(id)` | Soft delete review |
| `fetchReviewsActions(params)` | Fetch reviews with pagination |

### Metadata Actions
| Action | Description |
|--------|-------------|
| `metadata.fetchOG(url)` | Fetch OpenGraph metadata |
| `reddit.extractMetadata(url)` | Extract Reddit-specific metadata |

### Contact Actions
| Action | Description |
|--------|-------------|
| `contact.submit(data)` | Handle contact form submissions |

## Content Actions (`@ratecreator/actions/content`)

### Tag Actions
| Action | Description |
|--------|-------------|
| `createTag(data)` | Create new tag |
| `updateTag(id, data)` | Update tag |
| `deleteTag(id)` | Delete tag |
| `getTags()` | Fetch all tags |

### Post Actions
| Action | Description |
|--------|-------------|
| `createPost(data)` | Create new blog post |
| `updatePost(id, data)` | Update existing post |
| `publishPost(id)` | Publish draft post |
| `deletePost(id)` | Soft delete post |
| `fetchPosts(params)` | Fetch posts with pagination |

### Author Actions
| Action | Description |
|--------|-------------|
| `getAuthor(id)` | Get author information |

## Error Handling

All actions throw typed errors and include proper validation:

```typescript
try {
  const review = await createReview(data)
} catch (error) {
  if (error.code === "UNAUTHORIZED") {
    // Handle auth error
  }
}
```

## Authentication

All mutation actions require Clerk authentication:

```typescript
"use server"

export async function createReview(data: ReviewInput) {
  const user = await auth()
  if (!user) throw new Error("Unauthorized")
  // ...
}
```
