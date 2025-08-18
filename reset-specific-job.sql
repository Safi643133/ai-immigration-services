-- Reset the specific failed job to test CAPTCHA properly
-- This will allow the automation to restart and wait for CAPTCHA solution

-- Reset the specific job that failed
UPDATE ceac_automation_jobs 
SET 
    status = 'queued',
    started_at = null,
    finished_at = null,
    error_code = null,
    error_message = null,
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb), 
        '{reset_reason}', 
        '"Reset for CAPTCHA testing"'
    )
WHERE id = '3bf96d2d-29e4-46ae-8798-799edfb30f06';

-- Clean up the CAPTCHA challenge for this job
UPDATE ceac_captcha_challenges 
SET 
    solved = false,
    solution = null,
    solved_at = null
WHERE job_id = '3bf96d2d-29e4-46ae-8798-799edfb30f06';

-- Clean up progress updates for this job (keep only the first one)
DELETE FROM ceac_progress_updates 
WHERE job_id = '3bf96d2d-29e4-46ae-8798-799edfb30f06'
AND step_name != 'job_created';

-- Show the reset job
SELECT 
    id,
    status,
    embassy_location,
    created_at,
    error_message
FROM ceac_automation_jobs 
WHERE id = '3bf96d2d-29e4-46ae-8798-799edfb30f06';
