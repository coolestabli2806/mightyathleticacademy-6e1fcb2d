-- Add date_of_birth column to registrations table with default for existing records
ALTER TABLE public.registrations 
ADD COLUMN date_of_birth date NOT NULL DEFAULT '2000-01-01';