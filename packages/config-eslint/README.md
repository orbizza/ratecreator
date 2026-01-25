# @ratecreator/eslint-config

Shared ESLint configuration for Rate Creator monorepo.

## Installation

```bash
yarn add -D @ratecreator/eslint-config
```

## Usage

Add to your `.eslintrc.js`:

```javascript
module.exports = {
  extends: ["@ratecreator/eslint-config"],
  rules: {
    // Package-specific overrides
  }
}
```

## Features

| Feature | Description |
|---------|-------------|
| TypeScript support | Full TypeScript linting |
| React best practices | React-specific rules |
| Next.js rules | Next.js specific optimizations |
| Import sorting | Automatic import organization |
| Accessibility | A11y rules enabled |
| Turbo integration | Turborepo-aware configuration |

## Base Configuration

Built on top of:
- `@vercel/style-guide`
- `eslint-config-turbo`
- `@typescript-eslint`

## Key Rules

| Rule | Setting | Description |
|------|---------|-------------|
| `no-unused-vars` | Error | Disallow unused variables |
| `@typescript-eslint/no-explicit-any` | Warn | Discourage `any` type |
| `react-hooks/rules-of-hooks` | Error | Enforce hooks rules |
| `react-hooks/exhaustive-deps` | Warn | Verify effect dependencies |
| `import/order` | Warn | Organize imports |
