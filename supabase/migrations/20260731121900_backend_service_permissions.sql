-- Permissions for internal backend service
-- Allows the backend service role to access application tables

GRANT ALL PRIVILEGES ON TABLE public.connections TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.scan_jobs TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.resources TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.rules TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.findings TO service_role;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;