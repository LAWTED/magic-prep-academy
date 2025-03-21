# Authentication and User Data Management

## Overview

This project uses a combination of:

1. **Supabase Authentication** - For user authentication
2. **Middleware** - For protecting routes and checking profile status
3. **Zustand** - For global state management of user data

## Middleware Protection

The middleware (`utils/supabase/middleware.ts`) handles:

- Checking if a user is authenticated for protected routes
- Checking if authenticated users have completed their profile
- Redirecting unauthenticated users to the sign-in page
- Redirecting authenticated users without profiles to the onboarding page

## User Store

The Zustand store (`store/userStore.ts`) provides:

- Centralized user authentication state
- User profile data across the application
- Loading states
- Error handling

This prevents redundant database queries in each page component.

## Implementation Example

### 1. Initializing User Data

The `UserProvider` component in the students layout fetches user data once and makes it available to all child components:

```tsx
// In app/(students)/layout.tsx
<UserProvider>
  <div className="min-h-[100dvh] flex flex-col bg-background">
    {/* ... */}
  </div>
</UserProvider>
```

### 2. Using User Data in Pages

Student pages can access user data without re-fetching it:

```tsx
const { user, profile, isLoading: userLoading } = useUserStore();

// Use profile.id, user.id, etc. directly in your component
```

### 3. Refreshing User Data

After profile updates, refresh the store:

```tsx
const { fetchUserData } = useUserStore();

// After updating user data
await fetchUserData();
```

## Benefits

- **Reduced Database Queries**: User data is fetched once per session
- **Consistent User State**: All components have access to the same user data
- **Optimized Performance**: Prevents redundant authentication checks
- **Better UX**: Loading states are managed consistently

## Template Usage

A template file is available at `app/(students)/template.tsx` showing how to
structure new student pages to properly use the user store.