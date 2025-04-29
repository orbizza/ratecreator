# Rate Creator Content App

This is the content management system for Rate Creator, built with Next.js. It
handles the creation, management, and publishing of content across the platform.

## Features

- Blog post creation and management
- Newsletter management
- Glossary term management
- Content scheduling and publishing
- Media library management
- SEO optimization
- Content analytics

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
- MDX for content

## Deployment

The application is deployed on Vercel. The deployment configuration can be found
in `vercel.json`.
