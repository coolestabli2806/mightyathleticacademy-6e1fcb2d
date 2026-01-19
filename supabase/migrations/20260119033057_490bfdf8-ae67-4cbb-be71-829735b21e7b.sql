-- First create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create waivers table to store signed waivers
CREATE TABLE public.waivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  parent_email TEXT NOT NULL,
  player_name TEXT NOT NULL,
  player_dob TEXT NOT NULL,
  parent_guardian_name TEXT NOT NULL,
  phone_email TEXT NOT NULL,
  health_participation BOOLEAN NOT NULL DEFAULT false,
  emergency_medical BOOLEAN NOT NULL DEFAULT false,
  concussion_awareness BOOLEAN NOT NULL DEFAULT false,
  media_consent BOOLEAN NOT NULL DEFAULT false,
  parent_signature TEXT NOT NULL,
  parent_signed_date DATE NOT NULL,
  player_signature TEXT,
  player_signed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.waivers ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can view waivers (authenticated users will be checked in queries)
CREATE POLICY "Anyone can view waivers"
ON public.waivers
FOR SELECT
USING (true);

-- RLS: Anyone can insert waivers (parents submitting)
CREATE POLICY "Anyone can insert waivers"
ON public.waivers
FOR INSERT
WITH CHECK (true);

-- RLS: Authenticated users can update waivers
CREATE POLICY "Authenticated users can update waivers"
ON public.waivers
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_waivers_updated_at
BEFORE UPDATE ON public.waivers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();