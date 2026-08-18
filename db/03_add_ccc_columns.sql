-- ==========================================
-- Migration: Add CCC integration columns
-- ==========================================

-- 1. Add ccc_applicability and data_classification_level to connections
ALTER TABLE public.connections
ADD COLUMN IF NOT EXISTS ccc_applicability TEXT,
ADD COLUMN IF NOT EXISTS data_classification_level TEXT;

-- 2. Add finding_type to rules
ALTER TABLE public.rules
ADD COLUMN IF NOT EXISTS finding_type TEXT;

-- 3. Add ccc_metadata to findings
ALTER TABLE public.findings
ADD COLUMN IF NOT EXISTS ccc_metadata JSONB;
