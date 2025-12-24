# Mess Management Backend - Migration Instructions

## Database Migration Required

After adding the MessSubscription model to the Prisma schema, you need to run a database migration to create the new table.

### Run Migration

Execute the following command in the backend directory:

```bash
npx prisma migrate dev --name add_mess_subscription
```

This will:
1. Create a new migration file in `prisma/migrations/`
2. Apply the migration to your database
3. Generate the updated Prisma Client

### Alternative: Reset Database (Development Only)

If you want to reset the entire database and apply all migrations from scratch:

```bash
npx prisma migrate reset
```

**Warning**: This will delete all data in your database!

### Verify Migration

After running the migration, verify it was successful:

```bash
npx prisma studio
```

This will open Prisma Studio where you can see the new `MessSubscription` table.

## What Was Added

### Database Schema
- **MessSubscription** table with fields:
  - `id` (UUID, primary key)
  - `residentId` (foreign key to Resident)
  - `planName` (string)
  - `monthlyFee` (float)
  - `startDate` (datetime)
  - `endDate` (datetime, nullable)
  - `isActive` (boolean, default true)
  - Timestamps: `createdAt`, `updatedAt`

### Backend Files Created
1. **Service**: `src/services/messSubscription.service.ts`
2. **Controller**: `src/controllers/messSubscription.controller.ts`
3. **Routes**: `src/routes/mess.routes.ts`

### API Endpoints
All endpoints require authentication and ADMIN role:

- `GET /api/mess/subscriptions` - List all subscriptions (optional `?isActive=true/false`)
- `GET /api/mess/subscriptions/:id` - Get specific subscription
- `POST /api/mess/subscriptions` - Create new subscription
- `PUT /api/mess/subscriptions/:id` - Update subscription
- `PATCH /api/mess/subscriptions/:id/deactivate` - Deactivate subscription

## Next Steps

1. Run the migration command above
2. Restart the backend server
3. Test the API endpoints using Postman or similar tool
4. Update the frontend to consume these APIs
