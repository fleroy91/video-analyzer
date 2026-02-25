-- Required for Supabase Realtime to deliver filtered UPDATE/INSERT events
-- when RLS is enabled. Without FULL, the old record in the WAL only contains
-- the primary key, so Realtime cannot evaluate RLS policies like
-- `auth.uid() = user_id` and silently drops events.

ALTER TABLE public.analysis_requests REPLICA IDENTITY FULL;
ALTER TABLE public.analysis_results REPLICA IDENTITY FULL;
