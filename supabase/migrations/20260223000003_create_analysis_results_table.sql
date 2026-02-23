CREATE TABLE public.analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.analysis_requests(id) ON DELETE CASCADE,
  kpi_name TEXT NOT NULL,
  predicted_value TEXT NOT NULL,
  score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own results" ON public.analysis_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.analysis_requests
      WHERE id = analysis_results.request_id AND user_id = auth.uid()
    )
  );
