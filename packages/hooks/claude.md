# Hooks Package - Project Memory

## What This Package Does

The `hooks` package provides reusable React custom hooks for Rate Creator:
- Utility hooks (debounce, throttle)
- Domain-specific hooks
- Integration hooks

## Architecture

- **Package**: `@ratecreator/hooks`
- **Pattern**: Custom React hooks

### Usage

```typescript
import { useDebounce } from "@ratecreator/hooks"

function SearchComponent() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    // Fetch with debouncedSearch
  }, [debouncedSearch])
}
```

## What Has Been Done

### Utility Hooks
- `useDebounce`: Debounce value changes

## Restrictions

### Hook Rules
- Follow React hooks rules (no conditional calls)
- Prefix all hooks with `use`
- Return stable references where possible

### Dependencies
- Should only depend on React
- No external state libraries

## What Needs To Be Done

- [ ] `useThrottle`: Throttle value changes
- [ ] `useLocalStorage`: Persist state to localStorage
- [ ] `useMediaQuery`: Responsive design hook
- [ ] `useOnClickOutside`: Click outside detection
- [ ] `useIntersectionObserver`: Lazy loading
- [ ] `useClipboard`: Copy to clipboard
- [ ] Unit tests for all hooks

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Main exports |
| `src/useDebounce.ts` | Debounce hook |
