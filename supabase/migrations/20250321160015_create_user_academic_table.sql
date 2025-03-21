-- Create user_academic table to store academic information for users
CREATE TABLE IF NOT EXISTS public.user_academic (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content JSONB DEFAULT '{}'::jsonb, -- Academic content in JSONB format
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id) -- Each user can have only one academic record
);

-- Create trigger for updating the updated_at column
CREATE TRIGGER update_user_academic_updated_at
    BEFORE UPDATE ON public.user_academic
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.user_academic ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security
CREATE POLICY "Users can view their own academic data"
  ON public.user_academic FOR SELECT
  USING (user_id IN (
    SELECT id FROM public.users
    WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can update their own academic data"
  ON public.user_academic FOR UPDATE
  USING (user_id IN (
    SELECT id FROM public.users
    WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own academic data"
  ON public.user_academic FOR INSERT
  WITH CHECK (user_id IN (
    SELECT id FROM public.users
    WHERE auth_id = auth.uid()
  ));