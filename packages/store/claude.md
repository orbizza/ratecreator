# Store Package - Project Memory

## What This Package Does

The `store` package provides global state management for Rate Creator using Recoil:

- Atom definitions for shared state
- Static data constants
- Domain-specific state (review, content)

## Architecture

- **Package**: `@ratecreator/store`
- **State Library**: Recoil

### Exports

```typescript
import { toastState } from "@ratecreator/store";
import { reviewFilterAtom } from "@ratecreator/store/review";
import { editorStateAtom } from "@ratecreator/store/content";
```

### Directory Structure

```
src/
├── index.ts          # Main exports
├── toastState.ts     # Toast notifications
├── atoms/
│   ├── review/       # Review domain state
│   └── content/      # Content domain state
└── data/             # Static data
    ├── categories-data.ts
    ├── categories-list-colors.ts
    ├── search-placeholder.ts
    ├── landing-features.ts
    ├── most-popular-categories.ts
    └── filter-*.ts
```

## What Has Been Done

### Atoms

- `toastState`: Global toast notification state
- Review filters and sorting state
- Content editor state
- Search state

### Static Data

- Category definitions and mappings
- Color schemes for categories
- Search placeholder texts
- Landing page feature lists
- Popular categories
- Filter options (country, language, etc.)

## Restrictions

### Recoil Usage

```typescript
// In components
import { useRecoilState, useRecoilValue } from "recoil";
import { reviewFilterAtom } from "@ratecreator/store/review";

function FilterComponent() {
  const [filters, setFilters] = useRecoilState(reviewFilterAtom);
  // ...
}
```

### State Design

- Keep atoms small and focused
- Use selectors for derived state
- Avoid storing server state in atoms (use React Query)

## What Needs To Be Done

- [ ] Add more domain atoms
- [ ] Create selectors for derived state
- [ ] Persistence middleware (localStorage)
- [ ] Debug tools integration
- [ ] State reset utilities
- [ ] Unit tests

## Key Files

| File                         | Purpose               |
| ---------------------------- | --------------------- |
| `src/index.ts`               | Main exports          |
| `src/toastState.ts`          | Toast atom            |
| `src/atoms/review/index.ts`  | Review domain atoms   |
| `src/atoms/content/index.ts` | Content domain atoms  |
| `src/data/*.ts`              | Static data constants |
