-- Create mentors table
CREATE TABLE IF NOT EXISTS public.mentors (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_id uuid REFERENCES auth.users(id),
    name text NOT NULL,
    email text,
    region text,
    avatar_name text DEFAULT 'Mentor',
    bio text,
    specialties text[] DEFAULT ARRAY[]::text[],
    subjects uuid[] DEFAULT ARRAY[]::uuid[],
    years_of_experience integer DEFAULT 0,
    hourly_rate decimal(10,2),
    availability jsonb DEFAULT '{}',
    rating decimal(3,2) DEFAULT 5.0,
    total_sessions integer DEFAULT 0,
    is_verified boolean DEFAULT false,
    instance_id uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at timestamp with time zone
);

-- Add RLS policies
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Mentors are viewable by everyone"
    ON public.mentors FOR SELECT
    USING (deleted_at IS NULL);

CREATE POLICY "Mentors can be updated by themselves"
    ON public.mentors FOR UPDATE
    USING (auth.uid() = auth_id);

CREATE POLICY "Mentors can be inserted by authenticated users"
    ON public.mentors FOR INSERT
    WITH CHECK (auth.uid() = auth_id);

-- Create indexes
CREATE INDEX mentors_auth_id_idx ON public.mentors(auth_id);
CREATE INDEX mentors_subjects_idx ON public.mentors USING gin(subjects);
CREATE INDEX mentors_specialties_idx ON public.mentors USING gin(specialties);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.mentors
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();