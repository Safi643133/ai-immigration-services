-- Check current CEAC automation job status
SELECT 
    id,
    status,
    embassy_location,
    created_at,
    started_at,
    finished_at,
    error_message,
    metadata->>'queue_job_id' as queue_job_id
FROM ceac_automation_jobs 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if there are any jobs stuck in queued/running status
SELECT 
    COUNT(*) as active_jobs,
    status,
    embassy_location
FROM ceac_automation_jobs 
WHERE status IN ('queued', 'running')
GROUP BY status, embassy_location;

-- Check recent job events
SELECT 
    job_id,
    event_type,
    level,
    message,
    created_at
FROM ceac_job_events 
ORDER BY created_at DESC 
LIMIT 10;
