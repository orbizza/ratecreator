# Web App - Project Memory

## What This App Does

The `web` app is the main user-facing platform for Rate Creator. It serves as the primary interface for:

- Discovering and searching creators across platforms
- Reading and writing reviews
- Engaging with comments and votes
- Consuming content (blog, newsletter, glossary)

## Architecture

- **Framework**: Next.js 14.2.26 (App Router)
- **Port**: 3000
- **Package**: `@ratecreator/web`

### Route Structure

```
app/
├── (protected)/          # Auth-required routes
│   ├── review/           # Review management
│   └── user-profile/     # User profile settings
│
├── (content)/            # Public content
│   ├── blog/             # Blog posts
│   ├── newsletter/       # Newsletter archive
│   ├── glossary/         # Glossary terms
│   └── category-glossary/# Category glossaries
│
├── (public)/             # Public pages
│   ├── search/           # Search interface
│   ├── profile/          # Creator/user profiles
│   ├── contact/          # Contact form
│   ├── privacy/          # Privacy policy
│   ├── terms/            # Terms of service
│   └── legal/            # Legal pages
│
└── api/                  # API routes
    ├── accounts/         # Account queries
    ├── reviews/          # Review CRUD
    ├── categories/       # Category data
    ├── metadata/         # Metadata fetching
    └── search/           # Search endpoints
```

## What Has Been Done

### Completed Features

- Landing page with hero section
- Creator profile pages with ratings and reviews
- Review creation with rich text (BlockNote)
- Comment threads with nested replies
- Voting system (upvote/downvote)
- Algolia-powered search with filters
- Command bar for quick navigation
- Dark/light theme support
- Responsive navigation and footer
- SEO optimization (next-sitemap)
- Error boundaries and loading states
- Sentry error tracking

### Completed Pages

- Landing page
- Search results page
- Creator profile page
- User profile page
- Review detail page
- Blog/newsletter/glossary pages
- Contact, privacy, terms pages

## Restrictions

### Authentication

- Protected routes require Clerk authentication
- Middleware handles route protection
- User must be logged in to write reviews

### API Routes

- All mutations go through server actions
- Search reads from Algolia (not MongoDB directly)
- Reviews trigger Kafka events for async processing

### Component Usage

- Use `@ratecreator/ui` for all UI components
- Use `@ratecreator/store` for global state
- Use `@ratecreator/hooks` for custom hooks

## What Needs To Be Done

### Features

- [ ] Review edit functionality
- [ ] Review delete with confirmation
- [ ] User following/followers
- [ ] Notification center
- [ ] Mobile-optimized experience
- [ ] Review moderation UI
- [ ] Report functionality
- [ ] Share to social media

### Technical

- [ ] Complete test coverage
- [ ] Performance optimization (lazy loading)
- [ ] Accessibility audit
- [ ] PWA support
- [ ] Offline capability

## Key Files

| File                 | Purpose                                 |
| -------------------- | --------------------------------------- |
| `app/layout.tsx`     | Root layout with providers              |
| `app/providers.tsx`  | Global providers (Clerk, Theme, Recoil) |
| `middleware.ts`      | Route protection logic                  |
| `instrumentation.ts` | Sentry initialization                   |
| `next.config.mjs`    | Next.js configuration                   |
