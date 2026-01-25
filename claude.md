# Rate Creator - Project Memory

## What is Rate Creator?

Rate Creator is a comprehensive platform that enables users to discover, review, and rate content creators across multiple social media platforms (YouTube, Twitter, Instagram, Reddit, TikTok, Twitch). The platform provides:

- **Creator Discovery**: Browse and search creators by category, platform, follower count, and ratings
- **Review System**: Write, vote on, and discuss reviews of creators
- **Content Hub**: Blog posts, newsletters, and glossary for creator economy education
- **Real-time Updates**: Event-driven architecture with Kafka for async processing

## Architecture Overview

### Monorepo Structure (Turborepo)

```
ratecreator/
├── apps/
│   ├── web/                    # Main review platform (Next.js) - Port 3000
│   ├── content/                # CMS for blog/newsletter (Next.js) - Port 3002
│   ├── consumers/
│   │   ├── review-calculate/   # Rating calculations (Hono)
│   │   ├── review-algolia-update/ # Search index sync (Hono)
│   │   └── user-sync/          # Clerk user sync (Hono)
│   └── webhooks/
│       └── clerk-sync/         # Clerk webhook receiver - Port 3010
│
├── packages/
│   ├── ui/                     # Shared React components
│   ├── db/                     # Prisma ORM + clients (Redis, Kafka, Algolia, MongoDB)
│   ├── auth/                   # Clerk authentication
│   ├── actions/                # Server actions
│   ├── store/                  # Recoil state management
│   ├── types/                  # Shared TypeScript types
│   ├── hooks/                  # Custom React hooks
│   ├── features/               # Feature flags (placeholder)
│   ├── scripts/                # Seeding and utility scripts
│   └── config-*/               # Shared configs (TypeScript, Tailwind, ESLint)
```

### Tech Stack

| Layer      | Technology                                    |
| ---------- | --------------------------------------------- |
| Frontend   | Next.js 14, React 18, TailwindCSS, Radix UI   |
| State      | Recoil                                        |
| Editor     | BlockNote                                     |
| Backend    | Hono.js (microservices), Next.js API routes   |
| Database   | MongoDB (Prisma ORM)                          |
| Cache      | Redis (Digital Ocean)                         |
| Search     | Algolia                                       |
| Queue      | Kafka (Digital Ocean)                         |
| Auth       | Clerk                                         |
| Email      | Resend                                        |
| Analytics  | PostHog                                       |
| Monitoring | Sentry                                        |
| Hosting    | Vercel (apps), Digital Ocean (infrastructure) |

### Data Flow

1. **User Events**: Clerk → Webhook → Kafka → user-sync consumer → MongoDB
2. **Review Events**: Web App → Kafka → review-calculate → Redis/MongoDB → Algolia
3. **Search**: Web App → Algolia (read), MongoDB (write)

## Key Data Models

### Core Entities

- **Account**: Creator profiles across platforms (YouTube, Twitter, etc.)
- **User**: Platform users (via Clerk)
- **Review**: Star ratings (1-5) with rich text content
- **Comment**: Threaded discussions with voting
- **Category**: Hierarchical creator categorization

### Relationships

- Users write Reviews for Accounts
- Reviews have Comments (nested replies supported)
- Reviews and Comments have Votes (upvote/downvote)
- Accounts belong to Categories (many-to-many via CategoryMapping)

## What Has Been Done

### Completed Features

- Multi-platform creator profiles (YouTube, Twitter, Instagram, Reddit, TikTok, Twitch)
- Full review system with star ratings, comments, voting
- Algolia-powered search with filters (category, country, language, follower count)
- User authentication via Clerk (OAuth, email)
- Event-driven architecture (Kafka consumers for async processing)
- Content management (blog, newsletter, glossary)
- Command bar (kbar-style quick search)
- Dark/light theme support
- SEO optimization (sitemaps, metadata)
- Soft delete with audit trails

### Implemented Consumers

- `review-calculate`: Bayesian average rating calculations
- `review-algolia-update`: Search index synchronization
- `user-sync`: Clerk webhook event processing

## Restrictions and Conventions

### Code Patterns

- Package prefix: `@ratecreator/*`
- Soft deletes: Use `isDeleted` flag, never hard delete
- Audit trail: All models have `createdAt`, `updatedAt`, `deletedAt`
- Event sourcing: Critical operations go through Kafka

### Environment Requirements

- Node.js >= 18
- Yarn 1.22.22
- Digital Ocean managed services (MongoDB, Redis, Kafka)
- Clerk account for authentication
- Algolia account for search

### Security

- Svix webhook verification for Clerk events
- No password storage (delegated to Clerk)
- Environment separation (public vs. secret keys)

## What Needs To Be Done

### Pending Features

- Admin dashboard application
- Creator site (for creators to claim and manage profiles)
- Full mobile responsiveness
- Notification system
- Social sharing features
- Advanced analytics dashboard
- Moderation queue and tools
- A/B testing framework (feature flags package)

### Technical Debt

- `apps/api/` - Empty, backend services to be built
- `apps/services/` - Empty, microservices to be added
- `packages/features/` - Feature flag system to be implemented
- Complete test coverage
- API documentation
- Performance optimization for large datasets

### Infrastructure

- Kubernetes deployment for consumers
- CDN optimization
- Database indexing review
- Rate limiting implementation

## Quick Start

```bash
# Install dependencies
yarn install

# Set up environment
cp env.example .env
# Fill in required values

# Generate Prisma client
yarn prisma-generate

# Start all apps in dev mode
yarn dev
```

## Key Commands

| Command                  | Description                   |
| ------------------------ | ----------------------------- |
| `yarn dev`               | Start all apps in development |
| `yarn build`             | Build all packages and apps   |
| `yarn test`              | Run Vitest test suite         |
| `yarn lint`              | Lint all code                 |
| `yarn prisma-generate`   | Generate Prisma client        |
| `yarn seed-category`     | Seed categories to Algolia    |
| `yarn flush-redis-cache` | Clear Redis cache             |
