# Rate Creator Web App

This is the main web application for Rate Creator, built with Next.js. It serves
as the primary interface for users to interact with the platform.

## Pages Structure

### Root Pages

- `page.tsx` - Landing page
- `layout.tsx` - Root layout with providers and global styles
- `providers.tsx` - Global providers (auth, theme, etc.)
- `error.tsx` - Global error page
- `not-found.tsx` - 404 page
- `global-error.tsx` - Global error boundary

### Authentication

- `sign-in/` - Sign in page
- `sign-up/` - Sign up page

### Protected Routes

- `(protected)/` - Routes that require authentication
  - Dashboard
  - Profile
  - Settings
  - Reviews

### Content

- `(content)/` - Public content pages
  - Blog posts
  - Newsletters
  - FAQs
  - Glossary

### API Routes

- `api/` - API endpoints
  - Authentication
  - Reviews
  - Users
  - Content

## Review Components

### Layout Components

- `nav-bar/` - Navigation bar components
  - Main navigation
  - User menu
  - Search bar
- `footer/` - Footer components
  - Site links
  - Social media
  - Newsletter signup

### Review Components

- `cards/` - Review card components
  - Review card
  - Review list
  - Review grid
- `creator-rating/` - Creator rating components
  - Rating display
  - Rating form
  - Rating stats
- `creator-profile/` - Creator profile components
  - Profile header
  - Profile stats
  - Profile reviews
- `user-profile/` - User profile components
  - User info
  - User reviews
  - User settings

### Search and Filter

- `search/` - Search components
  - Search bar
  - Search results
  - Search filters
- `filters/` - Filter components
  - Category filters
  - Rating filters
  - Date filters
- `commandbar/` - Command bar components
  - Quick search
  - Quick actions
  - Command palette

### Categories

- `categories/` - Category components
  - Category list
  - Category cards
  - Category navigation

### Landing

- `landing/` - Landing page components
  - Hero section
  - Features
  - Testimonials
  - CTA sections

### Common

- `common/` - Shared components
  - Buttons
  - Forms
  - Modals
  - Alerts

### Skeletons

- `skeletons/` - Loading state components
  - Review skeleton
  - Profile skeleton
  - List skeleton

### Error Pages

- `error-page/` - Error page components
  - 404 page
  - 500 page
  - Error boundaries

### Contact

- `contact/` - Contact components
  - Contact form
  - Contact info
  - Support links

## Features

- User authentication and profile management
- Creator dashboard and analytics
- Review management and moderation
- Social media integration
- Content creation and publishing
- Search and discovery
- Notifications and messaging

## Getting Started

1. Install dependencies:

   ```bash
   yarn install
   ```

2. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

3. Start the development server:

   ```bash
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see
   the result.

## Development

- `yarn dev` - Start the development server
- `yarn build` - Build the application
- `yarn test` - Run tests
- `yarn lint` - Run linting
- `yarn format` - Format code

## Project Structure

- `app/` - Next.js app directory
- `components/` - React components
- `lib/` - Utility functions and shared logic
- `public/` - Static assets
- `styles/` - Global styles and Tailwind configuration

## Dependencies

- Next.js 14
- React 18
- Tailwind CSS
- Shadcn UI
- Prisma
- Clerk

## Deployment

The application is deployed on Vercel. The deployment configuration can be found
in `vercel.json`.

## Best Practices

- Keep pages focused and small
- Use TypeScript for type safety
- Follow accessibility guidelines
- Add proper documentation
- Include unit tests
- Use shared components from `@turbo/ui`
- Follow the established folder structure

To add new pages or components:

1. Create the page/component in the appropriate directory
2. Add proper TypeScript types
3. Add necessary styles
4. Add tests
5. Update documentation
