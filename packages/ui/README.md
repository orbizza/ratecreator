# @ratecreator/ui

Shared React component library for Rate Creator applications. Built with TailwindCSS and Radix UI primitives.

## Installation

```bash
yarn add @ratecreator/ui
```

## Usage

```typescript
import { Button, Card, Input } from "@ratecreator/ui"
import { ReviewCard } from "@ratecreator/ui/review"
import { Editor } from "@ratecreator/ui/common"
import { cn } from "@ratecreator/ui/utils"
import "@ratecreator/ui/styles.css"
```

## UI Primitives

Core components exported from main index:

| Component | Description |
|-----------|-------------|
| `Accordion` | Expandable/collapsible content sections |
| `AlertDialog` | Modal alerts with confirmation |
| `AnimatedGradientText` | Text with animated gradient effect |
| `AnimatedTooltip` | Styled tooltip with animations |
| `Avatar` | User profile images/icons |
| `Badge` | Status badges and labels |
| `Breadcrumb` | Navigation breadcrumb trails |
| `Button` | Multiple variants (default, destructive, outline, secondary, ghost, link) |
| `Calendar` | Date picker calendar widget |
| `Card` | Content container component |
| `Checkbox` | Form checkbox input |
| `Collapsible` | Toggle-able content sections |
| `Command` | Command palette/search interface |
| `Dialog` | Modal dialog component |
| `DropdownMenu` | Dropdown menu lists |
| `Form` | Form management utilities |
| `HeroHighlight` | Hero section highlighting |
| `HoverCard` | Hover-triggered card display |
| `IconCloud` | Cloud visualization of icons |
| `Input` | Text input field |
| `KBD` | Keyboard key display |
| `Label` | Form label element |
| `LinearGradient` | Linear gradient background |
| `Marquee` | Scrolling text animation |
| `MenuBar` | Menu bar navigation |
| `MultiSelect` | Multi-select dropdown |
| `Pagination` | Page navigation |
| `Popover` | Floating popover UI |
| `RadialGradient` | Radial gradient background |
| `ScrollProgress` | Page scroll progress bar |
| `Select` | Single select dropdown |
| `Separator` | Visual divider |
| `Sheet` | Side panel/drawer component |
| `Sidebar` | Collapsible sidebar |
| `Skeleton` | Loading skeleton placeholders |
| `Spinner` | Loading spinner animation |
| `Table` | Data table component |
| `Tabs` | Tabbed content interface |
| `Textarea` | Multi-line text input |
| `Toast` | Toast notification component |
| `Toaster` | Toast notification container |
| `Toggle` | Toggle button |
| `ToggleGroup` | Group of toggle buttons |
| `Tooltip` | Hover tooltip |
| `TweetCard` | Twitter-style card display |
| `ThemeProvider` | Dark/light mode provider |
| `ToggleTheme` | Theme switching component |
| `Spotlight` | Spotlight effect component |

## Hooks

| Hook | Description |
|------|-------------|
| `useToast` | Toast notification management |
| `useMobile` | Mobile device detection |

## Common Components (`@ratecreator/ui/common`)

| Component | Description |
|-----------|-------------|
| `Logos` | Logo components |
| `SingleImageDropzone` | Single image upload with drag-drop |
| `UploadImageComponent` | Image upload UI component |
| `Editor` | BlockNote rich text editor |
| `BlockNoteRender` | Render BlockNote content |
| `BlockNoteToMarkdown` | Convert editor content to markdown |
| `YouTubeBlockNote` | YouTube embed block |
| `Divider` | Divider block for editor |
| `DatePicker` | Date selection component |
| `SelectComponent` | Custom select component |

## Review Components (`@ratecreator/ui/review`)

### Navigation
| Component | Description |
|-----------|-------------|
| `AppBar` | Top navigation bar |
| `NavBar` | Navigation menu |
| `Footer` | Footer component |
| `ContentNavbar` | Content section navigation |
| `CommandBar` | Global search/command palette |

### Landing Page
| Component | Description |
|-----------|-------------|
| `LandingPage` | Full landing page component |
| `CardLandingVertical` | Vertical card layout |
| `CardLandingHorizontal` | Horizontal card layout |

### Creator & Profile
| Component | Description |
|-----------|-------------|
| `CreatorProfile` | Full creator profile page |
| `CreatorRating` | Creator rating display |
| `CardCommandBarCreator` | Creator card for command bar |

### Categories
| Component | Description |
|-----------|-------------|
| `CategoryListPage` | Category browsing page |
| `CategorySearchResult` | Category search results |
| `CardCommandBarCategory` | Category card for command bar |

### Search
| Component | Description |
|-----------|-------------|
| `CentralSearchResults` | Global search results page |
| `PaginationBar` | Pagination controls |

### Content Display
| Component | Description |
|-----------|-------------|
| `BlogListPage` | Blog articles listing |
| `BlogContent` | Blog article display |
| `GlossaryListPage` | Glossary terms listing |
| `GlossaryPost` | Individual glossary entry |
| `LegalPost` | Legal content display |

### Error & Loading States
| Component | Description |
|-----------|-------------|
| `ErrorMessage` | Generic error message |
| `WIP` | Work-in-progress page |
| `GlossarySkeleton` | Loading state for glossary |
| `GlossaryPostSkeleton` | Loading state for glossary posts |

### Forms
| Component | Description |
|-----------|-------------|
| `FormSuccess` | Success message display |
| `FormError` | Error message display |
| `ContactPage` | Full contact page |
| `ContactMap` | Map display component |

## Content Components (`@ratecreator/ui/content`)

### Admin
| Component | Description |
|-----------|-------------|
| `AdminSidebar` | Admin navigation sidebar |
| `TagComponent` | Tag display |
| `EditTagComponent` | Tag editor |
| `PostsNavbar` | Posts navigation |
| `PostsEditNavbar` | Edit mode navigation |
| `NewPostComponent` | New post form |
| `EditContentPost` | Post editor |
| `PostsListComponent` | Posts table view |
| `PostsListContentWise` | Posts grouped by type |

## Utilities

| Utility | Description |
|---------|-------------|
| `cn()` | ClassName merging utility (clsx + tailwind-merge) |

## Development

```bash
# Build the package
yarn build

# Watch for changes
yarn dev
```

## Styling

All components are styled with TailwindCSS and support dark/light mode via the `dark:` prefix. Import the styles:

```typescript
import "@ratecreator/ui/styles.css"
```
