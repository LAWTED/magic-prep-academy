-- Create progress status enum
CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed');

-- Create session_progress table
CREATE TABLE IF NOT EXISTS public.session_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  progress progress_status DEFAULT 'not_started' NOT NULL,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(session_id, user_id)
);

-- Create module_progress table
CREATE TABLE IF NOT EXISTS public.module_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  progress progress_status DEFAULT 'not_started' NOT NULL,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(module_id, user_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS session_progress_session_id_idx ON public.session_progress(session_id);
CREATE INDEX IF NOT EXISTS session_progress_user_id_idx ON public.session_progress(user_id);
CREATE INDEX IF NOT EXISTS module_progress_module_id_idx ON public.module_progress(module_id);
CREATE INDEX IF NOT EXISTS module_progress_user_id_idx ON public.module_progress(user_id);

-- Create triggers for progress tables
CREATE TRIGGER update_session_progress_updated_at
    BEFORE UPDATE ON public.session_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_module_progress_updated_at
    BEFORE UPDATE ON public.module_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.session_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for session_progress
CREATE POLICY "Users can view their own session progress"
  ON public.session_progress FOR SELECT
  USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can update their own session progress"
  ON public.session_progress FOR UPDATE
  USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can insert their own session progress"
  ON public.session_progress FOR INSERT
  WITH CHECK (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Create RLS policies for module_progress
CREATE POLICY "Users can view their own module progress"
  ON public.module_progress FOR SELECT
  USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can update their own module progress"
  ON public.module_progress FOR UPDATE
  USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can insert their own module progress"
  ON public.module_progress FOR INSERT
  WITH CHECK (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');