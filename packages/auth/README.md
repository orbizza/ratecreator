# @ratecreator/auth

Clerk authentication integration for Rate Creator applications.

## Installation

```bash
yarn add @ratecreator/auth
```

## Usage

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

## Exports

| Export          | Description                           |
| --------------- | ------------------------------------- |
| `ClerkProvider` | Clerk authentication provider wrapper |

## Server-Side Usage

```typescript
import { auth, currentUser } from "@clerk/nextjs/server";

export async function getServerSideProps() {
  const { userId } = auth();
  const user = await currentUser();
  // ...
}
```

## Client-Side Usage

```typescript
import { useAuth, useUser } from "@clerk/nextjs";

function Component() {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  // ...
}
```

## Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

## Middleware

Configure route protection in `middleware.ts`:

```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```
