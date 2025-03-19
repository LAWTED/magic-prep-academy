-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create trigger for subjects table
CREATE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON public.subjects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view subjects"
  ON public.subjects FOR SELECT
  TO authenticated, anon;

-- Only admins can insert, update or delete subjects
CREATE POLICY "Admins can manage subjects"
  ON public.subjects FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');