-- Create schedules table
CREATE TABLE public.schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  age_group TEXT NOT NULL,
  session_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Anyone can view schedules (public)
CREATE POLICY "Anyone can view schedules"
ON public.schedules
FOR SELECT
USING (true);

-- Authenticated users can manage schedules
CREATE POLICY "Authenticated users can manage schedules"
ON public.schedules
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert default schedule data
INSERT INTO public.schedules (day, time, age_group, session_type) VALUES
  ('Monday', '4:00 PM', '5-8', 'Fundamentals'),
  ('Monday', '5:30 PM', '9-12', 'Skills'),
  ('Wednesday', '4:00 PM', '5-8', 'Fundamentals'),
  ('Wednesday', '5:30 PM', '9-12', 'Skills'),
  ('Saturday', '9:00 AM', '5-8', 'Games'),
  ('Saturday', '10:30 AM', '9-12', 'Match');