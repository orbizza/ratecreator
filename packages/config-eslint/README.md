# `@turbo/eslint-config`

Collection of internal eslint configurations for the Rate Creator project.

## Installation

```bash
yarn add -D @turbo/eslint-config
```

## Usage

Add the following to your `.eslintrc.js`:

```javascript
module.exports = {
  extends: ["@turbo/eslint-config"],
};
```

## Features

- TypeScript support
- React best practices
- Next.js specific rules
- Import sorting
- Code style consistency

## Development

To modify the configuration:

1. Make changes to the rules in `index.js`
2. Test the changes locally
3. Build the package: `yarn build`
4. Publish the package: `yarn publish`
