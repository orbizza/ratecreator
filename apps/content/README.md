# Rate Creator Content App

The Content Management System for Rate Creator, built with Next.js. Handles blog posts, newsletters, glossary terms, and tag management.

## Getting Started

```bash
# Install dependencies
yarn install

# Set up environment
cp .env.example .env

# Start development server
yarn dev
```

Open [http://localhost:3002](http://localhost:3002)

## Project Structure

```
app/
├── (posts)/              # Blog post management
├── (content)/            # Content dashboard
├── tags/                 # Tag management
├── todo/                 # Task management
├── user-profile/         # User settings
└── api/                  # API routes
```

## Pages and Routes

### Post Management (`(posts)/`)
| Route | Description |
|-------|-------------|
| `/new-post` | Create new blog post |
| `/editor` | Post editor |
| `/[slug]` | Edit existing post |

### Content Dashboard (`(content)/`)
| Route | Description |
|-------|-------------|
| `/ratecreator` | Content management hub |

### Tag Management (`tags/`)
| Route | Description |
|-------|-------------|
| `/tags` | Tag listing |
| `/tags/new-tag` | Create new tag |
| `/tags/[slug]` | Edit tag |

### API Routes
| Route | Description |
|-------|-------------|
| `/api/upload` | Media file upload handler |

## Key Components

### Editor Components
| Component | Description |
|-----------|-------------|
| `BlockNoteEditor` | Rich text editor |
| `YouTubeEmbed` | YouTube video block |
| `Divider` | Content divider block |
| `ImageUpload` | Image upload component |

### Admin Components
| Component | Description |
|-----------|-------------|
| `AdminSidebar` | Admin navigation |
| `PostsNavbar` | Posts section navigation |
| `PostsListComponent` | Posts table view |
| `NewPostComponent` | New post form |
| `EditContentPost` | Post editor |

### Tag Components
| Component | Description |
|-----------|-------------|
| `TagComponent` | Tag display |
| `EditTagComponent` | Tag editor form |

## Content Types

| Type | Description |
|------|-------------|
| `BLOG` | Blog articles |
| `GLOSSARY` | Glossary terms |
| `LEGAL` | Legal documents |
| `NEWS` | News updates |

## Editor Features

- Rich text formatting (bold, italic, etc.)
- Headings (H1-H6)
- Ordered and unordered lists
- Code blocks with syntax highlighting
- Block quotes
- YouTube video embeds
- Custom dividers
- Image uploads
- Markdown export

## Dependencies

- **Framework**: Next.js 14.2.26
- **Editor**: BlockNote
- **UI**: @ratecreator/ui
- **Actions**: @ratecreator/actions
- **Auth**: @ratecreator/auth (Clerk)

## Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL_ONLINE=
DO_SPACES_KEY=
DO_SPACES_SECRET=
DO_SPACES_BUCKET=
```

## Commands

| Command | Description |
|---------|-------------|
| `yarn dev` | Start development server |
| `yarn build` | Build for production |
| `yarn start` | Start production server |
| `yarn lint` | Run ESLint |
