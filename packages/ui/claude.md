# UI Package - Project Memory

## What This Package Does

The `ui` package is the shared React component library for all Rate Creator applications. It provides:

- Primitive UI components (buttons, inputs, dialogs)
- Domain-specific components (review cards, creator profiles)
- BlockNote editor integration
- Theme support (dark/light)

## Architecture

- **Package**: `@ratecreator/ui`
- **Styling**: TailwindCSS
- **Components**: Radix UI primitives + custom components
- **Build**: TailwindCSS compiler

### Exports

```typescript
import { Button, Card } from "@ratecreator/ui";
import { ReviewCard } from "@ratecreator/ui/review";
import { Editor } from "@ratecreator/ui/content";
import { Logo } from "@ratecreator/ui/common";
import { cn } from "@ratecreator/ui/utils";
import "@ratecreator/ui/styles.css";
```

### Directory Structure

```
src/components/
├── ui/               # Primitive components (Radix UI based)
├── common/           # Shared utilities (BlockNote, dropzone, etc.)
├── review/           # Review domain components
├── content/          # Content domain components
└── themes/           # Theme providers
```

## What Has Been Done

### UI Primitives (`src/components/ui/`)

- Accordion, Alert, Alert Dialog, Avatar
- Badge, Breadcrumb, Button, Calendar
- Card, Checkbox, Collapsible, Command
- Dialog, Dropdown Menu, Form
- Input, Label, Menu Bar, Popover
- Progress, Radio Group, Select
- Separator, Slider, Switch
- Tabs, Textarea, Toast, Toggle
- Tooltip, Animated components, Spinner

### Common Components (`src/components/common/`)

- **BlockNote Editor Suite**:
  - `editor.tsx` - Main editor component
  - `blocknote-render.tsx` - Content renderer
  - `blocknote-to-markdown.tsx` - Markdown conversion
  - `youtube-blocknote.tsx` - YouTube embedding
  - `divider.tsx` - Divider block
- Date picker
- Single image dropzone
- Upload image component
- Logo components

### Review Components (`src/components/review/`)

- Cards (review cards, creator cards)
- Categories (filters, lists)
- Creator Profile (header, stats)
- Creator Rating (display, form)
- Filters (search, category, platform)
- Command bar (quick search)
- Search interface
- Landing page sections
- Navigation and footer
- Error pages
- Loading skeletons

## Restrictions

### Import Patterns

```typescript
// Correct
import { Button } from "@ratecreator/ui";
import { ReviewCard } from "@ratecreator/ui/review";

// Incorrect - don't deep import
import { Button } from "@ratecreator/ui/src/components/ui/button";
```

### Styling

- Use `cn()` utility for className merging
- Follow TailwindCSS patterns
- Support dark mode via `dark:` prefix
- Use CSS variables for theme colors

### Component Guidelines

- All components must be accessible (ARIA)
- All components must support ref forwarding
- All components must be typed with TypeScript

## What Needs To Be Done

- [ ] Complete documentation for all components
- [ ] Storybook setup for component showcase
- [ ] Unit tests for components
- [ ] Accessibility audit
- [ ] Performance optimization (tree shaking)
- [ ] Animation library integration
- [ ] Mobile-first responsive variants

## Key Files

| File                 | Purpose                      |
| -------------------- | ---------------------------- |
| `src/index.ts`       | Main exports                 |
| `lib/utils.ts`       | Utility functions (cn, etc.) |
| `tailwind.config.ts` | TailwindCSS configuration    |
| `package.json`       | Package configuration        |
