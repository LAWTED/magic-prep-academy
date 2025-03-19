-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster lookups by module_id
CREATE INDEX IF NOT EXISTS sessions_module_id_idx ON public.sessions(module_id);

-- Create trigger for sessions table
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view sessions"
  ON public.sessions FOR SELECT
  TO authenticated, anon;

-- Only admins can insert, update or delete sessions
CREATE POLICY "Admins can manage sessions"
  ON public.sessions FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');