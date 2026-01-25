# TypeScript Config Package - Project Memory

## What This Package Does

The `config-typescript` package provides shared TypeScript configuration for all Rate Creator packages and apps.

## Architecture

- **Package**: `@ratecreator/typescript-config`
- **Pattern**: Shared tsconfig base

### Usage

```json
// In any package's tsconfig.json
{
  "extends": "@ratecreator/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

## What Has Been Done

- Base TypeScript configuration
- Strict mode enabled
- ES module support
- Path aliases configuration
- React JSX support

## Restrictions

- All packages must extend from this config
- Do not override strict settings
- Keep consistent across monorepo

## Key Files

| File | Purpose |
|------|---------|
| `base.json` | Base TypeScript config |
| `package.json` | Package configuration |
