-- Function to initialize XP and Hearts for new users
CREATE OR REPLACE FUNCTION public.initialize_user_xp_hearts()
RETURNS TRIGGER AS $$
BEGIN
  -- Initialize user_xp
  INSERT INTO public.user_xp (user_id, total_xp, streak_days)
  VALUES (NEW.id, 0, 0);

  -- Initialize user_hearts
  INSERT INTO public.user_hearts (user_id, current_hearts, max_hearts)
  VALUES (NEW.id, 5, 5);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (to avoid duplicate errors)
DROP TRIGGER IF EXISTS on_user_created ON public.users;

-- Create trigger to run after a new user is inserted
CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_xp_hearts();