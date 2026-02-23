CREATE TABLE public.analysis_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  video_source TEXT NOT NULL CHECK (video_source IN ('upload', 'link')),
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
  target_age TEXT NOT NULL,
  target_gender TEXT NOT NULL CHECK (target_gender IN ('male', 'female', 'all')),
  target_tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.analysis_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON public.analysis_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own requests" ON public.analysis_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
