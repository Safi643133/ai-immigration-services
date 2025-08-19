-- Fix ceac_artifacts table schema for Supabase Storage support
-- Run this in your Supabase SQL Editor

-- Add missing columns
ALTER TABLE ceac_artifacts ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE ceac_artifacts ADD COLUMN IF NOT EXISTS public_url TEXT;
ALTER TABLE ceac_artifacts ADD COLUMN IF NOT EXISTS checksum TEXT;
ALTER TABLE ceac_artifacts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ceac_artifacts_job_id ON ceac_artifacts(job_id);
CREATE INDEX IF NOT EXISTS idx_ceac_artifacts_type ON ceac_artifacts(type);
CREATE INDEX IF NOT EXISTS idx_ceac_artifacts_created_at ON ceac_artifacts(created_at);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ceac_artifacts' 
ORDER BY ordinal_position;
