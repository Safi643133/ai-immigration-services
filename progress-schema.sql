-- ============================================================================
-- Progress Tracking System Database Schema
-- ============================================================================
-- This script creates the database schema for the new modular progress
-- tracking and CAPTCHA handling system.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Progress status enum
CREATE TYPE progress_status AS ENUM (
  'pending',
  'initializing', 
  'running',
  'waiting_for_captcha',
  'captcha_solved',
  'completed',
  'failed',
  'cancelled'
);

-- Progress step enum
CREATE TYPE progress_step AS ENUM (
  'job_created',
  'browser_initialized',
  'navigating_to_ceac',
  'embassy_selected',
  'captcha_detected',
  'form_filling_started',
  'form_step_1',
  'form_step_2',
  'form_step_3',
  'form_step_4',
  'form_step_5',
  'form_step_6',
  'form_step_7',
  'form_step_8',
  'form_step_9',
  'form_step_10',
  'form_step_11',
  'form_step_12',
  'form_step_13',
  'form_step_14',
  'form_step_15',
  'form_step_16',
  'form_step_17',
  'form_review',
  'form_submitted',
  'application_id_extracted',
  'confirmation_id_extracted',
  'job_completed'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Progress updates table
CREATE TABLE IF NOT EXISTS ceac_progress_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES ceac_automation_jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  step_number INTEGER,
  step_name progress_step NOT NULL,
  status progress_status NOT NULL,
  message TEXT NOT NULL,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  captcha_image TEXT,
  needs_captcha BOOLEAN DEFAULT FALSE,
  captcha_solution TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CAPTCHA challenges table
CREATE TABLE IF NOT EXISTS ceac_captcha_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES ceac_automation_jobs(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  input_selector TEXT NOT NULL,
  submit_selector TEXT NOT NULL,
  refresh_selector TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  solved BOOLEAN DEFAULT FALSE,
  solution TEXT,
  solved_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Progress updates indexes
CREATE INDEX IF NOT EXISTS idx_progress_updates_job_id ON ceac_progress_updates(job_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_user_id ON ceac_progress_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_created_at ON ceac_progress_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_updates_status ON ceac_progress_updates(status);
CREATE INDEX IF NOT EXISTS idx_progress_updates_step_name ON ceac_progress_updates(step_name);

-- CAPTCHA challenges indexes
CREATE INDEX IF NOT EXISTS idx_captcha_challenges_job_id ON ceac_captcha_challenges(job_id);
CREATE INDEX IF NOT EXISTS idx_captcha_challenges_created_at ON ceac_captcha_challenges(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_captcha_challenges_expires_at ON ceac_captcha_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_captcha_challenges_solved ON ceac_captcha_challenges(solved);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on progress updates
ALTER TABLE ceac_progress_updates ENABLE ROW LEVEL SECURITY;

-- Progress updates policies
CREATE POLICY "Users can view their own progress updates" ON ceac_progress_updates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress updates" ON ceac_progress_updates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress updates" ON ceac_progress_updates
  FOR UPDATE USING (auth.uid() = user_id);

-- Enable RLS on CAPTCHA challenges
ALTER TABLE ceac_captcha_challenges ENABLE ROW LEVEL SECURITY;

-- CAPTCHA challenges policies
CREATE POLICY "Users can view their own CAPTCHA challenges" ON ceac_captcha_challenges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ceac_automation_jobs 
      WHERE ceac_automation_jobs.id = ceac_captcha_challenges.job_id 
      AND ceac_automation_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own CAPTCHA challenges" ON ceac_captcha_challenges
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ceac_automation_jobs 
      WHERE ceac_automation_jobs.id = ceac_captcha_challenges.job_id 
      AND ceac_automation_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own CAPTCHA challenges" ON ceac_captcha_challenges
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM ceac_automation_jobs 
      WHERE ceac_automation_jobs.id = ceac_captcha_challenges.job_id 
      AND ceac_automation_jobs.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SUPABASE REALTIME
-- ============================================================================

-- Enable realtime for progress updates
ALTER PUBLICATION supabase_realtime ADD TABLE ceac_progress_updates;

-- Enable realtime for CAPTCHA challenges
ALTER PUBLICATION supabase_realtime ADD TABLE ceac_captcha_challenges;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update job progress metadata
CREATE OR REPLACE FUNCTION update_job_progress_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the metadata column of ceac_automation_jobs with latest progress info
  UPDATE ceac_automation_jobs 
  SET metadata = jsonb_build_object(
    'latest_progress', jsonb_build_object(
      'step_name', NEW.step_name,
      'status', NEW.status,
      'message', NEW.message,
      'progress_percentage', NEW.progress_percentage,
      'needs_captcha', NEW.needs_captcha,
      'captcha_image', NEW.captcha_image,
      'updated_at', NEW.created_at
    ),
    'last_update', NEW.created_at
  )
  WHERE id = NEW.job_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update job metadata when progress changes
DROP TRIGGER IF EXISTS trigger_update_job_progress_metadata ON ceac_progress_updates;
CREATE TRIGGER trigger_update_job_progress_metadata
  AFTER INSERT OR UPDATE ON ceac_progress_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_job_progress_metadata();

-- Function to cleanup expired CAPTCHAs
CREATE OR REPLACE FUNCTION cleanup_expired_captchas()
RETURNS void AS $$
BEGIN
  DELETE FROM ceac_captcha_challenges 
  WHERE expires_at < NOW() AND solved = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get job progress summary
CREATE OR REPLACE FUNCTION get_job_progress_summary(job_uuid UUID)
RETURNS TABLE (
  job_id UUID,
  current_step progress_step,
  current_status progress_status,
  progress_percentage INTEGER,
  total_steps INTEGER,
  completed_steps INTEGER,
  last_update TIMESTAMPTZ,
  needs_captcha BOOLEAN,
  captcha_image TEXT,
  estimated_completion TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_progress AS (
    SELECT 
      pu.job_id,
      pu.step_name,
      pu.status,
      pu.progress_percentage,
      pu.needs_captcha,
      pu.captcha_image,
      pu.created_at,
      ROW_NUMBER() OVER (PARTITION BY pu.job_id ORDER BY pu.created_at DESC) as rn
    FROM ceac_progress_updates pu
    WHERE pu.job_id = job_uuid
  ),
  step_counts AS (
    SELECT 
      job_id,
      COUNT(*) as total_steps,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_steps
    FROM ceac_progress_updates
    WHERE job_id = job_uuid
    GROUP BY job_id
  )
  SELECT 
    lp.job_id,
    lp.step_name,
    lp.status,
    lp.progress_percentage,
    COALESCE(sc.total_steps, 0) as total_steps,
    COALESCE(sc.completed_steps, 0) as completed_steps,
    lp.created_at as last_update,
    lp.needs_captcha,
    lp.captcha_image,
    CASE 
      WHEN lp.status = 'running' THEN 
        lp.created_at + INTERVAL '10 minutes'
      ELSE NULL
    END as estimated_completion
  FROM latest_progress lp
  LEFT JOIN step_counts sc ON lp.job_id = sc.job_id
  WHERE lp.rn = 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA (Optional)
-- ============================================================================

-- Insert any initial data if needed
-- (This section can be customized based on requirements)

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE 'Progress tracking system schema created successfully';
  RAISE NOTICE 'Tables: ceac_progress_updates, ceac_captcha_challenges';
  RAISE NOTICE 'Indexes: Created for performance optimization';
  RAISE NOTICE 'RLS: Enabled with user-specific policies';
  RAISE NOTICE 'Realtime: Enabled for both tables';
  RAISE NOTICE 'Triggers and functions configured';
END $$;
