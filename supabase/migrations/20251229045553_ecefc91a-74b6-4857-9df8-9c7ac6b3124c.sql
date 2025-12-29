-- Create gallery_items table for photos and videos
CREATE TABLE public.gallery_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'photo', -- 'photo' or 'video'
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view gallery items
CREATE POLICY "Anyone can view gallery items" 
ON public.gallery_items 
FOR SELECT 
USING (true);

-- Only authenticated users (admins) can manage gallery items
CREATE POLICY "Authenticated users can manage gallery items" 
ON public.gallery_items 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Create sponsors table
CREATE TABLE public.sponsors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    description TEXT,
    website_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Anyone can view active sponsors
CREATE POLICY "Anyone can view sponsors" 
ON public.sponsors 
FOR SELECT 
USING (true);

-- Only authenticated users (admins) can manage sponsors
CREATE POLICY "Authenticated users can manage sponsors" 
ON public.sponsors 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Create storage bucket for gallery media
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);

-- Create storage policies for gallery bucket
CREATE POLICY "Gallery files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'gallery');

CREATE POLICY "Authenticated users can upload gallery files" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'gallery');

CREATE POLICY "Authenticated users can delete gallery files" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'gallery');

-- Create storage bucket for sponsor logos
INSERT INTO storage.buckets (id, name, public) VALUES ('sponsors', 'sponsors', true);

-- Create storage policies for sponsors bucket
CREATE POLICY "Sponsor logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'sponsors');

CREATE POLICY "Authenticated users can upload sponsor logos" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'sponsors');

CREATE POLICY "Authenticated users can delete sponsor logos" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'sponsors');