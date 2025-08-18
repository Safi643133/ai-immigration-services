-- Simple reset of stuck CEAC automation jobs
-- This avoids triggering the problematic update_job_progress_metadata function

-- First, temporarily disable the trigger
DROP TRIGGER IF EXISTS trigger_update_job_progress_metadata ON ceac_progress_updates;

-- Reset all stuck jobs to failed status
UPDATE ceac_automation_jobs 
SET 
    status = 'failed',
    finished_at = NOW(),
    error_message = 'Reset for testing - job was stuck in running/queued state',
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb), 
        '{reset_reason}', 
        '"Reset for testing - job was stuck in running/queued state"'
    )
WHERE status IN ('queued', 'running');

-- Show what was reset
SELECT 
    id,
    status,
    embassy_location,
    created_at,
    error_message
FROM ceac_automation_jobs 
WHERE status = 'failed' 
AND error_message LIKE '%Reset for testing%'
ORDER BY created_at DESC;

-- Clean up any orphaned progress updates for these jobs
UPDATE ceac_progress_updates 
SET 
    status = 'failed',
    progress_percentage = 0,
    message = 'Reset due to stuck job cleanup'
WHERE job_id IN (
    SELECT id FROM ceac_automation_jobs 
    WHERE status = 'failed' 
    AND error_message LIKE '%Reset for testing%'
);

-- Clean up any orphaned CAPTCHA challenges for these jobs
UPDATE ceac_captcha_challenges 
SET 
    solved = false,
    solution = null,
    solved_at = null
WHERE job_id IN (
    SELECT id FROM ceac_automation_jobs 
    WHERE status = 'failed' 
    AND error_message LIKE '%Reset for testing%'
);

-- Re-enable the trigger (after schema fixes are applied)
-- CREATE TRIGGER trigger_update_job_progress_metadata
--     AFTER INSERT ON ceac_progress_updates
--     FOR EACH ROW
--     EXECUTE FUNCTION update_job_progress_metadata();

-- Show final state
SELECT 
    COUNT(*) as total_jobs,
    status,
    COUNT(CASE WHEN error_message LIKE '%Reset for testing%' THEN 1 END) as reset_jobs
FROM ceac_automation_jobs 
GROUP BY status
ORDER BY status;
