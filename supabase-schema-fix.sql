-- Run these commands in Supabase SQL Editor to fix the schema issues

-- 1. Add missing columns to ceac_automation_jobs table
ALTER TABLE ceac_automation_jobs ADD COLUMN IF NOT EXISTS last_update TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE ceac_automation_jobs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 2. Add missing columns to ceac_artifacts table
ALTER TABLE ceac_artifacts ADD COLUMN IF NOT EXISTS filename VARCHAR(500);

-- 3. Add missing columns to ceac_job_events table
ALTER TABLE ceac_job_events ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 4. Update existing records to have proper metadata
UPDATE ceac_automation_jobs SET metadata = COALESCE(metadata, '{}'::jsonb) WHERE metadata IS NULL;
UPDATE ceac_job_events SET metadata = COALESCE(metadata, '{}'::jsonb) WHERE metadata IS NULL;

-- 5. Verify the schema changes
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('ceac_automation_jobs', 'ceac_job_events', 'ceac_artifacts')
    AND column_name IN ('last_update', 'metadata', 'filename')
ORDER BY table_name, column_name;
