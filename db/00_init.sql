-- Create User table
CREATE TABLE IF NOT EXISTS public."Test" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO public."Test" (name, date) VALUES ('test', '2025-01-01');