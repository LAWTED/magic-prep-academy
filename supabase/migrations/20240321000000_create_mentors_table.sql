-- Create mentors table
CREATE TABLE IF NOT EXISTS public.mentors (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_id uuid REFERENCES auth.users(id),
    name text NOT NULL,
    email text,
    avatar_name text DEFAULT 'Mentor',
    subjects uuid[] DEFAULT ARRAY[]::uuid[],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at timestamp with time zone
);