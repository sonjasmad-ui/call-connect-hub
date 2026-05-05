
CREATE TABLE public.shared_dashboards (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.shared_dashboard_meta (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_dashboard_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shared dashboards" ON public.shared_dashboards FOR SELECT USING (true);
CREATE POLICY "Anyone can insert shared dashboards" ON public.shared_dashboards FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update shared dashboards" ON public.shared_dashboards FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete shared dashboards" ON public.shared_dashboards FOR DELETE USING (true);

CREATE POLICY "Anyone can view shared meta" ON public.shared_dashboard_meta FOR SELECT USING (true);
CREATE POLICY "Anyone can insert shared meta" ON public.shared_dashboard_meta FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update shared meta" ON public.shared_dashboard_meta FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_dashboards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_dashboard_meta;
