# User Sync Consumer

Kafka consumer that synchronizes Clerk authentication events to MongoDB.

## Overview

This consumer processes Clerk user events:

1. User creation (new signups)
2. User updates (profile changes)
3. User deletion (soft delete)

## Architecture

- **Framework**: Hono.js
- **Message Queue**: Kafka
- **Database**: MongoDB (via Prisma)
- **Package**: `@ratecreator/user-sync`
- **Build**: esbuild

## Event Flow

```
Clerk → Webhook → clerk-sync → Kafka → user-sync → MongoDB
```

## Functions

| Function                   | Description                           |
| -------------------------- | ------------------------------------- |
| `handleUserCreated(event)` | Upsert user record in MongoDB         |
| `handleUserUpdated(event)` | Update user profile fields            |
| `handleUserDeleted(event)` | Soft delete user (set isDeleted flag) |
| `extractUserData(event)`   | Map Clerk event to database schema    |

## Event Types Handled

| Event          | Action                           |
| -------------- | -------------------------------- |
| `user.created` | Upsert user record in MongoDB    |
| `user.updated` | Update user profile fields       |
| `user.deleted` | Soft delete (set isDeleted flag) |

## Data Mapping

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

## Message Format

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

## Environment Variables

```env
KAFKA_SERVICE_URI=
KAFKA_USERNAME=
KAFKA_PASSWORD=
KAFKA_CA_CERT=
DATABASE_URL_ONLINE=
```

## Development

```bash
# Build
yarn build

# Run locally
yarn start
```
