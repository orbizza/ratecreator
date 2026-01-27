# Creator Portal (creatorops) - Project Memory

## What This App Does

The `creatorops` app is the Creator Portal for Rate Creator. It enables content creators to:

- Claim ownership of their creator profiles
- Manage multiple social media accounts
- Respond to reviews and engage with their audience
- Organize team access through organizations
- View analytics and insights for their accounts

## Architecture

- **Framework**: Next.js 14.2.35 (App Router)
- **Port**: 3003
- **Package**: `@ratecreator/creatorops`
- **Authentication**: Clerk

### Route Structure

```
app/
├── (auth)/                       # Authentication routes
│   ├── sign-in/[[...sign-in]]/   # Sign in page
│   └── sign-up/[[...sign-up]]/   # Sign up page
│
├── (dashboard)/                  # Protected dashboard routes
│   ├── dashboard/                # Main dashboard
│   ├── accounts/                 # Account management
│   │   ├── page.tsx              # List claimed/linked accounts
│   │   ├── claim/                # Claim new account
│   │   └── [accountId]/          # Account details
│   ├── organization/             # Organization management
│   │   ├── page.tsx              # List organizations
│   │   └── members/              # Team members
│   └── settings/                 # User settings
│
└── api/                          # API routes
    ├── accounts/
    │   ├── search/               # Search for accounts
    │   ├── claim/                # Claim account
    │   └── verify/               # Verify ownership
    └── organization/             # Organization CRUD
```

## What Has Been Done

### Completed Features

- Basic app structure and configuration
- Clerk authentication integration
- Dashboard layout with sidebar navigation
- Account claiming flow (search → verify)
- Multi-account support (multiple accounts per platform)
- Organization management (create, list)
- API routes for account operations

### Database Models Used

- `User` - Platform users
- `Account` - Creator profiles
- `ClaimedAccount` - Account ownership claims
- `UserLinkedAccount` - Linked accounts for tracking
- `Organization` - Team organizations
- `OrganizationMember` - Organization membership
- `OrganizationAccount` - Organization-linked accounts

### Verification Methods Supported

| Platform  | Primary Method | Status  |
| --------- | -------------- | ------- |
| YouTube   | OAuth          | Planned |
| X/Twitter | OAuth          | Planned |
| Instagram | OAuth          | Planned |
| TikTok    | OAuth          | Planned |
| Reddit    | OAuth          | Planned |
| Twitch    | OAuth          | Planned |

## Restrictions

### Authentication

- All dashboard routes require Clerk authentication
- OAuth verification requires platform-specific credentials
- Claims must be verified before full access

### API Routes

- All mutations require authentication
- Account claims are unique per user-account pair
- Verified claims prevent duplicate claims by others

### Component Usage

- Use `@ratecreator/ui` for all UI components
- Use local components in `/components` for app-specific UI
- Follow existing patterns from `apps/web` and `apps/content`

## What Needs To Be Done

### Features

- [ ] OAuth verification flows for each platform
- [ ] Bio link verification method
- [ ] Review response functionality
- [ ] Comment management interface
- [ ] Analytics dashboard
- [ ] Organization account management
- [ ] Team member invitation system
- [ ] Notification preferences
- [ ] Account settings and customization

### Technical

- [ ] Connect to Kafka for event publishing
- [ ] Integrate with platform OAuth providers
- [ ] Add Sentry error tracking
- [ ] Add PostHog analytics
- [ ] Write tests for API routes
- [ ] Mobile responsive optimization

## Key Files

| File                                       | Purpose                    |
| ------------------------------------------ | -------------------------- |
| `app/layout.tsx`                           | Root layout with providers |
| `app/provider.tsx`                         | Global providers           |
| `app/(dashboard)/layout.tsx`               | Dashboard layout           |
| `components/dashboard/creator-sidebar.tsx` | Sidebar navigation         |
| `components/dashboard/creator-header.tsx`  | Header with user menu      |
| `app/api/accounts/claim/route.ts`          | Account claiming API       |
| `app/api/accounts/verify/route.ts`         | Verification API           |

## Environment Variables

Uses the same environment variables as the main web app, plus:

```env
# OAuth Provider Credentials (for verification)
YOUTUBE_OAUTH_CLIENT_ID=
YOUTUBE_OAUTH_CLIENT_SECRET=
X_OAUTH_CLIENT_ID=
X_OAUTH_CLIENT_SECRET=
TIKTOK_OAUTH_CLIENT_ID=
TIKTOK_OAUTH_CLIENT_SECRET=
REDDIT_OAUTH_CLIENT_ID=
REDDIT_OAUTH_CLIENT_SECRET=
INSTAGRAM_OAUTH_CLIENT_ID=
INSTAGRAM_OAUTH_CLIENT_SECRET=
```
