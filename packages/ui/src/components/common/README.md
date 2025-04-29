# Common Components

This directory contains shared components used across the Rate Creator platform.

## Component Categories

### Layout (`/layout`)

Components for page layout and structure.

#### Container

- Responsive container
- Max-width constraints
- Padding control
- Background options
- Border support
- Shadow options

#### Grid

- Responsive grid system
- Column control
- Gap management
- Alignment options
- Order control
- Nested grids

#### Stack

- Vertical stacking
- Horizontal stacking
- Gap management
- Alignment options
- Responsive behavior
- Custom spacing

### Navigation (`/navigation`)

Components for navigation and routing.

#### Navbar

- Responsive navigation
- Mobile menu
- Dropdown support
- Search integration
- User menu
- Theme toggle

#### Sidebar

- Collapsible sidebar
- Nested navigation
- Active state
- Custom styling
- Responsive behavior
- Scroll management

#### Breadcrumbs

- Dynamic breadcrumbs
- Custom separators
- Responsive design
- Link support
- Custom styling
- Accessibility

### Forms (`/forms`)

Components for form handling and input.

#### Input

- Text input
- Password input
- Number input
- Email input
- URL input
- Custom validation

#### Select

- Single select
- Multi select
- Searchable
- Custom options
- Group support
- Clear button

#### Checkbox

- Single checkbox
- Checkbox group
- Custom styling
- Disabled state
- Indeterminate state
- Label support

#### Radio

- Radio group
- Custom styling
- Disabled state
- Label support
- Error state
- Helper text

### Feedback (`/feedback`)

Components for user feedback and notifications.

#### Alert

- Success alert
- Error alert
- Warning alert
- Info alert
- Dismissible
- Custom styling

#### Toast

- Success toast
- Error toast
- Warning toast
- Info toast
- Auto-dismiss
- Custom duration

#### Modal

- Basic modal
- Form modal
- Confirmation modal
- Custom size
- Backdrop options
- Animation

#### Tooltip

- Basic tooltip
- Rich tooltip
- Custom position
- Custom delay
- Custom styling
- Accessibility

### Data Display (`/data-display`)

Components for displaying data and information.

#### Table

- Basic table
- Sortable columns
- Filterable
- Pagination
- Row selection
- Custom styling

#### List

- Basic list
- Ordered list
- Unordered list
- Custom markers
- Nested lists
- Custom styling

#### Card

- Basic card
- Header support
- Footer support
- Image support
- Custom styling
- Hover effects

#### Badge

- Status badge
- Count badge
- Custom colors
- Custom sizes
- Custom styling
- Animation

### Typography (`/typography`)

Components for text and typography.

#### Heading

- H1 to H6
- Custom styling
- Responsive sizes
- Color options
- Weight options
- Line height

#### Text

- Paragraph text
- Span text
- Custom styling
- Color options
- Weight options
- Line height

#### Link

- Basic link
- External link
- Custom styling
- Hover effects
- Active state
- Disabled state

## Usage

Import components from their respective directories:

```typescript
import { Container } from "@turbo/ui/components/common/layout";
import { Input } from "@turbo/ui/components/common/forms";
import { Alert } from "@turbo/ui/components/common/feedback";
```

## Best Practices

1. Component Structure

   - Keep components focused and single-responsibility
   - Use TypeScript for type safety
   - Follow the established naming conventions
   - Include proper documentation

2. Styling

   - Use Tailwind CSS for styling
   - Follow the design system
   - Ensure responsive design
   - Maintain consistent spacing

3. Performance

   - Implement proper loading states
   - Use proper image optimization
   - Implement lazy loading where appropriate
   - Optimize bundle size

4. Accessibility

   - Use semantic HTML
   - Include proper ARIA labels
   - Ensure keyboard navigation
   - Maintain proper color contrast

5. Testing
   - Write unit tests
   - Include integration tests
   - Test accessibility
   - Test responsive design

## Development

To add new components:

1. Create the component in the appropriate directory
2. Add TypeScript types
3. Add Tailwind styles
4. Add component documentation
5. Add tests
6. Update this README
