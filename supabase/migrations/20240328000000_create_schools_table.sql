-- Create schools table with minimal fields for MVP
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create programs table (renamed from school_subjects)
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  application_deadline DATE,
  requirements TEXT,
  name TEXT,
  vector_store_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);


-- Create user_programs_progress table for tracking application milestones
CREATE TABLE IF NOT EXISTS public.user_programs_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'saved', -- overall status: 'saved', 'in_progress', 'applied', 'accepted', 'rejected'
  content JSONB DEFAULT '{"toefl": {"status": "not_started"}, "wes": {"status": "not_started"}, "cv": {"status": "not_started"}, "sop": {"status": "not_started"}, "lor": {"status": "not_started"}, "application_submitted": false}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, program_id)
);

-- Create user_actions table for calendar view and timeline
CREATE TABLE IF NOT EXISTS public.user_program_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'program_saved', 'toefl_started', 'toefl_completed', 'cv_submitted', etc.
  action_date DATE NOT NULL,
  due_date DATE, -- For deadline-related actions
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}'::jsonb, -- Additional data specific to the action type
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
