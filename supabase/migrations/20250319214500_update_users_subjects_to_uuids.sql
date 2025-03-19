-- First, create a temporary column to store the new UUID array
ALTER TABLE public.users
ADD COLUMN subject_ids UUID[] DEFAULT ARRAY[]::UUID[];

-- Drop the old subjects column
ALTER TABLE public.users
DROP COLUMN subjects;

-- Rename the new column
ALTER TABLE public.users
RENAME COLUMN subject_ids TO subjects;
