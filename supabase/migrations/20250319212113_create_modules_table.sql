-- Create modules table
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster lookups by subject_id
CREATE INDEX IF NOT EXISTS modules_subject_id_idx ON public.modules(subject_id);

-- Create trigger for modules table
CREATE TRIGGER update_modules_updated_at
    BEFORE UPDATE ON public.modules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view modules"
  ON public.modules FOR SELECT
  TO authenticated, anon;

-- Only admins can insert, update or delete modules
CREATE POLICY "Admins can manage modules"
  ON public.modules FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');