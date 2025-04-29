# `@turbo/ui`

UI component library for the Rate Creator project. This package provides
reusable React components built with Tailwind CSS and Shadcn UI.

## Installation

```bash
yarn add @turbo/ui
```

## Usage

Import and use components in your React components:

```typescript
import { Button, Card, Input } from '@turbo/ui';

// In your component
function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter text" />
      <Button>Click me</Button>
    </Card>
  );
}
```

## Available Components

### Layout Components

- `Container`: Page container
- `Grid`: Grid layout
- `Stack`: Vertical stack layout
- `Box`: Basic container

### Form Components

- `Input`: Text input
- `Select`: Dropdown select
- `Checkbox`: Checkbox input
- `Radio`: Radio input
- `Button`: Button component
- `Form`: Form wrapper

### Data Display

- `Card`: Card container
- `Table`: Data table
- `List`: List container
- `Avatar`: User avatar
- `Badge`: Status badge

### Feedback

- `Alert`: Alert message
- `Toast`: Toast notification
- `Modal`: Modal dialog
- `Tooltip`: Tooltip

### Navigation

- `Navbar`: Navigation bar
- `Sidebar`: Side navigation
- `Tabs`: Tab navigation
- `Breadcrumbs`: Breadcrumb navigation

## Styling

Components are styled using Tailwind CSS. The package includes:

- Custom color scheme
- Typography system
- Spacing system
- Responsive design utilities

## Development

To add new components:

1. Create a new component in `src/components/`
2. Add proper TypeScript types
3. Add Tailwind styles
4. Add component documentation
5. Test the component
6. Build the package: `yarn build`

## Best Practices

- Keep components focused and reusable
- Use TypeScript for type safety
- Follow accessibility guidelines
- Add proper documentation
- Include unit tests

## Type Safety

All components are fully typed with TypeScript, providing type safety for props
and events.
