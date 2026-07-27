-- Create auth schema for GoTrue
CREATE SCHEMA IF NOT EXISTS auth;

-- Create User table
CREATE TABLE IF NOT EXISTS public."Test" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO public."Test" (name, date) VALUES ('test', '2025-01-01');

-- Create auth.uid() helper function
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT 
    COALESCE(
      current_setting('request.jwt.claim.sub', true),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    )::uuid
$$;