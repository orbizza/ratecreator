# @ratecreator/hooks

Reusable React custom hooks for Rate Creator.

## Installation

```bash
yarn add @ratecreator/hooks
```

## Usage

```typescript
import { useDebounce } from "@ratecreator/hooks"
```

## Available Hooks

### useDebounce

Debounce value changes with configurable delay.

```typescript
function useDebounce<T>(value: T, delay: number): T
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | `T` | Value to debounce |
| `delay` | `number` | Delay in milliseconds |

**Returns:** Debounced value of type `T`

**Example:**

```typescript
import { useDebounce } from "@ratecreator/hooks"
import { useState, useEffect } from "react"

function SearchComponent() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    if (debouncedSearch) {
      // Fetch search results
      fetchResults(debouncedSearch)
    }
  }, [debouncedSearch])

  return (
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search..."
    />
  )
}
```

## Planned Hooks

| Hook | Description |
|------|-------------|
| `useThrottle` | Throttle value changes |
| `useLocalStorage` | Persist state to localStorage |
| `useMediaQuery` | Responsive design detection |
| `useOnClickOutside` | Click outside detection |
| `useIntersectionObserver` | Lazy loading support |
| `useClipboard` | Copy to clipboard |
