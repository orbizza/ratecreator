# `@turbo/actions`

A collection of server actions for the Rate Creator project. These actions
provide server-side functionality that can be called directly from client
components.

## Installation

```bash
yarn add @turbo/actions
```

## Usage

Import and use actions in your components:

```typescript
import { createReview } from "@turbo/actions";

// In your component
const handleSubmit = async () => {
  await createReview({
    // review data
  });
};
```

## Available Actions

### Review Actions

- `createReview`: Create a new review
- `updateReview`: Update an existing review
- `deleteReview`: Delete a review
- `getReview`: Fetch a single review
- `getReviews`: Fetch multiple reviews

### User Actions

- `updateUser`: Update user profile
- `getUser`: Fetch user data
- `getUserReviews`: Fetch user's reviews

### Content Actions

- `createContent`: Create new content
- `updateContent`: Update existing content
- `deleteContent`: Delete content
- `getContent`: Fetch content

## Development

To add new actions:

1. Create a new file in `src/` directory
2. Export your action function
3. Add proper TypeScript types
4. Add error handling
5. Test the action
6. Build the package: `yarn build`
7. Publish the package: `yarn publish`

## Error Handling

All actions include proper error handling and return typed responses. Errors are
thrown with descriptive messages and proper HTTP status codes.

## Type Safety

Actions are fully typed with TypeScript, providing type safety for both input
parameters and return values.
