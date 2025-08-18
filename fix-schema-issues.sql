-- Fix database schema issues that are causing CEAC automation to fail

-- 1. Add missing columns to ceac_automation_jobs table
DO $$ 
BEGIN
    -- Add last_update column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ceac_automation_jobs' AND column_name = 'last_update') THEN
        ALTER TABLE ceac_automation_jobs ADD COLUMN last_update TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ceac_automation_jobs' AND column_name = 'metadata') THEN
        ALTER TABLE ceac_automation_jobs ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    
    -- Add filename column to ceac_artifacts if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ceac_artifacts' AND column_name = 'filename') THEN
        ALTER TABLE ceac_artifacts ADD COLUMN filename VARCHAR(500);
    END IF;
    
    -- Add metadata column to ceac_job_events if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ceac_job_events' AND column_name = 'metadata') THEN
        ALTER TABLE ceac_job_events ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    
    RAISE NOTICE 'Schema fixes applied successfully';
EXCEPTION
    WHEN duplicate_column THEN
        RAISE NOTICE 'Some columns already exist, continuing...';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error applying schema fixes: %', SQLERRM;
END $$;

-- 2. Fix the trigger function that's causing the error
DROP FUNCTION IF EXISTS update_job_progress_metadata() CASCADE;

-- Recreate the trigger function with proper column handling
CREATE OR REPLACE FUNCTION update_job_progress_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the job's metadata with latest progress
    UPDATE ceac_automation_jobs 
    SET 
        metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{latest_progress}',
            jsonb_build_object(
                'step', NEW.step_name,
                'status', NEW.status,
                'percentage', NEW.progress_percentage,
                'message', NEW.message,
                'needs_captcha', COALESCE(NEW.needs_captcha, false),
                'updated_at', NEW.created_at
            )
        ),
        last_update = NEW.created_at
    WHERE id = NEW.job_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_job_progress_metadata ON ceac_progress_updates;
CREATE TRIGGER trigger_update_job_progress_metadata
    AFTER INSERT ON ceac_progress_updates
    FOR EACH ROW
    EXECUTE FUNCTION update_job_progress_metadata();

-- 3. Update existing records to have proper metadata
UPDATE ceac_automation_jobs 
SET metadata = COALESCE(metadata, '{}'::jsonb)
WHERE metadata IS NULL;

UPDATE ceac_job_events 
SET metadata = COALESCE(metadata, '{}'::jsonb)
WHERE metadata IS NULL;

-- 4. Show current schema state
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('ceac_automation_jobs', 'ceac_job_events', 'ceac_artifacts', 'ceac_progress_updates', 'ceac_captcha_challenges')
ORDER BY table_name, ordinal_position;
