-- Reset the job for testing the API fix
-- This will allow the API to restart the job when "Submit to CEAC" is clicked

UPDATE ceac_automation_jobs 
SET 
    status = 'failed',
    started_at = null,
    finished_at = NOW(),
    error_code = null,
    error_message = 'Reset for API testing',
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb), 
        '{reset_reason}', 
        '"Reset for API testing - job was stuck"'
    )
WHERE id = '3bf96d2d-29e4-46ae-8798-799edfb30f06';

-- Clean up related data
UPDATE ceac_progress_updates 
SET 
    status = 'failed',
    progress_percentage = 0,
    message = 'Reset due to API testing'
WHERE job_id = '3bf96d2d-29e4-46ae-8798-799edfb30f06';

UPDATE ceac_captcha_challenges 
SET 
    solved = false,
    solution = null,
    solved_at = null
WHERE job_id = '3bf96d2d-29e4-46ae-8798-799edfb30f06';

-- Show the reset job
SELECT 
    id,
    status,
    embassy_location,
    created_at,
    error_message
FROM ceac_automation_jobs 
WHERE id = '3bf96d2d-29e4-46ae-8798-799edfb30f06';
