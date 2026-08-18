-- Drop the ccc_metadata column since it's now evaluated dynamically in the API
ALTER TABLE findings DROP COLUMN IF EXISTS ccc_metadata;
