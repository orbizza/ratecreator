# @ratecreator/tailwind-config

Shared TailwindCSS configuration for Rate Creator applications.

## Usage

Use as a preset in your app's `tailwind.config.ts`:

```typescript
import sharedConfig from "@ratecreator/tailwind-config";

export default {
  presets: [sharedConfig],
  content: [
    "./app/**/*.tsx",
    "./components/**/*.tsx",
    "../../packages/ui/src/**/*.tsx",
  ],
};
```

## Exports

| Export    | Description                   |
| --------- | ----------------------------- |
| `default` | Tailwind configuration preset |

## Included Configuration

### Colors

- Custom brand color palette
- Dark mode color variants
- Semantic color tokens (primary, secondary, accent, etc.)

### Typography

- Custom font families
- Font size scale
- Line height settings

### Spacing

- Custom spacing scale
- Container widths
- Breakpoints

### Animation

- Custom transition timings
- Keyframe animations
- Animation utilities

### Plugins

- Typography plugin
- Forms plugin
- Container queries

## Custom Utilities

| Utility          | Description            |
| ---------------- | ---------------------- |
| `text-balance`   | Balanced text wrapping |
| `scrollbar-hide` | Hide scrollbars        |
| `glass`          | Glass morphism effect  |
