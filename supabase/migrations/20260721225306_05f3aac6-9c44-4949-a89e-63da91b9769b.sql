
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'new';
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'searching';
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'contacted';
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'verified';
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'received';

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS keywords text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes text;
