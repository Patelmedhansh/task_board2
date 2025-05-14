/*
  # Optimize Search Performance

  1. Changes
    - Enable pg_trgm extension for faster text search
    - Add GIN index on projects.title for ILIKE queries
    - Add GIN index on projects.description for potential future use
  
  2. Benefits
    - Dramatically improves ILIKE query performance
    - Enables fast partial text matching
    - Reduces sequential scans
*/

-- Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN index for title search
CREATE INDEX IF NOT EXISTS idx_projects_title_trgm 
ON projects USING GIN (title gin_trgm_ops);

-- Add GIN index for description search (for future use)
CREATE INDEX IF NOT EXISTS idx_projects_description_trgm 
ON projects USING GIN (description gin_trgm_ops);