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
- `yarn test` - Run tests
- `yarn lint` - Run linting
- `yarn format` - Format code

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
