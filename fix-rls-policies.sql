-- Fix RLS policies to allow service role to bypass them
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own CAPTCHA challenges" ON ceac_captcha_challenges;
DROP POLICY IF EXISTS "Users can insert their own CAPTCHA challenges" ON ceac_captcha_challenges;
DROP POLICY IF EXISTS "Users can update their own CAPTCHA challenges" ON ceac_captcha_challenges;

-- Create new policies that allow service role to bypass
CREATE POLICY "Users can view their own CAPTCHA challenges"
  ON ceac_captcha_challenges FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM ceac_automation_jobs 
      WHERE id = ceac_captcha_challenges.job_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own CAPTCHA challenges"
  ON ceac_captcha_challenges FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM ceac_automation_jobs 
      WHERE id = ceac_captcha_challenges.job_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own CAPTCHA challenges"
  ON ceac_captcha_challenges FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM ceac_automation_jobs 
      WHERE id = ceac_captcha_challenges.job_id 
      AND user_id = auth.uid()
    )
  );

-- Also fix progress updates policies
DROP POLICY IF EXISTS "Users can view their own progress updates" ON ceac_progress_updates;
DROP POLICY IF EXISTS "Users can insert their own progress updates" ON ceac_progress_updates;
DROP POLICY IF EXISTS "Users can update their own progress updates" ON ceac_progress_updates;

CREATE POLICY "Users can view their own progress updates"
  ON ceac_progress_updates FOR SELECT
  USING (auth.role() = 'service_role' OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress updates"
  ON ceac_progress_updates FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

CREATE POLICY "Users can update their own progress updates"
  ON ceac_progress_updates FOR UPDATE
  USING (auth.role() = 'service_role' OR auth.uid() = user_id);
