-- Remove the unique constraint that prevents a school from having multiple programs for the same subject
ALTER TABLE public.programs
DROP CONSTRAINT IF EXISTS programs_school_id_subject_id_key;