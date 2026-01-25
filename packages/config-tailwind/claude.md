# Tailwind Config Package - Project Memory

## What This Package Does

The `config-tailwind` package provides shared TailwindCSS configuration for all Rate Creator apps.

## Architecture

- **Package**: `@ratecreator/tailwind-config`
- **Pattern**: Shared Tailwind preset

### Usage

```javascript
// In any app's tailwind.config.ts
import sharedConfig from "@ratecreator/tailwind-config";

export default {
  presets: [sharedConfig],
  content: ["./app/**/*.tsx", "./components/**/*.tsx"],
};
```

## What Has Been Done

- Custom color scheme (brand colors)
- Typography configuration
- Spacing system
- Border radius presets
- Animation utilities
- Dark mode configuration
- Custom plugins

## Restrictions

- All apps must use this preset
- Brand colors must be consistent
- Use CSS variables for themeable values

## Key Files

| File                 | Purpose                |
| -------------------- | ---------------------- |
| `tailwind.config.ts` | Shared Tailwind config |
| `package.json`       | Package configuration  |
