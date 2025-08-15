-- ============================================================================
-- Database Schema Fixes
-- ============================================================================
-- This script fixes the missing database schema issues

-- Fix 1: Add missing metadata column to ceac_job_events
ALTER TABLE ceac_job_events 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Fix 2: Add missing filename column to ceac_artifacts
ALTER TABLE ceac_artifacts 
ADD COLUMN IF NOT EXISTS filename TEXT;

-- Fix 3: Ensure progress tracking tables exist
-- (This will be handled by the main progress-schema.sql)

-- Fix 4: Update existing job events to have metadata
UPDATE ceac_job_events 
SET metadata = '{}' 
WHERE metadata IS NULL;

-- Fix 5: Update existing artifacts to have filename
UPDATE ceac_artifacts 
SET filename = 'unknown' 
WHERE filename IS NULL;

-- Verify fixes
DO $$
BEGIN
  RAISE NOTICE 'Database schema fixes applied successfully';
  RAISE NOTICE 'Added metadata column to ceac_job_events';
  RAISE NOTICE 'Added filename column to ceac_artifacts';
  RAISE NOTICE 'Updated existing records with default values';
END $$;
