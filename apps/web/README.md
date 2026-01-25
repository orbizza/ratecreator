# Rate Creator Web App

The main web application for Rate Creator, built with Next.js. It serves as the primary interface for users to discover creators, read and write reviews, and engage with content.

## Getting Started

```bash
# Install dependencies
yarn install

# Set up environment
cp .env.example .env

# Start development server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── (protected)/          # Auth-required routes
├── (content)/            # Public content pages
├── (public)/             # Public pages
├── api/                  # API routes
├── sign-in/              # Authentication
└── sign-up/
```

## Pages and Routes

### Authentication

| Route      | Description            |
| ---------- | ---------------------- |
| `/sign-in` | User sign in page      |
| `/sign-up` | User registration page |

### Protected Routes (`(protected)/`)

| Route             | Description                    |
| ----------------- | ------------------------------ |
| `/review/*`       | Review creation and management |
| `/user-profile/*` | User profile settings          |

### Content Routes (`(content)/`)

| Route                | Description                  |
| -------------------- | ---------------------------- |
| `/blog`              | Blog articles listing        |
| `/blog/[slug]`       | Individual blog post         |
| `/newsletter`        | Newsletter archive           |
| `/glossary`          | Glossary terms               |
| `/category-glossary` | Category-specific glossaries |

### Public Routes (`(public)/`)

| Route            | Description                 |
| ---------------- | --------------------------- |
| `/search`        | Creator search with filters |
| `/profile/[id]`  | Creator profile page        |
| `/contact`       | Contact form                |
| `/privacy`       | Privacy policy              |
| `/terms`         | Terms of service            |
| `/cookie-policy` | Cookie policy               |
| `/legal`         | Legal pages                 |

### API Routes (`api/`)

| Route                  | Description            |
| ---------------------- | ---------------------- |
| `/api/accounts`        | Account queries        |
| `/api/reviews`         | Review CRUD operations |
| `/api/categories`      | Category data          |
| `/api/metadata`        | Metadata fetching      |
| `/api/search/accounts` | Account search         |

## Key Components

### Layout

| Component    | Location            | Description                             |
| ------------ | ------------------- | --------------------------------------- |
| `RootLayout` | `app/layout.tsx`    | Root layout with providers              |
| `Providers`  | `app/providers.tsx` | Global providers (Clerk, Theme, Recoil) |

### Navigation

| Component    | Description                  |
| ------------ | ---------------------------- |
| `NavBar`     | Main navigation bar          |
| `AppBar`     | Top application bar          |
| `Footer`     | Site footer                  |
| `CommandBar` | Quick search palette (Cmd+K) |

### Review Components

| Component        | Description                     |
| ---------------- | ------------------------------- |
| `CreatorProfile` | Full creator profile with stats |
| `CreatorRating`  | Rating display and form         |
| `ReviewCard`     | Individual review display       |
| `CommentThread`  | Threaded discussions            |

### Search & Filters

| Component              | Description              |
| ---------------------- | ------------------------ |
| `CentralSearchResults` | Global search results    |
| `CategoryFilters`      | Category-based filtering |
| `PaginationBar`        | Page navigation          |

## Dependencies

- **Framework**: Next.js 14.2.26
- **UI**: @ratecreator/ui
- **State**: @ratecreator/store (Recoil)
- **Auth**: @ratecreator/auth (Clerk)
- **Database**: @ratecreator/db (Prisma)
- **Monitoring**: Sentry

## Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL_ONLINE=
NEXT_PUBLIC_RATECREATOR_API_URL=
NEXT_PUBLIC_POSTHOG_KEY=
```

## Commands

| Command           | Description              |
| ----------------- | ------------------------ |
| `yarn dev`        | Start development server |
| `yarn build`      | Build for production     |
| `yarn start`      | Start production server  |
| `yarn lint`       | Run ESLint               |
| `yarn type-check` | Run TypeScript checks    |
