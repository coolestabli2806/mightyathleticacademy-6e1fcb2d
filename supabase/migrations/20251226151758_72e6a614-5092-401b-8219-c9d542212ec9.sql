-- Create locations table for configurable training locations
CREATE TABLE public.locations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    address text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Anyone can view locations
CREATE POLICY "Anyone can view locations" 
ON public.locations 
FOR SELECT 
USING (true);

-- Authenticated users can manage locations
CREATE POLICY "Authenticated users can manage locations" 
ON public.locations 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Add location_id to schedules table
ALTER TABLE public.schedules 
ADD COLUMN location_id uuid REFERENCES public.locations(id);

-- Insert default locations
INSERT INTO public.locations (name, address) VALUES 
('Deep Run Park', 'Deep Run Park'),
('Glover Park', 'Glover Park');