-- Allow updates to analysis_requests (used by the webhook callback and the analyze route).
-- The webhook runs without a user session, so we allow updates for any role.
CREATE POLICY "Allow update for any role" ON public.analysis_requests
  FOR UPDATE USING (true) WITH CHECK (true);
