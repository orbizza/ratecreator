# ESLint Config Package - Project Memory

## What This Package Does

The `config-eslint` package provides shared ESLint configuration for all Rate Creator packages and apps.

## Architecture

- **Package**: `@ratecreator/eslint-config`
- **Base**: @vercel/style-guide
- **Pattern**: Shared ESLint config

### Usage

```javascript
// In any package's .eslintrc.js
module.exports = {
  extends: ["@ratecreator/eslint-config"],
  rules: {
    // Package-specific overrides
  },
};
```

## What Has Been Done

- Vercel style guide integration
- TypeScript support
- React/Next.js rules
- Import sorting
- Accessibility rules
- Turbo ESLint configuration

## Restrictions

- All packages must extend from this config
- Do not disable critical rules
- Keep consistent across monorepo

## Key Files

| File           | Purpose               |
| -------------- | --------------------- |
| `index.js`     | Main ESLint config    |
| `package.json` | Package configuration |
