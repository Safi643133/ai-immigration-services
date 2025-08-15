-- First, check what columns exist in ceac_progress_updates
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ceac_progress_updates'
ORDER BY ordinal_position;

-- Check if the table exists at all
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'ceac_progress_updates';

-- Check CAPTCHA challenges for the specific jobs
SELECT 
    cc.id,
    cc.job_id,
    cc.image_url,
    cc.solved,
    cc.solution,
    cc.created_at,
    cc.expires_at,
    caj.status as job_status
FROM ceac_captcha_challenges cc
LEFT JOIN ceac_automation_jobs caj ON cc.job_id = caj.id
WHERE cc.job_id IN (
    '3e8db12c-2582-433c-8f74-924ce2e1b9f7',
    '00e3c351-ec02-4dda-996a-1a55b1460c41'
)
ORDER BY cc.created_at DESC;

-- Check if ceac_captcha_challenges table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'ceac_captcha_challenges';

-- Check progress updates for these jobs (using correct column names)
SELECT 
    cpu.id,
    cpu.job_id,
    cpu.step_name,
    cpu.status,
    cpu.message,
    cpu.progress_percentage,
    cpu.created_at
FROM ceac_progress_updates cpu
WHERE cpu.job_id IN (
    '3e8db12c-2582-433c-8f74-924ce2e1b9f7',
    '00e3c351-ec02-4dda-996a-1a55b1460c41'
)
ORDER BY cpu.created_at DESC;
