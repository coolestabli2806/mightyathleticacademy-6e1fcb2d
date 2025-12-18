-- Add payment_status and sessions_count to registrations
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS sessions_attended INTEGER DEFAULT 0;

-- Create attendance_records table
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  marked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage attendance
CREATE POLICY "Authenticated users can manage attendance"
ON public.attendance_records
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Update registration policies to allow updates
CREATE POLICY "Authenticated users can update registrations"
ON public.registrations
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete registrations"
ON public.registrations
FOR DELETE
TO authenticated
USING (true);