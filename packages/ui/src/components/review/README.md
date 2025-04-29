# Review Components

This directory contains all the components related to reviews, ratings, and user
interactions in the Rate Creator platform.

## Component Categories

### Cards (`/cards`)

Components for displaying review information in card format.

#### ReviewCard

- Displays a single review with rating, content, and metadata
- Supports different variants (compact, detailed, featured)
- Includes user avatar, rating stars, and timestamp
- Handles review actions (like, share, report)

#### ReviewList

- Displays a list of reviews with pagination
- Supports sorting and filtering
- Includes loading states and empty states
- Handles infinite scroll

#### ReviewGrid

- Displays reviews in a grid layout
- Supports different grid sizes
- Includes masonry layout option
- Optimized for image-heavy reviews

### Creator Rating (`/creator-rating`)

Components for displaying and managing creator ratings.

#### RatingDisplay

- Shows overall rating with stars
- Displays rating breakdown (5-star to 1-star)
- Includes total review count
- Supports different sizes and variants

#### RatingForm

- Form for submitting new ratings
- Star rating input
- Review text input
- Category selection
- Image upload support

#### RatingStats

- Displays detailed rating statistics
- Shows rating trends over time
- Includes category-specific ratings
- Supports data visualization

### Creator Profile (`/creator-profile`)

Components for displaying creator information and their reviews.

#### ProfileHeader

- Displays creator's basic information
- Shows profile picture and cover image
- Includes social media links
- Displays verification status

#### ProfileStats

- Shows creator's key metrics
- Displays follower count
- Shows review statistics
- Includes engagement metrics

#### ProfileReviews

- Displays creator's reviews
- Supports filtering and sorting
- Includes review highlights
- Shows review trends

### User Profile (`/user-profile`)

Components for displaying user information and their activity.

#### UserInfo

- Displays user's basic information
- Shows profile picture
- Includes user preferences
- Displays account status

#### UserReviews

- Shows user's review history
- Displays review statistics
- Includes review activity
- Shows review preferences

#### UserSettings

- Form for updating user settings
- Profile editing
- Notification preferences
- Privacy settings

### Search and Filter (`/search`, `/filters`)

Components for searching and filtering reviews.

#### SearchBar

- Main search input
- Autocomplete suggestions
- Search history
- Recent searches

#### SearchResults

- Displays search results
- Supports different view modes
- Includes filters
- Shows result count

#### Filters

- Category filters
- Rating filters
- Date filters
- Advanced filters

### Command Bar (`/commandbar`)

Components for quick actions and navigation.

#### QuickSearch

- Global search
- Command palette
- Quick actions
- Recent items

#### QuickActions

- Common actions
- Shortcuts
- Context menu
- Toolbar

### Categories (`/categories`)

Components for displaying and navigating categories.

#### CategoryList

- Displays category hierarchy
- Supports nested categories
- Includes category counts
- Shows active category

#### CategoryCards

- Displays categories in card format
- Includes category images
- Shows category stats
- Supports different layouts

### Landing (`/landing`)

Components for the landing page.

#### HeroSection

- Main hero banner
- Call-to-action buttons
- Feature highlights
- Social proof

#### Features

- Feature cards
- Feature descriptions
- Feature icons
- Feature benefits

#### Testimonials

- Testimonial cards
- User quotes
- Rating display
- User avatars

### Common (`/common`)

Shared components used across the application.

#### Buttons

- Primary button
- Secondary button
- Icon button
- Loading button

#### Forms

- Input fields
- Select dropdowns
- Checkboxes
- Radio buttons

#### Modals

- Confirmation modal
- Form modal
- Alert modal
- Custom modal

### Skeletons (`/skeletons`)

Loading state components.

#### ReviewSkeleton

- Loading state for review card
- Animated placeholder
- Responsive design
- Multiple variants

#### ProfileSkeleton

- Loading state for profile
- Animated placeholder
- Responsive design
- Multiple variants

### Error Pages (`/error-page`)

Error handling components.

#### Error404

- 404 page design
- Error message
- Navigation options
- Search suggestion

#### Error500

- 500 page design
- Error message
- Retry option
- Support contact

### Contact (`/contact`)

Contact-related components.

#### ContactForm

- Contact form
- Form validation
- Success message
- Error handling

#### ContactInfo

- Contact details
- Office locations
- Support hours
- Social media links

## Usage

Import components from their respective directories:

```typescript
import { ReviewCard } from "@turbo/ui/components/review/cards";
import { RatingDisplay } from "@turbo/ui/components/review/creator-rating";
import { ProfileHeader } from "@turbo/ui/components/review/creator-profile";
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
