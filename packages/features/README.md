# @ratecreator/features

Feature flag system for Rate Creator (placeholder package).

## Status

This package is currently a placeholder for future feature flag implementation.

## Planned Features

### Feature Flags

| Feature             | Description                     |
| ------------------- | ------------------------------- |
| Boolean flags       | Simple on/off toggles           |
| Percentage rollouts | Gradual rollout (0-100%)        |
| User targeting      | Target specific users/segments  |
| Environment flags   | Dev/staging/production specific |

### Planned Exports

```typescript
// Server-side
import { isFeatureEnabled } from "@ratecreator/features"

if (isFeatureEnabled("new-review-ui", { userId })) {
  // Show new UI
}

// Client-side
import { useFeatureFlag } from "@ratecreator/features"

function Component() {
  const showNewUI = useFeatureFlag("new-review-ui")
  return showNewUI ? <NewUI /> : <OldUI />
}
```

## Planned Functions

| Function                          | Description                          |
| --------------------------------- | ------------------------------------ |
| `isFeatureEnabled(flag, context)` | Check if feature is enabled (server) |
| `useFeatureFlag(flag)`            | React hook for feature flags         |
| `getFeatureFlags()`               | Get all feature flags                |
| `setFeatureFlag(flag, value)`     | Set feature flag value (admin)       |

## Integration Options

- PostHog feature flags
- LaunchDarkly
- Custom implementation with Redis
