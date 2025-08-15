-- ============================================================================
-- Corrected Progress Tracking System Database Schema
-- ============================================================================
-- This script creates the database schema for the new modular progress
-- tracking and CAPTCHA handling system with correct column names.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Progress status enum
DO $$ BEGIN
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
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Progress step enum
DO $$ BEGIN
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
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Progress updates table (with correct column names)
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

-- CAPTCHA challenges indexes
CREATE INDEX IF NOT EXISTS idx_captcha_challenges_job_id ON ceac_captcha_challenges(job_id);
CREATE INDEX IF NOT EXISTS idx_captcha_challenges_solved ON ceac_captcha_challenges(solved);
CREATE INDEX IF NOT EXISTS idx_captcha_challenges_expires_at ON ceac_captcha_challenges(expires_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on progress updates
ALTER TABLE ceac_progress_updates ENABLE ROW LEVEL SECURITY;

-- Progress updates policies
DO $$ BEGIN
  CREATE POLICY "Users can view their own progress updates"
    ON ceac_progress_updates FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own progress updates"
    ON ceac_progress_updates FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own progress updates"
    ON ceac_progress_updates FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enable RLS on CAPTCHA challenges
ALTER TABLE ceac_captcha_challenges ENABLE ROW LEVEL SECURITY;

-- CAPTCHA challenges policies
DO $$ BEGIN
  CREATE POLICY "Users can view their own CAPTCHA challenges"
    ON ceac_captcha_challenges FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM ceac_automation_jobs 
        WHERE id = ceac_captcha_challenges.job_id 
        AND user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own CAPTCHA challenges"
    ON ceac_captcha_challenges FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM ceac_automation_jobs 
        WHERE id = ceac_captcha_challenges.job_id 
        AND user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own CAPTCHA challenges"
    ON ceac_captcha_challenges FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM ceac_automation_jobs 
        WHERE id = ceac_captcha_challenges.job_id 
        AND user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update job metadata when progress changes
CREATE OR REPLACE FUNCTION update_job_progress_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the job's metadata with latest progress info
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
        'needs_captcha', NEW.needs_captcha,
        'updated_at', NEW.created_at
      )
    ),
    last_update = NEW.created_at
  WHERE id = NEW.job_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update job metadata
DROP TRIGGER IF EXISTS trigger_update_job_progress_metadata ON ceac_progress_updates;
CREATE TRIGGER trigger_update_job_progress_metadata
  AFTER INSERT OR UPDATE ON ceac_progress_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_job_progress_metadata();

-- Function to get progress summary
DROP FUNCTION IF EXISTS get_job_progress_summary(UUID);
CREATE OR REPLACE FUNCTION get_job_progress_summary(job_uuid UUID)
RETURNS TABLE (
  job_id UUID,
  current_step progress_step,
  current_status progress_status,
  progress_percentage INTEGER,
  total_steps INTEGER,
  completed_steps INTEGER,
  estimated_completion TIMESTAMPTZ,
  last_update TIMESTAMPTZ,
  needs_captcha BOOLEAN,
  captcha_image TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_progress AS (
    SELECT 
      cpu.job_id,
      cpu.step_name,
      cpu.status,
      cpu.progress_percentage,
      cpu.needs_captcha,
      cpu.captcha_image,
      cpu.created_at,
      COUNT(*) OVER () as total_updates
    FROM ceac_progress_updates cpu
    WHERE cpu.job_id = job_uuid
    ORDER BY cpu.created_at DESC
    LIMIT 1
  )
  SELECT 
    lp.job_id,
    lp.step_name,
    lp.status,
    lp.progress_percentage,
    17 as total_steps, -- DS-160 has 17 steps
    CASE 
      WHEN lp.step_name = 'job_completed' THEN 17
      WHEN lp.step_name LIKE 'form_step_%' THEN 
        CAST(SUBSTRING(lp.step_name FROM 'form_step_([0-9]+)') AS INTEGER)
      ELSE 0
    END as completed_steps,
    CASE 
      WHEN lp.status = 'completed' THEN lp.created_at
      WHEN lp.status = 'failed' THEN lp.created_at
      ELSE lp.created_at + INTERVAL '30 minutes'
    END as estimated_completion,
    lp.created_at as last_update,
    lp.needs_captcha,
    lp.captcha_image
  FROM latest_progress lp;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA (if needed)
-- ============================================================================

-- No initial data needed for these tables
