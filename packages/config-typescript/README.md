# @ratecreator/typescript-config

Shared TypeScript configuration for Rate Creator monorepo.

## Usage

Extend in your package's `tsconfig.json`:

```json
{
  "extends": "@ratecreator/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

## Available Configurations

| Config | Description |
|--------|-------------|
| `base.json` | Base TypeScript configuration |

## Key Settings

| Setting | Value | Description |
|---------|-------|-------------|
| `strict` | `true` | Enable all strict type checks |
| `target` | `ES2020` | JavaScript target version |
| `module` | `ESNext` | Module system |
| `moduleResolution` | `bundler` | Module resolution strategy |
| `jsx` | `react-jsx` | JSX transform |
| `skipLibCheck` | `true` | Skip type checking of declaration files |
