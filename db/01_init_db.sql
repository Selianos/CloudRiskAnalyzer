-- ==========================================
-- 1. CREATE TABLES
-- ==========================================

-- Connections Table (Cloud credentials per user)
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('aws', 'gcp', 'oci')),
    credentials JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Scan Jobs Table (Queue and execution logs)
CREATE TABLE IF NOT EXISTS public.scan_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Resources Table (Inventory + Configuration payload)
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_job_id UUID NOT NULL REFERENCES public.scan_jobs(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL,
    provider_resource_id TEXT NOT NULL,
    name TEXT NOT NULL,
    region TEXT,
    configuration JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Rules Table (Static check reference catalog)
CREATE TABLE IF NOT EXISTS public.rules (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL CHECK (provider IN ('aws', 'gcp', 'oci')),
    name TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'WARNING', 'MEDIUM', 'INFO')),
    description TEXT NOT NULL,
    recommendation TEXT NOT NULL
);

-- Findings Table (Evaluated rule statuses)
CREATE TABLE IF NOT EXISTS public.findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_job_id UUID NOT NULL REFERENCES public.scan_jobs(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    rule_id TEXT NOT NULL REFERENCES public.rules(id) ON UPDATE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('PASS', 'FAIL')),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 2. CREATE PERFORMANCE INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_connections_user ON public.connections(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_jobs_connection ON public.scan_jobs(connection_id);
CREATE INDEX IF NOT EXISTS idx_scan_jobs_user ON public.scan_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_scan ON public.resources(scan_job_id);
CREATE INDEX IF NOT EXISTS idx_findings_scan ON public.findings(scan_job_id);
CREATE INDEX IF NOT EXISTS idx_findings_resource ON public.findings(resource_id);

-- ==========================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. DEFINE SECURITY POLICIES
-- ==========================================

-- Connections Policies
DROP POLICY IF EXISTS "Users can manage their own connections" ON public.connections;
CREATE POLICY "Users can manage their own connections" 
ON public.connections 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- Scan Jobs Policies
DROP POLICY IF EXISTS "Users can manage their own scan jobs" ON public.scan_jobs;
CREATE POLICY "Users can manage their own scan jobs" 
ON public.scan_jobs 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- Resources Policies
DROP POLICY IF EXISTS "Users can view resources from their own scans" ON public.resources;
CREATE POLICY "Users can view resources from their own scans" 
ON public.resources 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.scan_jobs 
        WHERE public.scan_jobs.id = public.resources.scan_job_id 
        AND public.scan_jobs.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can insert resources from their own scans" ON public.resources;
CREATE POLICY "Users can insert resources from their own scans" 
ON public.resources 
FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.scan_jobs 
        WHERE public.scan_jobs.id = public.resources.scan_job_id 
        AND public.scan_jobs.user_id = auth.uid()
    )
);

-- Rules Policies (Static table, read-only for authenticated users)
DROP POLICY IF EXISTS "Anyone authenticated can read rules" ON public.rules;
CREATE POLICY "Anyone authenticated can read rules" 
ON public.rules 
FOR SELECT 
TO authenticated 
USING (true);

-- Findings Policies
DROP POLICY IF EXISTS "Users can view findings from their own scans" ON public.findings;
CREATE POLICY "Users can view findings from their own scans" 
ON public.findings 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.scan_jobs 
        WHERE public.scan_jobs.id = public.findings.scan_job_id 
        AND public.scan_jobs.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can insert findings from their own scans" ON public.findings;
CREATE POLICY "Users can insert findings from their own scans" 
ON public.findings 
FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.scan_jobs 
        WHERE public.scan_jobs.id = public.findings.scan_job_id 
        AND public.scan_jobs.user_id = auth.uid()
    )
);
