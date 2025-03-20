-- Add is_achievement column to awards table
ALTER TABLE public.awards ADD COLUMN is_achievement BOOLEAN NOT NULL DEFAULT FALSE;

-- Rename purchased_at column in user_awards table to acquired_at
ALTER TABLE public.user_awards RENAME COLUMN purchased_at TO acquired_at;

-- Add achievement_type column to user_awards table
ALTER TABLE public.user_awards ADD COLUMN achievement_type TEXT;

-- Update existing award insert to include achievement-based awards
INSERT INTO public.awards (name, description, price, image_path, category, is_achievement)
VALUES
  ('First Spell', 'Awarded for casting your first spell', 0, '/images/awards/first-spell.png', 'achievement', TRUE),
  ('Potion Master', 'Complete 10 potion exercises', 0, '/images/awards/potion-master.png', 'achievement', TRUE);

-- Create a new function for granting achievement awards
CREATE OR REPLACE FUNCTION grant_achievement_award(
  user_id UUID,
  award_id UUID,
  achievement_type TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO public.user_awards (user_id, award_id, achievement_type)
  VALUES (user_id, award_id, achievement_type)
  ON CONFLICT (user_id, award_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a new policy to allow admins to insert achievement awards
CREATE POLICY "Admins can insert achievement awards"
  ON public.user_awards FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );