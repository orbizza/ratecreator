# Contributing to Rate Creator

## Development Setup

```bash
# Clone the repo
git clone https://github.com/orbizza/ratecreator.git
cd ratecreator

# Install dependencies
yarn install

# Set up environment
cp env.example .env
# Fill in required values (see README.md)

# Generate Prisma client
yarn prisma-generate

# Start dev server (web apps only, no GCP needed)
yarn dev:web
```

## Branch Strategy

- `main` — production branch, auto-deploys to Vercel and Cloud Run
- Feature branches — create from `main`, open PR when ready

## Code Standards

- TypeScript throughout
- ESLint + Prettier for formatting (`yarn lint`)
- Vitest for testing (`yarn test`)
- Soft deletes — never hard delete data, use `isDeleted` flag
- Server actions must have `"use server"` directive
- Package prefix: `@ratecreator/*`

## Monorepo Structure

Changes to shared packages affect all apps:

| Package            | Used By                  | Rebuild Trigger       |
| ------------------ | ------------------------ | --------------------- |
| `packages/db`      | All apps + workers       | Full rebuild          |
| `packages/types`   | All apps + workers       | Full rebuild          |
| `packages/actions` | Web, workers             | Web + workers rebuild |
| `packages/ui`      | Web, content, creatorops | Frontend rebuild      |
| `packages/store`   | Web                      | Web rebuild           |

## Key Conventions

- **YouTube icon**: Always use custom `YouTubeIcon` component with `#FF0000` (YouTube ToS)
- **Categories**: Cached indefinitely in Redis — flush manually after changes
- **Redis TTLs**: Always set TTL on new cache keys (except category listings)
- **Elasticsearch**: Changes to search require reindex (`yarn workspace @ratecreator/scripts reindex-accounts-v2`)
- **Images**: Use `next/image` with `remotePatterns` — never use raw `<img>` tags

## Testing

```bash
# Run all tests
yarn test

# Run tests for specific package
npx vitest run packages/db/src/__tests__/elasticsearch-client.test.ts
```

## Deployment

See [PRODUCTION.md](./PRODUCTION.md) for full deployment documentation.
