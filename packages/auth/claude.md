# Auth Package - Project Memory

## What This Package Does

The `auth` package provides Clerk authentication integration for Rate Creator applications:

- ClerkProvider component for React apps
- Authentication utilities
- Server-side auth helpers

## Architecture

- **Package**: `@ratecreator/auth`
- **Provider**: Clerk
- **Client SDK**: @clerk/nextjs
- **Server SDK**: @clerk/clerk-sdk-node

### Usage

```typescript
// In app layout
import { ClerkProvider } from "@ratecreator/auth"

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  )
}
```

## What Has Been Done

- ClerkProvider wrapper component
- Environment variable configuration
- Integration with Next.js middleware
- Server-side authentication helpers

## Restrictions

### Environment Variables

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### Usage Patterns

- Always wrap app with ClerkProvider
- Use Clerk middleware for route protection
- Use `auth()` on server, `useAuth()` on client

## What Needs To Be Done

- [ ] Custom sign-in/sign-up components
- [ ] Organization/team support
- [ ] Role-based access control utilities
- [ ] Session management helpers
- [ ] Multi-factor authentication setup
- [ ] Social login configuration

## Key Files

| File                     | Purpose               |
| ------------------------ | --------------------- |
| `src/clerk-provider.tsx` | ClerkProvider wrapper |
| `package.json`           | Dependencies          |
