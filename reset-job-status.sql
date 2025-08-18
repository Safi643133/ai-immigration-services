-- Reset stuck CEAC automation jobs to allow new testing
UPDATE ceac_automation_jobs 
SET 
    status = 'failed',
    finished_at = NOW(),
    error_message = 'Reset for testing - job was stuck',
    metadata = jsonb_set(
        metadata, 
        '{reset_reason}', 
        '"Reset for testing - job was stuck"'
    )
WHERE status IN ('queued', 'running')
AND created_at < NOW() - INTERVAL '1 hour';

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
