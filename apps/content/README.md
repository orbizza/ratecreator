# Rate Creator Content App

This is the content management system for Rate Creator, built with Next.js. It
handles the creation, management, and publishing of content across the platform.

## Pages Structure

### Root Pages

- `page.tsx` - Dashboard/Home page
- `layout.tsx` - Root layout with providers and global styles
- `provider.tsx` - Global providers (auth, theme, etc.)
- `sidebar-toggle.tsx` - Sidebar toggle component
- `globals.css` - Global styles

### Authentication

- `sign-in/` - Sign in page
- `sign-up/` - Sign up page

### Content Management

- `(content)/` - Content management pages
  - Blog post editor
  - Newsletter editor
  - Glossary term editor
  - Media library
  - Content scheduling
  - SEO management

### Posts

- `(posts)/` - Blog post management
  - Post list
  - Post editor
  - Post preview
  - Post analytics
  - Post scheduling

### Tags

- `tags/` - Tag management
  - Tag list
  - Tag editor
  - Tag analytics
  - Tag relationships

### User Profile

- `user-profile/` - User profile management
  - Profile settings
  - Content preferences
  - Notification settings
  - Account management

### API Routes

- `api/` - API endpoints
  - Content management
  - Media upload
  - Analytics
  - User management

## Components

### Content Editor

- Rich text editor
- Markdown support
- Image upload
- Code highlighting
- Table support
- Embed support

### Media Library

- Image upload
- Video upload
- File management
- Media optimization
- CDN integration

### Content Scheduling

- Calendar view
- Timeline view
- Publishing schedule
- Social media scheduling
- Email newsletter scheduling

### SEO Management

- Meta tag editor
- Open Graph editor
- Schema markup
- Sitemap generation
- Robots.txt management

### Analytics

- Content performance
- User engagement
- Traffic sources
- Conversion tracking
- Custom reports

### User Management

- User roles
- Permissions
- Activity logs
- Team management
- Access control

## Features

### Content Creation

- Rich text editing
- Markdown support
- Image optimization
- Video embedding
- Code highlighting
- Table creation
- Custom blocks

### Content Management

- Draft management
- Version control
- Content scheduling
- Publishing workflow
- Content archiving
- Content restoration

### Media Management

- Image optimization
- Video transcoding
- File organization
- CDN integration
- Media library
- Asset management

### SEO Tools

- Meta tag management
- Open Graph optimization
- Schema markup
- Sitemap generation
- Robots.txt management
- SEO analysis

### Analytics

- Content performance
- User engagement
- Traffic analysis
- Conversion tracking
- Custom reports
- Export functionality

### User Management

- Role-based access
- Permission management
- Activity tracking
- Team collaboration
- User preferences
- Notification settings

## Development

### Setup

1. Install dependencies:

   ```bash
   yarn install
   ```

2. Set up environment variables:

   ```bash
   cp env.example .env
   ```

3. Start the development server:

   ```bash
   yarn dev
   ```

### Adding New Features

1. Create the necessary pages in the appropriate directory
2. Add required components
3. Set up API routes
4. Add proper TypeScript types
5. Add tests
6. Update documentation

### Best Practices

- Keep components focused and reusable
- Use TypeScript for type safety
- Follow accessibility guidelines
- Add proper documentation
- Include unit tests
- Use shared components from `@turbo/ui`
- Follow the established folder structure

## Deployment

The application is deployed on Vercel. The deployment configuration can be found
in `vercel.json`.

## Environment Variables

Required environment variables:

```
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=
NEXT_PUBLIC_CLERK_SIGN_UP_URL=
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=
```

## Contributing

1. Create a new branch
2. Make your changes
3. Add tests
4. Update documentation
5. Submit a pull request

## License

This project is licensed under the MIT License.
