# `@turbo/types`

TypeScript type definitions for the Rate Creator project. This package provides
shared types used across the application.

## Installation

```bash
yarn add @turbo/types
```

## Usage

Import types in your code:

```typescript
import { User, Review, Content } from "@turbo/types";

// Use types in your code
const user: User = {
  id: "1",
  name: "John Doe",
  // ...
};
```

## Available Types

### User Types

- `User`: User profile data
- `UserPreferences`: User settings and preferences
- `UserStats`: User statistics and metrics

### Review Types

- `Review`: Review data structure
- `ReviewMetrics`: Review statistics
- `ReviewFilters`: Review filtering options

### Content Types

- `Content`: Content data structure
- `ContentMetadata`: Content metadata
- `ContentFilters`: Content filtering options

### API Types

- `ApiResponse`: Standard API response format
- `ApiError`: Error response format
- `PaginationParams`: Pagination parameters

## Development

To add new types:

1. Create a new file in `src/` directory
2. Define your types using TypeScript
3. Export the types
4. Update the package's index file
5. Build the package: `yarn build`
6. Publish the package: `yarn publish`

## Best Practices

- Keep types focused and specific
- Use proper TypeScript features (unions, intersections, etc.)
- Add JSDoc comments for documentation
- Use strict type checking
- Avoid using `any` type

## Type Safety

All types are strictly defined to ensure type safety throughout the application.
The package is configured to use strict TypeScript settings.
