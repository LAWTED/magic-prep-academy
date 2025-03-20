-- Function to check and award achievements based on module completion
CREATE OR REPLACE FUNCTION public.check_module_completion_achievements()
RETURNS TRIGGER AS $$
DECLARE
  user_completed_modules INTEGER;
  subject_total_modules INTEGER;
  award_id UUID;
BEGIN
  -- First module completion achievement
  IF NEW.progress = 'completed' THEN
    -- Check if this is the user's first completed module
    SELECT COUNT(*) INTO user_completed_modules
    FROM public.module_progress
    WHERE user_id = NEW.user_id AND progress = 'completed';

    IF user_completed_modules = 1 THEN
      -- Find the 'First Steps' achievement
      SELECT id INTO award_id FROM public.awards
      WHERE condition_type = 'module_completion' AND condition_value = 'first';

      IF award_id IS NOT NULL THEN
        -- Award the achievement if it hasn't been awarded yet
        INSERT INTO public.user_awards (user_id, award_id, acquisition_method)
        VALUES (NEW.user_id, award_id, 'achievement')
        ON CONFLICT (user_id, award_id) DO NOTHING;
      END IF;
    END IF;

    -- Check if all modules in a subject are completed
    SELECT
      COUNT(*) INTO subject_total_modules
    FROM
      public.modules m
    WHERE
      m.subject_id = (SELECT subject_id FROM public.modules WHERE id = NEW.module_id);

    -- Count completed modules in this subject
    SELECT
      COUNT(*) INTO user_completed_modules
    FROM
      public.module_progress mp
    JOIN
      public.modules m ON mp.module_id = m.id
    WHERE
      mp.user_id = NEW.user_id
      AND mp.progress = 'completed'
      AND m.subject_id = (SELECT subject_id FROM public.modules WHERE id = NEW.module_id);

    -- If all modules are completed, award the 'Module Master' achievement
    IF user_completed_modules = subject_total_modules THEN
      SELECT id INTO award_id FROM public.awards
      WHERE condition_type = 'module_completion' AND condition_value = 'all';

      IF award_id IS NOT NULL THEN
        INSERT INTO public.user_awards (user_id, award_id, acquisition_method)
        VALUES (NEW.user_id, award_id, 'achievement')
        ON CONFLICT (user_id, award_id) DO NOTHING;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for module completion achievements
CREATE TRIGGER check_module_completion_achievements_trigger
AFTER INSERT OR UPDATE ON public.module_progress
FOR EACH ROW
EXECUTE FUNCTION public.check_module_completion_achievements();

-- Function to check and award streak achievements
CREATE OR REPLACE FUNCTION public.check_streak_achievements()
RETURNS TRIGGER AS $$
DECLARE
  award_id UUID;
  streak_award_threshold INTEGER;
BEGIN
  -- Check if user has reached streak targets
  SELECT
    CAST(condition_value AS INTEGER),
    id
  INTO
    streak_award_threshold,
    award_id
  FROM
    public.awards
  WHERE
    condition_type = 'streak'
    AND acquisition_type = 'achievement'
    AND CAST(condition_value AS INTEGER) <= NEW.streak_days
  ORDER BY
    CAST(condition_value AS INTEGER) DESC
  LIMIT 1;

  -- Award the achievement if streak threshold was found and reached
  IF award_id IS NOT NULL THEN
    INSERT INTO public.user_awards (user_id, award_id, acquisition_method)
    VALUES (NEW.user_id, award_id, 'achievement')
    ON CONFLICT (user_id, award_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for streak achievements
CREATE TRIGGER check_streak_achievements_trigger
AFTER UPDATE OF streak_days ON public.user_xp
FOR EACH ROW
WHEN (NEW.streak_days > OLD.streak_days)
EXECUTE FUNCTION public.check_streak_achievements();