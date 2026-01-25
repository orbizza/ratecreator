# Content App - Project Memory

## What This App Does

The `content` app is the Content Management System (CMS) for Rate Creator. It handles:

- Blog post creation and publishing
- Newsletter management
- Glossary term editing
- Tag management
- Media uploads

## Architecture

- **Framework**: Next.js 14.2.26 (App Router)
- **Port**: 3002
- **Package**: `@ratecreator/content`
- **Editor**: BlockNote (rich text)

### Route Structure

```
app/
├── (posts)/              # Blog post management
│   ├── new-post/         # Create new post
│   ├── editor/           # Post editor
│   └── [slug]/           # Edit existing post
│
├── (content)/            # Content dashboard
│   └── ratecreator/      # Content management hub
│
├── tags/                 # Tag management
│   ├── new-tag/          # Create new tag
│   └── [slug]/           # Tag editor
│
├── todo/                 # Todo/task management
│   └── [todo]/           # Todo item
│
├── user-profile/         # User profile management
│
└── api/
    └── upload/           # Media upload handler
```

## What Has Been Done

### Completed Features

- Rich text editor with BlockNote
- Blog post CRUD operations
- Tag creation and management
- Image/media upload to Digital Ocean Spaces
- Draft and publish workflow
- Content preview
- YouTube video embedding
- Divider blocks
- Markdown export

### Editor Capabilities

- Text formatting (bold, italic, etc.)
- Headings (H1-H6)
- Ordered and unordered lists
- Code blocks with syntax highlighting
- Block quotes
- YouTube video embeds
- Custom dividers
- Theme-aware styling

## Restrictions

### Authentication

- All routes require Clerk authentication
- Only authorized content editors can access

### Content Workflow

- Posts start as drafts
- Publishing requires all required fields
- Slug must be unique

### Media

- Images uploaded to Digital Ocean Spaces
- Maximum file size limits apply
- Supported formats: JPG, PNG, GIF, WebP

## What Needs To Be Done

### Features

- [ ] Newsletter scheduling
- [ ] Content calendar view
- [ ] SEO analysis tools
- [ ] Content versioning/history
- [ ] Multi-author support
- [ ] Content approval workflow
- [ ] Bulk operations
- [ ] Analytics dashboard

### Technical

- [ ] Autosave functionality
- [ ] Collaborative editing
- [ ] Better image optimization
- [ ] PDF generation
- [ ] RSS feed generation

## Key Files

| File                      | Purpose              |
| ------------------------- | -------------------- |
| `app/layout.tsx`          | Root layout          |
| `app/provider.tsx`        | Global providers     |
| `app/sidebar-toggle.tsx`  | Sidebar state        |
| `app/api/upload/route.ts` | Media upload handler |
