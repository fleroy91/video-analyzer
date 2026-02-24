-- Allow inserts into analysis_results (used by the webhook callback from the Python analyzer).
-- The service_role key bypasses RLS, but we also add a policy for the anon/authenticated
-- roles so the webhook can insert even without a user session.
CREATE POLICY "Allow insert for any role" ON public.analysis_results
  FOR INSERT WITH CHECK (true);
