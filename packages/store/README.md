# @ratecreator/store

Global state management for Rate Creator using Recoil. Contains atoms and static data.

## Installation

```bash
yarn add @ratecreator/store
```

## Usage

```typescript
import { toastState } from "@ratecreator/store"
import { categoryState, searchState } from "@ratecreator/store/review"
import { adminContentState } from "@ratecreator/store/content"
```

## Atoms

### Main Atoms
| Atom | Description |
|------|-------------|
| `toastState` | Global toast notification state |

### Review Atoms (`@ratecreator/store/review`)
| Atom | Description |
|------|-------------|
| `categoryState` | Category selection and filtering |
| `searchState` | Search query and results state |

### Content Atoms (`@ratecreator/store/content`)
| Atom | Description |
|------|-------------|
| `adminContentNavbar` | Content admin navigation state |
| `adminContentPost` | Content post editing state |

## Static Data

All static data exports from main index:

| Export | Description |
|--------|-------------|
| `categoriesData` | Full category hierarchy |
| `categoriesListColors` | Color palette for categories |
| `searchPlaceholder` | Search input placeholder texts |
| `landingFeatures` | Features list for landing page |
| `mostPopularCategories` | Trending categories list |
| `filterCountryCode` | Country filter options |
| `filterLanguageCode` | Language filter options |
| `filterFollowersCheckbox` | Follower count filter options |
| `filterVideoCountCheckbox` | Video count filter options |
| `filterReviewCountCheckbox` | Review count filter options |

## Usage Example

```typescript
import { useRecoilState, useRecoilValue } from "recoil"
import { categoryState } from "@ratecreator/store/review"

function CategoryFilter() {
  const [category, setCategory] = useRecoilState(categoryState)

  return (
    <Select
      value={category}
      onChange={setCategory}
    />
  )
}
```

## Static Data Usage

```typescript
import { filterCountryCode, mostPopularCategories } from "@ratecreator/store"

function CountryFilter() {
  return (
    <Select options={filterCountryCode} />
  )
}

function PopularCategories() {
  return (
    <List items={mostPopularCategories} />
  )
}
```
