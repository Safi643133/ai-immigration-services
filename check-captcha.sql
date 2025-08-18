-- Check CAPTCHA challenges
SELECT 
    cc.id,
    cc.job_id,
    cc.image_url,
    cc.solved,
    cc.solution,
    cc.created_at,
    cc.expires_at,
    caj.status as job_status,
    caj.user_id
FROM ceac_captcha_challenges cc
LEFT JOIN ceac_automation_jobs caj ON cc.job_id = caj.id
ORDER BY cc.created_at DESC
LIMIT 10;

-- Check if metadata column exists in ceac_artifacts
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ceac_artifacts' 
AND column_name = 'metadata';

-- Check if metadata column exists in ceac_job_events
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ceac_job_events' 
AND column_name = 'metadata';

-- Check recent jobs
SELECT 
    id,
    status,
    user_id,
    created_at,
    embassy_location
FROM ceac_automation_jobs
ORDER BY created_at DESC
LIMIT 5;

