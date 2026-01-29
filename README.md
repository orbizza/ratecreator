# Rate Creator

Rate Creator is a comprehensive platform for creators to manage their online
presence, engage with their audience, and grow their brand. The platform
consists of multiple applications and services built using modern web
technologies.

## Project Structure

The project is organized as a monorepo using Turborepo, with the following main
components:

### Apps (`/apps`)

- `web/` - Main web application (Next.js)
- `content/` - Content management system (Next.js)
- `admin/` - Admin dashboard (Next.js)
- `consumer/` - Consumer-facing application (Next.js)
- `api/` - Backend services (Express.js/Hono.js)
- `webhooks/` - Webhook handlers for various services

### Packages (`/packages`)

- `ui/` - Shared UI components
- `config/` - Shared configuration files
- `db/` - Database models and migrations
- `store/` - State management
- `features/` - Shared business logic

## Tech Stack

### Frontend

- [Next.js](https://nextjs.org) - React framework
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Shadcn-UI](https://ui.shadcn.com) - UI component library
- [MagicUI](https://magicui.design) - Advanced UI components
- [Aceternity](https://ui.aceternity.com) - UI components and animations

### Backend

- [Express.js](https://expressjs.com) - Web framework
- [Hono.js](https://hono.dev) - Lightweight web framework
- [Prisma](https://prisma.io) - ORM
- [MongoDB](https://www.mongodb.com) - Database
- [Clerk](https://clerk.dev) - Authentication and User Management

### Infrastructure

- [Digital Ocean Spaces](https://www.digitalocean.com/products/spaces) - Object
  Storage
- [Digital Ocean Managed Databases](https://www.digitalocean.com/products/managed-databases) -
  Database hosting
- [Digital Ocean Redis](https://www.digitalocean.com/products/managed-databases-redis) -
  Caching
- [Digital Ocean Kafka](https://www.digitalocean.com/products/managed-databases-kafka) -
  Message queuing
- [Resend](https://resend.com) - Email service
- [Posthog](https://posthog.com) - Analytics
- [Vercel](https://vercel.com) - Deployment
- [HarnessIO](https://harness.io) - CI/CD

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   yarn dev
   ```

## Development

- `yarn dev` - Start all applications in development mode
- `yarn build` - Build all applications
- `yarn test` - Run tests (857 tests across 35 files)
- `yarn lint` - Run linting
- `yarn format` - Format code

---

## Configuration Todo List

### Required Environment Variables

Copy `.env.example` to `.env` and configure the following:

#### Database & Cache

| Variable              | Description                 | Required | Service               |
| --------------------- | --------------------------- | -------- | --------------------- |
| `DATABASE_URL_ONLINE` | MongoDB connection string   | Yes      | Digital Ocean MongoDB |
| `REDIS_URL`           | Redis connection string     | Yes      | Digital Ocean Redis   |
| `REDIS_HOST`          | Redis host                  | Yes      | Digital Ocean Redis   |
| `REDIS_PORT`          | Redis port (default: 25061) | Yes      | Digital Ocean Redis   |
| `REDIS_PASSWORD`      | Redis password              | Yes      | Digital Ocean Redis   |

#### Kafka (Message Queue)

| Variable            | Description                   | Required | Service             |
| ------------------- | ----------------------------- | -------- | ------------------- |
| `KAFKA_SERVICE_URI` | Kafka broker URL              | Yes      | Digital Ocean Kafka |
| `KAFKA_USERNAME`    | Kafka SASL username           | Yes      | Digital Ocean Kafka |
| `KAFKA_PASSWORD`    | Kafka SASL password           | Yes      | Digital Ocean Kafka |
| `KAFKA_CA_CERT`     | Kafka CA certificate (base64) | Yes      | Digital Ocean Kafka |

#### Authentication (Clerk)

| Variable                            | Description                       | Required | Service |
| ----------------------------------- | --------------------------------- | -------- | ------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key             | Yes      | Clerk   |
| `CLERK_SECRET_KEY`                  | Clerk secret key                  | Yes      | Clerk   |
| `CLERK_WEBHOOK_SECRET`              | Clerk webhook signing secret      | Yes      | Clerk   |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`     | Sign-in URL (default: `/sign-in`) | Yes      | Clerk   |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`     | Sign-up URL (default: `/sign-up`) | Yes      | Clerk   |

#### Search & Indexing

| Variable                 | Description                 | Required | Service       |
| ------------------------ | --------------------------- | -------- | ------------- |
| `ALGOLIA_APP_ID`         | Algolia application ID      | Yes      | Algolia       |
| `ALGOLIA_SEARCH_KEY`     | Algolia search-only API key | Yes      | Algolia       |
| `ALGOLIA_ADMIN_KEY`      | Algolia admin API key       | Yes      | Algolia       |
| `ALGOLIA_ACCOUNTS_INDEX` | Algolia accounts index name | Yes      | Algolia       |
| `ELASTICSEARCH_URL`      | Elasticsearch URL           | Optional | Elasticsearch |
| `ELASTICSEARCH_API_KEY`  | Elasticsearch API key       | Optional | Elasticsearch |

#### File Storage (Digital Ocean Spaces)

| Variable             | Description                  | Required | Service   |
| -------------------- | ---------------------------- | -------- | --------- |
| `DO_SPACES_ENDPOINT` | Spaces endpoint URL          | Yes      | DO Spaces |
| `DO_SPACES_REGION`   | Spaces region (e.g., `nyc3`) | Yes      | DO Spaces |
| `DO_SPACES_BUCKET`   | Spaces bucket name           | Yes      | DO Spaces |
| `DO_SPACES_KEY`      | Spaces access key            | Yes      | DO Spaces |
| `DO_SPACES_SECRET`   | Spaces secret key            | Yes      | DO Spaces |

#### Platform APIs (for data fetching)

| Variable                        | Description                   | Required | Service      |
| ------------------------------- | ----------------------------- | -------- | ------------ |
| `YOUTUBE_API_KEY`               | YouTube Data API v3 key       | Yes      | Google Cloud |
| `TWITTER_BEARER_TOKEN`          | Twitter API v2 bearer token   | Yes      | Twitter/X    |
| `INSTAGRAM_ACCESS_TOKEN`        | Instagram Graph API token     | Optional | Meta         |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | Instagram Business Account ID | Optional | Meta         |
| `TIKTOK_API_KEY`                | TikTok API key                | Optional | TikTok       |
| `TWITCH_CLIENT_ID`              | Twitch client ID              | Optional | Twitch       |
| `TWITCH_CLIENT_SECRET`          | Twitch client secret          | Optional | Twitch       |

#### AI/ML Services (Vertex AI / Gemini)

| Variable                         | Description                         | Required | Service |
| -------------------------------- | ----------------------------------- | -------- | ------- |
| `GCP_PROJECT_ID`                 | Google Cloud project ID             | Yes      | GCP     |
| `GCP_LOCATION`                   | GCP region (default: `us-central1`) | Yes      | GCP     |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON        | Yes      | GCP     |

#### Email & Analytics

| Variable                   | Description                   | Required | Service |
| -------------------------- | ----------------------------- | -------- | ------- |
| `RESEND_API_KEY`           | Resend API key for emails     | Yes      | Resend  |
| `NEXT_PUBLIC_POSTHOG_KEY`  | PostHog project API key       | Optional | PostHog |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host URL              | Optional | PostHog |
| `SENTRY_DSN`               | Sentry DSN for error tracking | Optional | Sentry  |

#### Application URLs

| Variable                  | Description     | Required |
| ------------------------- | --------------- | -------- |
| `NEXT_PUBLIC_APP_URL`     | Main app URL    | Yes      |
| `NEXT_PUBLIC_CONTENT_URL` | Content app URL | Yes      |
| `NEXT_PUBLIC_ADMIN_URL`   | Admin app URL   | Yes      |

---

### Setup Checklist

#### 1. Database Setup

- [ ] Create MongoDB cluster on Digital Ocean
- [ ] Create database user with read/write permissions
- [ ] Whitelist IP addresses or enable VPC networking
- [ ] Run Prisma migrations: `yarn prisma-generate && yarn prisma db push`

#### 2. Redis Setup

- [ ] Create Redis cluster on Digital Ocean
- [ ] Note connection string, host, port, and password
- [ ] Test connection with `redis-cli`

#### 3. Kafka Setup

- [ ] Create Kafka cluster on Digital Ocean
- [ ] Download CA certificate and encode to base64
- [ ] Create topics: `clerk-user-events`, `account-added`, `account-data-fetched`, `account-translated`, `account-root-categorised`, `data-refresh-youtube`, `data-refresh-tiktok`, `data-refresh-reddit`
- [ ] Create consumer groups for each consumer service

#### 4. Clerk Authentication

- [ ] Create Clerk application at [clerk.com](https://clerk.com)
- [ ] Configure OAuth providers (Google, GitHub, etc.)
- [ ] Set up webhook endpoint: `https://your-domain.com/api/webhooks/clerk`
- [ ] Copy webhook signing secret

#### 5. Algolia Search

- [ ] Create Algolia application at [algolia.com](https://algolia.com)
- [ ] Create indices: `accounts`, `categories`
- [ ] Configure searchable attributes and ranking
- [ ] Run category seeding: `yarn seed-category`

#### 6. Digital Ocean Spaces

- [ ] Create Spaces bucket
- [ ] Generate access keys
- [ ] Configure CORS for your domains
- [ ] Set bucket policy for public read access on uploads

#### 7. Platform API Keys

- [ ] **YouTube**: Create project in [Google Cloud Console](https://console.cloud.google.com), enable YouTube Data API v3
- [ ] **Twitter/X**: Apply for API access at [developer.twitter.com](https://developer.twitter.com)
- [ ] **Instagram**: Set up Meta Business account and configure Graph API
- [ ] **TikTok**: Apply for TikTok API access (requires business verification)

#### 8. Google Cloud / Vertex AI

- [ ] Create GCP project
- [ ] Enable Vertex AI API
- [ ] Create service account with Vertex AI User role
- [ ] Download JSON key file
- [ ] Set `GOOGLE_APPLICATION_CREDENTIALS` to key file path

#### 9. Email & Analytics

- [ ] Create Resend account and verify domain
- [ ] Create PostHog project (optional)
- [ ] Create Sentry project for error tracking (optional)

#### 10. Deployment

- [ ] Configure Vercel project for each app
- [ ] Set environment variables in Vercel dashboard
- [ ] Configure custom domains
- [ ] Set up CI/CD with Harness (optional)

---

### Consumer Services Ports

| Consumer              | Port | Topic                      |
| --------------------- | ---- | -------------------------- |
| data-fetch            | 3040 | `account-added`            |
| translate             | 3041 | `account-data-fetched`     |
| categorise-root       | 3042 | `account-translated`       |
| categorise-sub        | 3043 | `account-root-categorised` |
| youtube-refresh       | 3050 | `data-refresh-youtube`     |
| tiktok-refresh        | 3051 | `data-refresh-tiktok`      |
| reddit-refresh        | 3052 | `data-refresh-reddit`      |
| instagram-refresh     | 3053 | `data-refresh-instagram`   |
| algolia-account-sync  | 3060 | `account-categorised`      |
| elastic-account-sync  | 3061 | `account-categorised`      |
| review-calculate      | 3070 | `review-events`            |
| review-algolia-update | 3071 | `review-events`            |
| user-sync             | 3080 | `clerk-user-events`        |
| clerk-sync (webhook)  | 3010 | N/A (HTTP webhook)         |

---

### Test Coverage

Run tests with: `yarn test`

| Package/App             | Test Files | Tests    |
| ----------------------- | ---------- | -------- |
| `packages/db`           | 5          | 225      |
| `packages/actions`      | 17         | 362      |
| `apps/web` (API routes) | 6          | 96       |
| `apps/consumers`        | 14         | 442      |
| **Total**               | **42**     | **1125** |

---

## Deployment

The project is deployed on Vercel. Each application has its own deployment
configuration in the `vercel.json` file.

## Contact

<a href="https://ratecreator.com/contact" style="text-decoration: none; display: flex; align-items: center;">
  <img src="https://www.orbizza.com/logos/ratecreator-logo.svg" style="width: 27px; height: 27px;" width="27" height="27" alt="Join the waitlist ratecreator.com">
  <span style="text-decoration: none; color:#F5F5F5;  font-size: 27px; line-height: 27px; margin-left: 8px;">Rate Creator</span>
</a>

##

<span style="text-decoration: none; color:#F5F5F5;  font-size: 48px; line-height: 48px; margin-top: 54px;">Sites
& Services</span>

## Monorepos - /apps

### Admin Site

- NextJS application to for the Admin site of the platform
- Platform Management
- Analytics
- Customer User Management
- Pricing
- Publishing Blogs, Newsletters, Glossary
- User Management
- Dashboard Page

### Backend Services - Express.js/Hono.js

- Recommendation Service
- YouTube Service
- Instagram Service
- Twitter Service
- Reddit Service
- Review and Comments
- User Management
- Email Service
- Newsletter Service
- Notification Service
- API Gateway
- Search Service
- Queuing Service
- Monitoring Service
- Data Streaming service
- Moderation Service
- Social Sharing Service
- Polling Service

### Creator Site

- NextJS application to for the Creator site of the platform
- User Management
- Profile Management
- Dashboard
- Analytics
- Reply to review
- Flagging Review
- Report Users
- Create invite link
- Settings
- Account Management
- FAQs
- Blogs
- Pricing
- License Page

### Review Site

- NextJS application to for the Review site of the platform
- Profile Management
- Following Page
- User Profile
- Reviews Done
- Creator Profile
- Comments & Discussion
- Blogs
- Newsletter
- FAQs
- Glossary
- Landing Page
- Search Page
- Categories Page
- Filter

## Monorepos - /packages

### DB

### Features

### Store

### UI

The UI package contains shared components used across the platform, including:

#### BlockNote Editor

A rich text editor component built on top of BlockNote, providing a modern and
feature-rich editing experience. The editor supports:

- Text formatting (bold, italic, etc.)
- Headings
- Lists (ordered and unordered)
- Code blocks
- Blockquotes
- YouTube video embeds
- Dividers
- Theme-aware styling (dark/light mode)

##### Usage in Apps

The BlockNote editor is used in various applications:

1. **Content Management System (`/apps/content`)**
   - Blog post creation and editing
   - Newsletter content management
   - Rich text content creation

2. **Review Site (`/apps/web`)**

   **_Used in Rendering_**

- Blogs
- Newsletters
- Glossaries

##### Key Features

- **Rich Text Editing**: Full support for text formatting and styling
- **Media Integration**: Easy embedding of YouTube videos and other media
- **Theme Support**: Automatic dark/light mode adaptation
- **Custom Blocks**: Extensible block system for custom content types
- **Markdown Export**: Built-in support for converting content to Markdown
  format

##### Implementation

The editor is implemented in the
`packages/ui/src/components/common/blocknote-editor` directory with the
following components:

- `editor.tsx`: Main editor component
- `blocknote-render.tsx`: Content rendering component
- `blocknote-to-markdown.tsx`: Markdown conversion utilities
- `youtube-blocknote.tsx`: YouTube video block implementation
- `divider.tsx`: Divider block implementation
