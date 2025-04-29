# Theme Components

This directory contains components for theme management and customization in the
Rate Creator platform.

## Component Categories

### Theme Provider (`/provider`)

Components for theme management and context.

#### ThemeProvider

- Theme context provider
- Theme switching
- Theme persistence
- System theme detection
- Custom theme support
- Theme inheritance

#### ThemeToggle

- Theme switch button
- Light/Dark mode
- Custom themes
- Animation support
- Accessibility
- Mobile support

#### ThemeConfig

- Theme configuration
- Color palette
- Typography
- Spacing
- Breakpoints
- Custom variables

### Color System (`/colors`)

Components for color management and display.

#### ColorPalette

- Color swatches
- Color picker
- Color combinations
- Color accessibility
- Color naming
- Color export

#### ColorPicker

- Color selection
- RGB/HSL support
- Alpha channel
- Preset colors
- Custom colors
- Color history

#### ColorContrast

- Contrast checker
- Accessibility tools
- Color combinations
- WCAG compliance
- Custom rules
- Export options

### Typography (`/typography`)

Components for typography management.

#### FontFamily

- Font selection
- Font preview
- Font loading
- Font fallbacks
- Custom fonts
- Font optimization

#### FontSize

- Size scale
- Responsive sizes
- Custom sizes
- Size preview
- Size export
- Size documentation

#### FontWeight

- Weight scale
- Weight preview
- Custom weights
- Weight export
- Weight documentation
- Weight optimization

### Spacing (`/spacing`)

Components for spacing management.

#### SpacingScale

- Spacing scale
- Custom spacing
- Spacing preview
- Spacing export
- Spacing documentation
- Spacing optimization

#### GridSystem

- Grid configuration
- Column system
- Gap management
- Responsive grid
- Custom grid
- Grid export

#### LayoutSystem

- Layout configuration
- Container sizes
- Breakpoints
- Custom layouts
- Layout export
- Layout documentation

### Animation (`/animation`)

Components for animation management.

#### AnimationSystem

- Animation configuration
- Keyframe definitions
- Timing functions
- Custom animations
- Animation export
- Animation documentation

#### TransitionSystem

- Transition configuration
- Transition types
- Duration settings
- Custom transitions
- Transition export
- Transition documentation

#### MotionSystem

- Motion configuration
- Motion types
- Motion settings
- Custom motion
- Motion export
- Motion documentation

### Icons (`/icons`)

Components for icon management.

#### IconSystem

- Icon configuration
- Icon sets
- Custom icons
- Icon optimization
- Icon export
- Icon documentation

#### IconPicker

- Icon selection
- Icon preview
- Icon search
- Icon categories
- Custom icons
- Icon export

#### IconGenerator

- Icon generation
- Icon customization
- Icon export
- Icon optimization
- Icon documentation
- Icon usage

## Usage

Import components from their respective directories:

```typescript
import { ThemeProvider } from "@turbo/ui/components/themes/provider";
import { ColorPalette } from "@turbo/ui/components/themes/colors";
import { FontFamily } from "@turbo/ui/components/themes/typography";
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
