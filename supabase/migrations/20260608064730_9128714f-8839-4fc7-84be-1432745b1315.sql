CREATE TABLE public.monthly_targets (
  id uuid not null default gen_random_uuid() primary key,
  metric text not null,
  month text not null,
  value integer not null,
  updated_at timestamp with time zone not null default now(),
  unique (metric, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_targets TO anon, authenticated;
GRANT ALL ON public.monthly_targets TO service_role;
ALTER TABLE public.monthly_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view monthly targets" ON public.monthly_targets FOR SELECT USING (true);
CREATE POLICY "Anyone can insert monthly targets" ON public.monthly_targets FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update monthly targets" ON public.monthly_targets FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete monthly targets" ON public.monthly_targets FOR DELETE USING (true);