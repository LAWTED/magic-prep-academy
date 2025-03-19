# Supabase Database Management

This directory contains the SQL schema and migrations for setting up and evolving the Supabase database.

## Directory Structure

- `schema.sql` - Initial database schema with basic tables and security policies
- `migrations/` - Directory containing dated migration files for incremental changes

## Setting Up the Database

1. Create a new Supabase project at [https://supabase.com/](https://supabase.com/)
2. Navigate to the SQL Editor in your Supabase dashboard
3. Copy the contents of `schema.sql` and execute it in the SQL Editor

## Migration Approach

For each database schema change:

1. Create a new dated migration file in the `migrations/` folder:
   ```
   YYYYMMDD_descriptive_name.sql
   ```

2. Write SQL changes using idempotent statements:
   - Use `IF NOT EXISTS` when creating new tables
   - Use `ALTER TABLE IF EXISTS` for modifying tables
   - Include `ON CONFLICT` handling for data insertions

3. Apply the migration in the Supabase SQL Editor

## Migration Example

Here's an example of a migration file (`20240601_add_quizzes.sql`):

```sql
-- Add new table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.users(auth_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view all quizzes"
  ON public.quizzes FOR SELECT
  USING (true);

CREATE POLICY "Users can create quizzes"
  ON public.quizzes FOR INSERT
  WITH CHECK (created_by = auth.uid());
```

## Environment Variables

Ensure your Next.js app has these environment variables in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key (for server operations)
```