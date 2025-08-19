-- Fix ceac_artifacts table schema for Supabase Storage support

-- Add missing columns for Supabase Storage
ALTER TABLE ceac_artifacts 
ADD COLUMN IF NOT EXISTS public_url TEXT,
ADD COLUMN IF NOT EXISTS checksum TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ceac_artifacts_job_id ON ceac_artifacts(job_id);
CREATE INDEX IF NOT EXISTS idx_ceac_artifacts_type ON ceac_artifacts(type);
CREATE INDEX IF NOT EXISTS idx_ceac_artifacts_created_at ON ceac_artifacts(created_at);

-- Add comments for documentation
COMMENT ON COLUMN ceac_artifacts.public_url IS 'Public URL for Supabase Storage objects';
COMMENT ON COLUMN ceac_artifacts.checksum IS 'MD5 checksum of the file for integrity verification';
COMMENT ON COLUMN ceac_artifacts.metadata IS 'Additional metadata stored as JSON';

-- Verify the schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ceac_artifacts' 
ORDER BY ordinal_position;
