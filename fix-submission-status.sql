-- Fix submission_status enum to include 'exported'
-- This script adds the 'exported' status to the existing submission_status enum

-- First, create a new enum with the additional value
CREATE TYPE submission_status_new AS ENUM ('draft', 'review', 'finalized', 'submitted', 'exported');

-- Temporarily remove the default constraint
ALTER TABLE form_submissions ALTER COLUMN status DROP DEFAULT;

-- Update the form_submissions table to use the new enum
ALTER TABLE form_submissions 
  ALTER COLUMN status TYPE submission_status_new 
  USING status::text::submission_status_new;

-- Restore the default constraint with the new enum
ALTER TABLE form_submissions ALTER COLUMN status SET DEFAULT 'draft';

-- Drop the old enum
DROP TYPE submission_status;

-- Rename the new enum to the original name
ALTER TYPE submission_status_new RENAME TO submission_status;

-- Add comment to document the change
COMMENT ON TYPE submission_status IS 'Status of form submissions: draft, review, finalized, submitted, exported'; 