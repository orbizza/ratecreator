# `@turbo/store`

State management package for the Rate Creator project. This package provides
global state management using Zustand.

## Installation

```bash
yarn add @turbo/store
```

## Usage

Import and use stores in your components:

```typescript
import { useAuthStore } from "@turbo/store";

// In your component
const { user, login, logout } = useAuthStore();
```

## Available Stores

### Auth Store

- User authentication state
- Login/logout functionality
- User profile data

### UI Store

- Theme preferences
- Layout settings
- Modal states
- Toast notifications

### Review Store

- Review creation state
- Review editing state
- Review list state

### Content Store

- Content creation state
- Content editing state
- Content list state

## Development

To add new stores:

1. Create a new file in `src/` directory
2. Define your store using Zustand
3. Add proper TypeScript types
4. Export the store hook
5. Test the store
6. Build the package: `yarn build`
7. Publish the package: `yarn publish`

## Best Practices

- Keep stores focused and small
- Use TypeScript for type safety
- Implement proper error handling
- Add persistence where needed
- Use middleware for side effects

## Type Safety

All stores are fully typed with TypeScript, providing type safety for both state
and actions.
