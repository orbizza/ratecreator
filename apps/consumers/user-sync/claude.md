# User Sync Consumer - Project Memory

## What This Consumer Does

The `user-sync` consumer processes Clerk authentication events and synchronizes user data to MongoDB. It handles:

1. User creation (new signups)
2. User updates (profile changes)
3. User deletion (soft delete)

## Architecture

- **Framework**: Hono.js
- **Message Queue**: Kafka
- **Database**: MongoDB (via Prisma)
- **Package**: `@ratecreator/user-sync`
- **Build**: esbuild

### Event Flow

```
Clerk → Webhook → clerk-sync → Kafka → user-sync → MongoDB
```

### Event Types Handled

| Event | Action |
|-------|--------|
| `user.created` | Upsert user record in MongoDB |
| `user.updated` | Update user profile fields |
| `user.deleted` | Soft delete (set isDeleted flag) |

## What Has Been Done

- Kafka consumer for `clerk-user-events` topic
- User creation with Clerk data mapping
- User updates (firstName, lastName, username, email)
- Soft deletion with timestamp
- Webhook payload storage for audit trail
- Health check endpoint

### Data Mapping

```typescript
// Clerk → MongoDB mapping
{
  clerkId: event.userId,
  email: event.primaryEmail,
  firstName: event.firstName,
  lastName: event.lastName,
  username: event.username,
  webhookPayload: event.rawPayload // Full audit trail
}
```

## Restrictions

### Message Format
Expected Kafka message structure:
```typescript
{
  type: "user.created" | "user.updated" | "user.deleted",
  data: {
    id: string,
    email_addresses: Array<{ email_address: string, id: string }>,
    primary_email_address_id: string,
    first_name: string,
    last_name: string,
    username: string
  }
}
```

### Dependencies
- Requires Kafka connection
- Requires MongoDB connection

### Data Integrity
- Uses upsert to handle duplicate events
- Soft deletes only (no hard deletes)
- Stores full webhook payload for debugging

## What Needs To Be Done

- [ ] Handle organization membership events
- [ ] Handle session events for analytics
- [ ] Email verification sync
- [ ] Profile image sync
- [ ] Retry logic for failed database operations
- [ ] Metrics and monitoring
- [ ] Dead letter queue
- [ ] Unit tests

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Main entry, Kafka consumer and DB sync |
| `package.json` | Dependencies and build config |
