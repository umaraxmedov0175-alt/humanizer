-- Humanizer Engine 2.0 Schema Migration

CREATE TABLE IF NOT EXISTS public.rewrite_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  user_id TEXT NOT NULL,
  client_request_id TEXT,
  input_hash TEXT NOT NULL,
  input_format TEXT NOT NULL DEFAULT 'plain_text',
  channel TEXT NOT NULL,
  requested_level TEXT,
  requested_dialect TEXT,
  controls JSONB NOT NULL,
  privacy_mode TEXT NOT NULL DEFAULT 'ephemeral',
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.rewrite_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.rewrite_requests(id) ON DELETE CASCADE,
  revision_number INT NOT NULL DEFAULT 1,
  output_text TEXT NOT NULL,
  output_hash TEXT NOT NULL,
  engine_mode TEXT NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT false,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.model_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.rewrite_requests(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  provider TEXT,
  model_id TEXT,
  prompt_version TEXT,
  attempt_number INT NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  latency_ms INT,
  input_tokens INT,
  output_tokens INT,
  estimated_cost NUMERIC(12, 6),
  result_status TEXT NOT NULL,
  degraded BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.quality_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  output_id UUID NOT NULL REFERENCES public.rewrite_outputs(id) ON DELETE CASCADE,
  evaluator_version TEXT NOT NULL,
  scores JSONB NOT NULL,
  failures JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence NUMERIC(5, 2),
  passed BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
