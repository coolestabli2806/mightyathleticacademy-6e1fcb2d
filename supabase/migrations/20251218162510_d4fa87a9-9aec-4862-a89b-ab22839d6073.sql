-- Create registrations table
CREATE TABLE public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_name TEXT NOT NULL,
  age TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  experience TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public registration form)
CREATE POLICY "Anyone can submit registration"
ON public.registrations
FOR INSERT
WITH CHECK (true);

-- Only admins can view registrations (we'll add admin role later if needed)
CREATE POLICY "Authenticated users can view registrations"
ON public.registrations
FOR SELECT
TO authenticated
USING (true);