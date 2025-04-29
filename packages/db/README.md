# `@turbo/db`

Database package for the Rate Creator project. This package contains Prisma
schema, migrations, and database utilities.

## Installation

```bash
yarn add @turbo/db
```

## Setup

1. Copy the environment file:

   ```bash
   cp env.example .env
   ```

2. Update the database URL in `.env`:

   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/ratecreator"
   ```

3. Run migrations:
   ```bash
   yarn prisma migrate dev
   ```

## Usage

Import and use the database client:

```typescript
import { db } from "@turbo/db";

// Example query
const users = await db.user.findMany({
  include: {
    reviews: true,
  },
});
```

## Schema

The database schema includes the following models:

- `User`: User profiles and authentication
- `Review`: User reviews and ratings
- `Content`: Blog posts and articles
- `Comment`: Comments on reviews and content
- `Category`: Content categories
- `Tag`: Content tags

## Development

### Adding New Models

1. Add the model to `prisma/schema.prisma`
2. Create a migration:
   ```bash
   yarn prisma migrate dev --name add_new_model
   ```
3. Update the database client
4. Test the changes

### Running Migrations

- Development: `yarn prisma migrate dev`
- Production: `yarn prisma migrate deploy`

### Database Management

- View database: `yarn prisma studio`
- Reset database: `yarn prisma db push --force-reset`

## Docker Support

A `docker-compose.yml` file is included for local development. To use it:

```bash
docker-compose up -d
```

This will start a PostgreSQL database with the correct configuration.

## Type Safety

The package provides TypeScript types for all database models and queries,
ensuring type safety throughout the application.
